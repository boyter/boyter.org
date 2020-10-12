---
title: Overcoming Fraud, How I built my own index for searchcode.com
date: 2050-06-14
---

So admission. I have felt like a fraud for a while. I get a lot of questions about indexing code due to searchcode.com and generally my answer has always been I use Sphinx search. Recently that has changed, and I moved over to manticore search. For the record manticore is an excellent sucessor to sphinx and I really do reccomend it. 

However this still is me outsourcing the core functionality of searchcode to a third party.

So lets think, what are the problems with searching source code. I have written about this before, but consider the following,

A query term,

```
i++
```

and then consider the following code snippets which should have a match,

```
for(i=0; i++; i<100) {
for(i=0;i++;i<100) {
```

How do you split them into terms? By spaces results in the following,

```
for(i=0; 
i++; 
i<100) 
{
for(i=0;i++;i<100) 
{
```

This is something I worked around in searchcode for years, by splitting the terms myself such that the search `i++` would work as expected.

So first takeaway is that there are more terms for source code compared to say normal text from a typical website, blog or document.

The second thing to observe is that we need to index those special characters. If someone wants to search for `for(i=0;i++;i<100)` there is no good reason to not allow them to do so. As such I had to configure sphinx/manticore to index these characters, but that's still a pain.

Another pain point is that special searches that most full test search engines offer. For example consider `*` which normally expands out terms. However in searchcode you might actually want to search for that, say looking up the use of pointers or some such.

Anyway in short, while sphinx/manticore are excellent, I really want build my own index. Honestly mostly because of the technical challenge and how fun it should be. Secondly because I think I cam improve on how searchcode works.

However before we start lets have a think about our requirements and constraints.

Requirements
 - We have a higher that normal term count per document than web
 - We don't need to support wildcard queries or OR search, AND by default
 - We need to be able to search special characters
 - We want to be able to update quickly as its a write heavy workload

Constraints

 - We want to store the entire index in RAM
 - We are using Go so we have to think about the impact of GC

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