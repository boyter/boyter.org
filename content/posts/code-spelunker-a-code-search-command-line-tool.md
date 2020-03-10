---
title: Code Spelunker a Code Search Command Line Tool
date: 2020-03-10
---


John Harrison https://en.wikipedia.org/wiki/John_Harrison was a clockmaker who solved the problem of calculating longitude while at sea using accurate timekeeping devices. To do so he ended up changing course after 30 years of experimentation to solve the problem using large sea clocks and starting again with a "sea watch" of a much smaller design.

I bring this up because I have spent the last 8 years or so working on searchcode.com and searchcodeserver.com and after rethinking the problem I think I am about to do something similar.

Code Spelunker (cs) or code search is a new command line tool I have been working on and off over the last few months.

Rather than bore you with details lets start by showing off its party trick. You can read the details about if after the download link.

https://github.com/boyter/cs


The extraction of snippets from some text is one of those problems I naievely assumed would be fairly simple. I had previously written about this https://boyter.org/2013/04/building-a-search-result-extract-generator-in-php/ which was based on an even older stackoverflow answer.

Well blow me down. Turns out this small chunk of code I wrote in anger was picked up by a bunch of PHP projects https://github.com/msaari/relevanssi/blob/master/lib/excerpts-highlights.php https://github.com/bolt/bolt/blob/master/src/Helpers/Excerpt.php and https://github.com/Flowpack/Flowpack.SimpleSearch/blob/master/Classes/Search/MysqlQueryBuilder.php

Whats interesting to me is that Relevanssi is the wordpress plugin that improves your search results and has 100,000+ installs. Which means it is probably the most successful code in terms of spread. Also interesting is that it is in PHP and I have almost never been paid to write PHP ever in my life. I wonder if thats something I should put on my resume?

Anyway I ported the code directly into cs to see how it would work. And for small snippets it works well. For multiple terms however it had issues and was not producing the results I wanted.

The problem with most snippet stuff is that it is designed to work on whole words or full word matches not partial matches such as the ones cs supports.

My test case for snippet extraction was based on Jane Austens Pride and Prejudice which I admit to knowing more about than most other books for one reason or another. The test case I wanted to work was that a search for `ten thousand a year` should return one of two snippets. Either

      features, noble mien, and the report which was in general
      circulation within five minutes after his entrance, of his having
      *ten thousand a year*. The gentlemen pronounced him to be a fine
      figure of a man, the ladies declared he was much handsomer than
      Mr. Bingley, and


However this is designed to work like that https://www.forrestthewoods.com/blog/reverse_engineering_sublime_texts_fuzzy_match/



