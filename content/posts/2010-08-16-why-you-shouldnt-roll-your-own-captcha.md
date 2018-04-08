---
title: Why You Shouldn't roll your own CAPTCHA
author: Ben E. Boyter
type: post
date: 2010-08-16T00:04:02+00:00
excerpt: |
  "Don't write your own CAPTCHA's unless you have a Doctorate in Machine Vision"
url: /2010/08/why-you-shouldnt-roll-your-own-captcha/
categories:
  - CAPTCHA

---
At a TechEd I attended a few years ago I was watching a presentation about Security presented by [Rocky Heckman (read his blog its quite good)][1]. In it he was talking about security algorithms. The part that really stuck with me went like this,

"Don't write your own Crypto algorithms unless you have a Doctorate in Cryptography." Interestingly someone there did have said qualification, and Rocky had to make an exception for that single person.

None the less I think this sort of advice can be applied to all sorts of situations. In particular one that really strikes close to me heart is CAPTCHA's. So following the words of Rocky I will make a simple statement.

**"Don't write your own CAPTCHA's unless you have a Doctorate in Machine Vision"**

<div id="attachment_101" style="width: 330px" class="wp-caption aligncenter">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/recaptcha.jpg"><img class="size-full wp-image-101" title="Recaptcha" alt="ReCAPTCHA Example" src="http://www.wausita.com/wp-content/uploads/2010/08/recaptcha.jpg" width="320" height="132" /></a>
  
  <p class="wp-caption-text">
    A Difficult CAPTCHA to break
  </p>
</div>

Now you are probably going to ask why? The reason is quite simple really. Unless you know what sort of attacks your CAPTCHA is going to experience then you don't know how to defend against those attacks.

I'm going to pull a figure out of the air here but I would say that 90% of the home

<div id="attachment_83" style="width: 160px" class="wp-caption alignright">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/1281913415-5.png"><img class="size-thumbnail wp-image-83" title="1281913415-5" alt="Sample trivial CAPTCHA" src="http://www.wausita.com/wp-content/uploads/2010/08/1281913415-5-150x64.png" width="150" height="64" /></a>
  
  <p class="wp-caption-text">
    A trivial CAPTCHA to break.
  </p>
</div>

grown CAPTCHA's out there on the internet are trivial to crack. Now the owners of these CAPTCHA's will point out a reduction in spam since they implemented it as a proof of the success of their CAPTCHA but frankly thats a flawed argument. I implemented a simple CAPTCHA on another site of mine where all you have to do is enter the word "human" into a text box. Guess what? 100% spam eradication.

See the thing is, if there is money to be gained by defeating your CAPTCHA then someone out there will. Personally I have written CAPTCHA crackers for people from time to time. Guess what, most of them took less then an hour to break including time for downloading samples and tweaking to get better results.

<div id="attachment_90" style="width: 94px" class="wp-caption alignleft">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/captcha.gif"><img class="size-full wp-image-90" title="captcha" alt="Sample Captcha" src="http://www.wausita.com/wp-content/uploads/2010/08/captcha.gif" width="84" height="22" /></a>
  
  <p class="wp-caption-text">
    A trivial CAPTCHA to break.
  </p>
</div>

Another thing to consider is accessibility. About 99% of the home grown CAPTCHA's out there dont even consider the fact that there are sight impaired people around who need text to speech. This becomes a huge issue in countries like England which requires that websites be accessible.

Finally its well known that you can pay people to crack a number of CAPTCHA's for you, or even offer them porn or something and have them crack it for you without knowing.

So whats the **conclusion** to all of this? If you have a simple blog or website and a problem with automated spam, just add a simple "Enter the word human" text-box. It will be 100% effective, is easy to implement and won't annoy your users. If you have something to protect and your CAPTCHA is being targeted, use an external service, which will provide a good accessible CAPTCHA that will be updated when it gets broken (which it will!). A custom CAPTCHA might seem like a good idea at the time, but its only a roadblock to someone who has any incentive to breaking in.

<div id="attachment_88" style="width: 130px" class="wp-caption alignright">
  <a href="http://www.wausita.com/wp-content/uploads/2010/08/word_verification.php_.jpg"><img class="size-full wp-image-88" title="word_verification.php" alt="A Sample CAPTCHA" src="http://www.wausita.com/wp-content/uploads/2010/08/word_verification.php_.jpg" width="120" height="40" /></a>
  
  <p class="wp-caption-text">
    A trivial CAPTCHA to break.
  </p>
</div>

If however you are the sort of person who looks at [ReCAPTCHA and thinks "I can break that"][2] knows when to apply Neural Networks or Support Vector Machines, knows that GIMPY is, and has post graduate studies in the field of machine vision by all means create your own CAPTCHA. Just don't complain when you have to update it every 6 months because someone with something to gain has defeated it.

For those interested my postgrad honours thesis was on applying CAPTCHA decoding techniques against web images as a method of improving search results. You can find a simple tutorial with code about how it was done here, [Decoding CAPTCHA's][3]

 [1]: http://blogs.msdn.com/b/rockyh/
 [2]: http://n3on.org/projects/reCAPTCHA/
 [3]: http://www.wausita.com/captcha/