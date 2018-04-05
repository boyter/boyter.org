---
title: Breaking Weak Captcha WITHOUT external libraries
author: Ben E. Boyter
type: post
date: 1970-01-01T00:00:00+00:00
draft: true
url: /?p=214

---
[<img class="aligncenter size-full wp-image-229" title="background" src="http://www.wausita.com/wp-content/uploads/2010/08/background.gif" alt="" width="58" height="28" />][1]http://www.bonsai-sec.com/blog/index.php/breaking-weak-captcha-in-26-lines-of-code/

Great article but has a few issues. First its Windows only. Secondly the meat of the application lives in an external application.

Lets see if we cant improve on it and in something new for me, lets try doing it using neural networks.

First we need to recreate a similar looking captcha. I created a simple background, and then wrote the following PHP to add 4 random characters to it. All lowercase.

Now we need to extract the characters, we can do this just slicing down since they are seperated correctly.

Now the final step is to run it through some neural nets to work out which character it most likely is.

 [1]: http://www.wausita.com/wp-content/uploads/2010/08/background.gif