---
title: Wildcards
author: Ben E. Boyter
type: post
date: 2011-11-28T04:49:22+00:00
url: /2011/11/wildcards/
categories:
  - Uncategorized

---
Just a quick update to let you know that wildcard searches have been updated to support prefix and postfix.

Essentially this means the following searches now all work,

[*print][1]
  
[\*clo\*][2]
  
[clo*][3]

In addition code characters such as { } [ ] < > are now being indexed. Finally searchco.de has been on a bit of a diet and should be a lot faster to load and search.

 [1]: http://searchco.de/?q=*print
 [2]: http://searchco.de/?q=*clo*
 [3]: http://searchco.de/?q=clo*