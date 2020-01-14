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

 - Announcement of Ripgrep a tool for searching code. Brilliantly written with benchmarks and analysis to explain what is happening for each https://blog.burntsushi.net/ripgrep/ the HN comments about it are worth reading as well https://news.ycombinator.com/item?id=12564442
 - How Mailinator compresses email by ~90%. Very interesting use of some creative thinking and LRU caches https://mailinator.blogspot.com.au/2012/02/how-mailinator-compresses-email-by-90.html some decent HN comments as well https://news.ycombinator.com/item?id=3617074
 - Searching 1TB/sec: Systems Engineering Before Algorithms. Explains how using brute force solutions to solve problems can be viable if you have enough brute and can write a tight inner loop. http://blog.scalyr.com/2014/05/searching-20-gbsec-systems-engineering-before-algorithms/ the HN comments for this one are also worth reading https://news.ycombinator.com/item?id=7715025 and https://news.ycombinator.com/item?id=11783483
 - The Treacherous Optimization. Post about making search faster by firstly comparing to grep and analysis of how grep achieves its speed. Very amusing in the way it is written as well. http://ridiculousfish.com/blog/posts/old-age-and-treachery.html
 - Another from Paul Tyma of Mailinator but less about Mailinator and more about how cache misses on the CPU can impact your performance. https://mailinator.blogspot.com.au/2010/02/how-i-sped-up-my-server-by-factor-of-6.html
 - Another from Paul (that guy is seriously smart) about the architecture of Mailinator and some tricks it employs to run on a single server (at the time). https://mailinator.blogspot.com.au/2007/01/architecture-of-mailinator.html
 - Improving spelling correction algorithm. Has code as well which is useful to learn from. http://blog.faroo.com/2012/06/07/improved-edit-distance-based-spelling-correction/
 - Profiling Ag. Writing My Own Scandir. Written by the author of ag the code searcher. https://geoff.greer.fm/2012/09/03/profiling-ag-writing-my-own-scandir/
 - Another Ag post about adding threads into Ag to improve searching performance. https://geoff.greer.fm/2012/09/07/the-silver-searcher-adding-pthreads/
 - LMAX Distruptor interesting collection of posts about how it works https://lmax-exchange.github.io/disruptor/ the HN comments on the Martin Fowler blog are worth looking at https://news.ycombinator.com/item?id=3173993
 - Regular Expression Matching with a Trigram Index or How Google Code Search Worked. https://swtch.com/~rsc/regexp/regexp4.html
 - Excellent explanation of branch prediction and its impact on how quickly your code can run. Ran into this once with searchcode and felt like a genius when I solved it. https://stackoverflow.com/questions/11227809/why-is-it-faster-to-process-a-sorted-array-than-an-unsorted-array
 - More branch prediction, A brief history of branch prediction by Dan Luu https://danluu.com/branch-prediction/
 - Branch prediction ahoy! http://igoro.com/archive/fast-and-slow-if-statements-branch-prediction-in-modern-processors/
 - Why Gnu Grep is fast https://lists.freebsd.org/pipermail/freebsd-current/2010-August/019310.html
 - How to write fast code http://asserttrue.blogspot.com.au/2009/03/how-to-write-fast-code.html
 - Regular Expression Matching Can Be Simple And Fast (but is slow in Java, Perl, PHP, Python, Ruby, &#8230;) https://swtch.com/%7Ersc/regexp/regexp1.html
 - Why Writing Your Own Search Engine is Hard https://queue.acm.org/detail.cfm?id=988407
 - Effects of CPU caches https://medium.com/@minimarcel/effect-of-cpu-caches-57db81490a7f
 - Neon is the New Black: fast JPEG optimization on ARM server https://blog.cloudflare.com/neon-is-the-new-black/
 - Beware of cute optimizations bearing gifts. Optimisations made to a fast fuzzy file matcher in Vim https://wincent.com/blog/optimization
 - Go code refactoring : the 23x performance hunt https://medium.com/@val_deleplace/go-code-refactoring-the-23x-performance-hunt-156746b522f7
 - Shameless self promotion but what I went through when building scc which is a code counter similar to cloc https://boyter.org/posts/sloc-cloc-code/
 - Built for Speed: Custom Parser for Regex at Scale https://blog.scalyr.com/2018/08/custom-regex-parser/
 - Gallery of Processor Cache Effects http://igoro.com/archive/gallery-of-processor-cache-effects/
 - Making the obvious code fast https://jackmott.github.io/programming/2016/07/22/making-obvious-fast.html with interesting HN comments https://news.ycombinator.com/item?id=19680595
 - Optimizing M3: How Uber Halved Our Metrics Ingestion Latency by (Briefly) Forking the Go Compiler https://eng.uber.com/optimizing-m3/ https://news.ycombinator.com/item?id=19692451
 - Linux Load Averages: Solving the Mystery http://www.brendangregg.com/blog/2017-08-08/linux-load-averages.html
 - The state of caching in Go https://blog.dgraph.io/post/caching-in-go/
 - Introducing Ristretto: A High-Performance Go Cache https://blog.dgraph.io/post/introducing-ristretto-high-perf-go-cache/
 - Building a Vectorized SQL Engine. A very good read about how CPU's work and data layouts affect it https://www.cockroachlabs.com/blog/how-we-built-a-vectorized-sql-engine/ with Hacker News comments https://news.ycombinator.com/item?id=21516322
 - Writing a fast cache service in Go https://allegro.tech/2016/03/writing-fast-cache-service-in-go.html
 - qgrep internals https://zeux.io/2019/04/20/qgrep-internals/

Will attempt to keep this list up to date as I find other content that really impresses me.