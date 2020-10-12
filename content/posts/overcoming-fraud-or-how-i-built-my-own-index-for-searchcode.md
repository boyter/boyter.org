---
title: Overcoming personal fraud, how I built my own index for searchcode.com
date: 2040-10-10
---

So admission. I have felt like a fraud for a while. I get a lot of questions about indexing code due to searchcode.com and generally my answer has always been I use Sphinx search. Recently that has changed, as I moved over to manticore search. For the record manticore is an excellent successor to sphinx and I really do recommend it. I like elasticsearch as well for enterprise search solutions.

However this still is me outsourcing the core functionality of searchcode to a third party, and I strongly believed you shouldn't outsource your core competency. Just its taken me about 10 years to do something about it in this case.

So lets think, what are the problems with searching source code. I have written about this before, but consider the following,

A query term,

```
i++
```

and then consider the following code snippets which should have a match,

{{<highlight java>}}
for(i=0; i++; i<100) {
for(i=0;i++;i<100) {
{{</highlight>}}

How do you split them into terms? By spaces results in the following,

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

Anyway in short, while sphinx/manticore are excellent, I really want build my own index. Honestly mostly because of the technical challenge and how fun it should be. Secondly because I think I cam improve on how searchcode works. Lastly because I doubt I will ever get to work on a large scale web index (its just too expensive to do yourself these days) so this at least lets me live large.

For the record I do not have a PhD in applied search or an real world experience building web indexes. I don't even work in the space professionally. I can use elastic search pretty well! Really I'm just some numb-nut who grew up in Western Sydney (up the riff!) and apparently dreams about flying close to the sun. Clearly I have no business writing my own indexer. But the nice thing about the internet is you really don't need anyones permission to do a lot of things, and so lets roll up our [flanno](https://www.urbandictionary.com/define.php?term=flanno) sleeves, roll a [durrie](https://www.urbandictionary.com/define.php?term=durrie)* and get coding. As such take anything below with a massive grain of salt before you start hurling the internet abuse at me.

* For the record I don't smoke not ever have

However before we start lets have a think about our requirements and constraints.

Requirements
 - We have a higher that normal term count per document than web
 - We don't need to support wildcard queries or OR search, AND by default
 - We need to be able to search special characters
 - We want to be able to update quickly as its a write heavy workload
 - We need to support filters on source, language and repository

Constraints

 - We want to store the entire index in RAM, cos RAM is cheap yeah?
 - We are using Go so we have to think about the impact of GC
 - We only index terms longer than 3 characters, and trim long ones down to 20 characters

So there are a few talked about ways to build an index (that I could find).

Brute Force, not this isn't an index strategy but worth discussing. Assuming you can get the entire corpus you are search into RAM it is possible to brute force search. Im including it here so I have the advantages and disadvantages, but suffice to say I have about 60 GB of RAM I can use to hold the index, which is nowhere near enough to hold the searchcode corpus.

Advantages
 - Space efficient!!!!
 - Easy to query/write
 - Can determine TF easily

Disadvantages
 - Slow... at scale IE not in RAM
 - Harder to scale because gotta duplicate all the data

Inverted index.

Advantages
 - Space efficient
 - Easy to query
 - Does not miss terms
 - Can store TF alongside terms

Disadvantages
 - Harder to do wildcard queries
 - Hard to update documents and avoid false positives


Trie EG https://github.com/typesense/typesense which uses Adaptive Radix Tree https://stackoverflow.com/questions/50127290/data-structure-for-fast-full-text-search

Advantages 
 - Constant lookup time
 - Potential to be space efficient if key terms share the same prefixes
 - Easy to do wildcard queries
 - Can store TF alongside terms

Disadvantages
 - Can take up more space if lots of prefixes
 - Not friendly to GC due to the use of pointers


Ngrams. Not something I am very familiar with. Which bothers me. Its one of those things I am not going to use mostly because of that reason, but hey I can always swap it out later if I want.

Advantages
 - Can do regular expression search!

Disadvantages
 - Not space efficient?


Bit Signatures. This is something I remember reading about years ago, and found this link to prove I had not lost my mind https://www.stavros.io/posts/bloom-filter-search-engine/ At the time I thought it was neat but not very practical... However then it turns out that Bing has been using this technique over its entire web corpus http://bitfunnel.org/ https://www.youtube.com/watch?v=1-Xoy5w5ydM


Advantages 
 - Stupidly fast if careful (bitwise operations are insanely fast)
 - Space/Memory efficient!!!
 - Easy to update/delete modify existing terms

Disadvantages
 - Cannot store TF information along terms
 - Produces false positive matches



So with the above I had a further think and decided I should try either an inverted index, a trie or bitsignatures. I quickly created some simple implementations of each to establish how they performed.

Firstly though, lets get an estimate of how much storage each is going to require.

Inside searchcode there is about 300 million code files. Ignoring duplicates give around 200 million code files that we want to search, broken up by 200+ languages.

There is probably about 5kb of code in most of those files, with each having about 500 unique terms. This gives us about 1.5 TB of code, which is actually in the ballpark, although I do compress the content at rest.

So given that, we can work out roughly how large the indexes might need to be. Im going to ignore most of the overhead of the implementation and just use the known sizes. In other words im going to assume a map, slice or other data structure is free for these estimates although that is far from the case.

For the inverted index we need in effect a large map of string to integer arrays, representing a word and which documents have it. Thats the bare minimum to work, but for Go large maps with strings are the devil causing high GC pauses. 

So lets assume there is a "free" mapping of strings to integers somewhere allowing us to use a integer for the words. We can worry about implementation later. Lets also assume we have less than 4 billion terms so we can use a 32 bit integer to save some space. However we do want to know what the count of each term is so lets add that too. 

So we end up with a map of 32 bit ints to a struct containing a 32 bit int (we have 300 million documents we might need to store so easily less that 4 billion) which gives us the following,

{{<highlight go>}}
type ind struct {
    count      uint8
    documentid uint32
}

map[uint32][]int
{{</highlight>}}

So we now know we need 4 bytes to store each term and 5 to track each position of it in a document.

So for our example document of 500 unique terms, to store it in the index takes 500 * 5 + 4 bytes. 2504 bytes. For our 200 million documents that's 500800000000 bytes which is about 500 GB.

Ouch. That is not going to fit into RAM. To confirm my numbers I had a look at the manticore index, and you know what? Its about that size. So our estimates are pretty close or so it seems, although manticore probably compresses the term lists and supports wildcards and such. Assuming gzip compression over a collection of ints you can probably reduce the size by 30% which is still way over our RAM limit. 

Incidentally I also tried a trie using the above and some random data to fit, and my goodness the Go GC really did not like it, taking seconds to walk the pointers. It also took a lot more memory than I would have thought and ended up filling my laptops RAM before crashing. Its possible a Adaptive Radix Tree would reduce this but I doubt it would be enough to fit conveniently in RAM.

So that leaves me with bit signatures from my original lists, cool. 

One of the things I was most curious about was how many bits they used for the bloom filters in bitfunnel. While it's entirely dependent on how large the documents are (since large documents have more terms) just having an idea helps when it comes to guessing. It took a while for me to pick it up but it was mentioned that they are around 1500 bits. Interesting. Well using our guesstimate of 500 unique terms, its pretty easy to use python to guess how many bits we might need, assuming we want a 1% false positive rate which should reduce the space requirements.

{{<highlight python>}}
from pybloom import BloomFilter

print len(BloomFilter(capacity=500, error_rate=0.01).bitarray.tobytes())
{{</highlight>}}

With the result being `1199`. Thats an impressive space saving there, because that works out to be about 150 bytes to store each document. Of course we don't have the count of each term, and need to store that somewhere else, but that's a far more approachable problem. If you bump up the number of bits to 1500 you get about a half a percent false positive error rate.

So back of napkin, 150 bits per filter times 200 million then converted into gigabytes,

`150 * 200000000 = ~3.75 GB`

Even if I am off by a factor of two for this thats easily going to fit into my RAM budget! So we have a winner on space at least. But how feasible is it to do an & operation on 200 million slices in memory? I am of course assuming that we don't implement any of the memory lookup savings that bitfunnel does, but it gives a nice idea of the sort of performance we can expect. Besides at this point after reviewing how bitfunnel worked I just itching to write a version of it. After all there is only so many papers you can read about something before wanting to do it. 

So lets write a simulation. I chose to make the filter be only 512 bits because thats easy to represent with a single 64 bit int.

{{<highlight go>}}
// setup 150 million 512 bit (64 byte) ints to represent each document with a bloom filter
index := []uint64{}
for i:=0;i<150_000_000;i++ {
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

For a simple brute force loop thats astonishingly fast. Its also using a single core to do it. I then tried it with 12 goroutines all running together and the runtime was roughly the same. However this is still a brute force algorithm, and as such we are still marching though all of the memory of the index. Can we reduce it?

The technique used by bitfunnel to avoid looking at all memory is cool. Using higher ranked rows, and the rotation of the bit vectors to reduce memory access is super neat.

But it also looks hard to implement. Reading the bitfunnel blog suggests the same, and the people writing that all have PhD's. So this technique is probably out of reach for most, and especially for a single person working on things in their spare time, and more so if that person is me.

So lets have a think. Can exploit the code we are searching? For example, we know that its unlikely for a Go file to have any matching code for `System.out.println` from Java, and Java is unlikely to have many matches for `fmt.println`.

Knowing this ee could organise our bloom filters into blocks. In fact we have to do this at some point because we want to persist it to disk, and it would be nice to do so so in chunks rather than trying to write the whole 4 GB structure to disk.

If we then order the chunks such that they contain mostly code of a single language and then store a logical | of all those signatures we can then test that superset row for potential matches. It will have more false positives, but it could have some savings. So consider the following four documents.

```
00110000
10000001
10010001
10110001
```

We can then store a single | of all the bits which produces

```
10110001
```

And then check out queries against that. If we have a potential match, then we go and look inside the store. Assuming we break these into logical blocks of a good chunk of documents we can potentially skip most of the index for many queries! Even if it increases the bit density to 50% we still have on average a 50% chance to not inspect a block, allowing us to skip half the index! However this is just a theory, and for now lets just get it working.

Get it working, get it right, make it fast. In that order.

Which means we also need the TF frequencies for each document. However we can save some space here. If we have a word with a single occurance in the document we don't need to store that, because we already know the word could be in there and can then just assume 1. This should cut down the TF size considerably!

Interesting to note that bing also stores the TF seperately. I was wondering how they knew what documents to send to their ranking oracle for queries such as "about" as clearly they are not sending half their corpus to it. There has to be some sort of pre-ranking going on to send the best candidate documents first.