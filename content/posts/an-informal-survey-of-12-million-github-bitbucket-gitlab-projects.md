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

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index I thought I would steal some of the format they provided. However this raised another question. How does one process 10 million JSON files in an S3 bucket?

The first thought was AWS Athena. But since it's going to cost about $2.50 USD per query to query the amount of data I had another ponder.

One idea was to dump the data into a large SQL database. However this means processing the data into the database, then running queries over it perhaps multiple times. This feels wasteful because we could just process the data as we read it once.

Seeing as I produced the JSON using spare compute, why not process the results the same way? So I did. Which means 

So with that done, what I needed was a collection of questions to answer, which are included below.

### How many files in a repository?

Start with a simple one. How many files are in an average repository? Do most projects have a few files in them, or many? By looping over the repositories and counting the number of files we can then drop them in buckets of 1, 2, 10, 15 or more files and plot it out.

![scc-data process load](/static/an-informal-survey/filesPerProject.png#center)

As you would expect most repositories have less than 100 files in them. However what about plotting this by percentile?

TODO check the above

### How many files in a repository per language?

An extension of the above, but broken down by language.

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

We know that the most common filenames, but what about knowing 

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

How many projects use multiple gitignore files? How many have none?

![scc-data process load](/static/an-informal-survey/gitignorePerProject.png#center)

As you would expect the majority of projects have either 0 or 1 gitignore file. However a lot more than I would have suspected have more.

### Which language developers have potty mouth?

This is less than an exact science. Picking up cursing/swearing or offensive terms using filenames is never going to be effective. If you do a simple contains you pick up all sorts or normal files such as `assemble.sh` and such. So to produce the following I pulled a list of curse words, then check if any files in each project start with one of those values followed by a period. This would mean a file named `gangbang.java` would be picked up while `assemble.sh` would not.

While not accuate at all it is incredibly fun to see what this produces.

### Top 20 longest files in lines per language

As you would probably expect Plain Text, SQL, XML and CSV take the top positions of this one, seeing as they usually contain metadata, database dumps and the like.

TODO ADD LINK TO FILE

| language | filename | lines |
| -------- | -------- | ----- |
| Plain Text | largeT.txt | 1000000 |
| SQL | f100.sql | 815560 |
| XML | orderdetails_rand_20000.xml | 480011 |
| CSV | real-ckjm.csv | 346438 |
| Python | qrc_resources_rc.py | 212466 |
| C | sqlite3.c | 131068 |
| HTML | benchmark.html | 111608 |
| C Header | banana.h | 96704 |
| JavaScript | sencha-touch-all-debug.js | 85550 |
| Game Maker Language | polblogs.gml | 85304 |
| Patch | 0014-import-compat-headers.patch | 82118 |
| PHP | en.php | 68830 |
| YAML | pgts.yaml | 62356 |
| Autoconf | B-large-practice.in | 51847 |
| Objective C | TrialData000_1347_03_04_2013.m | 48539 |
| Perl | Grammar.pm | 47955 |
| SVG | Milky set.svg | 35002 |
| JSON | khanhist_aligned.json | 29626 |
| C++ | vmetst_v7.cpp | 25618 |
| Assembly | fpsp.S | 24785 |

### Whats the largest file for each language?

Across all the languages we looked at whats the largest file by number of bytes for each one?

| language | filename | bytes |
| -------- | -------- | ----- |
| CSV | real-ckjm.csv | 346438 |
| SQL | f100.sql | 815560 |
| JSON | AllSets-x.json | 1 |
| Plain Text | in2.txt | 201 |
| Python | qrc_resources_rc.py | 212466 |
| Objective C | TrialData000_1347_03_04_2013.m | 48539 |
| XML | orderdetails_rand_20000.xml | 480011 |
| HTML | benchmark.html | 111608 |
| SVG | gnome-music.svg | 2894 |
| Autoconf | A-large.in | 101 |
| C Header | banana.h | 96704 |
| Patch | 0014-import-compat-headers.patch | 82118 |
| C | sqlite3.c | 131068 |
| Jupyter | template_match.ipynb | 909 |
| JavaScript | ext-all-debug-w-comments.js | 78980 |
| Perl | Grammar.pm | 47955 |
| YAML | pgts.yaml | 62356 |
| PHP | four.php | 2527 |
| CSS | 6329A103E89DFA89D.css | 22 |
| XAML | Icons.xaml | 4941 |

### How many "pure" projects

That is projects that have 1 language in them. Of course that would not be very interesting, so lets see what the spread is. Turns out most languages have fewer than 20 languages in them with most in the less than 10 bracket.

TODO ensure the above is correct

![scc-data pure projects](/static/an-informal-survey/languagesPerProject.png#center)

### Projects with TypeScript but not JavaScript

### Anyone using CoffeeScript and TypeScript?

### The most complex code is written in what language?

### Whats the most complex file?

### Whats the most complex file in each language?

### Whats the most complex file weighted against lines?

This sounds good in practice, but in reality... anything minified or with no newlines skews the results making this one effectively pointless.

### What's the typical path length, broken up by language

Given that you can either dump all the files you need in a single directory, or span them out using file paths whats the typical path length and number of directories?

### YAML or YML?

Sometime back on the company slack there was a "discussion" with many dying on one hill or the other over should you use .yaml or .yml

The debate can finally(?) be ended. Although I suspect some still prefer the hill.

| extension | count |
| ----------- | ----- |
| yaml | 975 |
| yml | 3712 |

### Who comments most-to-least, by language (95th percentile)


### Whats the most commented file?


### Upper lower or mixed case?


### Java Factories

Another one that came up in the internal company slack when looking through some old Java code. I thought why not add a check for any Java code that has Factory, FactoryFactory and FactoryFactoryFactory and lets see how many factory classes are out there.

| type | count | percent |
| ---- | ----- | ------- |
| not factory | 49110 | 99 |
| factory | 533 | 0.91 |
| factoryfactory | 2 | 0.001|
| factoryfactoryfactory | 1 | 0.001 |

TODO update the above

## If you got this far thank you and please read my sales pitch!


I am working on a tool that helps manager types analyze code looking for size, flaws etc... You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some codebase.