---
title: Sloc Cloc and Code - Can a crusty Go program outperform a well written Rust Project?
date: 2029-10-12
---



Sloc Cloc and Code - Can a crusty Go program outperform a well written Rust Project?
TALK
Description
Sloc cloc and code. How a death march project lead to learning Go, the creation of a source lines of code counter which is faster and more accurate then the Rust/ATS/C equivalents, while learning about some really bizarre performance characteristics.

About Ben Boyter
A technical lead for Kablamo but at heart a codemonkey. I write about various topics on my blog https://boyter.org/ which occasionally makes the front of the orange site, as well as run searchcode.com as a side gig for fun. I like writing code, walks on beach and getting caught in the rain. I hate eating raw tomato unless you prepare it somehow, and slices on a hamburger does not count as preparation.










Hello All!

Hope you are having a wonderful day.

So I am Ben. I am not an alcholic, but I might be if this does't go well. I am a technical lead for Kablamo which means "codemoney". As you are probably aware my talk is about a command line tool I created. The talk is name "Sloc Cloc and Code - Can a crusty Go program outperform a well written Rust Project?"

// title slide with name + photo

As I mentioned I work for Kablamo. Kablamo builds a lot of custom software on AWS. Our backend language of choice is Go which was a problem for me because I didn't know it.

As such I was working on projects in other languages such as C# and Java. 

One that came past was to upgrade a an application written in C# with a JavaScript frontend. The goal was to upgrade the frontend and fix some backend issues. It was meant to take 6 weeks. It took over a year.

The reason is that I massively underestimated how large a project it was. So what do we do when we make mistakes?

When looking though any new project one tends to poke through the code, looking at login methods, database calls, file logic, logging etc... One thing thats very useful is knowing how large the project is and what languages are included.

Enter cloc. A command line tool. Is as far as I can tell the original code counter, Ie first one beyond wc. It's a very full featured perl program at least 13 years old. I remember using it my first year on the job. Its premise is simple, it scans though code looking for blank lines, code and comments. It then reports on what languages it found and the counts of file.

However in the .NET world you can use Visual Studio to count as well. But it also gives you a count of the complexity of code. This tells you where the problematic files are likely to be.

// slide showing

Cloc has one huge advantage over the Visual Stuido count. It will count over 100 languages. Which is great because if you are working on a C# codebase its nice to now there is a huge chunk of Kotlin code in there that Visual Studio knows nothing about.

However Visual Studio has the advantage of telling you which files are likely to be the most complex so you can have a look at those first. Its also MUCH faster than cloc, which is probably not known for being a fast counter.

So back to that project I was asked to look at. Because it was in C# I could get counts for portions of it, but not the JavaScript. As such we massively understimated how large a project it was. 

A 6 week engagement turned into a 1 year death match.

So what do you do as a response to such things?

// Over compensating for past failures

So what I wanted was a tool that combines both, but works across all languages.

I am not original enough to have had this idea, and it turns out at the time where were 2 other projects I could find. Tokei (great name) and Loc. Both were written in rust and both claim to offer exceptional performance.

Challange accepted.

My theory was it's likely they missed some optimisations that I could implement. If nothing else I would get what I wanted which was a fast code counter which included some ideas of complexity.

So lets start talking about the first issue I had. Which was I wrote a basic version. I followed the usual Go method of channels to communicate which almost fits this model perfectly (more on that later).



integer parsing C# story