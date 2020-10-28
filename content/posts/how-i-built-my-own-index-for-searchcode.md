---
title: How I built my own search index for searchcode.com
date: 2020-10-10
---

So admission. I have felt like a fraud for a while. I get a lot of questions about indexing code due to searchcode.com and generally my answer has always been I use [sphinx search](http://sphinxsearch.com/). Recently that has changed, as I moved over to its forked version [manticore search](https://manticoresearch.com/). Manticore is an excellent successor to sphinx and I really do recommend it. I also like elasticsearch as well for enterprise search solutions since it does things out of the box that sphinx/manticore are still catching up on.

However this still is me outsourcing the core functionality of searchcode to a third party, and I strongly believed you shouldn't outsource your core competency. Just its taken me about 10 years to do something about it in this case.

Anyway what follows are my notes while thinking about this from start to implementation. A lot of random thoughts, ideas and such going on. It's not in chronological order, but grouped by what I was thinking about at the time.


# The Problem

So I decided to build my own index/search for searchcode. Why would anyone consider doing this when there are so many projects that can do this for you. Off the top of my head we have code available for lucene, sphinx, solr, elasticsearch, manticore, xaipan, gigablast, bleve, bludge, mg4j, mnoGoSearch... you get the idea. There is a lot of them out there. Most of them however are focused on text and not source code. Also its worth noting that the really large scale engines such as Bing and Google have their own indexing engines which gives you the ability to wring more performance out of the system since you know where you can cut corners or save space, assuming you have the skill or patience.

So lets think, what are the problems with searching source code. I have written about this before, but consider the following,

A query term,

{{<highlight java>}}
i++
{{</highlight>}}

and then consider the following code snippets which should have a match,

{{<highlight java>}}
for(i=0; i++; i<100) {
for(i=0;i++;i<100) {
{{</highlight>}}

How do you split them into terms? By spaces which is what most engines do (for English language documents) results in the following,

{{<highlight java>}}
for(i=0; 
i++; 
i<100) 
{
for(i=0;i++;i<100) 
{
{{</highlight>}}

This is something I worked around in searchcode for years, by splitting the terms myself such that the search `i++` would work as expected.

So first takeaway is that there are more terms for source code compared to say normal text from a typical website, blog or document.

The second thing to observe is that we need to index those special characters. If someone wants to search for `for(i=0;i++;i<100)` there is no good reason to not allow them to do so. As such I had to configure sphinx/manticore to index these characters, but that's still a pain.

Another pain point is that special searches that most full test search engines offer. For example consider `*` which normally expands out terms. However in searchcode you might actually want to search for that, say looking up the use of pointers or some such.

Also stop words, which are the words you don't index because they aren't that useful. There aren't really any stop words in code... well I guess maybe import statements? Things that would normally be stop words such as `for and or not` are actually pretty useful to search for. Also the repetition of patterns means you end up with enormous term lists for common terms.

One way to get around the above is to index ngrams. This is how Google Code Search worked back in the day. However this technique has a few downsides. The first is you end up with really long posting lists. Usually compared to keywords its 4-5 times the number of keywords for ngrams of length 3. They also produce a lot of false positive matches which need to be filtered out. However the advantage is you can then use use those ngrams to provide some level of regular expression search on top which can be useful.

Anyway in short, while sphinx/manticore or whatever you favorite choice is are excellent, I really want build my own index. Honestly mostly because of the technical challenge and how fun it should be. Secondly because I think I cam improve on how searchcode works with that deep level integration. Lastly because I doubt I will ever get to work on a large scale web index (its just too expensive to do yourself these days, and I doubt Google nor Microsoft are that interested in me personally) and this gets me close to living that dream.

Also on occasion I get something like this, which is the manticore/sphinx process going a little crazy due to some search running in the system.

![bad sphinx](/static/how-i-built-index-searchcode/bad_sphinx.png)

Not what you want on your server when normally the load average is ~0.1. Hopefully I can ensure this never happens again.

For the record I do not have a PhD in applied search or an real world experience building web indexes. I don't even work in the space professionally. I can use elastic search pretty well though! Really I'm just some numb-nut who grew up in Western Sydney (up the riff!) and apparently dreams about flying close to the sun. Clearly I have no business writing my own indexer. But the nice thing about the internet is you really don't need permission to do a lot of things, so lets roll up our [flanno](https://www.urbandictionary.com/define.php?term=flanno) sleeves, then a [durrie](https://www.urbandictionary.com/define.php?term=durrie)* and get coding. As such take anything below with a massive grain of salt before you implement or start hurling internet abuse at me.

*NB* BTW I don't smoke

Ahem. However before we start lets have a think about our requirements and constraints. One thing to consider early on is how to do searches in your index you have two options. The first is to allow searches in parallel and the latter is to not. However the choice between might not be as simple as you would think. It also greatly impacts the design of the system.

Most would think, of course do it in parallel! Process in parallel so that way people wait less. But do they? As more searches come in the average time for each search goes up. Consider the situation that 10 people all search at the same time. Lets also assume that each search takes 1 second. Given limited resources which is true for most cases it means all 10 searches are shared across the system. As such everyone gets 1/10th of the system to search with and end up waiting 10 seconds for a result.

However consider doing it in serial. While all came in at once only one can go first, and that persons search returns in 1 second. The second was waiting on the first and their search takes 2 seconds. The third takes 3 seconds etc... till the last one who had a 10 second wait. Which is the better result? I would argue the latter.

There are a few other advantage to doing your searches in serial. You can attempt to consume all the resources you have at your disposal to give a good result, you don't have to worry about memory issues since you should know how much memory you need at any one time. As such I am going to make the choice to limit searches in the system to one at a time.

That decided lets list down the "requirements" and constraints we have.

Requirements

 - We don't need to support wildcard queries or OR search, AND by default but be able to implement them later...
 - We need to be able to search special characters
 - We want to be able to update quickly as its a write heavy workload
 - We need to support filters on source, language and repository
 - Its a free website, so we can deal with some downtime or inaccuracy
 - Only one search allowed at at time
 - We want searches to return in 0.2 seconds so a 200 ms time budget with no cache (lower is better though)
 - Want to embed into searchcode itself to avoid those dreaded network calls
 - No stopwords
 - Would be nice to get a spelling corrector in there too
 - We want to store as much of the index in RAM as possible, cos RAM is cheap now?
 - We only index terms longer than 3 characters, and trim long ones down to 20 characters
 - We don't need to do any term rewriting (where you map NY to new york and or search for both)
 
Constraints

 - We have a higher that normal term count per document than web
 - We are using Go so we have to think about the impact of GC and that its slower than other languages
 - This is a side project, so whatever is done needs to be achievable out of hours by a single person who is not a 10x developer

Why using Go I hear you ask? Well I know 3 languages reasonably well. Those being Java, C# and Go. The current version of searchcode.com is written in Go which is the main reason for using it. I don't know of anyone else using it but blekko back in the day was supposedly using Perl. Plus I would really like to get this embedded into the application itself to avoid those pesky expensive slow network calls.

It might surprise some reading this to learn that searchcode.com is the work of one person in their spare time. As such I write this pretty frankly. There is no money to be make in the free online code search market (just ask Google or Ohloh), so by all means feel free to take whats here and enter the "market" and loose money as well. There is a market in enterprise search though, so feel free to compete with sourcegraph if you like.

So there are a few talked about ways to build an index that I am aware of or could easily find and document.

Brute Force, not this isn't an index strategy but worth discussing. Assuming you can get the entire corpus you are search into RAM it is possible to brute force search. Im including it here so I have the advantages and disadvantages, but suffice to say I have about 30 GB of RAM I can use to hold the index, which is nowhere near enough to hold the searchcode corpus. That said the problem is pretty brute forcible given enough CPU and RAM.

Advantages
 - 100% space efficient (for the index anyway) since there isn't one
 - Easy to query/write
 - Can determine TF easily as its a positional "index"
 - Scales (assuming you are prepared to pay)

Disadvantages
 - Slow... at scale IE not in RAM
 - Harder to scale because gotta duplicate all the data
 
Inverted index. Pretty much building a map of terms to documents and then intersecting them and ranking. One issue with this technique is that you end up with enormous term lists, known as posting lists for common terms. As mentioned previously we cannot use stop words to reduce this, and even if we did there is a lot of repetition in code so you tend to get a lot of huge posting lists.

Advantages
 - Easy to query
 - Does not miss terms
 - Can store TF alongside terms as a positional index
 - Fast and easy; intersecting posting lists is something you can hand off to your most junior developer (at least initially)
 - Query execution time is related to the number of returned results

Disadvantages
 - Harder to do wildcard queries OR use more space for them
 - Hard to update documents and avoid false positives, usually have to rebuild the index or do delta + merge
 - Need to implement skip lists or compression on the posting lists at scale

Trie for example https://github.com/typesense/typesense which uses Adaptive Radix Tree https://stackoverflow.com/questions/50127290/data-structure-for-fast-full-text-search

Advantages 
 - Constant lookup time
 - Potential to be space efficient if key terms share the same prefixes
 - Easy to do wildcard queries
 - Can store TF alongside terms as a positional index

Disadvantages
 - Can take up more space if lots of prefixes
 - Not friendly to GC due to the use of pointers
 - Need to implement skip lists or compression on the posting lists at scale

Bit Signatures. This is something I remember reading about years ago, and found this link to prove I had not lost my mind https://www.stavros.io/posts/bloom-filter-search-engine/ At the time I thought it was neat but not very practical... However then it turns out that Bing has been using this technique over its entire web corpus http://bitfunnel.org/ https://www.youtube.com/watch?v=1-Xoy5w5ydM

Advantages 
 - Stupidly fast if careful (bitwise operations are insanely fast)
 - Space/Memory efficient
 - Easy to update/delete modify existing terms

Disadvantages
 - Cannot store TF information along terms as its a non-positional index
 - Produces false positive matches
 - Query execution time is linear in the collection size (bitfunnel is about reducing this to an extent)
 - Memory bandwidth of the machine limits how large the index can grow on a single machine

So with the above I had a further think and decided I should try either an inverted index, a trie or bitsignatures. Before I quickly create some simple implementations of each to establish how they perform, lets get an estimate of how much storage each is going to require.

Inside searchcode there is about 300 million code files (as I write this). Ignoring duplicates gives around 200 million code files that we want to search, broken up by about 240 languages across 40 million repositories.

There is probably about 5kb of code in most of those files, with each having about 500 unique terms. This gives us about 1.5 TB of code, which is actually in the ballpark, although I do compress the content at rest. However to be sure I wrote a simple program to loop through most of whats there to actually calculate this. Not as a true average, but a rolling average over every 10,000 files it was able to process. I am still waiting on the results but for the first 150,000 files the average shows about 330 unique terms which is bearing up to my back of napkin calculations. I also had this work out ngrams for length of 3 to see how it would fare and it was about 4 times the results.

The nice thing about this number is that its not stupidly big. It should be possible to run this on a single machine, and frankly its possible to brute force it given a powerful enough machine. Its certainly not a web scale problem in the sense that Google or Bing are.

So given our rough numbers, we can work out roughly how large the indexes might need to be. Im going to ignore most of the overhead of the implementation and just use the known sizes. In other words im going to assume a map, slice or other data structure is free for these estimates although that is far from the case.

For the inverted index we need in effect a large map of string to integer arrays, representing a word and which documents have it. Thats the bare minimum to work. Any index worth spit though is compressing the integer arrays somehow, either using Elias-Fano, just storing offsets or some other technique and using a skip list allowing you to step through it very quickly. If you don't do this you have problems when someone searches for a really common and a really rare term.

So lets assume there is a "free" mapping of strings to integers somewhere allowing us to use a integer for the words. We don't have one but for the moment while working things out lets assume so. Lets also assume we have less than 4 billion terms (I think Bing/Google have something like 10 billion per shard but we are simplifying here) so we can use a 32 bit integer to save some space. However we do want to know what the count of each term is so lets add that too, in other words we are making a positional index. 

So we end up with a map of 32 bit ints to a struct containing a 32 bit int (we have 300 million documents we might need to store so easily less that 4 billion) which gives us the following,

{{<highlight go>}}
type ind struct {
    count      uint8
    documentid uint32
}

map[uint32][]int
{{</highlight>}}

So we now know we need 4 bytes to store each term and 5 to track the number of them in a document.

So for our example document of 500 unique terms, to store it in the index takes 500 * 5 + 4 bytes. 2504 bytes. For our 200 million documents that's 500800000000 bytes which is about 500 GB. Even if we remove the positional portion of the index that about 400 GB.

Ouch. That is not going to fit into our RAM budget. To confirm my numbers I had a look at the manticore index searchcode is using now, and you know what? Its about that size spread across two machines. So our estimates are pretty close, although manticore probably compresses the term lists and supports wildcards and such. Assuming basic gzip compression over a collection of ints you can probably reduce the size by 30% which is still way over our RAM limit.

It gets back to that issue that code tends to also have very long posting lists. For example the word `for` or `while` appears a lot in most code. This tends to old true for a LOT of terms you might want to search for. So you end up with a lot of the lookups for being a hundred million terms long. The only feasible way for that to work, is distribute it across your cluster.

Incidentally I also tried implementing a trie using the above and some random data to fit, and my goodness the Go GC really did not like it, taking seconds to walk the pointers. It also took a lot more memory than I would have thought and ended up filling my laptops RAM before slowing down and being killed by me. Its possible a Adaptive Radix Tree would reduce this but I doubt it would be enough to fit conveniently in RAM.

There are techniques to reduce the size of the posting list though. Elias-Fano being one of the most well known, and Progressive Elias-Fano being perhaps even more efficient than bit signatures in terms of storage size. I don't know if thats going to continue to hold true for my use case. Also you still need to keep the term list in something like a skip list or some other data structure, which is a little more complexity than I am willing to commit to.

So that leaves me with bit signatures from my original choices, cool. Which is the one I wanted to implement anyway because it sounds so interesting. 

# Bit Signatures

So there is a bit of background reading needed here. But in short, you use a bloom filter which is a space efficient way of saying something is NOT in a set or MIGHT be in a set.

One of the things I was most curious about was how many bits Bing used for the bloom filters in bitfunnel. While it's entirely dependent on how large the documents are (since large documents have more terms) just having an idea helps when it comes to guessing. It took a while for me to pick it up but it was mentioned that they are around 1500 bits. Interesting. Well using our guesstimate of 500 unique terms, its pretty easy to use python to guess how many bits we might need, assuming we want a 1% false positive rate which should reduce the space requirements.

I had some Python code lying around which lets you do this.

{{<highlight python>}}
from pybloom import BloomFilter

print len(BloomFilter(capacity=500, error_rate=0.01).bitarray.tobytes())
{{</highlight>}}

There isn't mention of the number of hashes in there, but the result came back as using `1199`. Thats an impressive space saving there. Lets bump it up to 1536 bytes so its nicely divisible by 64. That works out to be 192 bytes to store each document. Of course we don't have the count of each term, and need to store that somewhere else, but that's a far more approachable problem, as you only ever need that when it comes to ranking. Also by bumping up the number of bits to 1536 you get about a half a percent false positive error rate.

The other useful thing about bloom filters is that they grow linearly to the benefit you get from the length. This means as you make it longer, you and drive down the false positive rate. Neat!

So back of napkin, 192 bytes per filter times 200 million then converted into gigabytes,

`192 * 200000000 == 38400000000 == ~38.4 GB`

Ok thats still not going to fit totally into my RAM budget unless I scale out and half the index per machine with what I am using now. However the searchcode machines have been running for a while, I could look at getting some new ones and get more CPU/RAM to boot! Or we could increase the size of the filter and drive down the error rate. If we increase the bit size to say ~7000 we can get a 1 in 1000 false positive.

Alternatively we could store ngrams in the index. This triples the number of terms in the bloom filter, meaning we need about ~13000 bits in the filter for a 1% error rate. This is going to really blow up the size of our index though.

Anyway in terms of space we have a reasonable winner. But how feasible is it to do an & operation on 200 million slices in memory? I am about to assume that we don't implement any of the memory lookup savings that bitfunnel does, but it gives a nice idea of the sort of performance we can expect. Besides at this point after reviewing how bitfunnel worked I just itching to write a version of it. After all there is only so many papers you can read about something before wanting to do it. 

So lets write a simulation. I chose to make the filter be only 512 bits because thats easy to represent with a single 64 bit int.

{{<highlight go>}}
// setup 200 million 512 bit (64 byte) ints to represent each document with a bloom filter
index := []uint64{}
for i:=0;i<200_000_000;i++ {
    index = append(index, rand.Uint64())
}

// setup a random "query" bloom filter
query := rand.Uint64()

// now we "search" and start timing from here
for i:=0;i<len(index);i++ {
    // perform the AND operation
    _ = index[i] & query
}
{{</highlight>}}

Running the above gives a time of about 80 ms on the laptop I was using at the time, which was a 2019 16-inch MacBook Pro.

For a simple brute force loop thats astonishingly fast. Its about as fast as you can iterate the array nearly! Its also using a single core to do it. I then tried it with 12 goroutines all running together and runtime as you would expect dropped to about 20 ms. However this is still a brute force algorithm, and as such we are still marching though all of the memory of the index. Can we reduce it?

The technique used by bitfunnel to avoid looking at all memory is cool. Using higher ranked rows.

But it also looks hard to implement. Reading the bitfunnel blog suggests the same, and the people writing that all have PhD's. So this technique is probably out of reach for most, and especially for a single person working on things in their spare time, and more so if that person is me.

However the rotation of the bit vectors to reduce memory access is super neat. Something that seems fairly easy to implement too. Lets look at that later once we thinking about it some more.

So lets have a think. Can exploit the code we are searching? For example, we know that its unlikely for a Go file to have any matching code for `System.out.println` from Java, and Java is unlikely to have many matches for `fmt.println`. There are papers out there with inconclusive evidence that this work, but thats for a web corpus. We are indexing code and are bound to run into a lot of keyword resuse.

Knowing this we could organise our bloom filters into blocks. In fact we have to do this at some point because we want to persist it to disk (for restarting the service), and it would be nice to do so so in chunks rather than trying to write the whole 30 GB structure to disk.

If we then order the chunks such that they contain mostly code of a single language and then store a logical | of all those signatures we can then test that superset row for potential matches. It will have more false positives, but it could have some savings. So consider the following four documents.

```
00110000
10000001
10010001
10100001
```

We can then store a single | of all the bits which produces

```
10110001
```

And then check out queries against that. If we have a potential match, then we go and look inside the store. Assuming we break these into logical blocks of a good chunk of documents we can potentially skip most of the index for many queries! Even if its only 50%b efficent it allows us to skip half the index! However this is just a theory, and for now lets just get it working. Incidently if you break the chunks up by language it gets even better when working with filters because you can skip even more blocks!

Get it working, get it right, make it fast. In that order. Lets start by just getting it working for the most basic version and see how it looks.

Thinking about TF frequencies for each document. We can save some space here. If we have a word with a single occurance in the document we don't need to store that, because we already know the word could be in there and can then just assume 1. This should cut down the TF size considerably!

Interesting to note that bing also stores the TF seperately in a forward index which stores a list of words for each document. I was wondering how they knew what documents to send to their ranking oracle for queries such as "about" as clearly they are not sending half their corpus to it. There has to be some sort of pre-ranking going on to send the best candidate documents first.

Of course there had to be more to it... as it turns out there isnt any "good" way to do bitsets in Go. Or rather none that fit my needs that well. I want 1536 bits that I can easily flip and otherwise do bitwise operations on. The obvious way to do it of a slice of boolean has actually an 8x memory overhead because of how it works.

1536 bits isn't too bad because I know what I need. Assuming I want 1536 bits for each document in the index I can have 24 64 bit integers for 1536 bits. An array in array should work, however there is no way we can store the whole index in RAM. However we can store the "higher" row in RAM and use that to keep track of everything. As always time to verify, because I want to ensure we can do an AND operation over an array of arrays containing 24 ints quickly.

I had a feeling this was going to hurt performance... by a lot. Because rather than one single & operation we are about to do 24 of them.... BUT the runtime of the loop before was close to the time to loop anyway so it might suprise me. Guess what? It did. With ten million items in the index, when I went from one bitwise operation to the full 24 the impact was negligible. Thats for a straight brute force implementation too.

However the problem is still this is larger than what was going to fit into RAM. So, I decided to make the concession of firstly bumping up the bits to avoid false positives. So heres the plan, lets break the index up into blocks of say 50,000 items. We can then persist those to disk, only pulling them when we need. This lets the OS deal with the paging and dealing with RAM. We then only keep the higher row in memory at all time. So long as we stick to our plan of sharding it by language we should be OK for most queries.

The other option is to do what Bing does. Shard both by document length and language. More complex, but should save some space. Especially if we be smart with it.

It depends on how much of a false positive rate we are willing to accept. I think somewhere around 1% seems fine. However looking at bitfunnel it gets somewhere around 2-3 so it might be worth reducing the index size at the expense of some addtional ranking. Depending on how fast we can make the ranking this might not be a huge issue.

The other thing we need to keep with this is per document its term frequency or TF. We need this for ranking, BUT we have a nice property about the bit signatures. Because if we get a match, we know there is at least one match, we can ignore storing any term that occurs only once in the document. This is an advantage again over the the term lists of an inverted index.

So this is getting a bit complex at this point, but hey nothing worth doing is usually easy. Before doing anything else lets consider the rotation.

Bit vector rotation. Because all the examples used in bitfunnel were using the same number of documents to vectors it took a while for this to sink in, as all the examples are a perfect square. Here is an example of it in ASCII which makes more sense... to me at least.

Lets consider an index with the following properties.

3 documents.
8 bit vector or bloom filter.
Single hash function, so each term added is hashed once and flips one bit.

```
Normal view, where we have documents as rows and the columns contain the bloom filter.

document1 10111010
document2 01100100
document3 00100111

Rotated view, where we have terms as the rows and columns are for a single document.

term1 001
term2 101
term3 011
term4 000
term5 100
term6 110
term7 010
term8 100
```

So when you search for a term such as "dog" all you need do is hash that term, and fetch that row. So assuming it hashed to the 5th bit we would know that row 5 would be the one to look at and that document1 potentially contains dog. Two or more terms is just as easy. Assuming you have "cat dog" where cat hashs to term 2, you get those rows,

```
101
100
```

Then & them together, which leaves only document 1 which looks like it has both cat and dog. This works out to be an amazing saving in the amount of memory you need to read. Of course you need to keep in mind cache lines and how memory is fetched for the CPU. Short note is to keep it to multiples of 64 bits for the CPU and 512 bits for RAM. It's actually more involved then that, but this gross over-simplification works well enough.

Now the above confused me for a while. In your normal view the row is constrained by the size of your bloom filter, so its fixed to 1500 bits or something. But the number of documents is unbound. So if flipped means you have these huge million long rows to worry about. The trick is to restrict the number of documents per "block". If you restrict it to say 64 documents you all of a sudden can store everything using 64 bit integers in a list of whatever works out to be the best size for your bloom filter. It also means that the row is only 64 bits long and is far more manageable.

The above sounds like a bloody good idea. We also have an idea about how optimal this can be based on the talk from [Dan Luu](https://www.youtube.com/watch?v=80LKF2qph6I). Where the above with the other tweaks gives about ~3900 QPS from a single server with 10 million documents. He mentions being close to that as well on their production system. 3900 QPS means about 0.2 milliseconds to process a query. Keep in mind that bitfunnel also uses higher rank rows to improve performance.

Considering I am storing 20x the documents, am working in a far slower language compared to C++ id be happy if I can get down to 10 ms for each query, which seems doable I guess? I suspect that most of it comes down to memory bandwidth. The CPU's I use for searchcode have about 17 GB per second bandwidth. So avoiding scanning all the memory is the main thing you have to worry about.

The other thing thats really useful to note is that the number of hash functions per term added varies. So you hash rare terms more than you hash common terms. This helps drive out the noise you get from the bloom filter. You can find details about this here https://www.clsp.jhu.edu/events/mike-hopcroft-microsoft/ and the video within.

However the annoying thing is that there is only so much you can do with "simuluations". Because I am just randomly picking ints it produces almost no matches. So I refined my simulation to try and get close to a real index.

I was looking into bloom filters and was wondering if having say a single hash function with salt was as effective as multiple hashes? A bit of searching around unearthed this https://news.ycombinator.com/item?id=14740032 and https://www.eecs.harvard.edu/~michaelm/postscripts/rsa2008.pdf which suggests that X hash fuctions, having two and a salt is good enough which saves the effort of finding different functions. Can use murmur3 and one of the fnv hashes.

Success! Hash 6ff1f8ad7c933c3942d75e43382bc00a59f208a5 I am now able to index and search against the filesystem. Its quite fast too! This is done with trigrams and against the linux kernel it searches in 1 ms or so compared to 400 ms for ripgrep (with warm disk cache). Pretty happy with that. All single core too which is the real suprise. I think this is looking fairly doable.

Even better Hash b0a30670c2d20e0ed19c4d444f8b4746bd43b8c3 has it working with a higher filter! This seems to cut down on a processing time for the rare terms, meaning we can skip huge chunks of the index without too much cost. It also means we can just load those chunks in from disk when needed keeping the index mostly on disk, and allowing the OS disk cache to look after it for us.

It seems to work reasonably well with the higher level filter. However results vary. I think it might need to be split by language as I thought it should have been from the beginning.


# Facets

So what about facets. Which searchcode has for filtering down by language, repository or source. These need to be calculated for each search. Also this turned out to be really painful. Working with 200 millon of anything is a serious pain. It was easily the most annoying bit of code I ran into that was just not fast enough no matter what I did.

It turns out though that this is a semi solved problem with papers such as https://en.wikipedia.org/wiki/HyperLogLog https://github.com/axiomhq/hyperloglog around to help with this. But who has time to read dusty old papers when we could code! Seriously though don't do that. I did have a quick look through these and I don't think my data sets are at a large enough level to need them... yet.

The filter itself can be done with a very small bloom filter, since it only needs to store 3 keywords in it. But it does raise an interesting property. Generally inside sphinx/manticore/elasticsearch/lucene you can only have a single filter value per filter for any document. This works well for things that sit in one category such as what language is this code written in. But what about things like what licence is this under? Its possible something is dual licenced, so it could be both MIT or BSD for example. This is something that the bloom filter can work with because you can assign it to both! In traditional indexes you create a new field, and put the values in there and then use regular AND/OR queries to deal with, which is what the bloom filter is doing in effect. Something for me to consider later.

So anyway back to facets. Given our 200 million documents how long does it take to determine what languages are in the result set.

{{<highlight go>}}
// hold the facet in memory where we assume 300 languages and randomly assign each document as to one
codeFacet := []int{}
for i:=0;i<200_000_000;i++ {
    t := rand.Intn(10)
    
    // attempt to distribute them such that some are more common than others
    // which reflects reality to an extent
    if t == 0 {
        codeFacet = append(codeFacet, rand.Intn(10))
    } else if t < 3 {
        codeFacet = append(codeFacet, rand.Intn(50))
    } else if t < 7 {
        codeFacet = append(codeFacet, rand.Intn(100))
    } else {
        codeFacet = append(codeFacet, rand.Intn(300))
    }
}

// lets simulate a search of which found 1 million matching documents in our result set
filters := map[int]bool{}
for i:=0;i<1_000_000;i++ {
    filters[rand.Intn(200_000_000)] = true
}

// now lets count how many times we see each "language" filtered by the search
// we start timing from here
realLangCount := map[int]int{}
for i:=0;i<len(codeFacet);i++ {
    _, ok := filters[i]
    if ok {
        realLangCount[codeFacet[i]]++
    }
}
{{</highlight>}}

So we try the above, and it takes roughly 11 seconds to aggregate. That's not going to work. Especially as it pegs a single core while doing it. It uses about 2 GB of RAM as well which is fine for our purposes, as 3 such lists for each of the current filters will be around 6 GB in total when implemented (unless we can mush them into the same list or something). 

I was curious to see how much Go was the problem. So I wrote a braindead implementation in Rust. Because of course no blog that mentiones Go is complete without some comparison to Rust either directly or in the comments. Also note that my Rust is also pretty poor at best. I then copied my implementation to Go to see how each fared. 

{{<highlight go>}}
package main

import (
    "fmt"
    "time"
)

func main() {
    // hold the facet in memory where we assume 300 languages and randomly assign each document as to one
    codeFacet := []int{}
    for i:=0;i<200_000_000;i++ {
        codeFacet = append(codeFacet, i%300)
    }

    // lets simulate a search of which found 1 million matching documents in our result set
    filters := map[int]bool{}
    for i:=0;i<1_000_000;i++ {
        filters[i%200_000_000] = true
    }

    start := time.Now().UnixNano() / int64(time.Millisecond)
    // now lets count how many times we see each "language" filtered by the search
    // we start timing from here
    realLangCount := map[int]int{}
    for i:=0;i<len(codeFacet);i++ {
        _, ok := filters[i]
        if ok {
            realLangCount[codeFacet[i]]++
        }
    }
    fmt.Println("time:", (time.Now().UnixNano() / int64(time.Millisecond)) - start, "ms")
}

{{</highlight>}}

{{<highlight rust>}}
use std::collections::HashMap;
use std::time::Instant;

fn main() {
    let mut codefacet = Vec::new();
    for n in 1..200_000_000 {
        codefacet.push(n % 300);
    }

    let mut matching_results = HashMap::new();
    for n in 1..1_000_000 {
        matching_results.insert(n % 200_000_000, true);
    }

    let start = Instant::now();
    let mut facet_count = HashMap::new();
    for codeid in codefacet.iter() {
        if matching_results.contains_key(codeid) {
            facet_count.entry(codeid).or_insert(0);
            *facet_count.get_mut(codeid).unwrap() += 1;
        }
    }
    println!("time: {} ms", start.elapsed().as_millis());
}
{{</highlight>}}

Followed by a quick compile and run,

```
$ go run main.go && cargo run --release
time: 11205 ms
    Finished release [optimized] target(s) in 0.03s
     Running `target/release/rusttest`
time: 8412 ms
```

Interesting. Rust is faster as you would expect, but not so much faster that you still wouldn't have a problem.

For comparison a mate of mine tried in C++ with -O3 and got a runtime of around 2 seconds. Not sure what voodoo its doing to achive that. We compared the output to ensure it was the same and it was. Our best guess was it unrolls the loop to fit the CPU/RAM best. This is rather annoying because if I were using C++ I would be very close to being done with that sort of performance.

Annoyingly there isn't much we can do to speed this up either. At least none that I am aware of. Certainly not with the way the data is laid out as it is. It's a straight line loop (which is about as fast as things get) which puts int values into a map. There are some faster map implementations in Go that it isn't going to solve our issue. Unless they are 40x times faster and they arent, I checked. However remember how I said we are limiting searches to one at a time? That means we can use all our cores to break the list apart and process using all our cores.

{{<highlight go>}}
cores := runtime.NumCPU()
shard := len(codeFacet)/cores
langCount := map[int]int{}
var langCountMutex sync.Mutex
var wg sync.WaitGroup

for c:=0;c<cores;c++ {
    wg.Add(1)

    from := shard * c
    to := shard * (c+1)
    if c == cores - 1 {
        to = len(codeFacet)
    }

    fmt.Println(from, to)

    go func(f int, t int) {
        for i:=f; i<t;i++ {
            _, ok := filters[i]
            if ok {
                langCountMutex.Lock()
                langCount[codeFacet[i]]++
                langCountMutex.Unlock()
            }
        }
        wg.Done()
    }(from, to)
}

wg.Wait()
{{</highlight>}}

Its a bit more bookkeeping then it should be IMHO and one of my main complaints about Go but it works mostly. It runs in about 200ms and uses all my cores while doing it. Note that I am using a mutex around a normal Go map, which is actually faster than the inbuilt sync map for cases such as this.

How do Google/Bing do this? Turns out they don't. For a start they don't have facets over the web index. It is the afore mentioned sphinx/manticore/elasticsearch/lucene which do. Time to go code spelunking. The Java ones are pretty annoying to read (I got bored) and my C++ is not good, but it looks like it does the same facet deal I was considering and relies on straight line speed. Of course they also tend to shard the index at 200 million documents. What about Bleve? its written in Go! Lets have a look at how it works.

Looking at index_impl.go (around [line 495](https://searchcode.com/file/158345498/vendor/github.com/blevesearch/bleve/index_impl.go/)) shows how the facets are constructed if on the supplied query. Turns out its doing roughly the same thing I was. A loop putting things into a map. I don't know what I was expecting, but it would have been a nice find to see some fancy way of speeding this up. I guess it means you cannot realisticly do filters using Bleve for 200 million items on a single core. Or you can, but be prepared to wait a bit for it to finish.

So what if we estimate? Turns out this is how Bing and Google work anyway. Not for facets but for search in general.

Don't belive me? Try searching for a fairly unique term. In my case I chose "boyter" on both. Google says it has 590,000 results for this and Bing says 107,000 results. However if you try to page though... Bing caps out on page 43 (interestingly Bing does not have a fixed number of results per page, possibly due to that false positive issue of bitfunnel) with 421 results. It shows more pages but won't let you access them. Google by contrast caps out on page 16 with 158 results. 

![google lies](/static/how-i-built-index-searchcode/google1.png)
![bing lies](/static/how-i-built-index-searchcode/bing1.png)
![google lies](/static/how-i-built-index-searchcode/google2.png)
![bing lies](/static/how-i-built-index-searchcode/bing2.png)

Clearly they are estimating here. What if I do the same? What if I get a sample of the index then estimate? Am I willing to sacrifice some accuracy for speed?

Heck yeah I am! If its good enough for Google and Bing then its good enough for me! Besides if we are going with the bit signature approach its not 100% accurate anyway, so a little more fuzzying cannot hurt too much.

The nice thing about this approach is that I can probably get a good estimate because I should know the relation of how common some terms are and be able to get a reasonable one. The best part about this is we can check if the server is busy and adjust the accuracy up or down depending on how busy the server is. Its also a case of not being 2x faster, but MUCH faster.

The question is how to skip over? I thought about firstly working out the sample size needed using your usual population calculation. But I realised it might be better to just change the increment on the loop. But what to increment to set? What you want is to randomly hit items, so a regular number such as 50 is no good. What about using a prime number? We could then pick two primes, iterate twice and then average them? We can then pick one lower level prime, and one higher for not much cost. 

Why primes you ask? Well I found the follow online which describes why they are useful more elegantly than I can.

> Primes, intersect at the last possible moment. 5 and 7, for example, only coincide at 35 (5*7). There's no intermediate value where they both show up. You'd think a lack of rhythm would be a bad thing, but in nature it can be an advantage. The cicada insect sprouts from the ground every 13 or 17 years. This means it has a smaller chance of "overlapping" with a predator's cycle, which could be at a more common 2 or 4-year cycle.

So lets model it on the life cycle of the cicada, which I am hoping to hear soon as I write this being in Australia and entering summer soon.

Sure we might miss some of the records, but at least it should run very quickly. In addition we can adjust our prime numbers based on how busy the server is. Higher primes for less accuracy when busy and lower when not.

I created our 200 million records, and then put in some weighted counts so we got clusters of numbers. The smallest prime I used here was about 89 which sped things up.

```
sample filter time 97
2 sample filter time 87
real filter time 8450

comparing sample filter to real filter
avg delta 120.11343253308269
missing 14

comparing 2 sample filter to real filter
avg delta 97.12998639702377
missing 19
```

Not the best result. Far more accurate to the real value while being faster but missing some values. Trying again with a 3 sample.

```
sample filter time 105
3 sample filter time 125
real filter count 9070

comparing 1 sample
avg delta 122.16727741384564
missing 14

comparing 3 sample
avg delta 100.78212739814019
missing 8
```

Thats what we are looking for. Much faster, almost as fast as the single sample (low prime number) but almost accurate guesses and missing far fewer. Probably good enough for saying yep this is a good idea.

Of course this needs to be done for each facet, but thats fine, we can adjust it down to make it faster if required.

This works for large values... but what about small ones?

Naturally I did not work. If you say only wanted to count 100 items... it missed everything. At that point we should probably just count them all. Or we could combine approaches.

Lets run it in parallel, with the prime filters, and do it on a sliding scale, so we look at more elements when we have smaller matches since it fast enough (probably because its branch predictor friendly) and if we have say 1 million matches we look every other one using a prime number skip. We in effect use the idea that for a larger sample size its more likely we will get representation of what we are measuring, which makes logical sense. Plus if we really want to be a snot about it we can use one of those faster map implementations to cut 20-50% off our map runtime.

In fact when I tried a version of the server its going to be deployed on it was many times faster than the machine I am working with. 15 million matching results ran in ~10ms.

That is a seriously cool result. Filter problem solved. Well maybe. Keep in mind thats just a locally optimal result. While we can process single filters in under 100 ms and probably all three of them in that same time budget, and speed it up trivially if we need (even dynamically as it turns out) at the expense of some accuracy, perhaps we should trudge on looking at other solutions.

But just to be complete. Lets just rethink how we organise the data. 

We know we want the filters following a search. We also know we want to look up those exact keys. Clearly a map is a better solution for this. Why bother looking through all 200 million when we can just select the million we want. O(1) lookups plus no annoying if conditions. We can also store each facet in that map so that we calculate each one at the same time!

Of course there is no free lunch and its going to eat more memory... but how much... A few minutes later to code up a version and test.

So our parallel estimate filter uses 1200 MB of RAM and takes about 18 ms to process 1 million matches, with a 2% error margin over its real counts and no missing. We can also cut that RAM usage down a lot, because we don't need to use a int to store it, nor 32 bit int. In fact we could use a int8, but just in case we add a lot more languages lets go with a int16. This brings it down to 300 MB of RAM.

By contrast the map is accurate, but uses 10,000 MB of RAM and takes 1542 ms to process 1 million matches. However if we have 3 maps one for each filter... we could also copy the int16 trick and see how that goes.

Wow. Thats an improvement. Down to 2000 MB of RAM but 3 ms to process.

The interesting thing is that the map method is order of magnitude faster for low counts, while the straight line is much faster for filters of over a million. They converge around the 50,000 mark.

So we have a choice... do we use extra RAM to speed this up and forget the large results, or settle for a decent average case. Maybe there is some hybrid model we can implement and get the best of both worlds?

How about if we create a slice as long as there are documents in the database, then use the slice index as the docid and whatever it holds as the value? Then lookups are O(1) because its just referring to the slice index. Better yet it should only be slowed down by the number of documents we need to lookup, so performance should be fast and accurate on small lookups and fast and accurate on large with a linear slowdown. The only real downside is that we waste some RAM because we need store the duplicate code indexes to ensure it all works out, but thats only going to double the slice, so about 600 MB of RAM. Even better this scales pretty nicely assuming you want to shard out. Store the offset, then a little math and you can shard to 20 machines with each holding 1/20th of the count.

In fact trying out the above takes 600 MB of RAM and processes 50,000 matches calculates in 3 ms. Thats a pretty sweet result. So we have improved the cut off for the worst case and we are using less RAM. Adding some parallel processing, and it takes longer. Presumably because most of the time is spent fighting over the lock... how about doing using their own maps and them merging them together at the end? Seemed to make no difference... One interesting property about the parallel one is that it seems to take the same amount of time no matter the number of results... I probably made a mistake with this.

So this is annoying because over some amount of results it slows down enough we need to do something about it. But I think we can use the approximation we tried before to solve this problem. When over some value we flip into the approximation mode using primes.

# Ranking

What about ranking?

We don't actually need anything too fancy for searchcode really. I doubt anyone is trying to game its search results, so spam isnt an issue nor is keyword stuffind. Anything that affects the ranking can just be deleted too. While web search engines tend to use thousands of signals in order to know how to rank searchcode can get by with something simple such as TF/IDF or a BM25 variant. Thankfully I have already implemented both (including the Lucene TF/IDF variant) for other projects, so moving over is a case of lift and shift.

The question being can my implementation of it work fast enough over millions of matches. At what point is it too slow and eating into our 200 ms time budget.

Thankfully both are based on simple lookups, basic math, an assignment and then a sort. Which part  do you think would be slowest? Turns out it was not the ranking, but the sort. Thankfully sort algorithms are well understood and the Go one is slow because of using interface. There are a few alternatives you can use such as https://github.com/twotwotwo/sorts/ or https://github.com/jfcg/sorty to solve this although for structs you will need to modify as you see fit. Again the lack of generics bits us.

However it did raise an interesting question. If you search for a common term such as boom on Bing or Google, both report over 50 million results. However the search still comes back instantly. Google claims it looked at 548,000,000. That number as I already established is lie, so lets assume it actually looked at 100 million. Its a common term so I will assume it was less overestimated than the other ones. That amount of results if we go by our calculations of about 500 terms per document and then 2504 bytes to store the terms of that document in the index,

`2504 bytes * 100000000 = ~250 GB`

This roughly works out to be about 250 GB of data you need to filter through and then sort. Lets say Google actually did the full range it reported that works out to 5x that result so 1.2 TB of data.

Now is it possible to rank and sort that much data in under 500 ms which Google returns in? 

There is the terasort benchmark which allows us to at least get an idea about this. Its a benchmark based on sorting 1 TB of random data as quickly as possible. I tried to find a recent result for this, but this https://www.wired.com/insights/2012/11/breaking-the-minute-barrier-for-terasort/ from 2012 shows that Google was able to sort the 1 TB of data in 54 seconds, using 4000+ CPU cores.

Lets assume it could be done in half the time with current CPU's. So 1 TB in 27 seconds, then lets do it for the 250 GB of data divided by 5 gives us 5.4 seconds. At this point I am fairly skeptical that Google is actually ranking the entire set. Even if they threw 5x the servers at it. Plus think of the cost. It was said that at the time the terasort record cost about $9. Lets assume it gets massively more efficient over time and say that it costs $1 for every search on Google for a common term to rank.

Apparently Google did over 2 trillion searches in 2016. They also made about $90 billion dollars that same year. Pretty clearly that isn't going to work out even in silicon value make your losses up in volume land. You really need to be processing that sort for fractions of cents.

Its a similar story on Bing. Even if it is losing money for Microsoft I doubt its losing money that quickly. While they have multiple machines which might solve the time issue, I doubt any company is going to let customers burn 10c to $1 per user action, unless charging $2 per action.

So how do they do it? I only have theories as I have never worked on a commercial search engine but I suspect there is some sort of pre-ranking going on or caching of some query terms with ranking, and on top of that smaller set is the actual ranking which then includes your user data and whatever other signals they use in the secret sauce. This makes some sense really because while PageRank is apparently not the most important signal used today some form of it still is, and pagerank is very much a pre ranking algorithm.

I have a theory that some of the reason that Google's search isn't as good as it used to be is the above. I suspect so much pre ranking goes on that when your query comes along you just get a custom ranked version of what was already pre ranked. As such its less about your query now and more about those pre ranks. If true I don't think the problem is going to get better anytime soon as the web keeps growing exponentially making it almost impossible for a new player to enter the market with a new algorithm. Meanwhile Google has no real reason to adjust its algorithms since its making more money than it know whats to do. The only thing that might change this is if someone comes up with seriously clever and is able to index at a cheaper price. Which I guess is what Cuil did, but they didn't get the ranking done very well. 

So back to my problem trying out on my local machine a rank and sort for 1 million documents. Pre-ranking sounds resonable, but we aren't talking about hundreds of millions of ranks here. We just arent in the same level of scale. For 1 million matching documents ranking takes 80 ms and sorting 264 ms. Thats without attempting to make it go any faster, on my first cut of the code.

Ranking is the easy one to speed up. We run it in parallel. That brings it down to 10 ms for 1 million documents. We can also flip from [Lucene TF/IDF](https://opensourceconnections.com/blog/2015/10/16/bm25-the-next-generation-of-lucene-relevation/) to pure TF/IDF for a small saving, changing the line

{{<highlight go>}}
weight += math.Sqrt(tf) * idf * (1 / math.Sqrt(float64(results[i].wordCount)))
{{</highlight>}}

to

{{<highlight go>}}
weight += tf * idf
{{</highlight>}}

which for very large cases saves a few ms of time. It reduces quality a bit, but generally if someone search for `for` there isnt anything useful to show them, so its probably acceptable to cut some corners there in the interest of speed.

Thats ranking taken care of. Or so I thought. I looked at the profile, most of the time is spent in math.Log10. Swapping out for a faster version with less accuracy reduces out runtime by 50% again which once again is acceptable for millions of results.

Now for speeding up the sorting. There are faster sorting algorithms than what Go ships with as I mentioned. Some do so by trading memory for speed. But first lets try doing something else. The ranking algorithm returns a float with 0 being the lowest possible rank and the highest some number way higher than than. If we iterate through the slice and find the highest number, we could then loop though looking for ranks close to that, shove that into a new list and sort that. The reason this works is looping over a slice in Go is really fast. 

We could also use our prime number trick to step through the list twice and on average we should find the highest number in the list. The loops look something like this,

{{<highlight go>}}
var maxScore float32
for i:=0;i<len(results);i += 263 {
    if results[i].score > j {
        maxScore = results[i].score
    }
}
for i:=0;i<len(results);i += 251 {
    if results[i].score > j {
        maxScore = results[i].score
    }
}
{{</highlight>}}

Note that the values of 263 and 251 are just ones I picked. They actually need to scale based on how many results we are iterating over in order to run fast enough, but in this example they only overlap every 66013 elements.

With that in place we know that the top score might be say 43.01 or some other value. We can then iterate over our list looking for values higher than say 95% of this value. Then keep reducing that percentage size till we get whatever count of items we need. 

This has the double bonus of making the list mostly sorted in reverse order, which should help with speeding up the final sort as well depending on what sort algorithm Go uses under the hood. Im assuming insertion sort for short slices and timsort otherwise, but should probably verify that assumption.

Regardless this new idea is actually fairly easy to code.

{{<highlight go>}}
var topResults []*doc
aboveScore := (maxScore / 100) * 95
for len(topResults) <= 1_000 {
    for i:=0;i<len(results);i++ {
        if results[i].score >= aboveScore { // must be >= or infinite loop here, so be careful!
            topResults = append(topResults, results[i])

            if len(topResults) >= 1_000 {
                break
            }
        }
    }

    aboveScore = aboveScore * 0.9
}
{{</highlight>}}

The results? Well for 5 million documents, the ranking takes about 80 ms. The finding of the top results and sorting them takes 26 ms. Looks like the sorting issue is solved. Also this leaves us with a huge time budget for putting additional ranking on top if we want.

In fact after all the above and some other tweaks I was able to get it ranking 50 million documents in 800ms and the sorting and selection done in under 30 ms.

The reality is though that I am likely to cut off any further processing if we get something like 100,000 or something documents. Its not like I let you page through them anyway. It's not like web search where if you search for facebook and facebook happens to be the 2 millionth document people are going to notice that its not in your search results. Also at 100,000 documents on my laptop I can rank, collect and sort in ~3 ms which is probably fast enough for my purposes.