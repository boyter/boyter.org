---
title: Reading between the lines at AWS re:Invent 2017
author: Ben E. Boyter
type: page
date: 2018-02-01T10:31:34+00:00
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
<div id="block-7897a572f589cd43136a" class="sqs-block html-block sqs-block-html" data-block-type="2">
  <div id="yui_3_17_2_1_1517481018430_248" class="sqs-block-content">
    <h2>
      <strong>AUTHOR: Ben Boyter &#8211; Software Engineer</strong>
    </h2>
    
    <p>
      <em>Ben is a leading Software Engineer at Kablamo, with an exceptional range of coding skills.  </em>
    </p>
    
    <p>
      While this year’s AWS included all the announcements we expected (Go for Lambdas, Kubernetes as a service, new instance types and improved deep learning tools), reading between the lines of what was, and, importantly, what wasn’t announced suggests interesting times ahead for AWS.
    </p>
    
    <h3>
      <strong>Blockchain? What Blockchain?</strong>
    </h3>
    
    <p>
      Given the hype around blockchain and its potential for FinTech, you’d have thought it would be on everyone’s lips at Re:Invent. Instead, it was barely mentioned throughout the keynotes and conference sessions.
    </p>
    
    <p>
      Perhaps Amazon sees no future in it, or the technology itself is not mature enough to build a business case for a service. Alternatively, maybe the very nature of it being widely distributed is making Amazon shy away.
    </p>
    
    <p>
      Whatever the reason, at an event the calibre and scale of AWS, it was conspicuous in its absence.
    </p>
    
    <h3>
      <strong>IoT on the Horizon? </strong>
    </h3>
    
    <p>
      During an informal talk by James Gosling, father of Java, it became apparent he is very much an Internet of Things (IoT) champion.
    </p>
    
    <p>
      He spoke about how, from the outset, he created Java specifically with IoT devices in mind (this has paid off in spades as Java is in practically every device on the planet). He wore his IoT passion on his wrist in the form of an Apple Watch, and spoke avidly about his experience with deep sea drones and the problems he encountered with them.
    </p>
    
    <p>
      This wasn’t just a passing topic though. He also pointed out that while at Sun Microsystems, the IoT division was the most profitable per employee. With so much passion, belief and experience in IoT, it would make a lot of sense for Amazon to recruit him if they planned to expand into the realm of IoT.
    </p>
    
    <p>
      We were in Vegas though, so it is fitting that Amazon kept its cards close to its chest.
    </p>
    
    <h3>
      <strong>Aurora comes in view </strong>
    </h3>
    
    <p>
      During one keynote, an offhand reference was made to serverless SQL Aurora. Although it was somewhat downplayed, after thinking about it further I see incredible potential in the technology.
    </p>
    
    <p>
      Traditionally in Amazon, or any other provider, you would need to provision a server to be large enough to support your peak load. You could get around this by intelligently caching the data, but there is an old saying in computer science; “the only two hard problems are cache invalidation and naming things&#8221;.
    </p>
    
    <p>
      If serverless SQL does as advertised (which we will find out in 2018), it means you could let Amazon worry about the scale. No longer would you need to pay for expensive Staging or Pre-Production environments which match production in order to discover bugs.
    </p>
    
    <p>
      I have seen installs where lower tier environments cost hundreds of thousands of dollars a month while doing very little.
    </p>
    
    <p>
      With Aurora, this could cost less than $100!
    </p>
    
    <p>
      Scaling SQL is itself a really difficult problem. Running your own hardware would mean forking out for a $200,000 machine to process the load and migrate across to it. Suddenly, this looks like ancient history.
    </p>
    
    <p>
      The benefits even translate into production. If you have spiky traffic due to user-driven demand, you could eliminate expenses during the night when nobody is using the application. For internal business applications, this would save a fortune.
    </p>
    
    <p id="yui_3_17_2_1_1517481018430_247">
      Aurora promises better performance, lower costs and more consistent environments. You don’t need to read between the lines to tell that I’m excited.
    </p>
  </div>
</div>