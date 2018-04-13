---
title: Collection of my favorite optimization posts and articles
author: Ben E. Boyter
type: post
date: 2018-03-08T22:34:02+00:00
url: /2018/03/collection-favorite-optimization-posts-articles/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Performance
  - Story
  - Tip

---
A collection of my favorite posts to read and re-read about optimizing code to an extreme. Unlikely that I will ever need to go to the extremes that these very talented individuals go to but its nice to learn the techniques.

In no particular order.

 - Announcement of Ripgrep a tool for searching code. Brilliantly written with benchmarks and analysis to explain what is happening for each <a href="https://blog.burntsushi.net/ripgrep/">https://blog.burntsushi.net/ripgrep/</a> the HN comments about it are worth reading as well <a href="https://news.ycombinator.com/item?id=12564442">https://news.ycombinator.com/item?id=12564442</a>
 - How Mailinator compresses email by ~90%. Very interesting use of some creative thinking and LRU caches <a href="https://mailinator.blogspot.com.au/2012/02/how-mailinator-compresses-email-by-90.html">https://mailinator.blogspot.com.au/2012/02/how-mailinator-compresses-email-by-90.html</a> some decent HN comments as well <a href="https://news.ycombinator.com/item?id=3617074">https://news.ycombinator.com/item?id=3617074</a>
 - Searching 1TB/sec: Systems Engineering Before Algorithms. Explains how using brute force solutions to solve problems can be viable if you have enough brute and can write a tight inner loop. <a href="http://blog.scalyr.com/2014/05/searching-20-gbsec-systems-engineering-before-algorithms/">http://blog.scalyr.com/2014/05/searching-20-gbsec-systems-engineering-before-algorithms/</a> the HN comments for this one are also worth reading <a href="https://news.ycombinator.com/item?id=7715025">https://news.ycombinator.com/item?id=7715025</a> and <a href="https://news.ycombinator.com/item?id=11783483">https://news.ycombinator.com/item?id=11783483</a>
 - The Treacherous Optimization. Post about making search faster by firstly comparing to grep and analysis of how grep achieves its speed. Very amusing in the way it is written as well. <a href="http://ridiculousfish.com/blog/posts/old-age-and-treachery.html">http://ridiculousfish.com/blog/posts/old-age-and-treachery.html</a>
 - Another from Paul Tyma of Mailinator but less about Mailinator and more about how cache misses on the CPU can impact your performance. <a href="https://mailinator.blogspot.com.au/2010/02/how-i-sped-up-my-server-by-factor-of-6.html">https://mailinator.blogspot.com.au/2010/02/how-i-sped-up-my-server-by-factor-of-6.html</a>
 - Another from Paul (that guy is seriously smart) about the architecture of Mailinator and some tricks it employs to run on a single server (at the time). <a href="https://mailinator.blogspot.com.au/2007/01/architecture-of-mailinator.html">https://mailinator.blogspot.com.au/2007/01/architecture-of-mailinator.html</a>
 - Improving spelling correction algorithm. Has code as well which is useful to learn from. <a href="http://blog.faroo.com/2012/06/07/improved-edit-distance-based-spelling-correction/">http://blog.faroo.com/2012/06/07/improved-edit-distance-based-spelling-correction/</a>
 - Profiling Ag. Writing My Own Scandir. Written by the author og ag the code searcher. <a href="https://geoff.greer.fm/2012/09/03/profiling-ag-writing-my-own-scandir/">https://geoff.greer.fm/2012/09/03/profiling-ag-writing-my-own-scandir/</a>
 - Another Ag post about adding threads into Ag to improve searching performance. <a href="https://geoff.greer.fm/2012/09/07/the-silver-searcher-adding-pthreads/">https://geoff.greer.fm/2012/09/07/the-silver-searcher-adding-pthreads/</a>
 - LMAX Distruptor interesting collection of posts about how it works <a href="https://lmax-exchange.github.io/disruptor/">https://lmax-exchange.github.io/disruptor/</a> the HN comments on the Martin Fowler blog are worth looking at <a href="https://news.ycombinator.com/item?id=3173993">https://news.ycombinator.com/item?id=3173993</a>
 - Regular Expression Matching with a Trigram Index or How Google Code Search Worked. <a href="https://swtch.com/~rsc/regexp/regexp4.html">https://swtch.com/~rsc/regexp/regexp4.html</a>
 - Excellent explanation of branch prediction and its impact on how quickly your code can run. Ran into this once with searchcode and felt like a genius when I solved it. <a href="https://stackoverflow.com/questions/11227809/why-is-it-faster-to-process-a-sorted-array-than-an-unsorted-array">https://stackoverflow.com/questions/11227809/why-is-it-faster-to-process-a-sorted-array-than-an-unsorted-array</a>
 - More branch prediction, A brief history of branch prediction by Dan Luu <a href="https://danluu.com/branch-prediction/">https://danluu.com/branch-prediction/</a>
 - Branch prediction ahoy! <a href="http://igoro.com/archive/fast-and-slow-if-statements-branch-prediction-in-modern-processors/">http://igoro.com/archive/fast-and-slow-if-statements-branch-prediction-in-modern-processors/</a>
 - Why Gnu Grep is fast <a href="https://lists.freebsd.org/pipermail/freebsd-current/2010-August/019310.html">https://lists.freebsd.org/pipermail/freebsd-current/2010-August/019310.html</a>
 - How to write fast code <a href="http://asserttrue.blogspot.com.au/2009/03/how-to-write-fast-code.html">http://asserttrue.blogspot.com.au/2009/03/how-to-write-fast-code.html</a>
 - Regular Expression Matching Can Be Simple And Fast (but is slow in Java, Perl, PHP, Python, Ruby, &#8230;) <a href="https://swtch.com/%7Ersc/regexp/regexp1.html">https://swtch.com/%7Ersc/regexp/regexp1.html</a>
 - Why Writing Your Own Search Engine is Hard <a href="https://queue.acm.org/detail.cfm?id=988407">https://queue.acm.org/detail.cfm?id=988407</a>
 - Effects of CPU caches https://medium.com/@minimarcel/effect-of-cpu-caches-57db81490a7f

Will attempt to keep this list up to date as I find other content that really impresses me.