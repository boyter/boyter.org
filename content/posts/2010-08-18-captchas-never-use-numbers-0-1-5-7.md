---
title: Why CAPTCHA's Never Use Number's 0 1 5 7
author: Ben E. Boyter
type: post
date: 2010-08-18T23:26:21+00:00
url: /2010/08/captchas-never-use-numbers-0-1-5-7/
categories:
  - CAPTCHA

---
Interestingly this sort of question pops up a lot in my referring search term stats.

**Why CAPTCHA's never use the numbers 0 1 5 7**

Its a relativity simple question with a reasonably simple answer. Its because each of the above numbers are easy to confuse with a letter. See the below,

<div id="attachment_184" style="width: 247px" class="wp-caption aligncenter">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/oexample.jpg"><img class="size-full wp-image-184  " title="oexample" alt="CAPTCHA With 0 and O" src="http://www.wausita.com/wp-content/uploads/2010/08/oexample.jpg" width="237" height="67" /></a>
  
  <p class="wp-caption-text">
    CAPTCHA With 0 and O
  </p>
</div>

<div id="attachment_185" style="width: 208px" class="wp-caption aligncenter">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/iexample.jpg"><img class="size-full wp-image-185  " title="iexample" alt="CAPTCHA With 0 and O" src="http://www.wausita.com/wp-content/uploads/2010/08/iexample.jpg" width="198" height="62" /></a>
  
  <p class="wp-caption-text">
    CAPTCHA With 1 and I
  </p>
</div>

<div id="attachment_186" style="width: 223px" class="wp-caption aligncenter">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/sexample.jpg"><img class="size-full wp-image-186  " title="sexample" alt="CAPTCHA With 5 and S" src="http://www.wausita.com/wp-content/uploads/2010/08/sexample.jpg" width="213" height="63" /></a>
  
  <p class="wp-caption-text">
    CAPTCHA With 5 and S
  </p>
</div>

<div id="attachment_191" style="width: 231px" class="wp-caption aligncenter">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/jliexample.jpg"><img class="size-full wp-image-191  " title="jliexample" alt="CAPTCHA With 7 and J L I" src="http://www.wausita.com/wp-content/uploads/2010/08/jliexample.jpg" width="221" height="71" /></a>
  
  <p class="wp-caption-text">
    CAPTCHA With 7 and J L I
  </p>
</div>

Are you able to tell the difference? For some yes, others, certainly not. For those wondering the first character is the number and the rest are letters. In the format "number dash letter letter".

They all look fairly similar to a human, especially when they are warped and made fuzzy and all of the other stuff a CAPTCHA does to make OCR (Character recognition) difficult. Interestingly you can end up with the unusual situation that the CAPTCHA is easier to decode for a computer then a human when you do this since it can just churn through thousands of results get a majority right and still successfully spam a website.

The CAPTCHA used to create the images in this post can be found here <http://milki.erphesfurt.de/captcha/> Which I discovered in a comment by Mario to my own post about [why you shouldnt write your own CAPTCHA's][1]. Its a pretty good CAPTCHA as far as CAPTCHA's go, and I had to modify it to produce the results above. Out of the box it never displays similar text like this. If you do insist on using a CAPTCHA on your site I highly suggest having a look at it.

 [1]: http://www.wausita.com/2010/08/why-you-shouldnt-roll-your-own-captcha/