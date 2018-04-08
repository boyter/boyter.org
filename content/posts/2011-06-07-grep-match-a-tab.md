---
title: Grep Match a Tab
author: Ben E. Boyter
type: post
date: 2011-06-07T23:19:24+00:00
url: /2011/06/grep-match-a-tab/
categories:
  - Tip

---
Ever wanted to match a tab while using grep for some reason? The trick (under bash anyway) is to Ctrl+V and then press the tab key so you get whatever you are looking for.

<pre>$ cat file_to_grep.txt | grep "^log    "</pre>

I was trying to match a file for the exact match of log and then a tab. Without the tab I ended up getting back a bunch of junk results like "logger" "logging" "login" etc&#8230;

The above gives me what I want although I suspect there is a better way to do this. I did look into using [[:space:]] but it matches spaces as well which ended up in my case not being accurate enough.