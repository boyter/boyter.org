---
title: BATF – Big Arse Text File
author: Ben E. Boyter
type: post
date: 2011-03-07T23:10:23+00:00
url: /2011/03/batf-big-arse-text-file/
categories:
  - Free Software
  - GitHub

---
Ever needed the ability to track bugs and features without using a full featured bug/feature tracker? What about storing all your random notes such as server details, blog ideas, books to read, urls etc, without using a full featured CMS or the like. Want to have everything searchable and in the most platform independent format possible?

Enter the BATF. I have always been a fan of the big arse text file (BATF) for keeping track of the above. The catch being I wanted it centralised so I could get at it from any machine I was on (assuming internet access). I also wanted it to provide a simplistic version system. Tags would be useful too.

You can of course do this using SVN, GIT, or any other versioning system. The problem with that is that it brought be close to what I didn't want to do (setup lots of stuff). So after a few beers I decided that what I really wanted was a BATF that had versioning (simple versioning anyway) built in, was web based so I could access it anywhere and lightweight. Since my 5 minute web search didn't turn up anything that could do this I thought I would create one.

<center>
  <a href="http://dl.dropbox.com/u/21583935/searchcode/blog/batfscreenshot.png"><img alt="" src="http://dl.dropbox.com/u/21583935/searchcode/blog/batfscreenshot.png" width="300" height="200" /></a>
</center>


  
Behold the online BATF. Everything you add or modify is viewable in a nice timeline of versions. Explore your thought process as you add/modify things. Have something important you want to preserve for some amount of time? Tag it and it will always accessible. You can also explore changes through a simplistic diff viewer that diff's against the current version.

Since I have been using it for a while and found it useful I thought I would give back to the community which provided the language (PHP), database (MySQL), Javascript framework (JQuery + plugins) and icons (famfamfam icons) by releasing this as free software. You can get a copy at GitHub <a style="text-decoration: underline;" href="https://github.com/boyter/BATF">https://github.com/boyter/BATF</a>. The install instructions are included (pretty simple really). Feel free to fork it and send back patches if you find any bugs etc&#8230;