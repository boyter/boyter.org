---
title: Feedback Loop
author: Ben E. Boyter
type: post
date: 2014-07-28T23:37:36+00:00
url: /2014/07/feedback-loop/
categories:
  - searchcode

---
About a month ago searchcode.com managed to sit on the front page of Hacker News (HN) for most of a day and produced a lot of useful feedback for me to act on. You can read the full details here [searchcode: A source code search engine][1]

Between the HN feedback, some I received via tweets and from republished articles I got a list of things I needed to work on.

The first and main change requested was over the way searchcode was matching results. It was by default looking for exact matches. Hence if you searched for something like &#8220;mongodb find&#8221; it would look for that exact text. It was requested by quite a few people to change this. The expectation was that the matching would work like Githubs. This has now taken effect. A sample search that came up is included below with the new logic,

<https://searchcode.com/?q=MongoDBObject+find+lang%3AScala>
  
vs
  
[https://github.com/searchq=MongoDBObject+find+language%3Ascala&type=Code&ref=searchresults][2]

I believe the results are more in line with the expectation.

The second thing requested was that I point at the new Google endpoints for GWT and Android. This has been done and the code is currently sitting in the queue ready to be indexed. I expect this to take place in the next few days. In addition I have pulled in a lot of new repositories from Github and Bitbucket using their API&#8217;s. The number of projects now being indexed is well over 5 million and growing every day.

The last request came from the user chdir on HN. I hope they won&#8217;t mind but I have included their request below,

_&#8220;I use sourcegraph occasionally and mostly rely on Gihub search. I wish the search has all those advanced refinement options that grep & Sublime Text search has. Some examples would be to use regex, search a word within a scope of lines, search within search results etc. Additionally, it&#8217;s very useful to be able to sort the search results by stars/forks. Sometimes I just want to see how popular projects have implemented a certain feature. A keyword based search isn&#8217;t enough for that._

_I guess these features are very expensive & slow to implement but it would be super useful if it can be achieved. Source code search is for geeks so it is probably fair to say that a truly advanced & complex interface won&#8217;t turn away users.&#8221;_

The above is actually one of the more difficult requests. However its suggestions are on my radar of things to do. To start with I have rolled out an experimental feature which displays matching results. One of the issues with codesearch is that being good developers there is a lot of duplicate code used in various projects. Since when you search for something like &#8220;jquery mobile&#8221; you don&#8217;t want to see the same file repeated thousands of times you need to work out the duplicate content and filter it out.

Sometimes however you want to see those results. Its a piece of functionality that existed in Google Code search which I had wanted implemented for a long time. Well it is now here. The duplicates are worked out using a few methods, matching MD5 hashes, file-name and a new hash I developed myself which converges the more similar the files are. Similar to simhash this new has however does not require any post calculation operations to determine if two files are a match. More details of this will come in a later post after I iron out all the kinks.

Anyway you can now see this functionality. Try searching for &#8220;[jquery mobile][3]&#8221; and look next to the title. You can see something along the lines of &#8220;Show 76 matches&#8221;

[<img class="alignnone size-large wp-image-982" src="http://www.boyter.org/wp-content/uploads/2014/07/1-1024x732.png" alt="1" width="525" height="375" srcset="http://localhost/boyter.org/wp-content/uploads/2014/07/1-1024x732.png 1024w, http://localhost/boyter.org/wp-content/uploads/2014/07/1-300x214.png 300w, http://localhost/boyter.org/wp-content/uploads/2014/07/1.png 1264w" sizes="(max-width: 525px) 100vw, 525px" />][4]

Clicking the link will expand out the matching files for this result. Each of the matching results shows the filename project and the location in the project. All of course are click-able and link to the duplicate file.

[<img class="alignnone size-large wp-image-983" src="http://www.boyter.org/wp-content/uploads/2014/07/2-1024x497.png" alt="2" width="525" height="254" srcset="http://localhost/boyter.org/wp-content/uploads/2014/07/2-1024x497.png 1024w, http://localhost/boyter.org/wp-content/uploads/2014/07/2-300x145.png 300w, http://localhost/boyter.org/wp-content/uploads/2014/07/2.png 1175w" sizes="(max-width: 525px) 100vw, 525px" />][5]

Lastly you can also do the same on the code page itself. Just click &#8220;Show 5 matches&#8221; on the top right of the result page to see a list of the matching files.

[<img class="alignnone size-large wp-image-984" src="http://www.boyter.org/wp-content/uploads/2014/07/3-1024x553.png" alt="3" width="525" height="283" srcset="http://localhost/boyter.org/wp-content/uploads/2014/07/3-1024x553.png 1024w, http://localhost/boyter.org/wp-content/uploads/2014/07/3-300x162.png 300w, http://localhost/boyter.org/wp-content/uploads/2014/07/3.png 1215w" sizes="(max-width: 525px) 100vw, 525px" />][5]

There is more to come in the next few weeks which I am excited about but for the moment I would love to get feedback on the above.

 [1]: https://news.ycombinator.com/item?id=7947075
 [2]: https://github.com/search?q=MongoDBObject+find+language%3Ascala&type=Code&ref=searchresults
 [3]: https://searchcode.com/?q=jquery+mobile
 [4]: http://www.boyter.org/wp-content/uploads/2014/07/1.png
 [5]: http://www.boyter.org/wp-content/uploads/2014/07/2.png