---
title: 'Can anyone explain how this regex [- ~] matches ASCII characters?'
author: Ben E. Boyter
type: post
date: 2014-02-04T00:07:02+00:00
url: /2014/02/explain-regex-matches-ascii-characters/
categories:
  - Tip

---
Since I am pulling most of my content from other sites such as Mahalo and Quora I thought I would pull back some of my more interesting HN comments.

[<span style="line-height: 1.5;">Can anyone explain how this regex [- ~] matches ASCII characters ?</span>][1]

It's pretty simple. Assuming you know regex&#8230; Im going to assume you don't since you are asking.

The bracket expression [ ] defines single characters to match, however you can have more then 1 character inside which all will match.

<pre>[a] matches a
[ab] matches either a or b
[abc] matches either a or b or c
[a-c] matches either a or b or c.</pre>

The &#8211; allows us to define the range. You can just as easily use [abc] but for long sequences such as [a-z] consider it short hand.

In this case [ -~] it means every character between <space> and <tilde>, which just happens to be all the ASCII printable characters (see chart in the article). The only bit you need to keep in mind is that <space> is a character as well, and hence you can match on it.
  
You could rewrite the regex like so (note I haven't escaped or anything in this so its probably not valid)

<pre>[ !"#$%&'()*+,-./0123456789:;&lt;=&gt;?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~]</pre>

but that's not quite as clever or neat.

 [1]: https://news.ycombinator.com/item?id=4774426