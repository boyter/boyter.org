---
title: An informal survey of 12 million git projects from Github, Bitbucket and Gitlab
date: 2019-07-11
---

The tool I created `scc` counts lines of code, comments and makes a guess at how complex some code is. The latter is something you need a good sample size to make use of. So I thought I would try running it at all the source code I could get my hands on. 

In this post I am looking at all the code I downloaded and processed using `scc`. The data set I looked at includes 

 - **5,483** repositories
 - **28,529** files
 - **7,069,681,918** bytes
 - **168,603,755** lines
 - **129,411,063** code lines
 - **16,584,855** blank lines
 - **22,607,837** comment lines
 - **10,330,300** estimated complexity 


## Methodology

Since I have searchcode.com I already have a collection of 7,000,000 projects across git, mercurial, subversion and such and I thought why not try processing them? The first step was to export the list from it. Turns out it was more like 12 million git, and I should probably update the page to reflect that.

So now I have 12 million or so git repositories which I need to download and process.

Since I already had the badge code working in lambda, I write about 15 lines of python to clean the format and make a request to the endpoint using multiprocessing. 

The problem with the above which worked brilliantly was firstly cost, and secondly with a 30 second timeout it couldn't process large repositories fast enough. I knew going in that this was not going to be the most cost effective solution but you never know till you try. After processing 1 million or so the cost was about $60 and since I didn't want a $600 AWS bill I decided to rethink my solution.

Since I was already in AWS the cool answer would be to dump the messages into SQS and farm out to multiple EC2 instances for processing. However I always believed in [taco bell programming](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html) and it was only 12 million messages, so I opted for a simple solution.

Running locally was out due to the abysmal state of internet in Australia. However I run searchcode.com fairly lean an efficiently. As such it usually has a lot of spare compute. The front-end varnish box for instance is doing the square root of zero most of the time. So why not run the processing there?

I didn't quite taco bell the solution using bash and gnu tools though. What I did do was write a simple [Go program](https://github.com/boyter/scc-data/blob/master/process/main.go) to spin up 32 go-routines which read from a channel (like SQS as it turns out) then spawned `git` and `scc` subprocesses before writing the JSON output into S3. Actually I wrote a Python solution at first, but having to install the pip dependencies didn't appeal to me and it keep breaking in odd ways.

Running this on the box produced the following sort of metrics in htop. A lot of git action, and not much `scc` which is good to see.

![scc-data process load](/static/an-informal-survey/1.png#center)


## Results

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index

### Files per repository

How many files are in each repository? That is, do most projects have a few files in them, or many?

![scc-data process load](/static/an-informal-survey/filesPerProject.png#center)


## If you got this far thank you and please read my sales pitch!

I am working on a tool that helps manager types analyze code looking for size, flaws etc... You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some codebase.