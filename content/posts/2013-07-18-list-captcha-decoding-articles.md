---
title: List of useful CAPTCHA Decoding Articles
author: Ben E. Boyter
type: post
date: 2013-07-18T23:46:43+00:00
url: /2013/07/list-captcha-decoding-articles/
categories:
  - CAPTCHA
  - Links

---
This website ranks quite high in most search engines for the search term "captcha decoding" or some permutation of it. As such here are a collection of useful links if you are looking into doing such a thing. If any more come up I will be sure to update this post.

<http://www.boyter.org/decoding-captchas/>

Shameless self promotion but this link is why this page ranks so highly. Its an article I wrote some time ago about how to go about decoding a simple CAPTCHA. There is full source code and the principles can be applied to 90% of CAPTCHA's out there. For the record it only came about because a colleague bet me that I couldn't decode his websites CAPTCHA which was the one used in the article. Of course I waited till he changed it before publishing.

<http://bokobok.fr/bypassing-a-captcha-with-python/>

Interesting post on how to bypass a CAPTCHA using python. The CAPTCHA broken in this article is far more complex then most of the others in this list. Full source code is provided so its an excellent source to look at even though the article is missing a lot of details.

<http://www.debasish.in/2012/01/bypass-captcha-using-python-and.html?m=1>

Another Python post about breaking CAPTCHA's. I think that might be due to how powerful the PIL is. Has full source code. This one is worth looking at because unlike the two previous one it uses an existing OCR engine Tesseract to perform the recogniton.

<http://www.mperfect.net/aiCaptcha/>

This is one of the older CAPTCHA articles around and does not supply source code. It does however go into a good amount of detail about how the author looked for weaknesses in the CAPTCHA and then went about writing an algorithm to defeat it. It really is a pity the code was never released to this one.

<http://www.troyhunt.com/2012/01/breaking-captcha-with-automated-humans.html>

A slightly different approach. Rather then try to code around the problem here is how to get humans to do it for you.

<http://caca.zoy.org/wiki/PWNtcha>

A PHP project that has been around since 2004 for defeating CAPTCHA's. Code is available so its work taking a look at.

<http://tech.slashdot.org/story/11/01/11/1411254/google-recaptcha-cracked>
  
<http://www.youtube.com/watch?v=dLgvrsAoPeE>

It seems the original content that went with the above posting on slashdot has disappeared but I am sure it exists somewhere else on the web. I may have a copy lying around which I will upload if I find it. Goes into detail of how to defeat the RECAPTCHA projects CAPTCHA.

<http://bhiv.com/defeating-diggs-captcha/>

This article about defeating Digg 2.0's CAPTCHA is hopelessly out of date however it shows how easily a simple CAPTCHA can be defeated if the person creating it has little knowledge of what they are doing. I believe it ties in well with this post http://www.boyter.org/2010/08/why-you-shouldnt-roll-your-own-captcha/

<http://www.cs.sfu.ca/~mori/research/gimpy/>

This is the grandaddy of all the above posts, papers and articles. The full paper is linked in there and has far more detail. It is one of the main sources I used when I started learning about decoding CAPTCHA's.

<https://medium.com/p/e8f2a748f95f>

How reCAPTCHA Works, plus, how to cheat it, and how it contributes to the common good.

<http://stevenhickson.blogspot.com.au/2014/01/hacking-snapchats-people-verification.html>

How to defeat SnapChats CAPTCHA. Fairly light on on details but provides the [source code][1] (C++) to defeat it.

<https://github.com/mieko/sr-captcha/blob/gh-pages/index.md>

Breaking the SilkRoad's CAPTCHA. Its follow up about breaking the new SilkRoad's CAPTCHA is worth reading as well. <https://github.com/mieko/sr-captcha/blob/gh-pages/silk-road-2.md>

&nbsp;

 [1]: https://github.com/StevenHickson/FindTheGhost