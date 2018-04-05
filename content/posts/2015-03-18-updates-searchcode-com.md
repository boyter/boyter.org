---
title: Updates to searchcode.com
author: Ben E. Boyter
type: post
date: 2015-03-18T22:11:33+00:00
url: /2015/03/updates-searchcode-com/
categories:
  - searchcode

---
Just a quick post to list some updates to searchcode.com The first is a slight modification to the home page. A while ago I received an email from the excellent [Christian Moore][1] who provided some mock-ups of how he felt it should look. I loved the designs, but was busy working on other issues. Thankfully however in the last week or so I found the time to implement his ideas and the result is far more professional to me.

[<img class="alignnone size-full wp-image-1085" src="http://www.boyter.org/wp-content/uploads/2015/03/searchcode_update1.png" alt="searchcode_update1" width="957" height="600" srcset="http://localhost/boyter.org/wp-content/uploads/2015/03/searchcode_update1.png 957w, http://localhost/boyter.org/wp-content/uploads/2015/03/searchcode_update1-300x188.png 300w" sizes="(max-width: 957px) 100vw, 957px" />][2]

It certainly is a large change from the old view but one that I really like as it is very clean. The second update was based on some observations I had. I was watching a colleague use searchcode to try finding some logic inside the Thumbor image resizer project. I noticed that once he had the the file open he was trying to navigate to other files in the same project. Since the only way to do was was to perform a new search (perhaps with the repo option) I decided to add in a faster way to do this. For some projects there is now an instant search box above the code result which allows you to quickly search over all the code inside that repository. It uses the existing searchcode API&#8217;s (which you can use as well!) to do so. Other ways of doing this would include the project tree (another piece of functionality I would like to add) but this was done using already existing code so was very easy to implement. An example would be going to [this result in pypy][3] and searching for import.

[<img class="alignnone size-large wp-image-1086" src="http://www.boyter.org/wp-content/uploads/2015/03/searchcode_update2-1024x629.png" alt="searchcode_update2" width="525" height="322" srcset="http://localhost/boyter.org/wp-content/uploads/2015/03/searchcode_update2-1024x629.png 1024w, http://localhost/boyter.org/wp-content/uploads/2015/03/searchcode_update2-300x184.png 300w, http://localhost/boyter.org/wp-content/uploads/2015/03/searchcode_update2.png 1047w" sizes="(max-width: 525px) 100vw, 525px" />][4]

As always I would love some feedback on this, but as always expecting none (par for the course).

&nbsp;

 [1]: https://plus.google.com/111936682578972850234/posts
 [2]: http://www.boyter.org/wp-content/uploads/2015/03/searchcode_update1.png
 [3]: https://searchcode.com/codesearch/view/16932103/
 [4]: http://www.boyter.org/wp-content/uploads/2015/03/searchcode_update2.png