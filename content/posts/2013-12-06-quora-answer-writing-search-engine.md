---
title: Quora answer about writing a search engine
author: Ben E. Boyter
type: post
date: 2013-12-06T01:31:30+00:00
url: /2013/12/quora-answer-writing-search-engine/
categories:
  - Search Engine
  - Tip

---
The following I posted on Quora in response to the question [&#8220;I am planning to make a small scale search engine on my local system, but I don&#8217;t know from where to start?&#8221;][1]. It&#8217;s a reasonable answer so like my [Mahalo][2] one I thought I would make a copy for myself.

I agree with Wolf Garbe and that you are better off in your case starting with existing technologies, have a look at <a class="external_link" href="http://yacy.net/" target="_blank" rel="nofollow">http://yacy.net/</a> and SphinxSearch as well. However if you are doing this to learn and not just deliver a product I can provide a few links for you.

For your specific questions,

1. How do I use hashing for efficient search operation ?

You are talking about having an inverted index I suspect. Have a look at the articles above which discuss the inverted index. Keep in mind you have options here. Such as inverted index or a full inverted index. The latter is useful if you want to do thinks like proximity searches and the like. For hashing itself,

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;stackexchange.com&quot;)" href="http://programmers.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed" target="_blank" rel="nofollow">Which hashing algorithm is best for uniqueness and speed?</a>

Be careful when using hashes with URL’s. While the square root of the number
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;skrenta.com&quot;)" href="http://www.skrenta.com/2007/08/md5_tutorial.html" target="_blank" rel="nofollow">We Worship MD5, the GOD of HASH</a> of URL’s is still a lot bigger then the current
  
web size if you do get a collision you are going to get pages about Britney Spears
  
when you were expecting pages about Bugzilla. Look into using bloom filters to avoid
  
these issues (assuming you get to sufficient scale).

2. How I will manage the data and ?

Up-to you. For small scale I would just use whatever database you are most familiar with. Any SQL database will scale up to hundreds of millions of records without too many issues.

3. How my searching algorithm would work ?

This is up-to you as well. You are the one in control here. Assuming you want to get something up and running as soon as possible I would do the following.

Write a simple crawler and start crawling. (for url; get url; find urls;) is about
  
all you need. For seeding use wikipedia&#8217;s data dump, the alexa top lists or dmoz
  
data.

Build a simple inverted index indexer and index as you go. Limit your index to small portions of text (title, meta tags etc..) for the moment till you get the kinks
  
ironed out. If your indexer is not using 100% of the CPU rethink your approach as it is wrong.

Build a simple ranker (just rank numbers of words in documents for the moment). DO NOT DO PAGE RANK! This step will save you a lot of time while getting everything else working.

Build it by default to be an OR engine (this saves you writing a query parser or
  
working out how to intersect two 10 million document lists quickly).

Be sure to use a stemmer from the following <a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;tartarus.org&quot;)" href="http://tartarus.org/~martin/PorterStemmer/" target="_blank" rel="nofollow">Stemming Algorithm</a>. Implement a fairly large amount of stop words and ignore anything less then 3 characters in length.

The above should be enough to occupy you for several weeks at least.

Here is a link to a collection of articles on how to start building a search engine.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;boyter.org&quot;)" href="http://www.boyter.org/2013/01/want-to-write-a-search-engine-have-some-links/" target="_blank" rel="nofollow">Want to write a search engine? Have some links</a>

I have copied the article below, but the above link I tend to update from time to
  
time as I find new articles.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;yioop.com&quot;)" href="http://www.yioop.com/blog.php" target="_blank" rel="nofollow">PHP Search Engine &#8211; Yioop!</a>

This one is fairly fresh and talks about building and running a general purpose
  
search engine in PHP.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;gigablast.com&quot;)" href="http://www.gigablast.com/rants.html" target="_blank" rel="nofollow">About Us &#8211; Gigablast</a>

This has been defunct for a long time now but is written by Matt Wells (Gigablast and Procog) and gives a small amount of insight into the issues and problems he worked through while writing Gigablast.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;acm.org&quot;)" href="http://queue.acm.org/detail.cfm?id=988407" target="_blank" rel="nofollow">Why Writing Your Own Search Engine Is Hard</a>

This is probably the most famous of all search engine articles with the exception of the original Google paper. Written by Anna Patterson (Cuil) it really explores the basics of how to get a search engine up and running from crawler to indexer to
  
serving results.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;acm.org&quot;)" href="http://queue.acm.org/detail.cfm?id=988401" target="_blank" rel="nofollow">A Conversation with Matt Wells</a>

A fairly interesting interview with Matt Wells (Gigablast and Procog) which goes into some details of problems you will encounter running your own search engine.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;thebananatree.org&quot;)" href="http://www.thebananatree.org/" target="_blank" rel="nofollow">Building a Search Engine</a>

This has a few articles written about creating a search engine from scratch. It
  
appears to have been on hold for years but some of the content is worth reading. If nothing else its another view of someone starting down the search engine route.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;blekko.com&quot;)" href="http://blog.blekko.com/" target="_blank" rel="nofollow">blekko | spam free search</a>

Blekko’s engineering blog is usually interesting and covers all sorts of
  
material applicable to search engines.

<a class="external_link" href="http://www.boyter.org/2013/01/code-for-a-search-engine-in-php-part-1/" target="_blank" rel="nofollow">http://www.boyter.org/201<wbr />3/01/co&#8230;</a>

This is a shameless plug but I will even suggest my own small implementation. Its essentially a walk though a write of a search engine in PHP. I implemented it and it worked quite well with 1 million pages serving up reasonable results. It actually covers everything you want, Crawling, Indexing, Storing, Ranking with articles explaining why I did certain things and full source code here <span class="qlink_container"><a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;github.com&quot;)" href="https://github.com/boyter/Phindex" target="_blank">Phindex</a></span>

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;stanford.edu&quot;)" href="http://infolab.stanford.edu/~backrub/google.html" target="_blank">The Anatomy of a Search Engine</a>

The granddaddy of search papers. Its very old but outlines how the original version of Google was designed and written.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;github.com&quot;)" href="https://github.com/gigablast/open-source-search-engine" target="_blank">open-source-search-engine</a>

Gigablast mentioned above has since become an Open source project hosted on Github. Personally I am still yet to look through the source code but you can find how to run it on the <a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;gigablast.com&quot;)" href="http://www.gigablast.com/developer.html" target="_blank" rel="nofollow">developer page</a> and <a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;gigablast.com&quot;)" href="http://www.gigablast.com/admin.html" target="_blank" rel="nofollow" data-tooltip="attached">administration page</a>.

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;highscalability.com&quot;)" href="http://highscalability.com/blog/2013/1/28/duckduckgo-architecture-1-million-deep-searches-a-day-and-gr.html" target="_blank" rel="nofollow" data-tooltip="attached">High Scalability &#8211; High Scalability &#8211; DuckDuckGo Architecture &#8211; 1 Million Deep Searches a Day and Growing</a>
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;highscalability.com&quot;)" href="http://highscalability.com/blog/2012/4/25/the-anatomy-of-search-technology-blekkos-nosql-database.html" target="_blank" rel="nofollow" data-tooltip="attached">High Scalability &#8211; High Scalability &#8211; The Anatomy of Search Technology: blekko’s NoSQL database</a>
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;highscalability.com&quot;)" href="http://highscalability.com/blog/2008/10/13/challenges-from-large-scale-computing-at-google.html" target="_blank" rel="nofollow" data-tooltip="attached">High Scalability &#8211; High Scalability &#8211; Challenges from large scale computing at Google</a>
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;highscalability.com&quot;)" href="http://highscalability.com/blog/2010/9/11/googles-colossus-makes-search-real-time-by-dumping-mapreduce.html" target="_blank" rel="nofollow" data-tooltip="attached">High Scalability &#8211; High Scalability &#8211; Google&#8217;s Colossus Makes Search Real-time by Dumping MapReduce</a>
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;highscalability.com&quot;)" href="http://highscalability.com/blog/2011/8/29/the-three-ages-of-google-batch-warehouse-instant.html" target="_blank" rel="nofollow" data-tooltip="attached">High Scalability &#8211; High Scalability &#8211; The Three Ages of Google &#8211; Batch, Warehouse, Instant</a>

The above are fairly interesting. The blekko one is the most technical. If you only have time to read one go with the blekko one.

Another thing you might want to consider is looking through the source of existing
  
indexing engines like Solr and Sphinx. I am personally running through the initial
  
version of the Sphinx engine and will one day write a blog about how it works.

Here are a few other links (disclaimer I wrote all of those) showing how to implement the vector space model (a good thing to start with as it does ranking for you)

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;boyter.org&quot;)" href="http://www.boyter.org/2011/06/vector-space-search-model-explained/" target="_blank" rel="nofollow">Vector Space Search Model Explained</a>
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;boyter.org&quot;)" href="http://www.boyter.org/2010/08/build-vector-space-search-engine-python/" target="_blank" rel="nofollow">Building a Vector Space Indexing Engine in Python</a>
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;boyter.org&quot;)" href="http://www.boyter.org/2013/08/golang-vector-space-implementation/" target="_blank" rel="nofollow">GoLang Vector Space Implementation</a>
  
<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;boyter.org&quot;)" href="http://www.boyter.org/2013/08/c-vector-space-implementation/" target="_blank" rel="nofollow">C# Vector Space Implementation</a>

and here is a much better article which explains the math behind it,

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;la2600.org&quot;)" href="http://la2600.org/talks/files/20040102/Vector_Space_Search_Engine_Theory.pdf" target="_blank" rel="nofollow">Page on La2600</a>

For snippet extraction I have another article here,

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;boyter.org&quot;)" href="http://www.boyter.org/2013/04/building-a-search-result-extract-generator-in-php/" target="_blank" rel="nofollow">Building a Search Result Extract Generator in PHP</a>

For crawling here is another one,

<a class="external_link" onmouseover="return require(&quot;qtext&quot;).tooltip(this, &quot;boyter.org&quot;)" href="http://www.boyter.org/2010/08/why-writing-a-web-crawler-isnt-easy/" target="_blank" rel="nofollow">Why Writing a Web Crawler isn’t Easy</a>

Lastly if you do go about and write your own search engine please write blog posts or articles about it. Its quite hard to find this sort of information, especially from the big boys (Google, Bing, Yandex, Yahoo) and I would love to see more articles about it.

 [1]: http://www.quora.com/Search-Engines/I-am-planning-to-make-a-small-scale-search-engine-on-my-local-system-but-I-dont-know-from-where-to-start
 [2]: http://www.boyter.org/2009/01/athlon-64-pc-512-ram-hold-home-server/