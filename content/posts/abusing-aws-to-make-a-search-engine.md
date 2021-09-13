---
title: Abusing AWS Lambda to make an Aussie Search Engine
date: 2021-09-11
---

I am in the middle of building a new index for searchcode.com from scratch. No real reason beyond I find it interesting. I mentioned this to a work colleague and he asked why I didn't use AWS as generally for work everything lands there. I mentioned something to the effect that you needed a lot of persistent storage, or RAM to keep the index around. At that point I trailed off. Something occurred to me.

Lambda's or any other serverless function on cloud work well for certain problems. So long as you can rebuild state inside the lambda, becauase there is no gurantee it will still be running next time you hit it you are fine. The problem with that of course is that while they give you a modest amount of CPU and a decent amount of RAM modern search engines need to have some level of persistance to them. Either in RAM, as Google/Bing store the index in RAM these days or disk. Lambda however does not give your persistance like this.

So can you use lambda for this? Well... There is a saying in computing.

> Never do at runtime what you can do at compile time.

Lets see how far we can take that idea, by using AWS Lambda to build a search engine. So I tried baking index into the lambda binaries themselves.

The plan, is to shard the index using lambda's. Each one holds a portion of the index compiled into the binary that we deploy. Then we call each lambda using a controller which invokes all of them, collects all the results, sorts by rank, gets the top results and returns them.

We are limited to 50 MB per lambda after it is zipped and put into AWS, so there is an upper limit on the size of the binary we can produce. However, we can scale out to 1,000 lambda's (by default in any account) so assuming we can stuff ~100,000 documents into a lambda we could build an index containing ~100,000,000 pages.

The best part about this is that it solves one of the big problems with building a search engine, which is that you need to serve it. Usually this means paying for a heap of machines to sit there doing nothing up till someone wants to perform a search. With lambda however, you pay for nothing till it is being used. It also means we don't need to pay for the storage of the index because we are abusing lambda to store the index. 

AWS by default gives 75 GB of space to store your lambda's, but remember how I mentioned that the lambda is zipped? Assuming a 50% level of compression (and I think im lowballing that) we get an index of 150 GB for free. 

That should be enough for a proof of concept. In fact looking at the free tier limits of AWS...

> AWS Lambda	1,000,000 free requests per month for AWS Lambda	
> AWS Lambda	400,000 seconds of compute time per month for AWS Lambda

It will probably slide under the AWS Lambda Free tier as well for running this thing... so long as it does not get too much attention. 

If not, perhaps AWS will reach out and offer me some credits for being such a good sport, or so I can iterate on the idea and build it out further. Call me AWS, I know you have my details, at least in the Sydney region you do.

## Proving the idea...

So the first thing I considered was putting content directly into lambda's, and then brute force searching across that content. Considering out guess of storing 100,000 items in a lambda, for a modern CPU brute force string searching that in memory shouldn't be that hard and should return in a few hundred milliseconds. So I tried it. I created a Go file with 100,000 strings in a slice, and then wrote a simple loop to run over that performing a search. I used a library I had written about a year ago https://github.com/boyter/go-string to do this which provides faster case insentive search for string literals than regex.

Alas I undersestimated how weak the CPU allotted to a lambda is, and searches took several seconds. Even increasing the RAM and the CPU allotment didn't really help. So my fallback plan was to embed an index into the lambda, allowing for a quick scan over that index before looking at the content directly.

As I was already working on a replacement index for searchcode.com I have the majority of the code needed for this just lying around. For searchcode.com I had been working on a bloom filter based index based on the ideas of bitfunnel which was developed by Bob Goodwin, Michael Hopcroft, Dan Luu, Alex Clemmer, Mihaela Curmei, Sameh Elnikety and Yuxiong He and being used in Microsoft Bing [https://danluu.com/bitfunnel-sigir.pdf](https://danluu.com/bitfunnel-sigir.pdf). For those curious the videos by Michael are very informative.

This technique lends itself pretty well to this, because its just an array of 64 bit integers you scan across, making it trivial wo write this out into a file which you then compile. Its also already compressed and the actual code to search is faily simple. 

Because I am embedding this directly into code I simplified the index so its not a full bitfunnel implementation. I did rotate the bit vectors to reduce the memory lookups. Because of this I write the index as a huge slice of 64 uint64's. This slice is always a multiple of 2048 with the length of the bloom filter for each document being 2048 bits. Each chunk of 2048 holds 64 documents filling all of the uint64 bits. 

I am not using frequency concious bloom filters for this implementation, nor the higher ranked rows that are mentiond. This greatly simplifys the implementation, and results in a beautifuly simple core search algorithm.

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

The result of the above is a list of interesting document id's which can then be brute force checked. Bloom filters produce false positive results, but the above is fast enough to run in a few milliseconds cutting down on the total number of documents we need to inspect.

Once the candidates are picked, they are then processed using the brute force search I mentioned before, and those results are then passed off for ranking.

Checking cloudwatch with the above implemented shows the following runtimes for a variety of searches being run, on a lambda allocated with 1024 MB of RAM.

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

> We have 1,000 results and you are only going to look at 20 of them so lets stop processing

Which is sort of is, but then I started reading about early termination algorithms and stumbled into a huge branch of research I never knew existed.

https://www.usenix.org/system/files/conference/atc18/atc18-gong.pdf
https://github.com/migotom/heavykeeper/blob/master/heavy_keeper.go
https://medium.com/@ariel.shtul/what-is-tok-k-and-how-is-it-done-in-redisbloom-module-acd9316b35bd
https://www.microsoft.com/en-us/research/wp-content/uploads/2012/08/topk.pdf
http://fontoura.org/papers/lsdsir2013.pdf
https://www.researchgate.net/profile/Zemani-Imene-Mansouria/publication/333435122_MWAND_A_New_Early_Termination_Algorithm_for_Fast_and_Efficient_Query_Evaluation/links/5d0606a5a6fdcc39f11e3f0f/MWAND-A-New-Early-Termination-Algorithm-for-Fast-and-Efficient-Query-Evaluation.pdf
https://dl.acm.org/doi/10.1145/1060745.1060785

I didn't even know there was so much about it. The more you learn the more you realise you know so little. Anyway I quickly backed away from this and just had my simple implementation bail out once it had enough results, with a guess as to how many would have been found had we kept going.

{{<highlight go>}}
// early return because how many do you really need?
if len(results) > 1000 {
    // guess how many matches we would have gotten had we continued
    return results, int(float64(1000) / float64(i) * float64(len(candidates)))
}
{{</highlight>}}

With the above done, it proves that its actually possible to do this. So I moved on to the next few problems.

## Getting Source Data

There are a heap of places to get a list of domains these days, which can serve as your seed list for crawling. We used to use DMOZ back in the day, but it no longer exists and its replacement does not offer downloads.

The following page https://hackertarget.com/top-million-site-list-download/ has a list of places you can pull top domains from, helping build this out.

I picked a few, pulled out all of the Australian domains, which are those ending in .au and created a new list. This produced a 12 million or so domains at the end all ready to be crawled an index. Nice and simple.

## Crawling Some Data

Crawling 12 million domains seems like a trivial task, up until you try it. While a million pages is something you should [taco bell](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html), but more than than needs a bit more work. You can read up on crawlers all over the internet, but I was using Go so this link https://flaviocopes.com/golang-web-crawler/ seemed fairly useful. Futher reading suggested using http://go-colly.org as it is a fairly decent Go crawler library. I wrote a quick crawler using Colly, but kept running in memory issues with it. Probably due to how I used it.

So in my case I wrote a "custom" crawler. Custom because I locked it to only downloading for a single domain I supplied, and had it process the documents as it went to extract out the content I wanted to index. This content is what I kept as a collection of JSON documents dumped one per line into a file, which I then stuffed into a tar.gz file for later processing and indexing.

An example prettified trimmed document follows. The content you see there is what is actually passed into the indexer, and potentially stored in the index. 

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

There are problems with this technique. The first is that by discarding the HTML if you have a bug in your processing code you need to recrawl the page. It also adds more overhead to the crawler, which are normally very CPU light and bandwidth heavy since part of the index process is being moved.

The advantage however is that the index process can be a little faster, and it reduces the disk space needed to store content before indexing. The disk space reduction can be huge as well, something like 1000x depending on the content on the page. For the samples I tired it was a 50x reduction. 

## Ranking

Ranking is one of those secret sauce things that makes or breaks a search engine. I didn't want to overthink this so I implemented [BM25 ranking](https://en.wikipedia.org/wiki/Okapi_BM25) for the main ranking caluclation. I then added in some logic to rank matches in domains and titles higher than content, penalise smaller matching documents and reward longer ones (to offset the bias thats in BM25). 

Of course everyone knows that pagerank by Google is how you should do this... or is it? Pagerank requires processing your documents multiple times to produce the rank score for the domain or page. It takes a long time, and while a beautiful mathermatical idea, not super practical. Can we find an easier way to do this? Well yes. Turns out that all of the document sources where I got the domains, list those domains in order of popularity. So I used this value to influence the score giving a "cheap" version of pagerank.

I plan on making this able to be turned off at some point so you can just rank based on content, but for most general searches this really improves the results.

## Adult Filter

Something all search engines need to deal with is identifying and filtering adult content. I don't feel like getting a PHD in deep learning to achive this, so I went for a very simple soluthon.

Given a document, if any run of 4 out of 5 words, ignoring words 2 characters or less, are considered "dirty" which is they have a match in a collection of dirty terms, then mark the page as having adult content. This is very similar to how Gigablast does its adult filter, however without any obscene words that any single occurance causes this, and with a much larger group of dirty words.


## Putting it all together

I have been a bit remiss in my DevOp's skills recently. Seriously the last time I touched cloudformation I was using JSON though a custom template processor (don't laugh we all do it once).

So why not do it properly this time, and make it easy for those following along at home to try it out. The design is going to be this.

![aws lambda search design](/static/abusing-aws-lambda/design.png)

In short, a single controller lambda calls multiple workers. The workers contrl

https://www.sqlshack.com/calling-an-aws-lambda-function-from-another-lambda-function/
https://docs.aws.amazon.com/sdk-for-go/v1/developer-guide/lambda-go-example-run-function.html





Also considering all of the media search laws going on in Australia we can make this an Australian search engine, but indexing a chunk of Australian websites and hopefully get a nice free traffic boost.

Also I can copy a lot of this post https://artem.krylysov.com/blog/2020/07/28/lets-build-a-full-text-search-engine/ which is a pretty decent 

Also while this is not totally original the scale out appears to be https://www.morling.dev/blog/how-i-built-a-serverless-search-for-my-blog/



### Stemming

Stemming is a solved problem. So lets use an existing solution https://github.com/kljensen/snowball and since we are doing Australian sites we can focus on just English, seeing as thats the main language. Id love to throw in some native Australian languages too, but I also want to finish quickly so consider that something to add down the line.

### Filter

There is no best use stop word list. So I did a quick search and found this https://www.textfixer.com/tutorials/common-english-words.txt which has the below.

```
a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your
```

Another source might be http://xpo6.com/list-of-english-stop-words/ but the above is fine for my purposes.


## Deployment

