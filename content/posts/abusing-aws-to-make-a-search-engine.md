---
title: Abusing AWS Lambda to make an Aussie Search Engine
date: 2021-09-11
---

**TL/DR** I wrote an Australian centric search engine. You can view it at [https://bonzamate.com.au](https://bonzamate.com.au). It's interesting because it runs its own index, only indexes australian websites and is written by an Australian, for Australian's and is hosted in Australia. It's also interesting technically because it runs almost entirely using serverless AWS Lambda, and uses bloom filters similar to Bing.

So I am in the middle of building a new index for searchcode.com from scratch. No real reason beyond I find it interesting. I mentioned this to a work colleague and he asked why I didn't use AWS as generally for work everything lands there. I mentioned something to the effect that you needed a lot of persistent storage, or RAM to keep the index around which is prohibitively expensive. He mentioned perhaps using Lambda? And I responded its lack of persistance is a problem... At that point I trailed off. Something occurred to me.

Lambda's or any other serverless function on cloud work well for certain problems. So long as you can rebuild state inside the lambda, because there is no guarantee it will still be running next time the lambda executes. The lack of persistance is an issue because modern search engines need to have some level of persistance to them. Either in RAM, as Google/Bing store the index in RAM these days or disk.

Without persistance it makes it hard to do this in lambda. However there is a saying in computing.

> Never do at runtime what you can do at compile time.

Lets see how far we can take that idea, by using AWS Lambda to build a search engine. So how to get get around the lack of persistance? By baking index into the lambda themselves. In other words, generate code which contains the index and compile that into the lambda binary.

The plan, is to shard the index using lambda's. Each one holds a portion of the index compiled into the binary that we deploy. Then then we call each lambda using a controller which invokes all of them, collects all the results, sorts by rank, gets the top results and returns them.

Why multiple lambdas? Well we are limited to 50 MB per lambda after it is zipped and deployed into AWS, so there is an upper limit on the size of the binary we can produce. However, we can scale out nicely to 1,000 lambda's (by default in a new AWS account) so assuming we can stuff ~100,000 documents into a lambda we could build an index containing ~100,000,000 pages, on the entry level AWS tier.

The best part about this is that it solves one of the big problems with building a search engine. Say you want to run your own. You need to pay for a heap of machines to sit there doing nothing up till someone wants to perform a search. When you first start nobody is using your search engine so you have this massive upfront cost that sits idle most of the time. With lambda, you pay nothing unless it is being used. It also scales so should you become popular overnight, in theory AWS should scale out for you. 

Another benefit here is that it means we don't need to pay for the storage of the index because we are abusing lambda's hosting to store the index. 

AWS by default gives 75 GB of space to store your lambda's, but remember how I mentioned that the lambda is zipped? Assuming a 50% level of compression (and I think im low-balling that value) we get an index of 150 GB for free in the default AWS tier.

That should be enough for a proof of concept. In fact looking at the free tier limits of AWS...

> AWS Lambda	1,000,000 free requests per month for AWS Lambda	
> AWS Lambda	400,000 seconds of compute time per month for AWS Lambda

It will probably slide under the AWS Lambda Free tier as well for running even if we try many thousands of searches a month.

If not, perhaps AWS will reach out and offer me some credits for being such a good sport, or so I can iterate on the idea and build it out further.

Incidentally searching around found this blog post https://www.morling.dev/blog/how-i-built-a-serverless-search-for-my-blog/ about building something similar using lucene, but without storing the content and only on a single lambda.

## Proving the idea...

So the first thing I considered was putting content directly into lambda's, and then brute force searching across that content. Considering our guess of storing ~100,000 items in a lambda, a modern CPU brute force string searching in memory should return in a few hundred milliseconds. Modern CPU's are very fast.

So I tried it. I created a Go file with 100,000 strings in a slice, and then wrote a simple loop to run over that performing a search. I used a library I had written about a year ago https://github.com/boyter/go-string to do this which provides faster case insensitive search for string literals than regex.

Alas I underestimated how weak the CPU allotted to a lambda is, and searches took several seconds. Even increasing the RAM to improve the CPU allotment didn't really help. My fallback plan was to embed an index into the lambda, allowing for a quick scan over that index before looking at the content directly.

As I was already working on a replacement index for searchcode.com I have the majority of the code needed for this just lying around. For searchcode.com I had been working on a bloom filter based index based on the ideas of bitfunnel which was developed by Bob Goodwin, Michael Hopcroft, Dan Luu, Alex Clemmer, Mihaela Curmei, Sameh Elnikety and Yuxiong He and used in Microsoft Bing [https://danluu.com/bitfunnel-sigir.pdf](https://danluu.com/bitfunnel-sigir.pdf). For those curious the videos by Michael are very informative.

This technique lends itself pretty well to what I am attempting to do, because its just an array of 64 bit integers you scan across, making it trivial wo write this out into a file which you then compile. Its also already compressed ensuring we can stay under our 50 MB limit and the actual code to do the search is simple. 

Because I am embedding this directly into code I simplified the ideas that bitfunnel uses so its not a full bitfunnel implementation. The first thing I did was rotate the bit vectors to reduce the memory lookups. Because of I was able write the index as a huge slice of 64 uint64's. This slice is always a multiple of 2048 with the length of the bloom filter for each document being 2048 bits. Each chunk of 2048 holds 64 documents filling all of the uint64 bits, right to left. 

I am not using frequency conscious bloom filters for this implementation, nor the higher ranked rows that are one of the main bitfunnel innovations. This greatly simplifies the implementation, and results in a beautifully simple core search algorithm.

{{<highlight go>}}
func preSearch(queryBits []uint64) []uint64 {
	var results []uint64
	var res uint64

	for i := 0; i < len(bloomFilter); i += 2048 {
		res = bloomFilter[queryBits[0]+uint64(i)]

		for j := 1; j < len(queryBits); j++ {
			res = res & bloomFilter[queryBits[j]+uint64(i)]
			if res == 0 {
				break
			}
		}

		if res != 0 {
			for j := 0; j < 64; j++ {
				if res&(1<<j) > 0 {
					results = append(results, uint64(64*(i/2048)+j))
				}
			}
		}
	}

	return results
}
{{</highlight>}}

The result of the above is a list of interesting document id's which can then be brute force checked for the terms we belike are in there. Bloom filters by default produce false positive results, but the above is fast enough to run in a few milliseconds cutting down on the total number of documents we need to inspect.

Once the candidates are picked, they are then processed using the brute force search I tried before, and those results are then passed off for ranking.

Checking cloudwatch with the above implemented shows the following runtime's for a variety of searches being run, on a lambda allocated with 1024 MB of RAM.

```
2021-09-13T14:33:34.114+10:00	Duration: 242.89 ms Billed Duration: 243 ms
2021-09-13T14:34:26.427+10:00	Duration: 6.44 ms Billed Duration: 7 ms 
2021-09-13T14:35:15.851+10:00	Duration: 3.40 ms Billed Duration: 4 ms 
2021-09-13T14:35:28.738+10:00	Duration: 1.10 ms Billed Duration: 2 ms 
2021-09-13T14:35:44.979+10:00	Duration: 6.11 ms Billed Duration: 7 ms 
2021-09-13T14:36:15.089+10:00	Duration: 170.31 ms Billed Duration: 171 ms 
```

The larger times are usually caused by a search for a really common term, which produces more results, and hence more work. This can actually be cut down with some early termination logic.

## Early Termination Logic

Wow... so early termination was something I was aware of but never investigated. I assumed it was a case of 

> We have 1,000 results and you are only going to look at 20 of them so lets stop processing more because its pointless

Which is sort of is, but then I started reading about early termination algorithms and stumbled into a huge branch of research I never knew existed. A few links I found are included below.

 - https://www.usenix.org/system/files/conference/atc18/atc18-gong.pdf
 - https://github.com/migotom/heavykeeper/blob/master/heavy_keeper.go
 - https://medium.com/@ariel.shtul/-what-is-tok-k-and-how-is-it-done-in-redisbloom-module-acd9316b35bd
 - https://www.microsoft.com/en-us/research/wp-content/uploads/2012/08/topk.pdf
 - http://fontoura.org/papers/lsdsir2013.pdf
 - https://www.researchgate.net/profile/Zemani-Imene-Mansouria/publication/333435122_MWAND_A_New_Early_Termination_Algorithm_for_Fast_and_Efficient_Query_Evaluation/links/5d0606a5a6fdcc39f11e3f0f/MWAND-A-New-Early-Termination-Algorithm-for-Fast-and-Efficient-Query-Evaluation.pdf
 - https://dl.acm.org/doi/10.1145/1060745.1060785

I didn't even know there was so much about it. The more you learn the more you realise you know so little. Anyway I quickly backed away from some of the techniques above and just had my simple implementation bail out once it had enough results, but with a guess as to how many would have been found had we kept going.

{{<highlight go>}}
// early return because how many do you really need?
if len(results) > 1000 {
    // guess how many matches we would have gotten had we continued
    return results, int(float64(1000) / float64(i) * float64(len(candidates)))
}
{{</highlight>}}

With the above done, searches worked well enough in a lambda. So I moved on to the next few problems.

## Getting Source Data

There are a heap of places to get a list of domains these days, which can serve as your seed list for crawling. People used to use DMOZ back in the day, but it no longer exists and its replacement does not offer downloads.

The following page https://hackertarget.com/top-million-site-list-download/ has a list of places you can pull top domains from, helping build this out.

I picked a few, pulled out all of the Australian domains, which are those ending in .au and created a new list. This produced a 12 million or so domains at the end all ready to be crawled an index. Nice and simple.

## Crawling Some Data

Crawling 12 million domains seems like a trivial task, up until you try it. While a million pages is something you should [taco bell](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html), but more than than needs a bit more work. You can read up on crawlers all over the internet, but I was using Go so this link https://flaviocopes.com/golang-web-crawler/ seemed fairly useful. Futher reading suggested using http://go-colly.org as it is a fairly decent Go crawler library. I wrote a quick crawler using Colly, but kept running in memory issues with it. Probably due to how I used it.

So in my case I wrote a "custom" crawler. Custom because I locked it to only downloading for a single domain I supplied, and had it process the documents as it went to extract out the content I wanted to index. This content is what I kept as a collection of JSON documents dumped one per line into a file, which I then stuffed into a tar.gz file for later processing and indexing.

An example prettified truncated document follows. The content you see there is what is actually passed into the indexer, and potentially stored in the index. 

```
{
    "url": "https://engineering.kablamo.com.au/",
    "title": [
        "Kablamo Engineering Blog"
    ],
    "h1": [
        "Lessons Learnt Building for the Atlassian Marketplace",
        "What I Wish I Knew About CSS When Starting Out As A Frontender",
        "How to model application flows in React with finite state machines and XState"
    ],
    "h2h3": [
        "Our Partners"
    ],
    "h4h5h6": null,
    "content": [
        "THE BLOG",
        "Insights from the Kablamo Team.",
        "28.7.2021 - By Ben Boyter"
    ]
}
```

There are problems with this technique. The first is that by discarding the HTML if you have a bug in your processing code you need to re-crawl the page. It also adds more overhead to the crawler, which are normally very CPU light and bandwidth heavy since part of the index process is being moved.

The advantage however is that the index process can be a little faster, and it reduces the disk space needed to store content before indexing. The disk space reduction can be huge as well, something like 1000x depending on the content on the page. For the samples I tired it was a 50x reduction on average. 

I then set my crawlers off, firstly going for breadth and getting as many of those 12 million domains as I could, and then again with depth to pull more pages. With the files ready I was ready to index.

## Ranking

Ranking is one of those secret sauce things that makes or breaks a search engine. I didn't want to overthink this so I implemented [BM25 ranking](https://en.wikipedia.org/wiki/Okapi_BM25) for the main ranking calculation. I actually implemented TF/IDF as well but generally the results were similar. I then added in some logic to rank matches in domains/urls and titles higher than content, penalize smaller matching documents and reward longer ones (to offset the bias thats in BM25). 

Ranking using BM25 or TF/IDF however means you need to store global document frequencies. You also need average document length for BM25. So those are two other things that need to be written into the index. Thankfully they can be calculated pretty easily at index time.

With those, the algorithm is fairly easy,

{{<highlight go>}}
// defaults for BM25 which provide a good level of damping
k1 := 1.2
b := 0.75

for word, wordCount := range res.matchWords {
    freq := documentFrequencies[word]
  
    // TF  = number of this words in this document / words in entire document
    // IDF = number of documents that contain this word
    tf := float64(wordCount) / words
    idf := math.Log10(float64(corpusCount) / float64(freq))

    step1 := idf * tf * (k1 + 1)
    step2 := tf + k1*(1-b+(b*words/averageDocumentWords))

    weight += step1 / step2
}
{{</highlight>}}

Of course everyone knows that PageRank by Google is what propelled Google to the top of the search heap... I don't know how true that is but regardless, pagerank requires processing your documents multiple times to produce the rank score for the domain or page. It takes a long time to do this, and while the whole thing beautiful mathematically, its not very practical especially for a single person working on this in their spare time. 

Can we find an easier way to do this? Some shortcut? Well yes. Turns out that all of the document sources where I got the domains, list those domains in order of popularity. So I used this value to influence the score giving a "cheap" version of pagerank. Add the domain popularity into the index when building it to provide some pre-ranking of documents.

I plan on making this able to be turned off at some point so you can just rank based on content, but for most general searches this really improves the results.

Note that ranking is especially important when working with bit vector or bloom filter search engines because of the false positives. The ranking helps drop these false positives to the bottom of the results.

## Adult Filter

Something all search engines need to deal with is identifying and filtering adult content. I don't feel like getting a PHD in deep learning to achieve this, so I went for a very simple solution.

Given a document, if any run of 4 out of 5 words, ignoring words 2 characters or less, are considered "dirty" which is they have a match in a collection of dirty terms, then mark the page as having adult content. This is very similar to how Gigablast does its adult filter, however without any obscene words that any single occupance causes this, and with a much larger group of dirty words.

Note this isn't meant to be a moral crusade. Its just something thats annoying to see in your search results at times and something users ask for almost instantly.

## Indexing

So the indexing step is the final step. To do it, I wrote a program that firstly walks all of the files downloaded. It reads the number of lines in each file and then groups files together into batches trying to find a collection of domains that when written together to disk get as close to the maximum size AWS allows for a lambda. This works out to be about a 150 MB of Go code, and about 70,000 documents. When compiled and zipped this tends to get very close to the 50 MB limit.

When a batch is found it is handed off to be processed. At this point the files are read, and the documents inside run though a process which analyses them, producing tokens ready to be indexed and determines a score for it.

The processing does things like looking at all of the titles, picking the first to be indexed. If a title is missing then it looks at H1 tags. Duplicate titles and H1's for the same domain are removed and content is tokenized and stemmed.

Then the tokens are checked to try and identify the document category and determine if it contains adult content or not. The final step is to index the batch and then write it out as a file.

With that all done, I write out the block. It's actually writing out to a Go file than can then be indexed.

{{<highlight go>}}
sb.WriteString(fmt.Sprintf(`var averageDocumentLength float64 = %d`, averageDocumentLength))

sb.WriteString(`var documentFrequencies = map[string]uint32{`)
for k, v := range newFreq {
    sb.WriteString(fmt.Sprintf("\"%s\": %d,", k, v))
}
sb.WriteString("}")

sb.WriteString("var bloomFilter = []uint64{")
for _, v := range bloom {
    sb.WriteString(fmt.Sprintf("%d,", v))
}
sb.WriteString("}")

_, _ = file.WriteString(fmt.Sprintf(`{Url:"%s",Title:"%s",Content:"%s",Score:%.4f,Adult:%t},`,
			res.Url,
			res.Title,
			res.Content,
			res.Score,
			res.Adult))
{{</highlight>}}

Once the block is written, it is then compiled and uploaded into AWS replacing the previous lambda. If its a new lambda, its deployed into AWS and the controller lambda has its environment variables update to know about the new lambda, at which point new searches will hit it and the index grows.

The result? Something like the below, where you can see multiple lambda's deployed.

![aws lambda search deployment](/static/abusing-aws-lambda/deployment.png)

There is some room for improvement here to make more optimal use of the lambda size. I purposely made the indexer not push the limits as its is a little dumb and can make mistakes. It should be easy to resolve when I get the time. It should improve the number of documents stored in each lambda by about 15% if done correctly. 

## Putting it all together

I have been a bit remiss in my devop's skills recently. Seriously the last time I seriously touched cloudformation I was using JSON though a custom template processor (don't laugh we all do it at some point).

The design is going to be this.

![aws lambda search design](/static/abusing-aws-lambda/design.png)

API Gateway fronts a single controller lambda which calls multiple workers. The workers contain the index, and when passed a query they search over their content finding matches, ranking them and then returning the top 20 results. The controller joins all the results together, resorts and sends the result back.

Pretty simple. 

Deploying the API Gateway and controller is done through cloudformation. Workers however are deployed directly using AWS API. This is done because they need to be updated and created fairly often and cloudformation was just too slow.

Of course we also need a website to serve it all up. I want to protect index itself, so rather than fire AJAX requests at the endpoint allowing anyone access, I quickly coded a small HTTP server which calls back to the endpoint and performs a search. I then turned to [mvp css](https://andybrewer.github.io/mvp/) to make it not offensively ugly and produced this result.

![bonzamate](/static/abusing-aws-lambda/1.png)
![bonzamate](/static/abusing-aws-lambda/2.png)

Considering all of the media search laws going on in Australia we can make this an Australian search engine, and maybe get some attention from someone willing to invest more into this.

Anyway seeing as I was going to the effort, I also added a quick info box output similar to the ones you see on Bing/Google/Duckduckgo which present some information for you based on wikipedia entries. Same idea as the workers, with the content compiled into a binary. The final bit was a news lambda, which pulls in news from






Also I can copy a lot of this post https://artem.krylysov.com/blog/2020/07/28/lets-build-a-full-text-search-engine/ which is a pretty decent 

Also while this is not totally original the scale out appears to be 



### Stemming

Stemming is a solved problem. So lets use an existing solution https://github.com/kljensen/snowball and since we are doing Australian sites we can focus on just English, seeing as thats the main language. Id love to throw in some native Australian languages too, but I also want to finish quickly so consider that something to add down the line.

### Filter

There is no best use stop word list. So I did a quick search and found this https://www.textfixer.com/tutorials/common-english-words.txt which has the below.

```
a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your
```

Another source might be http://xpo6.com/list-of-english-stop-words/ but the above is fine for my purposes.


## Deployment

