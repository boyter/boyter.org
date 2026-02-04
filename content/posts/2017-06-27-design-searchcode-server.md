---
title: Design for searchcode server
author: Ben E. Boyter
type: post
date: 2017-06-27T08:18:05+00:00
url: /2017/06/design-searchcode-server/
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
A very brief update about the progress of searchcode server. Currently I am in the middle of reworking how the index is built and maintained. The idea being I want to add zero downtime index rebuilds which requires a blue/green index strategy. It is still very much in flux but the current design is to merge the indexer and searcher which should allow this to happen. I have been playing around with using an iPad as a production device these days and produced the following document.

Edit. People keep asking me what App I used to create this. It was made Pureflow for iOS and then exported.

<img class="alignnone size-large" src="https://raw.githubusercontent.com/boyter/searchcode-server/master/assets/design/indexer-pipeline.png" width="1000" height="1000" />