---
title: Repository overview now in searchcode server
author: Ben E. Boyter
type: post
date: 2017-01-30T07:34:35+00:00
url: /2017/01/repository-overview-searchcode-server/
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
One feature that I have wanted for a long time in searchcode server was a page which would give an overview of a repository. I wanted the overview to give a very high look at the languages used, the total number of files, estimated cost and who would be the best people to talk to.

One thing that occurred to me when I started work was that it would be nice to calculate a bus factor for the repository as well. After all we all know that project managers do like to know who are the most critical contributors to any project and what the risk is.

Below is the what has been added into searchcode server.

![Bus Factor](/static/busfactor.jpg)

The most interesting part of the above in my opinion is the overview blurb. It attempts to summarise all of the figures below and let anyone know in plain english where the repository stands.

An example for searchcode server's code itself,

_"In this repository 2 committers have contributed to 228 files. The most important languages in this repository are Java, CSS and Freemarker Template. The project has a low bus factor of 2 and will be in trouble if Ben Boyter is hit by a bus. The average person who commits this project has ownership of 50% of files. The project relies on the following people; Ben Boyter, =."_

Certainly there is room for improvement on this page and I am hoping to add what I am calling signals logic to it. This would involve scanning the code to determine what languages, features and libraries are being used and add those to the report. The end goal would be to find for instance C# code using MySQL and ReactJS.

The last bit of news is that I am moving searchcode.com over to the same codebase. This should improve things in a few ways. The first bring the improved performance when moving from Python to Java. It should also mean that I can focus on a single codebase.

Anyway you will be able to get the new repository overview in the next release of searchcode server 1.3.6 which will be released before the end of January 2017.

 [1]: http://www.boyter.org/wp-content/uploads/2017/01/busfactor.jpg