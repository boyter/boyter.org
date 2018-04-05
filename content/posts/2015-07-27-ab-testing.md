---
title: A/B Testing
author: Ben E. Boyter
type: post
date: 2015-07-27T08:11:59+00:00
url: /2015/07/ab-testing/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Advertising
  - Testing

---
A/B testing is testing the comparison of two outputs where a single unit has changed. It is commonly used when when trying to increase conversion rates for online websites. Also known as split testing an example would be trying to increase user clicks on a specific button on a website. You may have a theory that red buttons work better then green. You would try out both against real users and see which one performs better.

You should use A/B testing when you have some existing traffic to a website (or mailing list), know what outcomes you are trying to achieve and most importantly are able to track what actions resulted in the outcome. Without these three things split testing will not achieve the outcomes you wish.

Numerous things are able to be A/B split tested and are limited to what you have to pivot on and your imagination. A few examples include,

* Pricing tiers and structures
  
* Free trial time lengths
  
* Titles E.G. length and word placement
  
* Headlines and Sub-Headlines E.G. size, length, word placement
  
* Forms E.G. adding and removing requested fields
  
* Paragraph Text E.G. adding more content, changing spacing
  
* Testimonials E.G. adding more or less, increasing the length
  
* Call to Action (text, links, buttons or images) E.G. &#8220;add to cart&#8221; vs &#8220;buy now&#8221;
  
* Movement of content around the page
  
* Press mentions and awards

Things to keep in mind when A/B testing is that running your tests for a long time can result in SEO penalties from Google and other search engines. Quoted from the [Google Webmaster Central Blog on Website Testing][1],

> &#8220;If we discover a site running an experiment for an unnecessarily long time, we may interpret this as an attempt to deceive search engines and take action accordingly. This is especially true if you’re serving one content variant to a large percentage of your users.&#8221;

It is highly recommended to read and understand the post mentioned in order to ensure you are following best practices. The consequences can be dire indeed including being black listed by Google and other search engines as the worst possible result.

A/B testing can be implemented in a variety of ways. Perhaps the best known is using using Google Analytics. However there are other free and paid for solutions. [Visual Website Optimizer][2] is one example of a paid for service and if you are using Ruby on Rails there are many libraries to help you out.

A few things to keep in mind when doing A/B testing.

* Test all the variations of a single entity at the same time. If you perform a test on one variant for a week and another the following week your data is likely to be skewed. Its possible that you had some excellent high value links added the second week but it had a lower conversion rate.
  
* Keep the test running long enough to have confidence in your results but not so long as to be penalised by Google. You need to have statistical significance. Any A/B tool worth money will be able to report on this metric for you and let you know when to finish the test. It is very useful to know how long you are going to run the test before starting.
  
* Trust the data over feeling. If the data is telling you that an ugly button works better then your beautiful one either trust the data or run the test again at a later date to confirm. It can be hard to do what feels counter intuitive but you need to remember that humans generally are not rational and will not behave how you expect.
  
* If a user complains about seeing a different price offer them the better deal. Always respect your users and customers. It builds good will. Another thing to do is avoid split testing paying customers. Adobe Omniture runs a lot of A/B tests in their online product and it drives some customer&#8217;s crazy as everything they need moves around on a regular basis. Just don&#8217;t do it.
  
* Don&#8217;t A/B test multiple things at the same time. If you are doing to A/B test a better design then test the better design against the other one. Don&#8217;t chop and change various parts of the website. It will be confusing.
  
* Keep trying. Its possible a single test will produce no meaningful results. If so try again. Not only will you get better with experience you are more likely to find the correct things to optimise.

A real genius in this space is [Patrick McKenzie][3] and a few very worthwhile articles to read about it are [A-B Testing Made Me a Small Fortune][4] and [A-B Testing][5]. Other articles worth reading include, [Practical Guide to Controlled Experiments on the Web by Microsoft Research (PDF)][6], [Writing Decisions: Headline Tests on the Highrise Sign-Up Page][7]], [&#8220;You Should Follow Me on Twitter Here&#8221;][8], [How We Increased our Conversion Rate by 72%][9], [Human Photos Double your Conversion Rate][10]

 [1]: http://googlewebmastercentral.blogspot.in/2012/08/website-testing-google-search.html
 [2]: https://vwo.com/
 [3]: http://www.kalzumeus.com/
 [4]: http://www.kalzumeus.com/2012/08/06/stripe-and-ab-testing-made-me-a-small-fortune/
 [5]: https://training.kalzumeus.com/newsletters/archive/ab_testing
 [6]: http://exp-platform.com/Documents/GuideControlledExperiments.pdf
 [7]: http://37signals.com/svn/posts/1525-writing-decisions-headline-tests-on-the-highrise-signup-page
 [8]: http://dustincurtis.com/you_should_follow_me_on_twitter.html
 [9]: http://dmix.ca/2010/05/how-we-increased-our-conversion-rate-by-72/
 [10]: http://carsonified.com/blog/design/human-photos-double-your-conversion-rate/