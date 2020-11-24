---
title: Bloom Filters
date: 2050-11-23
---

A bloom filter is one of those data structures you are probably already aware of. For those looking for a simple recap, they are a probablistic data structure which can be used to determine if something is in a set or not, giving a slight chance of returning a false positive result but while using less space.

What you may not know is that while you can use them as a space efficent hash/dictionary there are other use cases you might not be aware of. However to do some of those things you need to be able to lay out how the bloom filter works in memory

However before going though those, a quick moment to build one. Turns out a bloom filter is actually really easy to build if you don't mind doing it inefficently. I am going to implment one using JavaScript because anyone reading this can follow along using the browser console. Why? Well I find a simple bit of code 

The first thing you need is a hash function. Ideally for a bloom filter you want to use something like Murmur3 and FNV-1a because you want the hash to be as fast as possible and yet have a good distrubution. See [this excellent stackexchange](https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed) question and the first comment for more detail.

However because JavaScript in the browser does not come with hash, nor a good way for me to sitribute, here is a port of the Java string one which gets us moving without needing to implement anything too hard. You can copy and paste the below into your console.

```
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
```

So with that done lest create our filter. At it's heart the filter itself is just an array of bits. You only need to store two states for every entry in the array. Note that in many languages using a boolean is not backed by a bit so using boolean's as your backing array might not be as efficent as you anticipate.

So lets create a bloom filter which contains 16 element's and then hash two words and put them into the filter.

```
// start out our bloom filter out with 16 0's indicating its empty
var bloom = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

// add some words to the filter using a single hash
// we use % to convert our 32 bit number into one of 16 values
// for the length of our bloom filter
bloom["something".hashCode() % bloom.length] = 1;
bloom["another".hashCode() % bloom.length] = 1;

```

After running the above your bloom filter should have 2 bits set and look like the following,

```
[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]
```

As you can see positions 7 and 15 in this filter are now set. In order to check if something is in the filter, you do the same hash operations and check the value rather than setting. So if we want to see if something is in the filter,

```
if (bloom["something".hashCode() % bloom.length] == 1) {
	// something might be in the filter
}
```

The above is pretty much all you need to get started with bloom filters. For a real implementation swap out for a better hash function, in fact use two of them with salts in order to get more than 2 hashes which you will need to drive down the false positive rates. You also need to increase the size of the filter itself for anything non trival. Use [this calculator](https://hur.st/bloomfilter/) in order to determine how large a filter you need to achieve your desired false positive rate.



https://www.perl.com/pub/2004/04/08/bloom_filters.html/
https://gist.github.com/boyter/0cffa9ff8e2e7259d455594d744f1164