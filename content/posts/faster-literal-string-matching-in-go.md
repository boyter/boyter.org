---
title: Faster Literal String Matching in Go
date: 2050-09-28
---

Recently I rebuilt https://searchcode.com/ in Go which I mentioned https://boyter.org/posts/searchcode-rebuilt-with-go/

While there was a variety of reasons for this one was that performance in the previous Python version was not great. This was mostly due to my own shortcomings and not the language itself. I have always used searchcode.com as a test bed for interesting problems, since it gets enough traffic to verify things at scale and as such you can quickly determine if something is working as expected or not.

So as mentioned one of the main performance hotspots in searchcode has always been finding the best lines to display and highlighting them. While most search engines can do this for you, for searchcode I have always done this myself, firstly for historical reason and secondly because I want to control this as I find it an interesting problem to solve.

Anyway one of the issues is, given some search terms such as "sally sea shell" finding all the locations of inside a string "Sally sells sea shells by the sea shore". While this seems to be a trivial task at first, since all you need a `indexOf` in a loop. The catch being when you want to do this in a case insensitive way.

I had previously written about https://boyter.org/posts/unicode-support-what-does-that-actually-mean/

The general answer to the above is to use Regular Expressions. However there are a few issues with this. Firstly, and there is no other way to say this, the regular expression engine in Go is slower than you think. Its usually not that bad till you hit some odd edge case. However its also not nessecary for searching for literals, 



> IndexAllIgnoreCase extracts all of the locations of a string inside another string up-to the defined limit. It is designed to be faster than uses of FindAllIndex with case insensitive matching enabled, by looking for string literals first and then checking for exact matches. It also does so in a unicode aware way such that a search for S will search for S s and ſ which a simple strings.ToLower over the haystack and the needle will not.
>
> The result is the ability to search for literals without hitting the regex engine which can at times be horribly slow. This by contrast is much faster. See index_ignorecase_benchmark_test.go for some head to head results. Generally so long as we aren't dealing with random data this method should be considerably faster (in some cases thousands of times) or just as fast. Of course it cannot do regular expressions, but that's fine.
>
> For pure literal searches which is no regular expression logic this method is a drop in replacement for re.FindAllIndex but generally much faster.




Of course talk is cheap... show me the benchmarks. Here is an example of the general Go way of finding all matches. I have a small program which you supply a search string and a filename. I test it against a 550MB file. First I run a case sensitive search using FindAllIndex in the regex package, then against IndexAll my own implementation. I do the same search against the case insensitive variants of both. The number on the end of each run is the number of matches found.

```
$ ./csperf ſecret 550MB
File length 576683100

FindAllIndex (regex)
Scan took 49.827369ms 0
Scan took 47.481561ms 0
Scan took 47.196833ms 0

IndexAll (custom)
Scan took 74.096167ms 0
Scan took 41.739351ms 0
Scan took 52.377169ms 0

FindAllIndex (regex ignore case)
Scan took 25.403231773s 16680
Scan took 25.39742299s 16680
Scan took 25.227218738s 16680

IndexAllIgnoreCaseUnicode (custom)
Scan took 2.04013314s 16680
Scan took 2.019360935s 16680
Scan took 1.996732171s 16680
```

The results speak for themselves. While the case sensitive search is only marginally faster (which might be useful depending on your use case) the case insensitive search is considerably faster.