---
title: Bloom Filters - Much, much more than a space efficient hashmap!
date: 2020-11-23
---

A bloom filter is one of those data structures you are probably already aware of. For those looking for a simple recap, they are a probablistic data structure which can be used to determine if something is in a set or not, giving a slight chance of returning a false positive result but while using less space.

What you may not know is that while you can use them as a space efficent hash/dictionary there are other use cases you might not be aware of. However to do some of those things you need to be able to lay out how the bloom filter works in memory

## Implementation

However before going though those, a quick moment to build one. Turns out a bloom filter is actually really easy to build if you don't mind doing it inefficently (at least at first). I am going to implment one using JavaScript because anyone reading this can follow along using the browser console. Why? Well I find a simple bit of code 

The first thing you need is a hash function. Ideally for a bloom filter you want to use something like Murmur3 and FNV-1a because you want the hash to be as fast as possible and yet have a good distrubution. See [this excellent stackexchange](https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed) question and the first comment for more detail.

However because JavaScript in the browser does not come with hash, here is a port of the Java string hash which gets us moving without needing to implement anything too difficult. You can copy and paste the below into your console, which will add a hash function to strings.

{{<highlight javascript>}}
// Primitive hash function that for a string returns a positive 32 bit int
// Do not use in production, use murmur3 or fnv1
Object.defineProperty(String.prototype, 'hashCode', {
  value: function() {
    var hash = 0, i, chr;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
});
{{</highlight>}}

So with that done lest create our filter. At it's heart the filter itself is just an array of bits. You only need to store two states for every entry in the array. Note that in many languages using a boolean is not backed by a bit so using boolean's as your backing array might not be as efficent as you expect. You tend to need to use a bitset implementation or bit packing into an integer for efficency but thats out of the scope of what we need here.

Lets create a bloom filter which contains 16 booleans to represent out bits and then hash two words and put them into the filter.

{{<highlight javascript>}}
// start out our bloom filter out with 16 0's indicating its empty
var bloom = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

// add some words to the filter using a single hash
// we use % to convert our 32 bit number into one of 16 values
// for the length of our bloom filter
bloom["something".hashCode() % bloom.length] = 1;
bloom["another".hashCode() % bloom.length] = 1;

{{</highlight>}}

After running the above your bloom filter should have 2 bits set and look like the following,

{{<highlight javascript>}}
[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]
{{</highlight>}}

As you can see positions 7 and 15 in this filter are now set. In order to check if something is in the filter, you do the same hash operations and check the value rather than setting. So if we want to see if something is in the filter,

{{<highlight javascript>}}
if (bloom["something".hashCode() % bloom.length] == 1) {
	// something might be in the filter
}
{{</highlight>}}

Note the comment that says it "might" be in the filter due to the false positive properties of a bloom filter.

The above is pretty much all you need to get started with bloom filters. For a real implementation swap out for a better hash function, in fact use two of them with salts in order to get more than 2 hashes which you will need to drive down the false positive rates. You also need to increase the size of the filter itself for anything non trival. Use [this calculator](https://hur.st/bloomfilter/) in order to determine how large a filter you need to achieve your desired false positive rate.

Note that the false positive rate is actually a feature, and there are situations where you might want to drive it up or down to achive your goal.

## Usage

But bloom filters can be so much more than a space efficient hashmap! Lets go though some common and less common use cases for them.

The first of course is using like you might use a hashmap as lookup cache. Consider running a video/music store where you pull detailed information about the movie or song from a backend database or cache. With a bloom filter fronting it you could use a smallish amount of memory to filter requests to the backend by only looking where you know a result exists. Because each key you need to store can fit into ~9 bits of data thats an impressive space saving.

Consider the properties of a bloom filter. Because you hash keys multiple times though a non reversible function, its possible to then share your bloom filter at the end as a way to share information that you hold without sharing the information itself. Its not even possible to brute force to get the information back because you can configure your filter to have a higher error rate and swamp the attacker with false positives.

Consider distributed social networks where I want to have two people determine if there is any overlap in their contact lists, without having to share the lists. You could build a filter for each users contacts and then check against that in order to determine if we have an overlap, without the possibility of you being able to reconstruct either list were you to hold even both filters. Assuming I am worried about someone getting a copy of these filters I can also drive up the false positive rate to thwart the attack. If you are more 

You can extend this idea futher as well. Say I want to determine the overlap between two user's social circles. Build two filters of the same size containing each users friends. Then compare the bits of the two filters. The more overlap the more shared bits.

The idea of sharing reasonable proof of ownership is an interesting use case for bloom filters. I could for instance use it in order to 

You can also use bloom filters to make a search engine. I first read about this idea on Hacker News https://www.stavros.io/posts/bloom-filter-search-engine/ with the idea being you build a bloom filter per document you want to index and then loop over each filter to check if terms are in each. This works at a small scale of a few thousand 

## Others

There are modified versions of bloom filters, as well as other similar structures. 

Variants include compressed bloom filters, and counting bloom filters.

The cuckoo filter for example works in a similar way to a bloom filter, except it has a inbuilt limit after which it will no longer add items, can delete items and has some different memory characteristics.


https://www.perl.com/pub/2004/04/08/bloom_filters.html/
https://gist.github.com/boyter/0cffa9ff8e2e7259d455594d744f1164