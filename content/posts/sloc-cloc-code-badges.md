---
title: Sloc Cloc and Code Badges for Github/Bitbucket/Gitlab
date: 2019-06-27
---

This is now part of a series of blog posts about `scc` Sloc Cloc and Code which has now been optimised to be the fastest code counter for almost every workload. Read more about it at the following links.

 - [Sloc Cloc and Code - What happened on the way to faster Cloc 2018-04-16](https://boyter.org/posts/sloc-cloc-code/)
 - [Sloc Cloc and Code Revisited - A focus on accuracy 2018-08-28](https://boyter.org/posts/sloc-cloc-code-revisited/)
 - [Sloc Cloc and Code Revisited - Optimizing an already fast Go application 2018-09-19](https://boyter.org/posts/sloc-cloc-code-performance/)
 - [Sloc Cloc and Code a Performance Update 2019-01-09](https://boyter.org/posts/sloc-cloc-code-performance-update/)
 - [Sloc Cloc and Code Badges for Github/Bitbucket/Gitlab](https://boyter.org/posts/sloc-cloc-code-badges/)

A very brief update in the world of `scc`. I noticed that tokei.rs which used to offer badges seemed to be having issues. Since I had wanted an excuse to hook up a AWS Lambda behind an ALB I thought I would add `scc` as a 'service' with badges.

You can view details on how to do so on the `scc` github page https://github.com/boyter/scc/#badges-beta

In short though you can get the count of various metrics that `scc` is able to do for your public github/bitbucket/gitlab repositories. Add the markdown to your README.md file and away you go. It will probably break for very large repositories such as the linux kernel, but it does work with apache/hadoop and spark so it should be fine to a few million lines of code.

In the interests of showing things off here are some badges taken from the `scc` project itself.

[![Scc Count Badge](https://sloc.xyz/github/boyter/scc/?category=lines)](https://github.com/boyter/scc/)
[![Scc Count Badge](https://sloc.xyz/github/boyter/scc/?category=code)](https://github.com/boyter/scc/)
[![Scc Count Badge](https://sloc.xyz/github/boyter/scc/?category=blanks)](https://github.com/boyter/scc/)
[![Scc Count Badge](https://sloc.xyz/github/boyter/scc/?category=comments)](https://github.com/boyter/scc/)
[![Scc Count Badge](https://sloc.xyz/github/boyter/scc/?category=cocomo)](https://github.com/boyter/scc/)

Feel free to use these anywhere you like. It supports git only and there is no hidden catch beyond that I cache the results so that the lambda does not have to clone and reprocess everything each time it is invoked. The cache should be valid for 24 hours. If you need an additional source added please let me know via email or twitter.