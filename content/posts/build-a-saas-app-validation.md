---
title: "Build a SaaS App - Idea Validation"
date: 2040-06-11
draft: true
---

> A part of a series of blog posts I have been working on to turn into a book about building a SaaS application.

# Idea Validation

There are a few ways to do idea validation, and I am not an expert in any of them. A few of the better ways that I can mention however,

 - Sales Safari. Rather than looking for ideas look for peoples pain. Then solve it.  https://shop.stackingthebricks.com/sales-safari-101
 - Just Fucking Ship. From the same people behind Sales Safari, a no nonsense guide to just shipping. https://shop.stackingthebricks.com/just-fucking-ship
 - Nugget. A startup incubator, but it also has a collection of start-up ideas you can just take. https://nugget.one/
 - Start Small Stay Small. A bit dated but the ideas in here are still pretty good to read. https://startupbook.net/

Because I idea validation is not the core thing I am doing with this series I am going to cheat. I subscribed to [nugget.one](https://nugget.one/) and picked an idea that has already been validated for us. The contents of a promising nugget are included below.

## Here's the Nugget

### Submission:

> I'm creating an online course about a fitness topic. The hardest part about creating the course is the writing involved. There are various ways writers and marketers create content for the blog, website, or books.

> I would like a solution that was part Content Calendar and part researcher. What I mean is, if there was a way for software to HELP me research a topic and provide a list of relevant articles so that I don't have to do this manually each day.

> This way, the research part would be taken care of (saving me tons of time or $$ to outsource) and I could happily start writing right away. Integrating the research with a content calendar would be really convenient and allow me to manage writing tasks in one easy interface.

> Maybe something like this already exists; if id does I've never heard of it. I've used different writing apps and most are just word processors. I want something that will help with research and help to plan and schedule the content I'm creating which will cut down a lot of steps and save me tons of time.

### Analysis:

This is a different problem than the those solved by Nugget #362 or Nugget #1002.

The product I am envisioning is one that searches the internet as you type and live loads related articles for you to read as you create your content. I think that would be pretty neat.

The submitter is also looking for a content schedule so overall this works well for course creators and content marketers. Which is not a bad space to be in.

### Business Domain Stats

88% of B2B marketers in North America use content marketing.

### Research & Find Customers

https://www.linkedin.com/vsearch/p?keywords=content+marketer (5k)
https://www.linkedin.com/groups/3946859/profile (4k)
https://www.quora.com/What-are-the-best-forums-related-to-the-content-marketing-niche1
Learn about the Problem Space

http://www.curata.com/resources/ebooks/2016-CMStaffing-Tactics-Study
http://www.curata.com/blog/content-marketing-statistics-the-ultimate-list/
Research Competition & Related Products

http://www.docurated.com/all-things-productivity/best-content-marketing-tools

### Notes:

We sent out this nugget to our premium subscribers eight months ago. If you would like access to our list of 400+ nuggets and our most current daily nugget join our premium list here.

Many Thanks,
Team Nugget

## What are we Creating?

Keep in mind we were looking for an outcome here and as such I am not going to validate the idea any futher. Lets get cracking with the actual implementation.

Based on the above we are going to create a web application, which you type in some search terms and click "research". It then hits search engine API's getting back the first 100 or so results. It then fetches each of those results itself, and builds a report based on them all. I am thinking that a summeriser of whats in the page, with the ability to search over everything in the report. Adding addtional documents using another search is useful and the ability to remove results and view them all.

Intuitively this seems to be a reasonable thing to build. Certainly I would find this useful when researching topics.

The end result being you can get a good overview of any topic with little effort. Its also very doable. Search API's are thankfully common these days, with Yahoo, Bing, Yandex and Gigablast all offering one. Basic summerisation is not a hard problem (lots of examples), and everything else looks very easy to implement with off the shelf software.


https://wiby.me/json/?q=about

https://azure.microsoft.com/en-au/pricing/details/cognitive-services/search-api/