---
title: searchcode server released
author: Ben E. Boyter
type: post
date: 2016-03-31T21:19:33+00:00
url: /2016/03/searchcode-server-released/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - searchcode

---
searchcode server the [downloadable self hosted version of searchcode.com][1] is now available. A large amount of work went into the release with a variety of improvements based on feedback from the general beta releases.

<img style="border:1px solid #eee; border-radius: 2px;" src="https://searchcode.com/static/product/searchcode-server.gif" alt="searchcode server" />

searchcode server has a number of advantages over searchcode.com that will eventually be back-ported in. The full list of things to check out is included below,

  * New Single Page Application UI for smooth search experience
  * Ability to split on terms so a search for "url signer" will match "UrlSigner"
  * Massively improved performance 3x in the worst case and 20x in the best
  * Configurable through UI and configuration
  * Spelling suggestion that learns from your code

A few things of note,

  * Java 8 application built using Lucene and Spark Framework
  * Designed to work any server. The test bench server is a netbook using an Intel Atom CPU and searches return in under a second
  * Scales to Gigabytes of code and thousands of repositories
  * Works on Linux, OSX and Windows

Be sure to check it out!

![searchcode server][2]
  
![searchcode server][3]
  
![searchcode server][4]

 [1]: https://searchcode.com/product/
 [2]: https://searchcode.com/static/temp/1.png
 [3]: https://searchcode.com/static/temp/2.png
 [4]: https://searchcode.com/static/temp/3.png