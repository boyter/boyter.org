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

So first takeaway is that there are more terms for source code compared t


So there are a few talked about ways to build an index (that I could find).

Brute Force

Advantages
 - Space efficient!!!!
 - Easy to query/write

Disadvantages
 - Slow... at scale IE not in RAM
 - Harder to scale because gotta duplicate all the data

Inverted index.

Advantages
 - Space efficient
 - Easy to query
 - Does not miss terms

Disadvantages
 - Harder to do wildcard queries
 - Hard to update documents and avoid false positives


Trie EG https://github.com/typesense/typesense which uses Adaptive Radix Tree https://stackoverflow.com/questions/50127290/data-structure-for-fast-full-text-search

Advantages 
 - Constant lookup time
 - Potential to be space efficient if key terms share the same prefixes
 - Easy to do wildcard queries

Disadvantages
 - Can take up more space if lots of prefixes
 - Not friendly to GC


Ngrams

Advantages
 - Can do regex search!
 - 

Disadvantages
 - Not space efficnet


Bitsignatures

Advantages 
 - Space efficent!!!
 - Easy to update/delete modify existing terms

Disadvantages
 - Cannot store TF information