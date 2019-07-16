---
title: An informal survey of 12 million git projects from Github, Bitbucket and Gitlab
date: 2019-07-11
---

The tool I created [Sloc Cloc and Code (`scc`)](https://github.com/boyter/scc/) counts lines of code, comments and makes a guess at how complex some code is. The latter is something you need a good sample size to make use of. So I thought I would try running it at all the source code I could get my hands on. 

In this post I am looking at all the code I downloaded and processed using `scc`. The data set I looked at includes,

 - **5,483** repositories
 - **842** empty repositories
 - **28,529** files
 - **7,069,681,918** bytes
 - **168,603,755** lines
 - **129,411,063** code lines
 - **16,584,855** blank lines
 - **22,607,837** comment lines
 - **10,330,300** estimated complexity 
 - **6,325** Bitbucket repositories


## Methodology

Since I have searchcode.com I already have a collection of 7,000,000 projects across git, mercurial, subversion and such and I thought why not try processing them? The first step was to export the list from it. A simple export and it turns out it I actually have 12 million git repositories that I am tracking, and I should probably update the page to reflect that.

So now I have 12 million or so git repositories which I need to download and process.

A while back I wrote code to create github badges using `scc` https://boyter.org/posts/sloc-cloc-code-badges/ and since part of that included caching the results, I modified it slightly to cache the results into S3.

With the badge code working in AWS using lambda, I took the exported list and wrote about 15 lines of python to clean the format and make a request to the endpoint. I threw in some python multiprocessing to fork 32 processes to churn through them. 

This worked brilliantly. However the problem with the above was firstly the cost, and secondly because lambda behind API-Gateway/ALB has a 30 second timeout it couldn't process large repositories fast enough. I knew going in that this was not going to be the most cost effective solution but it could have been close to $100 which would have been fine. After processing 1 million or so the cost was about $60 and since I didn't want a $700 AWS bill I decided to rethink my solution.

Since I was already in AWS the cool answer would be to dump the messages into SQS and pull from this queue into multiple EC2 instances for processing, and scale out like crazy. However I always believed in [taco bell programming](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html) and as it was only 12 million messages I opted to implement a simpler solution.

Running locally was out due to the abysmal state of internet in Australia. However I run searchcode.com fairly lean and efficiently. As such it usually has a lot of spare compute. The front-end varnish box for instance is doing the square root of zero most of the time. So why not run the processing there?

I didn't quite taco bell the solution using bash and gnu tools. What I did was write a simple [Go program](https://github.com/boyter/scc-data/blob/master/process/main.go) to spin up 32 go-routines which read from a channel (like SQS as it turns out) then spawned `git` and `scc` subprocesses before writing the JSON output into S3. I actually wrote a Python solution at first, but having to install the pip dependencies on my clean varnish box seemed like a bad idea and it keep breaking in odd ways which I didn't feel like debugging.

Running this on the box produced the following sort of metrics in htop.

![scc-data process load](/static/an-informal-survey/1.png#center)


## Results

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index

### Files per repository

How many files are in each repository? That is, do most projects have a few files in them, or many?

![scc-data process load](/static/an-informal-survey/filesPerProject.png#center)

### How many lines of code (LOC) are in a typical file per language?

What languages on average have the largest files?

| Language | Average (LOC) |
|---|---|
| Java | 65 |
| PHP | 33 |
| C | 15 |
| Go | 6 |

### Do projects with few files have large files?

Do projects that have less files have larger files?

### What are the most common filenames?

What filenames are most common across all code-bases ignoring extension and case?

| file-name | count |
| -------- | ----- |
| index | 9,400 |
| jquery | 9,167 |
| readme | 7,749 |
| makefile | 6,136 |
| lang | 6,119 |
| \__init__ | 4,313 |
| package | 3,955 |
| license | 3,739 | 
| main | 3,634 |
| config | 2,863 |

### Whats the average size of those index pages?

### How many repositories appear to be missing a license?

This is an interesting one. Which repositories have an explicit license file somewhere? Not that the lack of a license file does not mean that the project has none, it might exist within the README for example but considering that the flow for most new repositories ask if you want to setup a license this surprised me.

| has license | count |
| ----------- | ----- |
| yes | 864 |
| no | 4619 |

![scc-data process load](/static/an-informal-survey/hasLicense.png#center)

[Chart Link](https://jsfiddle.net/mscvtgd4/)

### Which languages have the most comments?

### How many projects use multiple .gitignore files?

### Whats the largest file for each language?

### How many "pure" projects

That is projects that have 1 language in them.

### Projects without javascript?

### Projects with typescript and not javascript

### Anyone using coffeescript and typescript?

### The most complex code is written in what language?

### Whats the most complex file?

### Whats the most complex file in each language?

### Whats the most complex file weighted against lines?

### What's the typical path length, broken up by language

### YAML or YML?

The debate can finally be ended.

| extension | count |
| ----------- | ----- |
| yaml | 975 |
| yml | 3712 |

### Who comments most-to-least, by language (95th percentile)


### Whats the most commented file?


## If you got this far thank you and please read my sales pitch!


I am working on a tool that helps manager types analyze code looking for size, flaws etc... You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some codebase.