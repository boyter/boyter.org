---
title: Identifying duplicate and near duplicate code results in a code search engine
date: 2050-04-13
---

One of the annoying things about running a code search engine is dealing with duplicate code results. While this is a problem all search engines face, when it comes to source code its especially problematic because its rare to find someone who writes code without pulling in some copied code, using a common library such as jQuery.

When removing duplicates you have two options. First is to do it at run time just before displaying the results. The second is to try and remove them from your index entirely by identifying them before indexing. 

In practice you need a mix of both. The first runtime option since people copy and paste functions inside other code, and the second because if you don't remove duplicates is bloats your index with redundant results.

Where this gets problematic is when you want to deal with "fuzzy" matches, where you try to remove content that is 90% the same. Using the jquery example, its unlikely there is much value showing results from both version 1.9.0 and 1.9.1 sice they are likely to be very similar.

Removing duplicates at runtime is easier. It's also the advice given by [Anna Patterson](https://queue.acm.org/detail.cfm?id=988407). To do so in the case of search code is to loop the results, once and filter out any results where all of the lines returned match. A simple for loop, or filter operation over your results is all you need.

This is already live on https://searchcode.com/ now. It was for a long time one of the main complaints it recieved. So you should see more unique results if you are using it, including results from the API. I plan on add in a way to see those duplicates if you want at some point.

This gives a better experience, but those documents are still sitting in the index taking up valuable RAM and so I have and continue to spend a considerable amount of time trying to filter them out before indexing.

My first attempt at this was to take a simple MD5 has of all content and store that in the database. I then run a process that iterates every repository in order of its popularity, and the files within that repository. When it processes a file it checks if the MD5 hash has been seen before. If it exists it is marked as a duplicate. If not, it is considered the first of its kind and marked original. The index is then built using this information to avoid the duplicates.

This works pretty well, but what I actually want is a fuzzy matcher, because of that afore mentioned multiple minor jQuery version problem. This falls into the domain of [Locality-sensitive hashing](https://en.wikipedia.org/wiki/Locality-sensitive_hashing) known as LSH. 


For the second Google published a solution to this some time ago using called [simhash](https://en.wikipedia.org/wiki/Simhash). This sounds great in theory. Calculate a hash, store it, and use that to filter out near duplicates. However a problem with this is that it becomes a O(n^2) problem. In order to identify near duplicates you have to get its simhash, and then compare that hash to every other one to get a distance. For the ~800 million files that searchcode is aware of this becomes problematic.

There are ways reduce this however. First being that we don't need to loop everything, since we already looked at the previous results we only need scan from where we already are. We can also use information inside searchcode, such as the filename, the language, and even the code 


You won't see any of this though. Because the serve time filter removes these duplicates. However what you will get is more results because by removing these duplicates from entering the index at all I can get more unique results.

