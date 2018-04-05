---
title: Variety of Updates
author: Ben E. Boyter
type: post
date: 2012-12-03T23:40:37+00:00
url: /2012/12/variety-of-updates/
categories:
  - searchcode

---
A variety of updates have just rolled out. Firstly there is the new look and feel which I am actually proud of. The website looks far better, which wasn&#8217;t hard considering how awful it looked before. The other update is that documentation and code results are mixed together now. An example of this would be the search for [mysql_query][1] which displays the PHP reference which has mysql_query in it above the code results.

Other updates include that when you do perform a search like the above searchcode will suggest Language filters on the sidebar which you can click to restrict to a specific language. With [100+ languages][2] recognised this can really help you restrict things down.

Finally I was request by [Pádraig Brady][3] to include the [full fedora source code][4] into searchcode (that&#8217;s a mouthful). This is now live and you can search across fedora like the below

[irq\_create\_mapping url:fedora][5]

Of course I couldn&#8217;t just limit it to fedora, and so I added the following as well,

<ul style="list-style: none;">
  <li>
    <a>GitHub </a><a href="http://searchco.de/?q=irq_create_mapping+url%3Agithub">irq_create_mapping url:github</a>
  </li>
  <li>
    Google Code <a href="http://searchco.de/?q=irq_create_mapping+url%3Agoogle">irq_create_mapping url:google</a>
  </li>
  <li>
    BitBucket <a href="http://searchco.de/?q=mysql_query+url%3Abitbucket">mysql_query url:bitbucket</a>
  </li>
  <li>
    SourceForge <a href="http://searchco.de/?q=mysql_query+url%3Asourceforge">mysql_query url:sourceforge</a>
  </li>
  <li>
    CodePlex <a href="http://searchco.de/?q=mysql_query+url%3Acodeplex">mysql_query url:codeplex</a>
  </li>
</ul>

Finally I have bumped up the size of the code that&#8217;s indexed. It previously would only allow about 2000 lines of code to be indexed per file. I bumped the size up about 15x which should suit pretty much every code file, and have kicked off a full index refresh.

 [1]: http://searchco.de/?q=mysql_query
 [2]: http://searchco.de/languages/
 [3]: http://www.pixelbeat.org
 [4]: http://www.pixelbeat.org/docs/fedora_source.html
 [5]: http://searchco.de/?q=irq_create_mapping+url%3Afedora