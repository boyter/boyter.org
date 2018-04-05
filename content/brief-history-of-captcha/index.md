---
title: Brief History of CAPTCHA’s
author: Ben E. Boyter
type: page
date: 2015-01-15T22:10:58+00:00
draft: true
private: true
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'

---
**Note:** This article is excerpted from my [e-book, All about CAPTCHA&#8217;s][1], which I&#8217;m currently writing. Please register your interest if you wish me to continue writing it.

_&#8220;There s nothing you can get from a book that you can&#8217;t get from TV faster&#8221; &#8211; Homer Simpson_

For those who follow this belief here is a 90 second run down by the Are you a human (<http://areyouahuman.com/>) CAPTCHA alternative people,

Youtube History of CAPTCHA by Are You a Human [http://youtu.be/6_BXeHW7NUo][2]

Otherwise read on.

## What is a CAPTCHA?

A CAPTCHA is an implementation of a one way function. This is a function where it is easy to take input and compute the result, but difficult to take the result and compute the input. Another example of a one way function is a hashing algorithm like MD5 or SHA.

What is makes a CAPTCHA different however is that while they are designed to be difficult for a computer to take the result and output the inputs, it should be reasonably easy for a human to do so. A CAPTCHA can be thought of in simple terms as a &#8220;Are you a human?&#8221; test. They are implemented by showing an image which has some word or letters embedded in it, and asking the human to identify these letters and words.

## Who invented the CAPTCHA?

Mark D. Lillibridge, Martin Abadi, Krishna Bharat, Andrei Z. Broder are generally credited as having invented the CAPTCHA or at least having the first documented evidence describing one through patent \[US 6195698 B1\](<http://www.google.com/patents/US6195698>). The word CAPTCHA however was first coined by Luis von Ahn, Manuel Blum, Nicholas J. Hopper and John Langford in their publication of CAPTCHA: Using Hard AI Problems For Security(<http://www.captcha.net/captcha_crypt.pdf>).

Interestingly obscuring text from computers is older then both having come from bulletin board systems (BBS) which started in the 1980&#8217;s. At the time early hackers and internet users sometimes used symbols and characters (later known as leetspeak) to obscure what was written. The idea being to circumvent swear filters and being banned for discussing various illegal activities since the word shit is rather easy to screen for whereas something like $#!+ is far more difficult. Somewhat off-topic but for an interesting look into this world I recommend reading Yahoo! Chat &#8211; A Eulogy(<http://ridiculousfish.com/blog/posts/YahooChatRooms.html>) with three amusing stories about Yahoos chat protocol.

## Usage

Regardless as to the true origin the first CAPTCHA&#8217;s appeared around 1997 and were used by AltaVista to prevent bots from submitting millions of URL&#8217;s to their search engine (Spamdexing). They were quickly followed by all the other major search engines of the time (Yahoo, HotBot, Excite) and free email services such as Hotmail and Yahoo to prevent spammers creating thousands of email accounts. The AltaVista team consisting of Lillibridge et.al apparently looked at existing OCR technology and did the opposite of its recommendation to make something hard for a computer to solve.

The earliest CAPTCHA&#8217;s were generally very simple. This was mostly due to there not being a huge incentive to crack them and by people not know how to design or evaluate their effectiveness. CAPTCHA&#8217;s consisting of fixed length strings, limited selection of words, and using mostly background distortions were common which were easy to break. In time techniques evolved to the sort of CAPTCHA&#8217;s we see today.

In the 2000&#8217;s the article &#8220;Recognizing Objects in Adversarial Clutter&#8221;(<http://www.cs.sfu.ca/~mori/research/papers/mori_cvpr03.pdf>) was published by Greg Mori and Jitendra Malik and shows how to overcome what was considered a good CAPTCHA (and certainly the most used one) Yahoo&#8217;s EZ-Gimpy. This paper when published was rather a big deal as it was the first large paper on how to defeat what was considered a very good CAPTCHA at the time and has since gone on to be cited by hundreds of other CAPTCHA related papers and articles.

At this point in time one of the main ways of getting black hack SEO was to spam thousands of comments on blogs and forums with links back to the website you were wanting to promote. This became especially prevalent from 2003 when blogging took off and software such as Movable Type and WordPress were being targeted. Around this point in time hundreds of different CAPTCHA&#8217;s were created. Mostly they were variations of the original enter the text you see in the box, however some did have new takes on the idea. CAPTCHA&#8217;s asking questions such as &#8220;What is 1 + 3?&#8221; and &#8220;What colour is the sky?&#8221; soon appeared. Generally however these were not as successful as the original idea. This was due to several reasons. Many of them were unable to be used by the sight impaired, many had few questions that could be asked and as such it was easy to just record all of to answers, and others were no more difficult to solve then existing CAPTCHA&#8217;s.

reCAPTCHA is probably considered the next bug jump in CAPTCHA technology. Rather then having users solve useless puzzles reCAPTCHA took unrecognised text from book digitisation and had users solve the text. Since the text was already difficult to recognise by the best in OCR technology it produced outputs that were hard for a computer to solve, easier for a human and had useful results. Its genius was soon recognised and reCAPTCHA was purchased by Google in 2009 and put to work. Google has since used it in 2012 to determine house numbers from the Street View project along with scanned words. You can read more about the project itself in the reCAPTCHA paper (<http://www.google.com/recaptcha/static/reCAPTCHA_Science.pdf>).

## The Future

I am not going to commit my thoughts on the future of CAPTCHA&#8217;s for fear of being called out incorrect in the years to come but I suspect CAPTCHA&#8217;s will continue to be used on the web for the foreseeable future. Unless someone starts using micro-payments (such as with bitcoin or some other crypto-currency) or CPU proof of work (such as the one in BitMessage (<https://bitmessage.org/wiki/Main_Page>)) the benefits are too great and the cost too low for spammers and the like to not continue spamming. As for CAPTCHA&#8217;s themselves I suspect they will continue to iterate along the same path, which seems to be minor tweaks to both the idea and implementation.

Generally speaking they are effective at reducing automated comment/signup spam and slowing down or making it cost ineffective for targeted spammers.

 [1]: https://leanpub.com/decodingcaptchas/
 [2]: http://youtu.be/6_BXeHW7NUo "Youtube History of CAPTCHA by Are You a Human"