---
title: Why count lines of code?
date: 2018-06-07
---

A work college (let's call him Owen as that's his name) asked me the other day 

> "I dont understand the problem space `scc` et al solve. If you wanted to write a short post, i'd read and share the hell out of it. Basically, it seems like a heap of people can see the need for it, and I'm trying to understand it myself"

Owen is one of the more switched on people I know. As such if he is asking whats the point of tools such as scc, tokei, sloccount, cloc, loc and gocloc then I suspect quite a few other people are asking the same thing.

To quote the lead from a few of the tools mentioned.

> scc is a very fast accurate code counter with complexity calculations and COCOMO estimates written in pure Go 

> cloc counts blank lines, comment lines, and physical lines of source code in many programming languages. Given two versions of a code base, cloc can compute differences in blank, comment, and source lines.

> "SLOCCount" a set of tools for counting physical Source Lines of Code (SLOC) in a large number of languages of a potentially large set of programs.

> Tokei is a program that displays statistics about your code. Tokei will show number of files, total lines within those files and code, comments, and blanks grouped by language.

So what?

I am going to explain personally where I have used these tools. Others may have different experiences but I suspect there will be a lot of overlap.



`scc` takes the idea a little further than the other tools by including a complexity estimate. Anyone who has worked with Visual Studio and the .NET languages for a few years will have eventually 