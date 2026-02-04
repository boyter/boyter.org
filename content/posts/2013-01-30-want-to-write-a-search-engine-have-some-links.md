---
title: Want to write a search engine? Have some links
author: Ben E. Boyter
type: post
date: 2013-01-30T23:29:36+00:00
url: /2013/01/want-to-write-a-search-engine-have-some-links/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Links
  - Search Engine

---
A recent comment I left on Hacker News managed to get quite a lot of up-votes which surprised me since it was effectively just a collection of links about search engines. You can read the full thread at <http://news.ycombinator.com/item?id=5129530>

Anyway since it did do so well I thought I would flesh it out with some more information. Here are a collection of posts/blogs/discussions which go into the details of how to write a search engine.

<http://blog.algolia.com/search-ranking-algorithm-unveiled/>

Algolia is a search as a service provider which has this blog post discussing the ranking algorithm they use.

<http://www.yioop.com/blog.php>

This one is fairly fresh and talks about building and running a general purpose search engine in PHP.

<http://www.gigablast.com/rants.html>

This has been defunct for a long time now but is written by Matt Wells (Gigablast and Procog) and gives a small amount of insight into the issues and problems he worked through while writing Gigablast.

<http://queue.acm.org/detail.cfm?id=988407>

This is probably the most famous of all search engine articles with the exception of the original Google paper. Written by Anna Patterson (Cuil) it really explores the basics of how to get a search engine up and running from crawler to indexer to serving results.

<http://queue.acm.org/detail.cfm?id=988401>

A fairly interesting interview with Matt Wells (Gigablast and Procog) which goes into some details of problems you will encounter running your own search engine.

<del><a href="http://blog.procog.com/">http://blog.procog.com/</a></del>

Sadly it appears that this has been shut down and the content is gone. <del>This is a new blog written by Matt Wells (Gigablast) and while there isn't much content there I have hopes for it. Matt really does know his stuff and is promoting an open algorithm to ranking so it stands to reason there will be more decent content here soon.</del>

<http://www.thebananatree.org/>

This has a few articles written about creating a search engine from scratch. It appears to have been on hold for years but some of the content is worth reading. If nothing else its another view of someone starting down the search engine route.

<http://blog.blekko.com/>

Blekko's engineering blog is usually interesting and covers all sorts of material applicable to search engines.

<http://www.boyter.org/2013/01/code-for-a-search-engine-in-php-part-1/>

This is a shameless plug but I will even suggest my own small implementation. Its essentially a walk though a group up write of a search engine in PHP. I implemented it and it worked quite well with 1 million pages.

<http://infolab.stanford.edu/~backrub/google.html>

The granddaddy of search papers. Its very old but outlines how the original version of Google was designed and written.

<https://github.com/gigablast/open-source-search-engine>

Gigablast mentioned above has since become an Open source project hosted on Github. Personally I am still yet to look through the source code but you can find how to run it on the [developer page][1] and [administration page][2].

<http://highscalability.com/blog/2013/1/28/duckduckgo-architecture-1-million-deep-searches-a-day-and-gr.html>

<http://highscalability.com/blog/2012/4/25/the-anatomy-of-search-technology-blekkos-nosql-database.html>

<http://highscalability.com/blog/2008/10/13/challenges-from-large-scale-computing-at-google.html>

<http://highscalability.com/blog/2010/9/11/googles-colossus-makes-search-real-time-by-dumping-mapreduce.html>

<http://highscalability.com/blog/2011/8/29/the-three-ages-of-google-batch-warehouse-instant.html>

The above are fairly interesting. The blekko one is the most technical. If you only have time to read one go with the blekko one.

<http://blog.saush.com/2009/03/17/write-an-internet-search-engine-with-200-lines-of-ruby-code/>

Article about using Ruby to write a small scale internet search engine. Covers crawling as well as indexing using a custom indexer in MySQL.

<https://blog.twitter.com/2014/building-a-complete-tweet-index>

Article from twitter about indexing the full history of tweets from 2006. Of note is the information about sharding. Due to the liner nature of the data (over time) they need a way to scale across time. Worth a look.

<http://www.ideaeng.com/write-search-engine-0402>

The anti write a search engine. Probably worth reading though in case you feel doing so is going to be easy.

<http://lucene.sourceforge.net/talks/pisa/>

A talk about the internals of Lucene. Covers some design decisions and shows the architecture that Lucene uses internally.

<http://alexmiller.com/the-students-guide-to-search-engines/>

Not as technical as the above can be but a good primer which covers quite a lot of history. Worth a read.

Have another one I have missed here? I would love to read it. Please add a link in the comments below.

 [1]: http://www.gigablast.com/developer.html
 [2]: http://www.gigablast.com/admin.html