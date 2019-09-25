---
title: Downloading and processing 40 TB of code from 10 million git projects using a dedicated server and Goroutines
date: 2019-09-20
---

The tool I created [Sloc Cloc and Code (`scc`)](https://github.com/boyter/scc/) (and now supported by many excellent people) counts lines of code, comments and make a complexity estimate for files inside a code repository. The latter is something you need a good sample size to make good use of. Otherwise what does "This file has complexity 10" tell you? So I thought I would try running it at all the source code I could get my hands on.

However if I am going to run it over all that code which is going to be expensive computationally I may as well try to get some interesting numbers out of it. As such I decided to record everything as I went and produce this post.

In short I downloaded and processed a lot of code using `scc`. The data set I looked at includes,

 - **9,985,051** total repositories
 - **9,100,083** repositories with at least 1 known file
 - **884,968** empty repositories (those with no files)
 - **58,389,641** files in all repositories
 - **40,736,530,379,778** bytes processed (40 TB)
 - **1,086,723,618,560** lines identified
 - **816,822,273,469** code lines identified
 - **124,382,152,510** blank lines identified
 - **145,519,192,581** comment lines identified
 - **71,884,867,919** complexity count according to scc rules

It took about 5 weeks to download and run `scc` over all of the repositories collecting all of the data. It took just over 49 hours to crunch and process the results which was just over 1TB of JSON.

## Quicklinks

 - [Methodology](#methodology)
 - [Results](#results)
 - [Data Sources](#data-sources)
 - [How many files in a repository?](#how-many-files-in-a-repository)
 - [Whats the project breakdown per language?](#whats-the-project-breakdown-per-language)
 - [What are the most common filenames?](#what-are-the-most-common-filenames)
 - [How many repositories appear to be missing a license?](#how-many-repositories-appear-to-be-missing-a-license)
 
## Methodology

Since I run [searchcode.com](https://searchcode.com/) I already have a collection of over 7,000,000 projects across git, mercurial, subversion and such. So why not try processing them? Working with git is usually the easiest solution so I ignored mercurial and subversion and exported the list of git projects. Turns out I actually have 12 million git repositories being tracked, and I should probably update the page to reflect that.

So now I have 12 million or so git repositories which I need to download and process.

A while back I wrote code to create github badges using `scc` https://boyter.org/posts/sloc-cloc-code-badges/ and since part of that included caching the results, I modified it slightly to cache the results into S3.

With the badge code working in AWS using lambda, I took the exported list and wrote about 15 lines of python to clean the format and make a request to the endpoint. I threw in some python multiprocessing to fork 32 processes to churn through them. 

This worked brilliantly. However the problem with the above was firstly the cost, and secondly because lambda behind API-Gateway/ALB has a 30 second timeout it couldn't process large repositories fast enough. I knew going in that this was not going to be the most cost effective solution but it could have been close to $100 which would have been fine. After processing 1 million or so the cost was about $60 and since I didn't want a $700 AWS bill I decided to rethink my solution.

Since I was already in AWS the hip solution would be to dump the messages into SQS and pull from this queue into EC2 instances or fargate for processing. Then scale out like crazy. However despite working in AWS in my day job I have always believed in [taco bell programming](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html) and as it was only 12 million repositories I opted to implement a simpler solution.

Running this computation locally was out due to the abysmal state of the internet in Australia. However I do run [searchcode.com](https://searchcode.com/) fairly lean using dedicated servers from Hetzner. These boxes are quite powerful, i7 Quad Core 32 GB RAM machines. As such they usually has a lot of spare compute based on how I use them. The front-end varnish box for instance is doing the square root of zero most of the time. So why not run the processing there?

I didn't quite taco bell program the solution using bash and gnu tools. What I did was write a simple [Go program](https://github.com/boyter/scc-data/blob/master/process/main.go) to spin up 32 go-routines which read from a channel, spawned `git` and `scc` subprocesses before writing the JSON output into S3. I actually wrote a Python solution at first, but having to install the pip dependencies on my clean varnish box seemed like a bad idea and it keep breaking in odd ways which I didn't feel like debugging.

Running this on the box produced the following sort of metrics in htop, and the multiple git/scc processes running suggested that everything was working as expected, which I confirmed by looking at the results in S3.

![scc-data process load](/static/an-informal-survey/1.png#center)

## Results

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index I thought I would steal the format of that post with regards to how I wanted to present the information. However this raised another question. How does one process 10 million JSON files in an S3 bucket?

The first thought I had was AWS Athena. But since it's going to cost about $2.50 USD **per query** with the amount of data I had I quickly looked for an alternative.

I posted the question on the company slack because why should I solve every issue alone.

One idea raised was to dump the data into a large SQL database. However this means processing the data into the database, then running queries over it multiple times. This feels wasteful because we could just process the data as we read it. I also was worried about building a database this large. As with just data it would be over 1 TB in size without indexes.

Seeing as I produced the JSON using spare compute, I thought why not process the results the same way? Of course there is one issue with this. Pulling 1 TB of data out of S3 is going to cost a lot. In the event the program crashes that is going to be annoying. To reduce costs I wanted to pull all the files down locally and save them for further processing. Handy tip, you really do not want to store lots of little files on disk in a single directory. It sucks for runtime performance and file-systems don't like it.

My answer to this was another simple [Go program](https://github.com/boyter/scc-data/blob/master/scc-tar/main.go) to pull the files down from S3 then store them in a tar file. I could then process that file over and over. The process itself is done though **very ugly** [program](https://github.com/boyter/scc-data/blob/master/main.go) to process the tar file so I could re-run my questions without having to trawl S3 over and over. I didn't bother with go-routines for this code for two reasons. The first was that I didn't want to max out my server so this limits it to 1 core. The second being I didn't want to ensure it was thread-safe.

With that done, what I needed was a collection of questions to answer. I used the slack brains trust again and crowd-sourced my work colleagues while I came up with some ideas of my own. The result of this mind meld is included below.

You can find all the code I used to process the JSON including that which pulled it down locally and the [ugly python script](https://github.com/boyter/scc-data/blob/master/convert_json.py) I used to mangle it into something useful here https://github.com/boyter/scc-data Please don't comment on it, I know the code is ugly and it is something I wrote as a throwaway and I am unlikely to ever look at it again.

### Data Sources

From the three sources, github, bitbucket and gitlab how many projects came from each? Note that this is counted before excluding empty repositories hence the sum is over the number of repositories that actually form the counts below.

| source | count |
| ------ | ----- |
| github | 9,680,111 |
| bitbucket | 248,217 |
| gitlab | 56,722 |

Sorry to the GitHub/Bitbucket/GitLab teams if you read this. If this caused any issues for you (I doubt it) I will shout you a refreshing beverage of your choice should we ever meet.

### How many files in a repository?

On to the real questions. Lets start with a simple one. How many files are in an average repository? Do most projects have a few files in them, or many? By looping over the repositories and counting the number of files we can then drop them in buckets of 1, 2, 10, 12 or however many files it has and plot it out.

![scc-data files per project](/static/an-informal-survey/filesPerProject.png#center)

The X-axis in this case being buckets of the count of files, and Y-axis being the count of projects with that many files. This is limited to projects with less than 1000 files because the plot looks like empty with a thin smear on the left side if you include all the outliers.

As it turns out most repositories have less than 200 files in them. 

However what about plotting this by percentile, or more specifically by 95th percentile so its actually worth looking at? Turns out the vast majority of projects have less than 1,000 files in them. While 90% of them have less than 300 files and 85% have less than 200.

![scc-data files per project 95th](/static/an-informal-survey/filesPerProjectPercentile95.png)

If you want to plot this yourself and do a better job than I here is a link to the raw data [filesPerProject.json](/static/an-informal-survey/filesPerProject.json).

### Whats the project breakdown per language?

This means for each project scanned if a Java file is identified increment the Java count by one and for the second file do nothing. This gives a quick view of what languages are most commonly used. Unsurprisingly the most common languages include markdown, .gitignore and plain text.

Markdown the most commonly used language in any project is included in just over 6 million projects which is about 2/3 of the entire project set. This makes sense since almost all projects include a README.md which is displayed in HTML for repository pages.

The full list is included below.

[skip table to next](#how-many-files-in-a-repository-per-language)

| language | project count |
| -------- | ----- |
| Markdown | 6,041,849 |
| gitignore | 5,471,254 |
| Plain Text | 3,553,325 |
| JavaScript | 3,408,921 |
| HTML | 3,397,596 |
| CSS | 3,037,754 |
| License | 2,597,330 |
| XML | 2,218,846 |
| JSON | 1,903,569 |
| YAML | 1,860,523 |
| Python | 1,424,505 |
| Shell | 1,395,199 |
| Ruby | 1,386,599 |
| Java | 1,319,091 |
| C Header | 1,259,519 |
| Makefile | 1,215,586 |
| Rakefile | 1,006,022 |
| PHP | 992,617 |
| Properties File | 909,631 |
| SVG | 804,946 |
| C | 791,773 |
| C++ | 715,269 |
| Batch | 645,442 |
| Sass | 535,341 |
| Autoconf | 505,347 |
| Objective C | 503,932 |
| CoffeeScript | 435,133 |
| SQL | 413,739 |
| Perl | 390,775 |
| C# | 380,841 |
| ReStructuredText | 356,922 |
| MSBuild | 354,212 |
| LESS | 281,286 |
| CSV | 275,143 |
| C++ Header | 199,245 |
| CMake | 173,482 |
| Patch | 169,078 |
| Assembly | 165,587 |
| XML Schema | 148,511 |
| m4 | 147,204 |
| JavaServer Pages | 142,605 |
| Vim Script | 134,156 |
| Scala | 132,454 |
| Objective C++ | 127,797 |
| Gradle | 126,899 |
| Module-Definition | 120,181 |
| Bazel | 114,842 |
| R | 113,770 |
| ASP.NET | 111,431 |
| Go Template | 111,263 |
| Document Type Definition | 109,710 |
| Gherkin Specification | 107,187 |
| Smarty Template | 106,668 |
| Jade | 105,903 |
| Happy | 105,631 |
| Emacs Lisp | 105,620 |
| Prolog | 102,792 |
| Go | 99,093 |
| Lua | 98,232 |
| BASH | 95,931 |
| D | 94,400 |
| ActionScript | 93,066 |
| TeX | 84,841 |
| Powershell | 80,347 |
| AWK | 79,870 |
| Groovy | 75,796 |
| LEX | 75,335 |
| nuspec | 72,478 |
| sed | 70,454 |
| Puppet | 67,732 |
| Org | 67,703 |
| Clojure | 67,145 |
| XAML | 65,135 |
| TypeScript | 62,556 |
| Systemd | 58,197 |
| Haskell | 58,162 |
| XCode Config | 57,173 |
| Boo | 55,318 |
| LaTeX | 55,093 |
| Zsh | 55,044 |
| Stylus | 54,412 |
| Razor | 54,102 |
| Handlebars | 51,893 |
| Erlang | 49,475 |
| HEX | 46,442 |
| Protocol Buffers | 45,254 |
| Mustache | 44,633 |
| ASP | 43,114 |
| Extensible Stylesheet Language Transformations | 42,664 |
| Twig Template | 42,273 |
| Processing | 41,277 |
| Dockerfile | 39,664 |
| Swig | 37,539 |
| LD Script | 36,307 |
| FORTRAN Legacy | 35,889 |
| Scons | 35,373 |
| Scheme | 34,982 |
| Alex | 34,221 |
| TCL | 33,766 |
| Android Interface Definition Language | 33,000 |
| Ruby HTML | 32,645 |
| Device Tree | 31,918 |
| Expect | 30,249 |
| Cabal | 30,109 |
| Unreal Script | 29,113 |
| Pascal | 28,439 |
| GLSL | 28,417 |
| Intel HEX | 27,504 |
| Alloy | 27,142 |
| Freemarker Template | 26,456 |
| IDL | 26,079 |
| Visual Basic for Applications | 26,061 |
| Macromedia eXtensible Markup Language | 24,949 |
| F# | 24,373 |
| Cython | 23,858 |
| Jupyter | 23,577 |
| Forth | 22,108 |
| Visual Basic | 21,909 |
| Lisp | 21,242 |
| OCaml | 20,216 |
| Rust | 19,286 |
| Fish | 18,079 |
| Monkey C | 17,753 |
| Ada | 17,253 |
| SAS | 17,031 |
| Dart | 16,447 |
| TypeScript Typings | 16,263 |
| SystemVerilog | 15,541 |
| Thrift | 15,390 |
| C Shell | 14,904 |
| Fragment Shader File | 14,572 |
| Vertex Shader File | 14,312 |
| QML | 13,709 |
| ColdFusion | 13,441 |
| Elixir | 12,716 |
| Haxe | 12,404 |
| Jinja | 12,274 |
| JSX | 12,194 |
| Specman e | 12,071 |
| FORTRAN Modern | 11,460 |
| PKGBUILD | 11,398 |
| ignore | 11,287 |
| Mako | 10,846 |
| TOML | 10,444 |
| SKILL | 10,048 |
| AsciiDoc | 9,868 |
| Swift | 9,679 |
| BuildStream | 9,198 |
| ColdFusion CFScript | 8,614 |
| Stata | 8,296 |
| Creole | 8,030 |
| Basic | 7,751 |
| V | 7,560 |
| VHDL | 7,368 |
| Julia | 7,070 |
| ClojureScript | 7,018 |
| Closure Template | 6,269 |
| AutoHotKey | 5,938 |
| Wolfram | 5,764 |
| Docker ignore | 5,555 |
| Korn Shell | 5,541 |
| Arvo | 5,364 |
| Coq | 5,068 |
| SRecode Template | 5,019 |
| Game Maker Language | 4,557 |
| Nix | 4,216 |
| Vala | 4,110 |
| COBOL | 3,946 |
| Varnish Configuration | 3,882 |
| Kotlin | 3,683 |
| Bitbake | 3,645 |
| GDScript | 3,189 |
| Standard ML (SML) | 3,143 |
| Jenkins Buildfile | 2,822 |
| Xtend | 2,791 |
| ABAP | 2,381 |
| Modula3 | 2,376 |
| Nim | 2,273 |
| Verilog | 2,013 |
| Elm | 1,849 |
| Brainfuck | 1,794 |
| Ur/Web | 1,741 |
| Opalang | 1,367 |
| GN | 1,342 |
| TaskPaper | 1,330 |
| Ceylon | 1,265 |
| Crystal | 1,259 |
| Agda | 1,182 |
| Vue | 1,139 |
| LOLCODE | 1,101 |
| Hamlet | 1,071 |
| Robot Framework | 1,062 |
| MUMPS | 940 |
| Emacs Dev Env | 937 |
| Cargo Lock | 905 |
| Flow9 | 839 |
| Idris | 804 |
| Julius | 765 |
| Oz | 764 |
| Q# | 695 |
| Lucius | 627 |
| Meson | 617 |
| F* | 614 |
| ATS | 492 |
| PSL Assertion | 483 |
| Bitbucket Pipeline | 418 |
| PureScript | 370 |
| Report Definition Language | 313 |
| Isabelle | 296 |
| JAI | 286 |
| MQL4 | 271 |
| Ur/Web Project | 261 |
| Alchemist | 250 |
| Cassius | 213 |
| Softbridge Basic | 207 |
| MQL Header | 167 |
| JSONL | 146 |
| Lean | 104 |
| Spice Netlist | 100 |
| Madlang | 97 |
| Luna | 91 |
| Pony | 86 |
| MQL5 | 46 |
| Wren | 33 |
| Just | 30 |
| QCL | 27 |
| Zig | 21 |
| SPDX | 20 |
| Futhark | 16 |
| Dhall | 15 |
| FIDL | 14 |
| Bosque | 14 |
| Janet | 13 |
| Game Maker Project | 6 |
| Polly | 6 |
| Verilog Args File | 2

### How many files in a repository per language?

An extension of the above, but averaged over however many files are in each language. So of projects that contain java how many java files exist in that project, and on average what does that work out to be?


### How many lines of code are in a typical file per language?

I suppose you could also look at this as what languages on average have the largest files? However to avoid that I have sorted by name because its not a content. Using the average/mean for this pushes the results out to stupidly high numbers. This is because things like sqlite.c for example is joined to make a single file, but nobody ever works on that single large file (I hope!).

So I tried this out using the median value and there are still some definitions with stupidly high numbers such as Bosque and JavaScript. 

So why not have both? I modified the average value as a comparison but with it ignoring files over 5000 lines and included it and the median.

[skip table to next](#what-are-the-most-common-filenames)

| language | mean < 5000 | median |
| -------- | ----------- | ------ |
| ABAP | 139 | 36 |
| ASP | 513 | 170 |
| ASP.NET | 315 | 148 |
| ATS | 945 | 1,411 |
| AWK | 431 | 774 |
| ActionScript | 950 | 2,676 |
| Ada | 1,179 | 13 |
| Agda | 466 | 89 |
| Alchemist | 1,040 | 1,463 |
| Alex | 479 | 204 |
| Alloy | 72 | 66 |
| Android Interface Definition Language | 119 | 190 |
| Arvo | 257 | 1,508 |
| AsciiDoc | 519 | 1,724 |
| Assembly | 993 | 225 |
| AutoHotKey | 360 | 23 |
| Autoconf | 495 | 144 |
| BASH | 425 | 26 |
| Basic | 476 | 847 |
| Batch | 178 | 208 |
| Bazel | 226 | 20 |
| Bitbake | 436 | 10 |
| Bitbucket Pipeline | 19 | 13 |
| Boo | 898 | 924 |
| Bosque | 58 | 199,238 |
| Brainfuck | 141 | 177 |
| BuildStream | 1,955 | 2,384 |
| C | 1,052 | 5,774 |
| C Header | 869 | 126,460 |
| C Shell | 128 | 77 |
| C# | 1,215 | 1,138 |
| C++ | 1,166 | 232 |
| C++ Header | 838 | 125 |
| CMake | 750 | 15 |
| COBOL | 422 | 24 |
| CSS | 729 | 103 |
| CSV | 411 | 12 |
| Cabal | 116 | 13 |
| Cargo Lock | 814 | 686 |
| Cassius | 124 | 634 |
| Ceylon | 207 | 15 |
| Clojure | 521 | 19 |
| ClojureScript | 504 | 195 |
| Closure Template | 343 | 75 |
| CoffeeScript | 342 | 168 |
| ColdFusion | 686 | 5 |
| ColdFusion CFScript | 1,231 | 1,829 |
| Coq | 560 | 29,250 |
| Creole | 85 | 20 |
| Crystal | 973 | 119 |
| Cython | 853 | 1,738 |
| D | 397 | 10 |
| Dart | 583 | 500 |
| Device Tree | 739 | 44,002 |
| Dhall | 124 | 99 |
| Docker ignore | 10 | 2 |
| Dockerfile | 76 | 17 |
| Document Type Definition | 522 | 1,202 |
| Elixir | 402 | 192 |
| Elm | 438 | 121 |
| Emacs Dev Env | 646 | 755 |
| Emacs Lisp | 653 | 15 |
| Erlang | 930 | 203 |
| Expect | 419 | 195 |
| Extensible Stylesheet Language Transformations | 442 | 600 |
| F# | 384 | 64 |
| F* | 335 | 65 |
| FIDL | 655 | 1,502 |
| FORTRAN Legacy | 277 | 1,925 |
| FORTRAN Modern | 636 | 244 |
| Fish | 168 | 74 |
| Flow9 | 368 | 32 |
| Forth | 256 | 62 |
| Fragment Shader File | 309 | 11 |
| Freemarker Template | 522 | 20 |
| Futhark | 175 | 257 |
| GDScript | 401 | 1 |
| GLSL | 380 | 29 |
| GN | 950 | 8,866 |
| Game Maker Language | 710 | 516 |
| Game Maker Project | 1,290 | 374 |
| Gherkin Specification | 516 | 2,386 |
| Go | 780 | 558 |
| Go Template | 411 | 25,342 |
| Gradle | 228 | 22 |
| Groovy | 734 | 13 |
| HEX | 1,002 | 17,208 |
| HTML | 556 | 1,814 |
| Hamlet | 220 | 70 |
| Handlebars | 506 | 3,162 |
| Happy | 1,617 | 0 |
| Haskell | 656 | 17 |
| Haxe | 865 | 9,607 |
| IDL | 386 | 210 |
| Idris | 285 | 42 |
| Intel HEX | 1,256 | 106,650 |
| Isabelle | 792 | 1,736 |
| JAI | 268 | 41 |
| JSON | 289 | 39 |
| JSONL | 43 | 2 |
| JSX | 393 | 24 |
| Jade | 299 | 192 |
| Janet | 508 | 32 |
| Java | 1,165 | 697 |
| JavaScript | 894 | 73,979 |
| JavaServer Pages | 644 | 924 |
| Jenkins Buildfile | 79 | 6 |
| Jinja | 465 | 3,914 |
| Julia | 539 | 1,031 |
| Julius | 113 | 12 |
| Jupyter | 1,361 | 688 |
| Just | 62 | 72 |
| Korn Shell | 427 | 776 |
| Kotlin | 554 | 169 |
| LD Script | 521 | 439 |
| LESS | 1,086 | 17 |
| LEX | 1,014 | 214 |
| LOLCODE | 129 | 4 |
| LaTeX | 895 | 7,482 |
| Lean | 181 | 9 |
| License | 266 | 20 |
| Lisp | 746 | 1,201 |
| Lua | 820 | 559 |
| Lucius | 284 | 445 |
| Luna | 85 | 48 |
| MQL Header | 793 | 10,337 |
| MQL4 | 799 | 3,168 |
| MQL5 | 384 | 631 |
| MSBuild | 558 | 160 |
| MUMPS | 924 | 98,191 |
| Macromedia eXtensible Markup Language | 500 | 20 |
| Madlang | 368 | 340 |
| Makefile | 309 | 20 |
| Mako | 269 | 243 |
| Markdown | 206 | 10 |
| Meson | 546 | 205 |
| Modula3 | 162 | 17 |
| Module-Definition | 489 | 7 |
| Monkey C | 140 | 28 |
| Mustache | 298 | 8,083 |
| Nim | 352 | 3 |
| Nix | 240 | 78 |
| OCaml | 718 | 68 |
| Objective C | 1,111 | 17,103 |
| Objective C++ | 903 | 244 |
| Opalang | 151 | 29 |
| Org | 523 | 24 |
| Oz | 360 | 7,132 |
| PHP | 964 | 14,660 |
| PKGBUILD | 131 | 19 |
| PSL Assertion | 149 | 108 |
| Pascal | 1,044 | 497 |
| Patch | 676 | 12 |
| Perl | 762 | 11 |
| Plain Text | 352 | 841 |
| Polly | 12 | 26 |
| Pony | 338 | 42,488 |
| Powershell | 652 | 199 |
| Processing | 800 | 903 |
| Prolog | 282 | 6 |
| Properties File | 184 | 18 |
| Protocol Buffers | 576 | 8,080 |
| Puppet | 499 | 660 |
| PureScript | 598 | 363 |
| Python | 879 | 258 |
| Q# | 475 | 5,417 |
| QCL | 548 | 3 |
| QML | 815 | 6,067 |
| R | 566 | 20 |
| Rakefile | 122 | 7 |
| Razor | 713 | 1,842 |
| ReStructuredText | 735 | 5,049 |
| Report Definition Language | 1,389 | 34,337 |
| Robot Framework | 292 | 115 |
| Ruby | 739 | 4,942 |
| Ruby HTML | 326 | 192 |
| Rust | 1,007 | 4 |
| SAS | 233 | 65 |
| SKILL | 526 | 123 |
| SPDX | 1,242 | 379 |
| SQL | 466 | 143 |
| SRecode Template | 796 | 534 |
| SVG | 796 | 1,538 |
| Sass | 682 | 14,653 |
| Scala | 612 | 661 |
| Scheme | 566 | 6 |
| Scons | 545 | 6,042 |
| Shell | 304 | 4 |
| Smarty Template | 392 | 15 |
| Softbridge Basic | 2,067 | 3 |
| Specman e | 127 | 0 |
| Spice Netlist | 906 | 1,465 |
| Standard ML (SML) | 478 | 75 |
| Stata | 200 | 12 |
| Stylus | 505 | 214 |
| Swift | 683 | 663 |
| Swig | 1,031 | 4,540 |
| SystemVerilog | 563 | 830 |
| Systemd | 127 | 26 |
| TCL | 774 | 42,396 |
| TOML | 100 | 17 |
| TaskPaper | 37 | 7 |
| TeX | 804 | 905 |
| Thrift | 545 | 329 |
| Twig Template | 713 | 9,907 |
| TypeScript | 461 | 10 |
| TypeScript Typings | 1,465 | 236,866 |
| Unreal Script | 795 | 927 |
| Ur/Web | 429 | 848 |
| Ur/Web Project | 33 | 26 |
| V | 704 | 5,711 |
| VHDL | 952 | 1,452 |
| Vala | 603 | 2 |
| Varnish Configuration | 203 | 77 |
| Verilog | 198 | 2 |
| Verilog Args File | 456 | 481 |
| Vertex Shader File | 168 | 74 |
| Vim Script | 555 | 25 |
| Visual Basic | 738 | 1,050 |
| Visual Basic for Applications | 979 | 936 |
| Vue | 732 | 242 |
| Wolfram | 940 | 973 |
| Wren | 358 | 279,258 |
| XAML | 703 | 24 |
| XCode Config | 200 | 11 |
| XML | 605 | 1,033 |
| XML Schema | 1,008 | 248 |
| Xtend | 710 | 120 |
| YAML | 165 | 47,327 |
| Zig | 188 | 724 |
| Zsh | 300 | 9 |
| gitignore | 33 | 3 |
| ignore | 6 | 2 |
| m4 | 959 | 807 |
| nuspec | 187 | 193 |
| sed | 82 | 33 |

### What are the most common filenames?

What filenames are most common across all code-bases ignoring extension and case?

Had you asked me before I started this I would have said, README, main, index, license. Thankfully the results reflect my thoughts pretty well. Although there are a lot of interesting ones in there. I have no idea why so many projects contain a file called `15` or `s15`. 

The makefile being the most common surprised me a little, but then I remembered that it is used a lot in many new JavaScript projects, and with that being among the most common projects makes a lot of sense. That said it still seems that jQuery is king and reports of its death are greatly exaggerated.

| file-name | count |
| -------- | ----- |
| makefile | 59,141,098 |
| index | 33,962,093 |
| readme | 22,964,539 |
| jquery | 20,015,171 |
| main | 12,308,009 |
| package | 10,975,828 |
| license | 10,441,647 |
| \__init__ | 10,193,245 |
| strings | 8,414,494 |
| android | 7,915,225 |
| config | 7,391,812 |
| default | 5,563,255 |
| build | 5,510,598 |
| setup | 5,291,751 |
| test | 5,282,106 |
| irq | 4,914,052 |
| 15 | 4,295,032 |
| country | 4,274,451 |
| pom | 4,054,543 |
| io | 3,642,747 |
| system | 3,629,821 |
| common | 3,629,698 |
| gpio | 3,622,587 |
| core | 3,571,098 |
| module | 3,549,789 |
| init | 3,378,919 |
| dma | 3,301,536 |
| bootstrap | 3,162,859 |
| application | 3,000,210 |
| time | 2,928,715 |
| cmakelists | 2,907,539 |
| plugin | 2,881,206 |
| base | 2,805,340 |
| s15 | 2,733,747 |
| androidmanifest | 2,727,041 |
| cache | 2,695,345 |
| debug | 2,687,902 |
| file | 2,629,406 |
| app | 2,588,208 |
| version | 2,580,288 |
| assemblyinfo | 2,485,708 |
| exception | 2,471,403 |
| project | 2,432,361 |
| util | 2,412,138 |
| user | 2,343,408 |
| clock | 2,283,091 |
| timex | 2,280,225 |
| pci | 2,231,228 |
| style | 2,226,920 |
| styles | 2,212,127 |

Note that due to memory constraints I had to make this process slightly lossy. Every 100 projects checked I would check the map and if an identified filename had < 10 counts it was dropped from the list. It could come back for the next run and if there was > 10 at this point it would remain. It shouldn't happen that often but it is possible the counts may be out by some amount if some common name appeared sparsely in the first batch of repositories before becoming common. In short they are not absolute numbers but should be close enough.

I could have used a trie structure to "compress" the space and gotten absolute numbers for this, but I didn't feel like writing one and just abused the map slightly to save memory and achieve my goal. I am however curious enough to try this out at a later date to see how much compression we can get out of it.

### Whats the average size of those index pages?

We know that the most common filenames, but what about knowing whats the average size of them? Annoyingly this meant running the above first and then taking the output and reprocessing.

### How many repositories appear to be missing a license?

This is an interesting one. Which repositories have an explicit license file somewhere? Note that the lack of a license file does not mean that the project has none, as it might exist within the README or be indicated through SPDX comment tags in-line.

Sadly it appears that the vast majority of repositories are missing a license. I would argue that all software should have a license for a variety of reasons but here is [someone elses take](https://www.infoworld.com/article/2839560/sticking-a-license-on-everything.html) on that.

| has license | count |
| ----------- | ----- |
| no | 6,502,753 |
| yes | 2,597,330 |

![scc-data license count](/static/an-informal-survey/hasLicense.png#center)

### Which languages have the most comments?

To make this fair this is averaged over each file as a percentage of comments.

### How many projects use multiple .gitignore files?

Some may not know this but it is possible to have multiple .gitignore files in a git project. Given that fact how many projects use multiple .gitignore files? While we are looking how many have none?

// **TODO** this is totally wrong, redo

What I did find that was interesting was one project that has 25,794 .gitignore files in its repository. The next highest was 2,547. I have no idea what is going on there.

Bringing this back to something sensible here is a plot of the data up to 20 .gitignore files and close to 99% of the total result.

![scc-data process load](/static/an-informal-survey/gitignorePerProject.png#center)

This was really not what I expected. I would have guessed most projects had either 0 or 1 .gitignore files. However it seems more likely to be around 4. Even more surprising to me was how many have considerably more than 1.

### Which language developers have the biggest potty mouth?

This is less than an exact science. Picking up cursing/swearing or offensive terms using filenames is never going to be effective. If you do a simple string contains test you pick up all sorts or normal files such as `assemble.sh` and such. So to produce the following I pulled a list of curse words, then checked if any files in each project start with one of those values followed by a period. This would mean a file named `gangbang.java` would be picked up while `assemble.sh` would not. 

The list I used contained some leet speak such as `b00bs` and `b1tch` to try and catch out the most interesting cases. The full list is [here](/static/an-informal-survey/curse.txt). 

While not accurate at all as it misses all manner of things it is incredibly fun to see what this produces. So lets start with a list of which languages have the most curse words.

| language | filename curse count |
| -------- | ----------- |
| C Header | 7,660 |
| Java | 7,023 |
| C | 6,897 |
| PHP | 5,713 |
| JavaScript | 4,306 |
| HTML | 3,560 |
| Ruby | 3,121 |
| JSON | 1,598 |
| C++ | 1,543 |
| Dart | 1,533 |
| Rust | 1,504 |
| Go Template | 1,500 |
| SVG | 1,234 |
| XML | 1,212 |
| Python | 1,092 |
| JavaServer Pages | 1,037 |

Interesting! Those naughty C developers! However we should probably weight this against how much code exists. Which produces the following,

// TODO ADD WEIGHTED BY LANGUAGE COUNT HERE

However what I really want to know is what are the most commonly used curse words. Lets see collectively how dirty a mind we have. A few of the top ones I could see being legitimate names, but the majority would certainly produce few comments in a PR if not a raised eyebrow.

| word | count |
| ---- | ----- |
| ass | 11,358 |
| knob | 10,368 |
| balls | 8,001 |
| xxx | 7,205
| sex | 5,021 |
| nob | 3,385 |
| pawn | 2,919 |
| hell | 2,819 |
| crap | 1,112 |
| anal | 950 |
| snatch | 885 |
| fuck | 572 |
| poop | 510 |
| cox | 476 |
| shit | 383 |
| lust | 367 |
| butt | 265 |
| bum | 151 |
| bugger | 132 |
| pron | 121 |
| cum | 118 |
| cok | 112 |
| damn | 105 |

Note that some of the more offensive words in the list did have matching filenames which I find rather shocking considering what they were. I am hoping that those files only exist for testing allow/deny lists and the like.

### Longest files in lines per language

As you would probably expect Plain Text, SQL, XML, JSON and CSV take the top positions of this one, seeing as they usually contain meta-data, database dumps and the like.

Limited to 40 because at some point there is only a hello world example or such available and the result is not very interesting. It is not surprising to see that someone has checked in `sqlite3.c` somewhere but I would be a little worried about that 3,064,594 line Python file and that 1,997,637 line TypeScript monster.

**NB** Some of the links below MAY not translate 100% due to throwing away some information when I created the files. Most should work, but a few you may need to mangle the URL to resolve.

[skip table to next](#whats-the-largest-file-for-each-language)

| language | filename | lines |
| -------- | -------- | ----- |
| JSON | <a href="https://bitbucket.com/_thc_/bcc-40/src/master/base/model.json">model.json</a> | 11313134 |
| Sass | <a href="https://bitbucket.com/abegarcia/lifyember/src/master/node_modules/node-sass/libsass/sass-spec/spec/benchmarks/large_empty.scss">large_empty.scss</a> | 10000000 |
| CSV | <a href="https://bitbucket.com/abduljehangir/ecse499/src/master/sp500data/code_and_processed_data/fundamentals/return_data_sp500.csv">return_data_sp500.csv</a> | 6486577 |
| Plain Text | <a href="https://bitbucket.com/abdullah38rcc/bci-virtual-keyboard/src/master/binspell/shuffle_alternate/bgramPickle.txt">bgramPickle.txt</a> | 5264667 |
| SQL | <a href="https://bitbucket.com/a--i/osmp/src/master/server/osmp-database-hsqldb/src/main/resources/db/migration/V1_08.12.2014.13.44__T_ADDRESS_DATA.sql">V1_08.12.2014.13.44__T_ADDRESS_DATA.sql</a> | 914442 |
| XML | <a href="https://bitbucket.com/adakoda/android_403_gnexus_frameworks_base/src/master/api/13.xml">13.xml</a> | 463337 |
| SVG | <a href="https://bitbucket.com/abdelba/mattlink/src/master/extras/design/uses-cases/membres-publications.svg">membres-publications.svg</a> | 444080 |
| C Header | <a href="https://bitbucket.com/abhisit/firefly-rk3288-kernel/src/master/drivers/media/rkdtv/DIBCom1009XH-IN3362/Firmware/firmware_nautilus_2_0-3006x_nscd.h">firmware_nautilus_2_0-3006x_nscd.h</a> | 417297 |
| JavaScript | <a href="https://bitbucket.com/53454e4f4a/nashorn-engine/src/master/Octane Benchmarks/mandreel.js">mandreel.js</a> | 277403 |
| C | <a href="https://bitbucket.com/-elmer-/plinkseq/src/master/R/Rplinkseq/src/sqlite3.c">sqlite3.c</a> | 141343 |
| PHP | <a href="https://bitbucket.com/______moizl________/bol-leaks/src/master/Player/Players.php">Players.php</a> | 131168 |
| Java | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/gen-java/org/hypertable/thriftgen/ClientService.java">ClientService.java</a> | 121051 |
| HTML | <a href="https://bitbucket.com/_ariel/chat/src/master/node_modules/socket.io/node_modules/socket.io-client/node_modules/active-x-obfuscator/node_modules/zeparser/benchmark.html">benchmark.html</a> | 111608 |
| Patch | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/openswan/patches/kernel/2.6.16/klips.patch">klips.patch</a> | 111156 |
| Perl | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/perl/lib/Locale/Codes/Language_Codes.pm">Language_Codes.pm</a> | 97190 |
| Assembly | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.S">CIDE.S</a> | 94241 |
| Prolog | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.P">CIDE.P</a> | 68311 |
| C++ | <a href="https://bitbucket.com/aaalexx/gamejam2013/src/master/cocos2d-x-2.1.5/scripting/lua/cocos2dx_support/LuaCocos2d.cpp">LuaCocos2d.cpp</a> | 67887 |
| Autoconf | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/Makefile.in">Makefile.in</a> | 52450 |
| D | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.D">CIDE.D</a> | 52353 |
| Objective C | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.M">CIDE.M</a> | 44283 |
| R | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.R">CIDE.R</a> | 40155 |
| Swig | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.I">CIDE.I</a> | 37382 |
| FORTRAN Legacy | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.F">CIDE.F</a> | 36476 |
| Specman e | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.E">CIDE.E</a> | 34043 |
| LEX | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.L">CIDE.L</a> | 28886 |
| HEX | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/uts/common/io/ipw/fw-ipw2100/ipw2100-1.3.fw.hex">ipw2100-1.3.fw.hex</a> | 26149 |
| Python | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/py/ThriftClient/gen-py/hyperthrift/gen/ClientService.py">ClientService.py</a> | 25602 |
| C# | <a href="https://bitbucket.com/45north/cx-developer-tutorials/src/master/Defect POC/SOAP.Account.PasswordReset/SOAP.Account.PasswordReset/Service References/RNT.SOAP/Reference.cs">Reference.cs</a> | 23985 |
| CSS | <a href="https://bitbucket.com/12110201/12110201/src/master/webit/webit/Content/xenon.css">xenon.css</a> | 22560 |
| Lua | <a href="https://bitbucket.com/420munk/pd2_lua/src/master/lib/tweak_data/weaponfactorytweakdata.lua">weaponfactorytweakdata.lua</a> | 21229 |
| TeX | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/docs/xen-api/xenapi-datamodel.tex">xenapi-datamodel.tex</a> | 20245 |
| LaTeX | <a href="https://bitbucket.com/40123204/40123204bitbucket/src/master/cdwp/tex_by_topic/TeXbyTopic.tex">TeXbyTopic.tex</a> | 19093 |
| Intel HEX | <a href="https://bitbucket.com/ace0/linux-restore-support/src/master/firmware/bnx2x/bnx2x-e2-7.2.51.0.fw.ihex">bnx2x-e2-7.2.51.0.fw.ihex</a> | 18459 |
| Ruby | <a href="https://bitbucket.com/aalmacin/rails-learning/src/master/blog/path/ruby/2.0.0/gems/rdoc-4.1.2/lib/rdoc/markdown.rb">markdown.rb</a> | 15961 |
| Happy | <a href="https://bitbucket.com/acclivitynyc/postgresql/src/master/src/backend/parser/gram.y">gram.y</a> | 14004 |
| SystemVerilog | <a href="https://bitbucket.com/act-lab/axbench_old/src/master/hardware/circuits/inversek/rtl/multiplier_32b.v">multiplier_32b.v</a> | 13932 |
| Emacs Lisp | <a href="https://bitbucket.com/4ourbit/prefs/src/master/.emacs.d/emacs-goodies-el/color-theme-library.el">color-theme-library.el</a> | 13539 |
| ASP.NET | <a href="https://bitbucket.com/abhi8600/demo/src/master/SourceAdmin/.wsdl/general/AdminService_14.asmx">AdminService_14.asmx</a> | 13234 |
| Batch | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/perl/bin/cpanm.bat">cpanm.bat</a> | 12633 |
| Shell | <a href="https://bitbucket.com/1120436joaopacheco/irudroid-technologies-lapr5/src/master/WalkMaze/lib/freetype-2.5.5/builds/unix/ltmain.sh">ltmain.sh</a> | 11030 |
| m4 | <a href="https://bitbucket.com/2ion/libqueue/src/master/aclocal.m4">aclocal.m4</a> | 10027 |
| Makefile | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/snort/src/win32/WIN32-Prj/snort.mak">snort.mak</a> | 9996 |
| Vim Script | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/autoload/netrw.vim">netrw.vim</a> | 9858 |
| ActionScript | <a href="https://bitbucket.com/abhi8600/demo/src/master/AnyChart/Original/AnyChartSource_6_0_11/build/utils/flex/frameworks/projects/framework/src/mx/controls/listClasses/ListBase.as">ListBase.as</a> | 9397 |
| gitignore | <a href="https://bitbucket.com/a3217055/illumos-joyent/src/master/.gitignore">.gitignore</a> | 9066 |
| TypeScript | <a href="https://bitbucket.com/abex/abex-mumble/src/master/src/mumble/mumble_de.ts">mumble_de.ts</a> | 9013 |
| VHDL | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/bundle/ctags58/Test/test.vhd">test.vhd</a> | 8174 |
| Boo | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/grub/grub-0.97/docs/texinfo.tex">texinfo.tex</a> | 7086 |
| Go Template | <a href="https://bitbucket.com/accelecon/linux-uclinux-dist/src/master/Documentation/DocBook/writing-an-alsa-driver.tmpl">writing-an-alsa-driver.tmpl</a> | 6229 |
| C++ Header | <a href="https://bitbucket.com/achase55/gba4ios/src/master/emu-ex-plus-alpha/imagine/bundle/darwin-iOS/include/boost/phoenix/bind/preprocessed/bind_member_function_50.hpp">bind_member_function_50.hpp</a> | 6033 |
| Jupyter | <a href="https://bitbucket.com/aabtzu/mlnfl/src/master/mlnfl-nfl2.ipynb">mlnfl-nfl2.ipynb</a> | 5819 |
| Markdown | <a href="https://bitbucket.com/abhayagiri/reflections/src/master/manuscripts/markdown/vol2-talks.md">vol2-talks.md</a> | 5520 |
| ReStructuredText | <a href="https://bitbucket.com/50onred/sqlalchemy/src/master/doc/build/changelog/changelog_06.rst">changelog_06.rst</a> | 5412 |
| Visual Basic for Applications | <a href="https://bitbucket.com/2014vleadinterns/amulya/src/master/Eucalyptus/paper/IEEEtran.cls">IEEEtran.cls</a> | 4929 |
| MSBuild | <a href="https://bitbucket.com/0908nooaey/becit-traning/src/master/Template.Metronic/Template.Metronic.csproj">Template.Metronic.csproj</a> | 4882 |
| Alex | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/gdb/ChangeLog-3.x">ChangeLog-3.x</a> | 4838 |
| Forth | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/apache/manual/mod/core.html.fr">core.html.fr</a> | 4803 |
| YAML | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/aws-sdk-1.28.1/lib/aws/api_config/EC2-2013-10-01.yml">EC2-2013-10-01.yml</a> | 4710 |
| TCL | <a href="https://bitbucket.com/achyutreddy24/abdevweb/src/master/dist/tcl/tcl8.6/clock.tcl">clock.tcl</a> | 4573 |
| Pascal | <a href="https://bitbucket.com/5665tm/mytools/src/master/ConEmuFar/PluginSDK/Headers.pas/PluginW.pas">PluginW.pas</a> | 4347 |
| Document Type Definition | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/solbookv2/solbook.dtd">solbook.dtd</a> | 4296 |
| Visual Basic | <a href="https://bitbucket.com/acrotech/dotspatialpcl/src/master/Trunk/DotSpatial.Plugins.Taudem.Port/frmAutomatic_v3.vb">frmAutomatic_v3.vb</a> | 4294 |
| Coq | <a href="https://bitbucket.com/abrzoska/bachelortheory/src/master/redsvd/svd.V">svd.V</a> | 4260 |
| Macromedia eXtensible Markup Language | <a href="https://bitbucket.com/abhi8600/demo/src/master/SourceAdmin/src/RealtimeAdmin.mxml">RealtimeAdmin.mxml</a> | 4057 |
| LESS | <a href="https://bitbucket.com/10chars/wordpress-application-angular/src/master/node_modules/gulp-less/node_modules/less/benchmark/benchmark.less">benchmark.less</a> | 3979 |
| Properties File | <a href="https://bitbucket.com/acgt/bitmate/src/master/azureus2/src/org/gudy/azureus2/internat/MessagesBundle.properties">MessagesBundle.properties</a> | 3878 |
| Lisp | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/clojure/lib/slime/swank.lisp">swank.lisp</a> | 3863 |
| CMake | <a href="https://bitbucket.com/02jandal/multilaunch/src/master/cmake/cotire.cmake">cotire.cmake</a> | 3626 |
| COBOL | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.cob">example.cob</a> | 3556 |
| TypeScript Typings | <a href="https://bitbucket.com/12110201/12110201/src/master/webit/webit/Scripts/devexpress-web-14.1/ts/dx.all.d.ts">dx.all.d.ts</a> | 3137 |
| Objective C++ | <a href="https://bitbucket.com/achase55/gba4ios/src/master/GBA4iOS/GBAEmulationViewController.mm">GBAEmulationViewController.mm</a> | 2849 |
| BASH | <a href="https://bitbucket.com/a_alfredo/vagrant-instance/src/master/modules/development/files/home/git-completion.bash">git-completion.bash</a> | 2826 |
| Expect | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/libkrb5/tests/dejagnu/config/default.exp">default.exp</a> | 2817 |
| Device Tree | <a href="https://bitbucket.com/abhisit/firefly-rk3288-kernel/src/master/arch/arm/boot/dts/rk3288-clocks.dtsi">rk3288-clocks.dtsi</a> | 2781 |
| XML Schema | <a href="https://bitbucket.com/aburias/moolahsense/src/master/MoolahConnectnew/NLog.xsd">NLog.xsd</a> | 2657 |
| BuildStream | <a href="https://bitbucket.com/adam_0/300/src/master/IEEEannot.bst">IEEEannot.bst</a> | 2626 |
| Haxe | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/tools/qemu-xen/qemu-options.hx">qemu-options.hx</a> | 2604 |
| Mustache | <a href="https://bitbucket.com/4lejandrito/cv-bootstrap/src/master/docs/templates/pages/components.mustache">components.mustache</a> | 2505 |
| Groovy | <a href="https://bitbucket.com/4s/ot-70-opentele-server/src/master/grails-app/migrations/1_0_baseline.groovy">1_0_baseline.groovy</a> | 2351 |
| Scheme | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/programming/lib/slime-2013-04-05/contrib/swank-kawa.scm">swank-kawa.scm</a> | 2342 |
| Module-Definition | <a href="https://bitbucket.com/_1126/humble/src/master/tufte-common.def">tufte-common.def</a> | 1872 |
| XAML | <a href="https://bitbucket.com/achadee/graphics-project/src/master/obj/Debug/Common/StandardStyles.xaml">StandardStyles.xaml</a> | 1830 |
| Org | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/microwin/src/engine/devdraw.org">devdraw.org</a> | 1748 |
| Smarty Template | <a href="https://bitbucket.com/adam_onodi/uclinux-lpcboard/src/master/user/gdb/Makefile.tpl">Makefile.tpl</a> | 1730 |
| Stata | <a href="https://bitbucket.com/0532/google-hosts/src/master/scripts/hosts.do">hosts.do</a> | 1485 |
| AWK | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/mysql/bdb/dist/gen_rpc.awk">gen_rpc.awk</a> | 1482 |
| Thrift | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/cc/ThriftBroker/Client.thrift">Client.thrift</a> | 1362 |
| Razor | <a href="https://bitbucket.com/aburias/moolahsense/src/master/MoolahConnectnew/Views/Admin/_UserVerification.cshtml">_UserVerification.cshtml</a> | 1339 |
| Processing | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/realtime/src/acquisition/openbci/java/src/OpenBCI_GUI.pde">OpenBCI_GUI.pde</a> | 1327 |
| F* | <a href="https://bitbucket.com/achyutreddy24/abdevweb/src/master/IMGT-Human_IGHV+IGKV+IGLV_F+ORF_AA.fst">IMGT-Human_IGHV+IGKV+IGLV_F+ORF_AA.fst</a> | 1325 |
| Korn Shell | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/itutools/itu.ksh">itu.ksh</a> | 1245 |
| OCaml | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/format.ml">format.ml</a> | 1213 |
| Powershell | <a href="https://bitbucket.com/1110245danielagrams/arqsi2/src/master/IDEIMusic/packages/EntityFramework.6.1.1/tools/EntityFramework.psm1">EntityFramework.psm1</a> | 1168 |
| CoffeeScript | <a href="https://bitbucket.com/adamfallon/4chan-x/src/master/src/Posting/QR.coffee">QR.coffee</a> | 1162 |
| Ada | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/ncurses/ncurses-5.7/Ada95/src/terminal_interface-curses-forms.adb">terminal_interface-curses-forms.adb</a> | 1161 |
| Scala | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/ser/scripts/sc">sc</a> | 1097 |
| Stylus | <a href="https://bitbucket.com/abornasdinamic/rovi/src/master/src/Dinamic/Rovi/FrontendBundle/Resources/public/css/main.styl">main.styl</a> | 1086 |
| License | <a href="https://bitbucket.com/acharyarajiv/resume_on_java/src/master/target/Resume-1.0-SNAPSHOT/WEB-INF/lib/apache-tomcat-7.0.30-embed/LICENSE">LICENSE</a> | 1050 |
| Julia | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/string.jl">string.jl</a> | 1031 |
| Nim | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.nim">example.nim</a> | 1010 |
| Wolfram | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/tutor/tutor.nb">tutor.nb</a> | 973 |
| ASP | <a href="https://bitbucket.com/abel-pacara/beta_masprospectos/src/master/admin/ckeditor/ckeditor.asp">ckeditor.asp</a> | 955 |
| Erlang | <a href="https://bitbucket.com/5ht/n2o/src/master/src/mochijson2.erl">mochijson2.erl</a> | 889 |
| Haskell | <a href="https://bitbucket.com/acgt/polyeuler/src/master/ProjectEuler.hs">ProjectEuler.hs</a> | 887 |
| JavaServer Pages | <a href="https://bitbucket.com/aaronhujun/test/src/master/src/main/webapp/WEB-INF/views/views/loanmonitor.jsp">loanmonitor.jsp</a> | 880 |
| Rust | <a href="https://bitbucket.com/adakoda/android_403_gnexus_frameworks_base/src/master/tests/RenderScriptTests/PerfTest/src/com/android/perftest/rsbench.rs">rsbench.rs</a> | 873 |
| PSL Assertion | <a href="https://bitbucket.com/abdulhamid/integrated-genome-browser/src/master/core/genometryImpl/src/test/resources/data/server/A_thaliana/A_thaliana_TAIR8/mRNA1.mm.psl">mRNA1.mm.psl</a> | 861 |
| Handlebars | <a href="https://bitbucket.com/73group/frames/src/master/app/views/editor/templates/editor.hbs">editor.hbs</a> | 850 |
| Protocol Buffers | <a href="https://bitbucket.com/abex/abex-mumble/src/master/src/murmur/MurmurRPC.proto">MurmurRPC.proto</a> | 823 |
| Puppet | <a href="https://bitbucket.com/acdtprn/proj-case-prototyping-boilerplate/src/master/puphpet/puppet/modules/puppi/manifests/project/maven.pp">maven.pp</a> | 814 |
| Swift | <a href="https://bitbucket.com/ac4lt/vistathing/src/master/VistaThing/VistaThingViewController.swift">VistaThingViewController.swift</a> | 812 |
| FORTRAN Modern | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/zmlrpc.f90">zmlrpc.f90</a> | 798 |
| Systemd | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/tools/qemu-xen-traditional/Makefile.target">Makefile.target</a> | 762 |
| Xtend | <a href="https://bitbucket.com/3m45t3r/dsl/src/master/main/at.tuwien.dsg.dsl.tests/src/at/tuwien/dsg/dsl/tests/parser/LittleJilParserTest.xtend">LittleJilParserTest.xtend</a> | 714 |
| Go | <a href="https://bitbucket.com/200bg/aquilo-server/src/master/aquilo/data/user.go">user.go</a> | 660 |
| Rakefile | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/activerecord-3.2.13/lib/active_record/railties/databases.rake">databases.rake</a> | 658 |
| PKGBUILD | <a href="https://bitbucket.com/11doctorwhocanada/arch-packages/src/master/kdeplasma-addons/trunk/PKGBUILD">PKGBUILD</a> | 648 |
| Zsh | <a href="https://bitbucket.com/abrookins/dotfiles/src/master/.zshrc">.zshrc</a> | 624 |
| Gherkin Specification | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/cucumber-1.3.8/legacy_features/cucumber_cli.feature">cucumber_cli.feature</a> | 584 |
| Extensible Stylesheet Language Transformations | <a href="https://bitbucket.com/aagraz/vrtoolkit/src/master/doc/generation_tools/doxyclean/object2html.xslt">object2html.xslt</a> | 582 |
| Ruby HTML | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.rhtml">example.rhtml</a> | 561 |
| V | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/troff/troff.d/tmac.d/v">v</a> | 552 |
| GLSL | <a href="https://bitbucket.com/0player/t-engine4/src/master/game/modules/tome/data/gfx/shaders/firearcs.frag">firearcs.frag</a> | 547 |
| Monkey C | <a href="https://bitbucket.com/abhi8600/demo/src/master/SMI/3rdparty/minnesota/DTake.mc">DTake.mc</a> | 533 |
| Clojure | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/genclass.clj">genclass.clj</a> | 510 |
| IDL | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/tools/libxl/libxl_types.idl">libxl_types.idl</a> | 504 |
| Twig Template | <a href="https://bitbucket.com/abdosagadir/annurestos/src/master/vendor/symfony/symfony/src/Symfony/Bundle/WebProfilerBundle/Resources/views/Collector/time.html.twig">time.html.twig</a> | 494 |
| Bazel | <a href="https://bitbucket.com/abhisit/firefly-rk3288-kernel/src/master/scripts/Makefile.build">Makefile.build</a> | 479 |
| Basic | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/unzip/windll/vb/vbunzip.bas">vbunzip.bas</a> | 466 |
| sed | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/mysql/bdb/rpc_server/db_server_proc.sed">db_server_proc.sed</a> | 418 |
| Unreal Script | <a href="https://bitbucket.com/___________chenjuensheng/android_kernel_samsung_n1/src/master/drivers/net/ixp2000/ixp2400_rx.uc">ixp2400_rx.uc</a> | 408 |
| Cython | <a href="https://bitbucket.com/-elmer-/plinkseq/src/master/py/pyplinkseq/pyplinkseq.pyx">pyplinkseq.pyx</a> | 380 |
| Android Interface Definition Language | <a href="https://bitbucket.com/adakoda/android_403_gnexus_frameworks_base/src/master/core/java/android/content/pm/IPackageManager.aidl">IPackageManager.aidl</a> | 367 |
| Game Maker Language | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/ati-eqn1.gml">ati-eqn1.gml</a> | 366 |
| Elixir | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example_elixir.ex">example_elixir.ex</a> | 363 |
| Vala | <a href="https://bitbucket.com/17twenty/colourl/src/master/main.vala">main.vala</a> | 362 |
| Gradle | <a href="https://bitbucket.com/10chars/wordpress-application-angular/src/master/node_modules/gulp-less/node_modules/less/build.gradle">build.gradle</a> | 347 |
| QML | <a href="https://bitbucket.com/4s/4sdcdemo/src/master/QtProjects/DemoHtmlIntegration/SettingsDialog.qml">SettingsDialog.qml</a> | 336 |
| Standard ML (SML) | <a href="https://bitbucket.com/_nkhalasi/proglang-2013-homework/src/master/hw1/hw1_test.sml">hw1_test.sml</a> | 310 |
| SAS | <a href="https://bitbucket.com/a3955269/unlockfs/src/master/libjpegtwrp/makefile.sas">makefile.sas</a> | 252 |
| F# | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/lib/libast/common/features/fs">fs</a> | 237 |
| SKILL | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/uts/intel/amd64/ml/amd64.il">amd64.il</a> | 231 |
| JSX | <a href="https://bitbucket.com/8hoursdo/rui/src/master/src/lib/components/tree-node.jsx">tree-node.jsx</a> | 228 |
| Mako | <a href="https://bitbucket.com/50onred/sqlalchemy/src/master/doc/build/templates/layout.mako">layout.mako</a> | 225 |
| AutoHotKey | <a href="https://bitbucket.com/5665tm/mytools/src/master/AutoHotkey/key.ahk">key.ahk</a> | 206 |
| Elm | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/cals-tbl.elm">cals-tbl.elm</a> | 204 |
| LD Script | <a href="https://bitbucket.com/accelecon/linux-stable/src/master/arch/m68k/kernel/vmlinux-nommu.lds">vmlinux-nommu.lds</a> | 195 |
| AsciiDoc | <a href="https://bitbucket.com/_tamim_/archibus/src/master/README.adoc">README.adoc</a> | 192 |
| Scons | <a href="https://bitbucket.com/abuffer/soundcustomizer/src/master/sconstruct">sconstruct</a> | 190 |
| C Shell | <a href="https://bitbucket.com/aakef/cci/src/master/config/distscript.csh">distscript.csh</a> | 185 |
| Jade | <a href="https://bitbucket.com/abhishekdelta/beamos/src/master/beamserv/node_modules/everyauth/example/views/home.jade">home.jade</a> | 181 |
| Dart | <a href="https://bitbucket.com/adam8810/chrome-app-samples/src/master/dart/dart/balls.dart">balls.dart</a> | 176 |
| Fish | <a href="https://bitbucket.com/aagraz/homebrew/src/master/Library/Contributions/brew_fish_completion.fish">brew_fish_completion.fish</a> | 173 |
| Dockerfile | <a href="https://bitbucket.com/abrad450/samm/src/master/.docker/Dockerfile">Dockerfile</a> | 161 |
| Arvo | <a href="https://bitbucket.com/adam_novak/sequence-graphs/src/master/avro/sequencegraph.avdl">sequencegraph.avdl</a> | 139 |
| Cabal | <a href="https://bitbucket.com/abailly/capital-match-infra/src/master/propellor.cabal">propellor.cabal</a> | 139 |
| Freemarker Template | <a href="https://bitbucket.com/618lf/tmt-base/src/master/base-webapp-tab/src/main/webapp/WEB-INF/template/article/search.ftl">search.ftl</a> | 126 |
| GN | <a href="https://bitbucket.com/aakef/cci/src/master/README.ctp.gni">README.ctp.gni</a> | 125 |
| Varnish Configuration | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/nokogiri-1.6.0/ext/nokogiri/tmp/i686-apple-darwin11/ports/libxml2/2.8.0/libxml2-2.8.0/win32/wince/libxml2.vcl">libxml2.vcl</a> | 122 |
| Jenkins Buildfile | <a href="https://bitbucket.com/abenity/postal-code-library/src/master/Jenkinsfile">Jenkinsfile</a> | 85 |
| nuspec | <a href="https://bitbucket.com/acgt/opserver/src/master/packages/BookSleeve.1.3.38/BookSleeve.1.3.38.nuspec">BookSleeve.1.3.38.nuspec</a> | 71 |
| XCode Config | <a href="https://bitbucket.com/365plus/api/src/master/FacebookSDK v4/Samples/Configurations/Project.xcconfig">Project.xcconfig</a> | 69 |
| LOLCODE | <a href="https://bitbucket.com/53454e4f4a/ba/src/master/tex/main.lol">main.lol</a> | 66 |
| Alloy | <a href="https://bitbucket.com/4ptiv4/picasso-kernel_at100/src/master/Documentation/sound/oss/ALS">ALS</a> | 66 |
| Bitbake | <a href="https://bitbucket.com/38zeros/power-meter/src/master/yocto/38z/38z.bb">38z.bb</a> | 62 |
| Modula3 | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/perl/t/lib/warnings/mg">mg</a> | 57 |
| Closure Template | <a href="https://bitbucket.com/13threbellion/spotify-plugin-for-stash/src/master/src/main/resources/spotify/feature/player/spotify-player.soy">spotify-player.soy</a> | 52 |
| Kotlin | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.kt">example.kt</a> | 47 |
| Fragment Shader File | <a href="https://bitbucket.com/adamfallon/bigdata/src/master/BigData/GPUImage/examples/iOS/ColorObjectTracking/ColorObjectTracking/PositionColor.fsh">PositionColor.fsh</a> | 45 |
| ColdFusion | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/demo.cfm">demo.cfm</a> | 38 |
| Ceylon | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.ceylon">example.ceylon</a> | 33 |
| Flow9 | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/snort/doc/README.flow">README.flow</a> | 32 |
| Brainfuck | <a href="https://bitbucket.com/_1126/humble/src/master/code/hello.bf">hello.bf</a> | 21 |
| ignore | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/rsync/.ignore">.ignore</a> | 19 |
| Vertex Shader File | <a href="https://bitbucket.com/aaalexx/gamejam2013/src/master/cocos2d-x-2.1.5/samples/Javascript/Shared/tests/res/Shaders/example_ColorBars.vsh">example_ColorBars.vsh</a> | 18 |
| GDScript | <a href="https://bitbucket.com/aadeshnpn/espeak/src/master/phsource/vowelcharts/gd">gd</a> | 14 |
| Bitbucket Pipeline | <a href="https://bitbucket.com/adam_qc/petsc/src/master/bitbucket-pipelines.yml">bitbucket-pipelines.yml</a> | 14 |
| Emacs Dev Env | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/realtime/src/buffer/java/bufferserver/Project.ede">Project.ede</a> | 13 |
| Opalang | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/test.opa">test.opa</a> | 10 |
| Ur/Web | <a href="https://bitbucket.com/aadeshnpn/espeak/src/master/espeak-data/voices/test/ur">ur</a> | 5 |
| Docker ignore | <a href="https://bitbucket.com/abdulcordoba/retocid/src/master/docker/retocid_mezz/.dockerignore">.dockerignore</a> | 3 |
| Creole | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/sinatra-1.3.4/test/views/hello.creole">hello.creole</a> | 1 |

### Whats the largest file for each language?

Across all the languages we looked at whats the largest file by number of bytes for each one? This means ignoring newlines and the like so its closer to finding checked in data files, which is less interesting but still pretty neat.

**NB** Some of the links below MAY not translate 100% due to throwing away some information when I created the files. Most should work, but a few you may need to mangle the URL to resolve.

[skip table to next](#whats-the-most-complex-file-in-each-language)

| language | filename | bytes |
| -------- | -------- | ----- |
| JSON | <a href="https://bitbucket.com/abram/bugparty/src/master/tests/big_data.json">big_data.json</a> | 182692471 |
| SQL | <a href="https://bitbucket.com/______moizl________/bol-leaks/src/master/bolForum.sql">bolForum.sql</a> | 182610866 |
| CSV | <a href="https://bitbucket.com/0im/mgdb-mobile/src/master/ServerSide/JUNE-2014-DATA/dstable.csv">dstable.csv</a> | 174972747 |
| Plain Text | <a href="https://bitbucket.com/abarysevich/java-experiments/src/master/Graphs/stronglyConnectedComponents/SCC.txt">SCC.txt</a> | 72653481 |
| CSS | <a href="https://bitbucket.com/adam_bear/cellular/src/master/subcellular/sass/icons/icons-svg-data.css">icons-svg-data.css</a> | 24870305 |
| PHP | <a href="https://bitbucket.com/______moizl________/bol-leaks/src/master/Player/Players.php">Players.php</a> | 22976108 |
| SVG | <a href="https://bitbucket.com/abdelba/mattlink/src/master/extras/design/uses-cases/membres-publications.svg">membres-publications.svg</a> | 22514559 |
| XML | <a href="https://bitbucket.com/abtekk/gaia/src/master/keyboard/dictionaries/hu_wordlist.xml">hu_wordlist.xml</a> | 15062952 |
| Sass | <a href="https://bitbucket.com/abegarcia/lifyember/src/master/node_modules/node-sass/libsass/sass-spec/spec/benchmarks/large_empty.scss">large_empty.scss</a> | 10000000 |
| HTML | <a href="https://bitbucket.com/_ariel/chat/src/master/node_modules/socket.io/node_modules/socket.io-client/node_modules/active-x-obfuscator/node_modules/zeparser/benchmark.html">benchmark.html</a> | 8062524 |
| Assembly | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.S">CIDE.S</a> | 6605737 |
| C Header | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/uts/common/sys/fibre-channel/fca/emlxs/fw_lpe11002.h">fw_lpe11002.h</a> | 5794337 |
| C | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.C">CIDE.C</a> | 5785777 |
| JavaScript | <a href="https://bitbucket.com/3x0dv5/ao2sm/src/master/WebContent/extjs/ext-all-dev.js">ext-all-dev.js</a> | 5386270 |
| Prolog | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.P">CIDE.P</a> | 4948259 |
| Java | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/gen-java/org/hypertable/thriftgen/ClientService.java">ClientService.java</a> | 4101939 |
| Patch | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/openswan/patches/kernel/2.6.16/klips.patch">klips.patch</a> | 3594619 |
| D | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.D">CIDE.D</a> | 3529597 |
| Objective C | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.M">CIDE.M</a> | 3141049 |
| Jupyter | <a href="https://bitbucket.com/abosamoor/data_science_course/src/master/ScientificPython.ipynb">ScientificPython.ipynb</a> | 3100608 |
| R | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.R">CIDE.R</a> | 2802622 |
| FORTRAN Legacy | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.F">CIDE.F</a> | 2560639 |
| Swig | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.I">CIDE.I</a> | 2514921 |
| Specman e | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.E">CIDE.E</a> | 2417432 |
| C++ Header | <a href="https://bitbucket.com/achase55/gba4ios/src/master/emu-ex-plus-alpha/imagine/bundle/darwin-iOS/include/boost/typeof/vector200.hpp">vector200.hpp</a> | 2234682 |
| C++ | <a href="https://bitbucket.com/aaalexx/gamejam2013/src/master/cocos2d-x-2.1.5/scripting/lua/cocos2dx_support/LuaCocos2d.cpp">LuaCocos2d.cpp</a> | 2151167 |
| LEX | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.L">CIDE.L</a> | 2086700 |
| Autoconf | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/Makefile.in">Makefile.in</a> | 1678085 |
| Python | <a href="https://bitbucket.com/3togo/python-tesseract/src/master/src/get-pip.py">get-pip.py</a> | 1563245 |
| Perl | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/perl/lib/Locale/Codes/Language_Codes.pm">Language_Codes.pm</a> | 1543893 |
| HEX | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/uts/common/io/ipw/fw-ipw2100/ipw2100-1.3.fw.hex">ipw2100-1.3.fw.hex</a> | 1255140 |
| SystemVerilog | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.V">CIDE.V</a> | 999600 |
| C# | <a href="https://bitbucket.com/45north/cx-developer-tutorials/src/master/Defect POC/SOAP.Account.PasswordReset/SOAP.Account.PasswordReset/Service References/RNT.SOAP/Reference.cs">Reference.cs</a> | 975402 |
| Intel HEX | <a href="https://bitbucket.com/ace0/linux-restore-support/src/master/firmware/bnx2x/bnx2x-e2-7.2.51.0.fw.ihex">bnx2x-e2-7.2.51.0.fw.ihex</a> | 830511 |
| Emacs Lisp | <a href="https://bitbucket.com/4ourbit/prefs/src/master/.emacs.d/emacs-goodies-el/color-theme-library.el">color-theme-library.el</a> | 797868 |
| LaTeX | <a href="https://bitbucket.com/40123204/40123204bitbucket/src/master/cdwp/tex_by_topic/TeXbyTopic.tex">TeXbyTopic.tex</a> | 675074 |
| Properties File | <a href="https://bitbucket.com/acgt/bitmate/src/master/azureus2/src/org/gudy/azureus2/internat/MessagesBundle_bg_BG.properties">MessagesBundle_bg_BG.properties</a> | 673506 |
| Lua | <a href="https://bitbucket.com/420munk/pd2_lua/src/master/lib/tweak_data/weaponfactorytweakdata.lua">weaponfactorytweakdata.lua</a> | 644230 |
| Makefile | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/net-snmp/agent/mibgroup/Makefile">Makefile</a> | 622258 |
| Ruby | <a href="https://bitbucket.com/aalmacin/rails-learning/src/master/blog/path/ruby/2.0.0/gems/mail-2.6.1/lib/mail/parsers/ragel/ruby/machines/address_lists_machine.rb">address_lists_machine.rb</a> | 570805 |
| ASP.NET | <a href="https://bitbucket.com/abhi8600/demo/src/master/SourceAdmin/.wsdl/general/AdminService_14.asmx">AdminService_14.asmx</a> | 557879 |
| TypeScript | <a href="https://bitbucket.com/abex/abex-mumble/src/master/src/mumble/mumble_ru.ts">mumble_ru.ts</a> | 443885 |
| Coq | <a href="https://bitbucket.com/abrzoska/bachelortheory/src/master/redsvd/svd.V">svd.V</a> | 430260 |
| Vim Script | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/autoload/netrw.vim">netrw.vim</a> | 417636 |
| TeX | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/docs/xen-api/xenapi-datamodel.tex">xenapi-datamodel.tex</a> | 410587 |
| MSBuild | <a href="https://bitbucket.com/0908nooaey/becit-traning/src/master/Template.Metronic/Template.Metronic.csproj">Template.Metronic.csproj</a> | 397925 |
| Happy | <a href="https://bitbucket.com/acclivitynyc/postgresql/src/master/src/backend/parser/gram.y">gram.y</a> | 375897 |
| gitignore | <a href="https://bitbucket.com/a3217055/illumos-joyent/src/master/.gitignore">.gitignore</a> | 373198 |
| Batch | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/perl/bin/cpanm.bat">cpanm.bat</a> | 367293 |
| m4 | <a href="https://bitbucket.com/2ion/libqueue/src/master/aclocal.m4">aclocal.m4</a> | 360820 |
| Shell | <a href="https://bitbucket.com/1120436joaopacheco/irudroid-technologies-lapr5/src/master/WalkMaze/lib/freetype-2.5.5/builds/unix/ltmain.sh">ltmain.sh</a> | 321214 |
| Markdown | <a href="https://bitbucket.com/abhayagiri/reflections/src/master/manuscripts/markdown/vol2-talks.md">vol2-talks.md</a> | 319691 |
| ActionScript | <a href="https://bitbucket.com/abhi8600/demo/src/master/AnyChart/Original/AnyChartSource_6_0_11/build/utils/flex/frameworks/projects/framework/src/mx/controls/listClasses/ListBase.as">ListBase.as</a> | 317139 |
| Groovy | <a href="https://bitbucket.com/4s/ot-70-opentele-server/src/master/grails-app/conf/BootStrap.groovy">BootStrap.groovy</a> | 273089 |
| Forth | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/apache/manual/mod/core.html.fr">core.html.fr</a> | 271345 |
| Boo | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/grub/grub-0.97/docs/texinfo.tex">texinfo.tex</a> | 226839 |
| Visual Basic for Applications | <a href="https://bitbucket.com/2014vleadinterns/amulya/src/master/Eucalyptus/paper/IEEEtran.cls">IEEEtran.cls</a> | 215484 |
| Go Template | <a href="https://bitbucket.com/accelecon/linux-uclinux-dist/src/master/Documentation/DocBook/writing-an-alsa-driver.tmpl">writing-an-alsa-driver.tmpl</a> | 205415 |
| Visual Basic | <a href="https://bitbucket.com/acrotech/dotspatialpcl/src/master/Trunk/DotSpatial.Plugins.Taudem.Port/frmAutomatic_v3.vb">frmAutomatic_v3.vb</a> | 203170 |
| VHDL | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/bundle/ctags58/Test/test.vhd">test.vhd</a> | 192381 |
| Alex | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/gdb/ChangeLog-3.x">ChangeLog-3.x</a> | 184506 |
| ReStructuredText | <a href="https://bitbucket.com/acclivitynyc/sqlalchemy/src/master/doc/build/changelog/changelog_06.rst">changelog_06.rst</a> | 170107 |
| COBOL | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.cob">example.cob</a> | 153346 |
| CMake | <a href="https://bitbucket.com/02jandal/multilaunch/src/master/cmake/cotire.cmake">cotire.cmake</a> | 152993 |
| Document Type Definition | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/solbookv2/solbook.dtd">solbook.dtd</a> | 150786 |
| Lisp | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/clojure/lib/slime/swank.lisp">swank.lisp</a> | 144497 |
| Macromedia eXtensible Markup Language | <a href="https://bitbucket.com/abhi8600/demo/src/master/SourceAdmin/src/RealtimeAdmin.mxml">RealtimeAdmin.mxml</a> | 139687 |
| PSL Assertion | <a href="https://bitbucket.com/abdulhamid/integrated-genome-browser/src/master/core/genometryImpl/src/test/resources/data/server/A_thaliana/A_thaliana_TAIR8/mRNA1.mm.psl">mRNA1.mm.psl</a> | 137316 |
| XML Schema | <a href="https://bitbucket.com/aburias/moolahsense/src/master/MoolahConnectnew/NLog.xsd">NLog.xsd</a> | 130385 |
| TCL | <a href="https://bitbucket.com/achyutreddy24/abdevweb/src/master/dist/tcl/tcl8.6/clock.tcl">clock.tcl</a> | 129701 |
| XAML | <a href="https://bitbucket.com/achadee/graphics-project/src/master/Common/StandardStyles.xaml">StandardStyles.xaml</a> | 119065 |
| LESS | <a href="https://bitbucket.com/a_hassala/website/src/master/assets/less/3rd-party/lesshat.less">lesshat.less</a> | 114654 |
| TypeScript Typings | <a href="https://bitbucket.com/12110201/12110201/src/master/webit/webit/Scripts/devexpress-web-14.1/ts/dx.all.d.ts">dx.all.d.ts</a> | 113915 |
| Mustache | <a href="https://bitbucket.com/4lejandrito/cv-bootstrap/src/master/docs/templates/pages/components.mustache">components.mustache</a> | 110205 |
| Razor | <a href="https://bitbucket.com/aburias/moolahsense/src/master/MoolahConnectnew/Views/Admin/_UserVerification.cshtml">_UserVerification.cshtml</a> | 109415 |
| YAML | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/aws-sdk-1.28.1/lib/aws/api_config/EC2-2013-10-01.yml">EC2-2013-10-01.yml</a> | 108948 |
| Objective C++ | <a href="https://bitbucket.com/achase55/gba4ios/src/master/GBA4iOS/GBAEmulationViewController.mm">GBAEmulationViewController.mm</a> | 105949 |
| Pascal | <a href="https://bitbucket.com/5665tm/mytools/src/master/ConEmuFar/PluginSDK/Headers.pas/PluginW.pas">PluginW.pas</a> | 105205 |
| Scala | <a href="https://bitbucket.com/_nkhalasi/fpscala-2012-assignments/src/master/objsets/src/main/scala/objsets/TweetData.scala">TweetData.scala</a> | 104077 |
| Expect | <a href="https://bitbucket.com/adam_onodi/uclinux-lpcboard/src/master/user/gdb/gdb/testsuite/gdb.disasm/t01_mov.exp">t01_mov.exp</a> | 93614 |
| Haxe | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/tools/qemu-xen/qemu-options.hx">qemu-options.hx</a> | 92576 |
| Scheme | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/programming/lib/slime-2013-04-05/contrib/swank-kawa.scm">swank-kawa.scm</a> | 84264 |
| F* | <a href="https://bitbucket.com/achyutreddy24/abdevweb/src/master/IMGT-Human_IGHV+IGKV+IGLV_F+ORF_AA.fst">IMGT-Human_IGHV+IGKV+IGLV_F+ORF_AA.fst</a> | 83412 |
| Device Tree | <a href="https://bitbucket.com/abhisit/firefly-rk3288-kernel/src/master/arch/arm/boot/dts/rk3288-clocks.dtsi">rk3288-clocks.dtsi</a> | 74436 |
| Module-Definition | <a href="https://bitbucket.com/_1126/humble/src/master/tufte-common.def">tufte-common.def</a> | 66821 |
| BuildStream | <a href="https://bitbucket.com/adam_0/300/src/master/IEEEannot.bst">IEEEannot.bst</a> | 61919 |
| Smarty Template | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/Makefile.tpl">Makefile.tpl</a> | 59029 |
| BASH | <a href="https://bitbucket.com/a_alfredo/vagrant-instance/src/master/modules/development/files/home/git-completion.bash">git-completion.bash</a> | 58130 |
| License | <a href="https://bitbucket.com/acharyarajiv/resume_on_java/src/master/target/Resume-1.0-SNAPSHOT/WEB-INF/lib/apache-tomcat-7.0.30-embed/LICENSE">LICENSE</a> | 56812 |
| Processing | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/realtime/src/acquisition/openbci/java/src/OpenBCI_GUI.pde">OpenBCI_GUI.pde</a> | 52494 |
| Stata | <a href="https://bitbucket.com/0532/google-hosts/src/master/scripts/hosts.do">hosts.do</a> | 51267 |
| Powershell | <a href="https://bitbucket.com/adamgiranowski/e-dziennik/src/master/packages/EntityFramework.6.1.0/tools/EntityFramework.psm1">EntityFramework.psm1</a> | 44234 |
| AWK | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/mysql/bdb/dist/gen_rpc.awk">gen_rpc.awk</a> | 44131 |
| OCaml | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/format.ml">format.ml</a> | 42416 |
| Org | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/microwin/src/engine/devdraw.org">devdraw.org</a> | 41988 |
| Thrift | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/cc/ThriftBroker/Client.thrift">Client.thrift</a> | 39471 |
| CoffeeScript | <a href="https://bitbucket.com/adamfallon/4chan-x/src/master/src/Posting/QR.coffee">QR.coffee</a> | 37666 |
| Ada | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/ncurses/ncurses-5.7/Ada95/src/terminal_interface-curses-forms.adb">terminal_interface-curses-forms.adb</a> | 36770 |
| Wolfram | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/tutor/tutor.nb">tutor.nb</a> | 35601 |
| Nim | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.nim">example.nim</a> | 35137 |
| Swift | <a href="https://bitbucket.com/ac4lt/vistathing/src/master/VistaThing/VistaThingViewController.swift">VistaThingViewController.swift</a> | 33142 |
| Erlang | <a href="https://bitbucket.com/5ht/n2o/src/master/src/mochijson2.erl">mochijson2.erl</a> | 31149 |
| ASP | <a href="https://bitbucket.com/accessatecs/project-realise/src/master/presentation/lib/ckeditor/ckeditor.asp">ckeditor.asp</a> | 30817 |
| Handlebars | <a href="https://bitbucket.com/73group/frames/src/master/app/views/editor/templates/editor.hbs">editor.hbs</a> | 30162 |
| Korn Shell | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/itutools/itu.ksh">itu.ksh</a> | 28975 |
| JavaServer Pages | <a href="https://bitbucket.com/aaronhujun/test/src/master/src/main/webapp/WEB-INF/views/views/loanmonitor.jsp">loanmonitor.jsp</a> | 28581 |
| Ur/Web | <a href="https://bitbucket.com/4gott3n/inn/src/master/src/test/resources/extensions/profiles/ur">ur</a> | 28532 |
| Stylus | <a href="https://bitbucket.com/abornasdinamic/rovi/src/master/src/Dinamic/Rovi/FrontendBundle/Resources/public/css/main.styl">main.styl</a> | 27854 |
| FORTRAN Modern | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/zmlrpc.f90">zmlrpc.f90</a> | 27700 |
| Julia | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/string.jl">string.jl</a> | 27687 |
| PKGBUILD | <a href="https://bitbucket.com/11doctorwhocanada/arch-packages/src/master/vim-spell/trunk/PKGBUILD">PKGBUILD</a> | 27549 |
| Haskell | <a href="https://bitbucket.com/abailly/capital-match-infra/src/master/src/Propellor/Property/SiteSpecific/JoeySites.hs">JoeySites.hs</a> | 27435 |
| Rakefile | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/activerecord-3.2.13/lib/active_record/railties/databases.rake">databases.rake</a> | 26578 |
| Rust | <a href="https://bitbucket.com/adakoda/android_403_gnexus_frameworks_base/src/master/tests/RenderScriptTests/PerfTest/src/com/android/perftest/rsbench.rs">rsbench.rs</a> | 25966 |
| Protocol Buffers | <a href="https://bitbucket.com/acb/boiler/src/master/proto/cstrike15_gcmessages.proto">cstrike15_gcmessages.proto</a> | 25510 |
| Xtend | <a href="https://bitbucket.com/3m45t3r/dsl/src/master/main/at.tuwien.dsg.dsl.tests/src/at/tuwien/dsg/dsl/tests/parser/LittleJilParserTest.xtend">LittleJilParserTest.xtend</a> | 25217 |
| Puppet | <a href="https://bitbucket.com/acdtprn/proj-case-prototyping-boilerplate/src/master/puphpet/puppet/modules/puppi/manifests/project/maven.pp">maven.pp</a> | 24374 |
| Clojure | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/genclass.clj">genclass.clj</a> | 21964 |
| Extensible Stylesheet Language Transformations | <a href="https://bitbucket.com/40087220/sd2/src/master/Practical Work/Lab 4 Code/Lab 4 Code/_UpgradeReport_Files/UpgradeReport.xslt">UpgradeReport.xslt</a> | 21697 |
| Twig Template | <a href="https://bitbucket.com/3663jgl/drupal-phpbb/src/master/piwik/plugins/PrivacyManager/templates/privacySettings.twig">privacySettings.twig</a> | 20780 |
| Go | <a href="https://bitbucket.com/200bg/aquilo-server/src/master/aquilo/data/user.go">user.go</a> | 19923 |
| Standard ML (SML) | <a href="https://bitbucket.com/_nkhalasi/proglang-2013-homework/src/master/hw1/hw1_test.sml">hw1_test.sml</a> | 18956 |
| Bazel | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/samba/packaging/Debian/debian-sarge/README.build">README.build</a> | 18314 |
| Zsh | <a href="https://bitbucket.com/abrookins/dotfiles/src/master/.zshrc">.zshrc</a> | 18079 |
| Ruby HTML | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.rhtml">example.rhtml</a> | 17790 |
| Systemd | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/tools/qemu-xen-traditional/Makefile.target">Makefile.target</a> | 17319 |
| GLSL | <a href="https://bitbucket.com/0player/t-engine4/src/master/game/modules/tome/data/gfx/shaders/firearcs.frag">firearcs.frag</a> | 16765 |
| IDL | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/tools/libxl/libxl_types.idl">libxl_types.idl</a> | 16578 |
| Basic | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/unzip/windll/vb/vbunzip.bas">vbunzip.bas</a> | 16319 |
| Game Maker Language | <a href="https://bitbucket.com/abouthydrology/udig-platform/src/master/plugins/net.refractions.udig.tool.edit.tests/data/lake.gml">lake.gml</a> | 15756 |
| Android Interface Definition Language | <a href="https://bitbucket.com/abhinavgupta2812/dynamix-framework/src/master/src/org/ambientdynamix/api/application/IDynamixFacade.aidl">IDynamixFacade.aidl</a> | 15475 |
| Gherkin Specification | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/compass-0.10.6/features/command_line.feature">command_line.feature</a> | 14767 |
| Vala | <a href="https://bitbucket.com/17twenty/colourl/src/master/main.vala">main.vala</a> | 14451 |
| SAS | <a href="https://bitbucket.com/a3955269/unlockfs/src/master/libjpegtwrp/makefile.sas">makefile.sas</a> | 12586 |
| sed | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/mysql/bdb/rpc_server/db_server_proc.sed">db_server_proc.sed</a> | 12177 |
| AsciiDoc | <a href="https://bitbucket.com/_tamim_/archibus/src/master/README.adoc">README.adoc</a> | 11455 |
| Elixir | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example_elixir.ex">example_elixir.ex</a> | 10529 |
| Gradle | <a href="https://bitbucket.com/10chars/wordpress-application-angular/src/master/node_modules/gulp-less/node_modules/less/build.gradle">build.gradle</a> | 10463 |
| Cython | <a href="https://bitbucket.com/-elmer-/plinkseq/src/master/py/pyplinkseq/pyplinkseq.pyx">pyplinkseq.pyx</a> | 10163 |
| Monkey C | <a href="https://bitbucket.com/abhi8600/demo/src/master/SMI/3rdparty/minnesota/DTake.mc">DTake.mc</a> | 9167 |
| V | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/troff/troff.d/tmac.d/v">v</a> | 9164 |
| QML | <a href="https://bitbucket.com/4s/4sdcdemo/src/master/QtProjects/DemoHtmlIntegration/SettingsDialog.qml">SettingsDialog.qml</a> | 9080 |
| Unreal Script | <a href="https://bitbucket.com/___________chenjuensheng/android_kernel_samsung_n1/src/master/drivers/net/ixp2000/ixp2400_rx.uc">ixp2400_rx.uc</a> | 8680 |
| Fish | <a href="https://bitbucket.com/aagraz/homebrew/src/master/Library/Contributions/brew_fish_completion.fish">brew_fish_completion.fish</a> | 7872 |
| Scons | <a href="https://bitbucket.com/abuffer/soundcustomizer/src/master/sconstruct">sconstruct</a> | 7766 |
| Jade | <a href="https://bitbucket.com/abhishekdelta/beamos/src/master/beamserv/node_modules/everyauth/example/views/home.jade">home.jade</a> | 7493 |
| JSX | <a href="https://bitbucket.com/abaddongit/colordomenscheck/src/master/src/js/components/FileField.jsx">FileField.jsx</a> | 7422 |
| F# | <a href="https://bitbucket.com/abred/btf-renderer/src/master/data/shader/btf.fs">btf.fs</a> | 7077 |
| Mako | <a href="https://bitbucket.com/50onred/sqlalchemy/src/master/doc/build/templates/layout.mako">layout.mako</a> | 6310 |
| Elm | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/cals-tbl.elm">cals-tbl.elm</a> | 6198 |
| Dockerfile | <a href="https://bitbucket.com/abrad450/samm/src/master/.docker/Dockerfile">Dockerfile</a> | 5863 |
| C Shell | <a href="https://bitbucket.com/aakef/cci/src/master/config/distscript.csh">distscript.csh</a> | 5828 |
| Arvo | <a href="https://bitbucket.com/adam_novak/sequence-graphs/src/master/avro/sequencegraph.avdl">sequencegraph.avdl</a> | 5498 |
| AutoHotKey | <a href="https://bitbucket.com/5665tm/mytools/src/master/AutoHotkey/key.ahk">key.ahk</a> | 5406 |
| nuspec | <a href="https://bitbucket.com/acgt/opserver/src/master/packages/BookSleeve.1.3.38/BookSleeve.1.3.38.nuspec">BookSleeve.1.3.38.nuspec</a> | 4976 |
| Dart | <a href="https://bitbucket.com/adam8810/chrome-app-samples/src/master/dart/dart/balls.dart">balls.dart</a> | 4581 |
| GN | <a href="https://bitbucket.com/aakef/cci/src/master/README.ctp.gni">README.ctp.gni</a> | 4518 |
| SKILL | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/uts/intel/ia32/ml/ia32.il">ia32.il</a> | 4468 |
| Freemarker Template | <a href="https://bitbucket.com/618lf/tmt-base/src/master/base-webapp-tab/src/main/webapp/WEB-INF/template/index.ftl">index.ftl</a> | 4369 |
| Varnish Configuration | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/nokogiri-1.6.0/ext/nokogiri/tmp/i686-apple-darwin11/ports/libxml2/2.8.0/libxml2-2.8.0/win32/wince/libxml2.vcl">libxml2.vcl</a> | 4153 |
| LD Script | <a href="https://bitbucket.com/accelecon/linux-stable/src/master/arch/m68k/kernel/vmlinux-nommu.lds">vmlinux-nommu.lds</a> | 4070 |
| LOLCODE | <a href="https://bitbucket.com/53454e4f4a/ba/src/master/tex/main.lol">main.lol</a> | 3962 |
| Alloy | <a href="https://bitbucket.com/___________chenjuensheng/android_kernel_samsung_n1/src/master/Documentation/sound/oss/ALS">ALS</a> | 3770 |
| Cabal | <a href="https://bitbucket.com/abailly/capital-match-infra/src/master/propellor.cabal">propellor.cabal</a> | 3698 |
| XCode Config | <a href="https://bitbucket.com/1234224576/voiceactress_ios/src/master/Pods/Pods.xcconfig">Pods.xcconfig</a> | 3239 |
| Bitbake | <a href="https://bitbucket.com/38zeros/power-meter/src/master/yocto/38z/38z.bb">38z.bb</a> | 2703 |
| Jenkins Buildfile | <a href="https://bitbucket.com/abenity/postal-code-library/src/master/Jenkinsfile">Jenkinsfile</a> | 2679 |
| Closure Template | <a href="https://bitbucket.com/13threbellion/spotify-plugin-for-stash/src/master/src/main/resources/spotify/feature/config/server/config-template.soy">config-template.soy</a> | 2321 |
| Fragment Shader File | <a href="https://bitbucket.com/adamfallon/maply/src/master/GoogleMaps.framework/Versions/A/Resources/GoogleMaps.bundle/GMSCoreResources.bundle/HybridRoadShader.fsh">HybridRoadShader.fsh</a> | 1496 |
| Modula3 | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/perl/t/lib/warnings/mg">mg</a> | 1146 |
| Flow9 | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/snort/doc/README.flow">README.flow</a> | 1002 |
| Kotlin | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.kt">example.kt</a> | 971 |
| Ceylon | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.ceylon">example.ceylon</a> | 887 |
| Brainfuck | <a href="https://bitbucket.com/_1126/humble/src/master/code/hello.bf">hello.bf</a> | 840 |
| ColdFusion | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/demo.cfm">demo.cfm</a> | 724 |
| Bitbucket Pipeline | <a href="https://bitbucket.com/adam_qc/petsc/src/master/bitbucket-pipelines.yml">bitbucket-pipelines.yml</a> | 562 |
| GDScript | <a href="https://bitbucket.com/aadeshnpn/espeak/src/master/phsource/vowelcharts/gd">gd</a> | 498 |
| Vertex Shader File | <a href="https://bitbucket.com/aaalexx/gamejam2013/src/master/cocos2d-x-2.1.5/samples/Javascript/Shared/tests/res/Shaders/example_ColorBars.vsh">example_ColorBars.vsh</a> | 323 |
| Emacs Dev Env | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/realtime/src/buffer/java/bufferserver/Project.ede">Project.ede</a> | 312 |
| Opalang | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/test.opa">test.opa</a> | 172 |
| ignore | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/rsync/.ignore">.ignore</a> | 137 |
| Docker ignore | <a href="https://bitbucket.com/abdulcordoba/retocid/src/master/docker/retocid_mezz/.dockerignore">.dockerignore</a> | 34 |
| Creole | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/sinatra-1.3.4/test/views/hello.creole">hello.creole</a> | 20 |

### Whats the most complex file in each language?

Once again these values are not directly comparable to each other, but it is interesting to see what is considered the most complex in each language.

Some of these files are absolute monsters. For example consider the most complex C++ file [COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp](https://github.com/KhronosGroup/OpenCOLLADA/blob/master/COLLADASaxFrameworkLoader/src/generated15/COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp) which is 28.3 MB of compiler hell (and thankfully appears to be a generated file). 

**NB** Some of the links below MAY not translate 100% due to throwing away some information when I created the files. Most should work, but a few you may need to mangle the URL to resolve.

[skip table to next](#whats-the-most-complex-file-weighted-against-lines)

| language | filename | complexity |
| -------- | -------- | ----- |
| JavaScript | <a href="https://bitbucket.com/abaddongit/colordomenscheck/src/master/src/js/ace/src-noconflict/worker-xquery.js">worker-xquery.js</a> | 17988 |
| Java | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/gen-java/org/hypertable/thriftgen/ClientService.java">ClientService.java</a> | 16956 |
| PHP | <a href="https://bitbucket.com/_phpdev/biling/src/master/protected/vendor/mpdf/mpdf.php">mpdf.php</a> | 10882 |
| C | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/perl/vendor/lib/auto/share/dist/DBD-SQLite/sqlite3.c">sqlite3.c</a> | 8516 |
| Autoconf | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/Makefile.in">Makefile.in</a> | 6737 |
| Python | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/py/ThriftClient/gen-py/hyperthrift/gen/ClientService.py">ClientService.py</a> | 6566 |
| C++ | <a href="https://bitbucket.com/ac-web/trinitycore/src/master/src/server/game/Entities/Player/Player.cpp">Player.cpp</a> | 6375 |
| Perl | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/perl/ThriftClient/gen-perl/Hypertable/ThriftGen/ClientService.pm">ClientService.pm</a> | 4744 |
| C# | <a href="https://bitbucket.com/abhi8600/demo/src/master/Performance Optimizer Administration/ApplicationBuilder.cs">ApplicationBuilder.cs</a> | 2687 |
| SQL | <a href="https://bitbucket.com/abs-cbn/pbbteen/src/master/technicals/pbbteen_db.sql">pbbteen_db.sql</a> | 2338 |
| C Header | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/cc/ThriftBroker/gen-cpp/ClientService.h">ClientService.h</a> | 1938 |
| Batch | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/perl/bin/cpanm.bat">cpanm.bat</a> | 1732 |
| SystemVerilog | <a href="https://bitbucket.com/act-lab/axbench_old/src/master/hardware/circuits/inversek/rtl/multiplier_32b.v">multiplier_32b.v</a> | 1507 |
| C++ Header | <a href="https://bitbucket.com/achase55/gba4ios/src/master/emu-ex-plus-alpha/imagine/bundle/darwin-iOS/include/boost/phoenix/core/preprocessed/function_equal_50.hpp">function_equal_50.hpp</a> | 1225 |
| Objective C | <a href="https://bitbucket.com/abhineetm/iosgeofencing/src/master/GeofencingClient/GeofencingClient/RegexKitLite-4.0/RegexKitLite.m">RegexKitLite.m</a> | 1219 |
| R | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.R">CIDE.R</a> | 1163 |
| Shell | <a href="https://bitbucket.com/1120436joaopacheco/irudroid-technologies-lapr5/src/master/WalkMaze/lib/freetype-2.5.5/builds/unix/ltmain.sh">ltmain.sh</a> | 1151 |
| Lua | <a href="https://bitbucket.com/0player/t-engine4/src/master/game/modules/tome/class/Actor.lua">Actor.lua</a> | 1147 |
| Assembly | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.S">CIDE.S</a> | 1057 |
| ActionScript | <a href="https://bitbucket.com/abhi8600/demo/src/master/AnyChart/Original/AnyChartSource_6_0_11/build/utils/flex/frameworks/projects/framework/src/mx/controls/listClasses/ListBase.as">ListBase.as</a> | 1041 |
| Ruby | <a href="https://bitbucket.com/aalmacin/rails-learning/src/master/blog/path/ruby/2.0.0/gems/rdoc-4.1.2/lib/rdoc/markdown.rb">markdown.rb</a> | 998 |
| Vim Script | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/autoload/netrw.vim">netrw.vim</a> | 993 |
| Makefile | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/snort/src/win32/WIN32-Prj/snort.mak">snort.mak</a> | 926 |
| Specman e | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.E">CIDE.E</a> | 711 |
| TypeScript | <a href="https://bitbucket.com/abex/abex-mumble/src/master/src/mumble/mumble_nb_NO.ts">mumble_nb_NO.ts</a> | 581 |
| TeX | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/snort/doc/snort_manual.tex">snort_manual.tex</a> | 533 |
| TCL | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/mysql/bdb/test/testutils.tcl">testutils.tcl</a> | 426 |
| FORTRAN Legacy | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/external/dmlt/external/glmnet/GLMnet.F">GLMnet.F</a> | 404 |
| Objective C++ | <a href="https://bitbucket.com/achase55/gba4ios/src/master/GBA4iOS/GBAEmulationViewController.mm">GBAEmulationViewController.mm</a> | 389 |
| VHDL | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/bundle/ctags58/Test/test.vhd">test.vhd</a> | 385 |
| Emacs Lisp | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/programming/lib/js2/js2-mode.el">js2-mode.el</a> | 384 |
| Visual Basic for Applications | <a href="https://bitbucket.com/2014vleadinterns/amulya/src/master/Eucalyptus/paper/IEEEtran.cls">IEEEtran.cls</a> | 374 |
| Org | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/microwin/src/engine/devdraw.org">devdraw.org</a> | 332 |
| Groovy | <a href="https://bitbucket.com/4s/ot-70-opentele-server/src/master/grails-app/services/org/opentele/server/CompletedQuestionnaireService.groovy">CompletedQuestionnaireService.groovy</a> | 307 |
| CMake | <a href="https://bitbucket.com/02jandal/multilaunch/src/master/cmake/cotire.cmake">cotire.cmake</a> | 296 |
| Expect | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/gdb/testsuite/lib/gdb.exp">gdb.exp</a> | 288 |
| Haxe | <a href="https://bitbucket.com/adag_dot_me/7drts/src/master/src/com/haxepunk/Scene.hx">Scene.hx</a> | 269 |
| Smarty Template | <a href="https://bitbucket.com/adam_onodi/uclinux-lpcboard/src/master/user/gdb/Makefile.tpl">Makefile.tpl</a> | 200 |
| CoffeeScript | <a href="https://bitbucket.com/adamfallon/4chan-x/src/master/src/Posting/QR.coffee">QR.coffee</a> | 196 |
| Swift | <a href="https://bitbucket.com/ac4lt/vistathing/src/master/VistaThing/VistaThingViewController.swift">VistaThingViewController.swift</a> | 195 |
| Razor | <a href="https://bitbucket.com/aburias/moolahsense/src/master/MoolahConnectnew/App_Code/RangeHelper.cshtml">RangeHelper.cshtml</a> | 194 |
| Processing | <a href="https://bitbucket.com/acorbi/p5-light-controller/src/master/LightController.pde">LightController.pde</a> | 186 |
| Module-Definition | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/bash/builtins/set.def">set.def</a> | 185 |
| Go | <a href="https://bitbucket.com/200bg/aquilo-server/src/master/aquilo/data/user.go">user.go</a> | 178 |
| Boo | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/grub/grub-0.97/docs/texinfo.tex">texinfo.tex</a> | 150 |
| Julia | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/string.jl">string.jl</a> | 141 |
| JavaServer Pages | <a href="https://bitbucket.com/acdevlin/opengrok/src/master/web/diff.jsp">diff.jsp</a> | 140 |
| Korn Shell | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/lib/brand/shared/zone/common.ksh">common.ksh</a> | 137 |
| BASH | <a href="https://bitbucket.com/a_alfredo/vagrant-instance/src/master/modules/development/files/home/git-completion.bash">git-completion.bash</a> | 134 |
| Puppet | <a href="https://bitbucket.com/acdtprn/proj-case-prototyping-boilerplate/src/master/puphpet/puppet/modules/nginx/manifests/resource/vhost.pp">vhost.pp</a> | 124 |
| Wolfram | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/tutor/tutor.nb">tutor.nb</a> | 120 |
| Scala | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/ser/scripts/sc">sc</a> | 118 |
| D | <a href="https://bitbucket.com/acehreli/ddili/src/master/src/ders/d.en/operator_overloading.d">operator_overloading.d</a> | 105 |
| Lisp | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/programming/lib/slime-2013-04-05/swank.lisp">swank.lisp</a> | 101 |
| Rust | <a href="https://bitbucket.com/adakoda/android_403_gnexus_frameworks_base/src/master/tests/RenderScriptTests/tests/src/com/android/rs/test/vector.rs">vector.rs</a> | 94 |
| Forth | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/psm/stand/bootblks/zfs/common/zfs.fth">zfs.fth</a> | 88 |
| FORTRAN Modern | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/zmlrpc.f90">zmlrpc.f90</a> | 82 |
| Nim | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.nim">example.nim</a> | 80 |
| GLSL | <a href="https://bitbucket.com/0player/t-engine4/src/master/game/modules/tome/data/gfx/shaders/target_fbo.frag">target_fbo.frag</a> | 71 |
| OCaml | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/format.ml">format.ml</a> | 71 |
| ASP | <a href="https://bitbucket.com/abel-pacara/beta_masprospectos/src/master/admin/ckeditor/ckeditor.asp">ckeditor.asp</a> | 70 |
| Sass | <a href="https://bitbucket.com/2one5/matchcode/src/master/source_code/wp-content/themes/senna/library/scss/vendor/greedy/_mixins.scss">_mixins.scss</a> | 65 |
| Twig Template | <a href="https://bitbucket.com/3663jgl/drupal-phpbb/src/master/piwik/plugins/Installation/templates/_systemCheckSection.twig">_systemCheckSection.twig</a> | 58 |
| Standard ML (SML) | <a href="https://bitbucket.com/_nkhalasi/proglang-2013-homework/src/master/hw1/hw1.sml">hw1.sml</a> | 53 |
| Xtend | <a href="https://bitbucket.com/3m45t3r/dsl/src/master/main/at.tuwien.dsg.dsl/src/at/tuwien/dsg/validation/DslValidator.xtend">DslValidator.xtend</a> | 53 |
| ASP.NET | <a href="https://bitbucket.com/abhi8600/demo/src/master/Acorn/Acorn/FlexModule.aspx">FlexModule.aspx</a> | 52 |
| Ada | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/ncurses/ncurses-5.7/Ada95/src/terminal_interface-curses-forms.adb">terminal_interface-curses-forms.adb</a> | 52 |
| Brainfuck | <a href="https://bitbucket.com/_1126/humble/src/master/code/hello.bf">hello.bf</a> | 51 |
| Powershell | <a href="https://bitbucket.com/1110245danielagrams/arqsi2/src/master/IDEIMusic/packages/EntityFramework.6.1.1/tools/EntityFramework.psm1">EntityFramework.psm1</a> | 51 |
| Mustache | <a href="https://bitbucket.com/4lejandrito/cv-bootstrap/src/master/docs/templates/pages/components.mustache">components.mustache</a> | 50 |
| Cython | <a href="https://bitbucket.com/abosamoor/polyglot2/src/master/polyglot2/polyglot2_inner.pyx">polyglot2_inner.pyx</a> | 50 |
| Zsh | <a href="https://bitbucket.com/abrookins/dotfiles/src/master/.zshrc">.zshrc</a> | 46 |
| Prolog | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/mysql/bdb/perl.BerkeleyDB/BerkeleyDB.pod.P">BerkeleyDB.pod.P</a> | 42 |
| Rakefile | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/activerecord-3.2.13/lib/active_record/railties/databases.rake">databases.rake</a> | 35 |
| JSX | <a href="https://bitbucket.com/8hoursdo/rui/src/master/src/lib/components/tree-node.jsx">tree-node.jsx</a> | 34 |
| Stylus | <a href="https://bitbucket.com/abhishekghosh/dillinger/src/master/public/css/nib/lib/nib/gradients.styl">gradients.styl</a> | 34 |
| Scons | <a href="https://bitbucket.com/abhisit/firefly-rk3288-kernel/src/master/drivers/gpu/arm/midgard/sconscript">sconscript</a> | 31 |
| sed | <a href="https://bitbucket.com/4ptiv4/picasso-kernel_at100/src/master/arch/ia64/scripts/pvcheck.sed">pvcheck.sed</a> | 30 |
| Haskell | <a href="https://bitbucket.com/abailly/capital-match-infra/src/master/src/Utility/Scheduled.hs">Scheduled.hs</a> | 30 |
| Jade | <a href="https://bitbucket.com/abhishekdelta/beamos/src/master/beamserv/node_modules/everyauth/example/views/home.jade">home.jade</a> | 29 |
| AutoHotKey | <a href="https://bitbucket.com/5665tm/mytools/src/master/AutoHotkey/key.ahk">key.ahk</a> | 29 |
| Vala | <a href="https://bitbucket.com/17twenty/tictactoe/src/master/TicTacToeBoard.vala">TicTacToeBoard.vala</a> | 27 |
| Mako | <a href="https://bitbucket.com/50onred/sqlalchemy/src/master/doc/build/templates/layout.mako">layout.mako</a> | 26 |
| C Shell | <a href="https://bitbucket.com/aakef/cci/src/master/config/distscript.csh">distscript.csh</a> | 24 |
| Fragment Shader File | <a href="https://bitbucket.com/aaalexx/gamejam2013/src/master/cocos2d-x-2.1.5/samples/Javascript/Shared/tests/res/Shaders/example_ColorBars.fsh">example_ColorBars.fsh</a> | 24 |
| Game Maker Language | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/iso-box.gml">iso-box.gml</a> | 24 |
| Cabal | <a href="https://bitbucket.com/3noch/hubble/src/master/hubble.cabal">hubble.cabal</a> | 21 |
| Bazel | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/samba/packaging/Debian/debian-sarge/README.build">README.build</a> | 20 |
| Fish | <a href="https://bitbucket.com/aagraz/homebrew/src/master/Library/Contributions/brew_fish_completion.fish">brew_fish_completion.fish</a> | 20 |
| F# | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/lib/libast/sparcv9/src/lib/libast/FEATURE/fs">fs</a> | 20 |
| Ruby HTML | <a href="https://bitbucket.com/aalmacin/rails-learning/src/master/blog/path/ruby/2.0.0/gems/rdoc-4.1.2/lib/rdoc/generator/template/darkfish/class.rhtml">class.rhtml</a> | 19 |
| Dockerfile | <a href="https://bitbucket.com/abrad450/samm/src/master/.docker/Dockerfile">Dockerfile</a> | 19 |
| Erlang | <a href="https://bitbucket.com/5ht/n2o/src/master/src/wf_tags.erl">wf_tags.erl</a> | 19 |
| Gherkin Specification | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/rspec-expectations-2.14.4/features/built_in_matchers/yield.feature">yield.feature</a> | 18 |
| QML | <a href="https://bitbucket.com/abuer/ricochet/src/master/src/ui/qml/MainWindow.qml">MainWindow.qml</a> | 18 |
| Elixir | <a href="https://bitbucket.com/0x0me/elixir_fp_book/src/master/chap05/test/chap05_test.exs">chap05_test.exs</a> | 17 |
| Dart | <a href="https://bitbucket.com/adam8810/chrome-app-samples/src/master/dart/dart/clock.dart">clock.dart</a> | 16 |
| Clojure | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/genclass.clj">genclass.clj</a> | 13 |
| Pascal | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/test.pas">test.pas</a> | 12 |
| Freemarker Template | <a href="https://bitbucket.com/120011676/snow/src/master/snow/src/main/resources/pageTag.ftl">pageTag.ftl</a> | 12 |
| Handlebars | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/nodechip/node_modules/bower/node_modules/handlebars/bin/handlebars">handlebars</a> | 11 |
| IDL | <a href="https://bitbucket.com/ace0/xen-restore-information/src/master/tools/libxl/libxl_types.idl">libxl_types.idl</a> | 9 |
| Monkey C | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/libkrb5/windows/identity/kmm/lang/kmm_msgs.mc">kmm_msgs.mc</a> | 8 |
| Modula3 | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/perl/t/lib/warnings/mg">mg</a> | 8 |
| Protocol Buffers | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/lp/model/alert.proto">alert.proto</a> | 7 |
| TypeScript Typings | <a href="https://bitbucket.com/12110201/12110201/src/master/webit/webit/Scripts/devexpress-web-14.1/ts/dx.all.d.ts">dx.all.d.ts</a> | 7 |
| Alloy | <a href="https://bitbucket.com/4ptiv4/picasso-kernel_at100/src/master/Documentation/sound/oss/ALS">ALS</a> | 7 |
| Visual Basic | <a href="https://bitbucket.com/acrotech/dotspatialpcl/src/master/Trunk/DotSpatial.Plugins.Taudem.Port/frmAutomatic_v3.vb">frmAutomatic_v3.vb</a> | 6 |
| Kotlin | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.kt">example.kt</a> | 5 |
| COBOL | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.cob">example.cob</a> | 5 |
| CSS | <a href="https://bitbucket.com/2krueger/roundcubemail/src/master/skins/classic/iehacks.css">iehacks.css</a> | 5 |
| MSBuild | <a href="https://bitbucket.com/4code/4code-lapr-v/src/master/C#/SocialGame/SocialGame.Services/SocialGame.Services.csproj">SocialGame.Services.csproj</a> | 4 |
| Unreal Script | <a href="https://bitbucket.com/4ptiv4/picasso-kernel_at100/src/master/lib/raid6/int.uc">int.uc</a> | 4 |
| V | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/troff/troff.d/tmac.d/v">v</a> | 3 |
| SKILL | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/lib/libc/sparc/fp/base.il">base.il</a> | 3 |
| Stata | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/power/lib/yasnippet/snippets/text-mode/f90-mode/do">do</a> | 2 |
| Bitbake | <a href="https://bitbucket.com/aakbalaev/blitz3d-project/src/master/main.bb">main.bb</a> | 2 |
| Elm | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/ati-tbl.elm">ati-tbl.elm</a> | 2 |
| Scheme | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/clojure/lib/slime/contrib/swank-kawa.scm">swank-kawa.scm</a> | 2 |
| SVG | <a href="https://bitbucket.com/0mid/fsusiam/src/master/talks/1-central-limit-thm/pictures/dice_clt.svg">dice_clt.svg</a> | 2 |
| Closure Template | <a href="https://bitbucket.com/13threbellion/spotify-plugin-for-stash/src/master/src/main/resources/spotify/feature/config/server/config-template.soy">config-template.soy</a> | 2 |
| LD Script | <a href="https://bitbucket.com/accelecon/u-boot/src/master/board/dave/PPChameleonEVB/u-boot.lds">u-boot.lds</a> | 1 |
| Ceylon | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.ceylon">example.ceylon</a> | 1 |
| XAML | <a href="https://bitbucket.com/__jacob/osu-music-library/src/master/OsuMusicLibrary/GUI/SettingsWindow.xaml">SettingsWindow.xaml</a> | 1 |
| Coq | <a href="https://bitbucket.com/a85brown/ffmpeg/src/master/libavformat/libavformat.v">libavformat.v</a> | 1 |

### Whats the most complex file weighted against lines?

This sounds good in practice, but in reality... anything minified or with no newlines skews the results making this one effectively pointless. As such I have not included this calculation. I have however created an issue inside `scc` to support detection of minified code so it can be removed from the calculation results https://github.com/boyter/scc/issues/91

It's probably possible to infer this using just the data at hand, but id like to make it a more robust check that anyone using `scc` can benefit from.

### Whats the most commented file in each language?

Whats the most commented file in each language? I have no idea what sort of information you can get out of this that might be useful but it is interesting to have a look.

**NB** Some of the links below MAY not translate 100% due to throwing away some information when I created the files. Most should work, but a few you may need to mangle the URL to resolve.

[skip table to next](#how-many-pure-projects)

| language | filename | comment lines |
| -------- | -------- | ------- |
| C | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.C">CIDE.C</a> | 84255 |
| Prolog | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.P">CIDE.P</a> | 68004 |
| JavaScript | <a href="https://bitbucket.com/3x0dv5/ao2sm/src/master/WebContent/extjs/ext-all-debug-w-comments.js">ext-all-debug-w-comments.js</a> | 57173 |
| D | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.D">CIDE.D</a> | 52202 |
| Objective C | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.M">CIDE.M</a> | 44141 |
| Swig | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.I">CIDE.I</a> | 37235 |
| C Header | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.H">CIDE.H</a> | 30417 |
| LEX | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.L">CIDE.L</a> | 28723 |
| C++ | <a href="https://bitbucket.com/-elmer-/plinkseq/src/master/lib/r8lib.cpp">r8lib.cpp</a> | 22641 |
| XML | <a href="https://bitbucket.com/a_hassala/projet-informatique/src/master/data/haarcascades/haarcascade_frontalface_alt_tree.xml">haarcascade_frontalface_alt_tree.xml</a> | 17027 |
| SystemVerilog | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.V">CIDE.V</a> | 13391 |
| Java | <a href="https://bitbucket.com/_dev_/shards-of-destiny/src/master/worldserver/src/main/java/com/l2jfree/gameserver/network/SystemMessageId.java">SystemMessageId.java</a> | 12331 |
| PHP | <a href="https://bitbucket.com/4nn3ck/myeclipse4php/src/master/configuration/org.eclipse.osgi/bundles/322/1/.cp/Resources/language/php5.4/standard.php">standard.php</a> | 10168 |
| C# | <a href="https://bitbucket.com/acrotech/dotspatialpcl/src/master/Trunk/DotSpatial.Plugins.Taudem/Hydrology.cs">Hydrology.cs</a> | 4674 |
| ActionScript | <a href="https://bitbucket.com/abhi8600/demo/src/master/AnyChart/Original/AnyChartSource_6_0_11/build/utils/flex/frameworks/projects/framework/src/mx/core/UIComponent.as">UIComponent.as</a> | 4468 |
| Ruby | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/aws-sdk-1.11.3/lib/aws/ec2/client.rb">client.rb</a> | 3805 |
| HTML | <a href="https://bitbucket.com/_thc_/asc2013/src/master/cokolino-html/war/com.podravka.cokolino.GwtDefinition/FA7CBF71A4805DCDA38517C976AE86E9.cache.html">FA7CBF71A4805DCDA38517C976AE86E9.cache.html</a> | 3712 |
| Autoconf | <a href="https://bitbucket.com/14farresa/projecte_esin/src/master/jp_public_terminal.in">jp_public_terminal.in</a> | 3690 |
| SQL | <a href="https://bitbucket.com/10bicsehali/blesk/src/master/structure.sql">structure.sql</a> | 3431 |
| TeX | <a href="https://bitbucket.com/act-lab/r2code/src/master/Python-2.7.5/Modules/_ctypes/libffi/texinfo.tex">texinfo.tex</a> | 3208 |
| Pascal | <a href="https://bitbucket.com/5665tm/mytools/src/master/ConEmuFar/PluginSDK/Headers.pas/PluginW.pas">PluginW.pas</a> | 3141 |
| LaTeX | <a href="https://bitbucket.com/a3217055/illumos-joyent/src/master/usr/src/grub/grub-0.97/docs/texinfo.tex">texinfo.tex</a> | 2464 |
| CSS | <a href="https://bitbucket.com/activey/reactor/src/master/reactor-transport-websockets-jetty/src/main/resources/static/css/semantic.css">semantic.css</a> | 2364 |
| Perl | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/perl/vendor/lib/DateTime.pm">DateTime.pm</a> | 2217 |
| Emacs Lisp | <a href="https://bitbucket.com/4ourbit/prefs/src/master/.emacs.d/emacs-goodies-el/folding.el">folding.el</a> | 2107 |
| Visual Basic | <a href="https://bitbucket.com/acrotech/dotspatialpcl/src/master/Trunk/DotSpatial.Plugins.Taudem.Port/frmAutomatic_v3.vb">frmAutomatic_v3.vb</a> | 2053 |
| m4 | <a href="https://bitbucket.com/2ion/libqueue/src/master/aclocal.m4">aclocal.m4</a> | 2009 |
| Shell | <a href="https://bitbucket.com/1120436joaopacheco/irudroid-technologies-lapr5/src/master/WalkMaze/lib/freetype-2.5.5/builds/unix/ltmain.sh">ltmain.sh</a> | 1935 |
| C++ Header | <a href="https://bitbucket.com/3togo/python-tesseract/src/master/vs2008/includes/opencv2/core/core.hpp">core.hpp</a> | 1869 |
| ASP.NET | <a href="https://bitbucket.com/5665tm/nyancatrainbowshot/src/master/NyanCat_Data/Mono/etc/mono/2.0/DefaultWsdlHelpGenerator.aspx">DefaultWsdlHelpGenerator.aspx</a> | 1677 |
| CMake | <a href="https://bitbucket.com/acoustid/chromaprint/src/master/Doxyfile.cmake">Doxyfile.cmake</a> | 1611 |
| FORTRAN Legacy | <a href="https://bitbucket.com/adam_qc/petsc/src/master/src/contrib/fun3d/comp/user.F">user.F</a> | 1531 |
| TCL | <a href="https://bitbucket.com/achyutreddy24/abdevweb/src/master/dist/tcl/tcl8.6/clock.tcl">clock.tcl</a> | 1323 |
| Sass | <a href="https://bitbucket.com/aadonskoy/helpdesk/src/master/app/assets/stylesheets/foundation_and_overrides.scss">foundation_and_overrides.scss</a> | 1150 |
| XAML | <a href="https://bitbucket.com/achadee/graphics-project/src/master/Common/StandardStyles.xaml">StandardStyles.xaml</a> | 1054 |
| Python | <a href="https://bitbucket.com/__rvalle__/openerp-7/src/master/openobject-server/openerp/addons/resource/faces/task.py">task.py</a> | 1016 |
| Thrift | <a href="https://bitbucket.com/abioy/hypertable/src/master/src/cc/ThriftBroker/Client.thrift">Client.thrift</a> | 906 |
| Lisp | <a href="https://bitbucket.com/acgt/dotemacs/src/master/packs/programming/lib/slime-2013-04-05/xref.lisp">xref.lisp</a> | 904 |
| TypeScript Typings | <a href="https://bitbucket.com/12110201/12110201/src/master/webit/webit/Scripts/devexpress-web-14.1/ts/jquery.d.ts">jquery.d.ts</a> | 770 |
| LESS | <a href="https://bitbucket.com/6artisans/tlapse/src/master/app/assets/stylesheets/custom_bootstrap/variables.less">variables.less</a> | 642 |
| Assembly | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/sim/testsuite/sim/h8300/shlr.s">shlr.s</a> | 588 |
| Expect | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/gdb/gdb/testsuite/lib/gdb.exp">gdb.exp</a> | 542 |
| Powershell | <a href="https://bitbucket.com/1110245danielagrams/arqsi2/src/master/IDEIMusic/packages/EntityFramework.6.1.1/tools/EntityFramework.psm1">EntityFramework.psm1</a> | 506 |
| Makefile | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/pwlib/src/ptlib/unix/Makefile">Makefile</a> | 481 |
| YAML | <a href="https://bitbucket.com/aadonskoy/rubycas-server/src/master/config/config.example.yml">config.example.yml</a> | 464 |
| Properties File | <a href="https://bitbucket.com/act-lab/r2code/src/master/jsr308-langtools/src/share/classes/com/sun/tools/javac/resources/compiler.properties">compiler.properties</a> | 458 |
| Haskell | <a href="https://bitbucket.com/acgt/polyeuler/src/master/ProjectEuler.hs">ProjectEuler.hs</a> | 444 |
| Scheme | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/boot-9.scm">boot-9.scm</a> | 439 |
| Haxe | <a href="https://bitbucket.com/adag_dot_me/7drts/src/master/src/com/haxepunk/HXP.hx">HXP.hx</a> | 437 |
| GLSL | <a href="https://bitbucket.com/0player/t-engine4/src/master/game/modules/tome/data/gfx/shaders/full_fbo.frag">full_fbo.frag</a> | 427 |
| Lua | <a href="https://bitbucket.com/0player/t-engine4/src/master/game/modules/tome/class/interface/PlayerExplore.lua">PlayerExplore.lua</a> | 419 |
| VHDL | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/bundle/ctags58/Test/test.vhd">test.vhd</a> | 396 |
| COBOL | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.cob">example.cob</a> | 390 |
| MSBuild | <a href="https://bitbucket.com/3f/_systemdatasqlite/src/master/SQLite.NET.Settings.targets">SQLite.NET.Settings.targets</a> | 386 |
| Processing | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/realtime/src/acquisition/openbci/java/src/OpenBCI_GUI.pde">OpenBCI_GUI.pde</a> | 384 |
| ASP | <a href="https://bitbucket.com/abel-pacara/beta_masprospectos/src/master/admin/ckeditor/ckeditor.asp">ckeditor.asp</a> | 347 |
| Protocol Buffers | <a href="https://bitbucket.com/abex/abex-mumble/src/master/src/murmur/MurmurRPC.proto">MurmurRPC.proto</a> | 339 |
| CoffeeScript | <a href="https://bitbucket.com/abhayathapa/interesting/src/master/app/assets/javascripts/gmaps4rails/gmaps4rails.googlemaps.js.coffee">gmaps4rails.googlemaps.js.coffee</a> | 339 |
| FORTRAN Modern | <a href="https://bitbucket.com/adam_qc/petsc/src/master/src/snes/examples/tutorials/ex5f90t.F90">ex5f90t.F90</a> | 330 |
| Groovy | <a href="https://bitbucket.com/4s/ot-70-opentele-server/src/master/grails-app/conf/Config.groovy">Config.groovy</a> | 309 |
| AWK | <a href="https://bitbucket.com/achase55/gba4ios/src/master/emu-ex-plus-alpha/imagine/bundle/all/src/libpng/libpng-1.6.2/scripts/options.awk">options.awk</a> | 284 |
| R | <a href="https://bitbucket.com/acoking/archervmperidot-mirror/src/master/MercuryMail/RESOURCE/wpm-lmtt.r">wpm-lmtt.r</a> | 284 |
| Ada | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/ncurses/ncurses-5.7/Ada95/src/terminal_interface-curses-forms.adb">terminal_interface-curses-forms.adb</a> | 278 |
| Objective C++ | <a href="https://bitbucket.com/aaalexx/gamejam2013/src/master/cocos2d-x-2.1.5/cocos2dx/platform/mac/CCImage.mm">CCImage.mm</a> | 262 |
| Korn Shell | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/lib/brand/shared/zone/common.ksh">common.ksh</a> | 253 |
| Boo | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/external/dmlt/external/gpstuff/SuiteSparse/AMD/Doc/AMD_UserGuide.tex">AMD_UserGuide.tex</a> | 253 |
| Clojure | <a href="https://bitbucket.com/acgt/polyeuler/src/master/euler.clj">euler.clj</a> | 227 |
| Android Interface Definition Language | <a href="https://bitbucket.com/abhinavgupta2812/dynamix-framework/src/master/src/org/ambientdynamix/api/application/IDynamixFacade.aidl">IDynamixFacade.aidl</a> | 225 |
| Batch | <a href="https://bitbucket.com/abhi8600/demo/src/master/BuildsAndReleases/deployment/deploy_acorn_noftp.bat">deploy_acorn_noftp.bat</a> | 224 |
| Razor | <a href="https://bitbucket.com/aburias/moolahsense/src/master/MoolahConnectnew/Views/Admin/_LoanRequestMoolahCoreEdit.cshtml">_LoanRequestMoolahCoreEdit.cshtml</a> | 220 |
| OCaml | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/format.ml">format.ml</a> | 218 |
| BASH | <a href="https://bitbucket.com/aborrmann/dotfiles/src/master/.git-completion.bash">.git-completion.bash</a> | 188 |
| TypeScript | <a href="https://bitbucket.com/0x3044/php-examples/src/master/public/typescript/form/form.ts">form.ts</a> | 186 |
| Stylus | <a href="https://bitbucket.com/abihf/chsj/src/master/themes/chsj/source/css/_base/normalize.styl">normalize.styl</a> | 186 |
| Puppet | <a href="https://bitbucket.com/acdtprn/proj-case-prototyping-boilerplate/src/master/puphpet/puppet/modules/puppi/manifests/project/maven.pp">maven.pp</a> | 186 |
| Scala | <a href="https://bitbucket.com/adam_novak/sequence-graphs/src/master/scala/SparkUtil.scala">SparkUtil.scala</a> | 175 |
| Module-Definition | <a href="https://bitbucket.com/act-lab/r2code/src/master/Python-2.7.5/PC/os2emx/python27.def">python27.def</a> | 174 |
| SVG | <a href="https://bitbucket.com/0mid/fsusiam/src/master/talks/1-central-limit-thm/pictures/dice_clt.svg">dice_clt.svg</a> | 166 |
| Device Tree | <a href="https://bitbucket.com/abhisit/firefly-rk3288-kernel/src/master/arch/arm/boot/dts/rk3288-box.dts">rk3288-box.dts</a> | 164 |
| Monkey C | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/ntp/ports/winnt/libntp/messages.mc">messages.mc</a> | 134 |
| Zsh | <a href="https://bitbucket.com/abrookins/dotfiles/src/master/.zshrc">.zshrc</a> | 120 |
| Basic | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/unzip/windll/vb/vbunzip.bas">vbunzip.bas</a> | 119 |
| Erlang | <a href="https://bitbucket.com/a12n/calendar_ext/src/master/src/internal/iso8601_datetime.erl">iso8601_datetime.erl</a> | 113 |
| Gherkin Specification | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/cucumber-1.3.8/legacy_features/wire_protocol.feature">wire_protocol.feature</a> | 112 |
| Nim | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/example.nim">example.nim</a> | 109 |
| gitignore | <a href="https://bitbucket.com/aagraz/blwebsocketsserver/src/master/.gitignore">.gitignore</a> | 105 |
| JavaServer Pages | <a href="https://bitbucket.com/abhi8600/demo/src/master/SalesforceConnector_28_0/WebContent/axis2-web/HappyAxis.jsp">HappyAxis.jsp</a> | 103 |
| Unreal Script | <a href="https://bitbucket.com/___________chenjuensheng/android_kernel_samsung_n1/src/master/drivers/net/ixp2000/ixp2400_rx.uc">ixp2400_rx.uc</a> | 98 |
| Bazel | <a href="https://bitbucket.com/4ptiv4/picasso-kernel_at100/src/master/scripts/Makefile.build">Makefile.build</a> | 93 |
| Go | <a href="https://bitbucket.com/200bg/aquilo-server/src/master/aquilo/csrf/csrf.go">csrf.go</a> | 87 |
| Vala | <a href="https://bitbucket.com/17twenty/colourl/src/master/main.vala">main.vala</a> | 73 |
| Rust | <a href="https://bitbucket.com/abhijeetbhagat/rusqlite/src/master/src/sqlite_test.rs">sqlite_test.rs</a> | 73 |
| QML | <a href="https://bitbucket.com/4s/4sdcdemo/src/master/QtProjects/DemoHtmlIntegration/Gateway/4SDC2QtWebKit/webBrowser.qml">webBrowser.qml</a> | 71 |
| Swift | <a href="https://bitbucket.com/abutenko/simplechat/src/master/SimpleChat/BuddiesViewModel.swift">BuddiesViewModel.swift</a> | 67 |
| SKILL | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/uts/intel/amd64/ml/amd64.il">amd64.il</a> | 67 |
| Org | <a href="https://bitbucket.com/acue/unified-sessions-manager/src/master/trunk/ctys/plugins/VMs/XEN/network-bridge.org">network-bridge.org</a> | 64 |
| sed | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/lib/ncurses/ncurses-5.7/man/manlinks.sed">manlinks.sed</a> | 63 |
| Rakefile | <a href="https://bitbucket.com/3ign0n/3ign0nbitbucketorg/src/master/src/Rakefile">Rakefile</a> | 59 |
| C Shell | <a href="https://bitbucket.com/aakef/cci/src/master/config/distscript.csh">distscript.csh</a> | 56 |
| Standard ML (SML) | <a href="https://bitbucket.com/_nkhalasi/proglang-2013-homework/src/master/hw7/hw7.sml">hw7.sml</a> | 52 |
| Smarty Template | <a href="https://bitbucket.com/aaryadewa/simpleresponsivetheme/src/master/themes/simpleresponsivetheme/authentication.tpl">authentication.tpl</a> | 52 |
| Dockerfile | <a href="https://bitbucket.com/abrad450/samm/src/master/.docker/Dockerfile">Dockerfile</a> | 46 |
| Xtend | <a href="https://bitbucket.com/3m45t3r/dsl/src/master/main/at.tuwien.dsg.dsl/src/at/tuwien/dsg/jvmmodel/DslJvmModelInferrer.xtend">DslJvmModelInferrer.xtend</a> | 45 |
| Specman e | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/bundle/ctags58/Eiffel/tag_file.e">tag_file.e</a> | 43 |
| Julia | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/string.jl">string.jl</a> | 43 |
| LD Script | <a href="https://bitbucket.com/accelecon/u-boot/src/master/board/gaisler/gr_xc3s_1500/u-boot.lds">u-boot.lds</a> | 40 |
| AutoHotKey | <a href="https://bitbucket.com/5665tm/mytools/src/master/AutoHotkey/key.ahk">key.ahk</a> | 38 |
| IDL | <a href="https://bitbucket.com/53454e4f4a/vs2/src/master/Koordinator/monitor.idl">monitor.idl</a> | 30 |
| F# | <a href="https://bitbucket.com/abred/btf-renderer/src/master/data/shader/btf.fs">btf.fs</a> | 29 |
| Elixir | <a href="https://bitbucket.com/0x0me/elixir_fp_book/src/master/chap10/lib/chap10.ex">chap10.ex</a> | 28 |
| Scons | <a href="https://bitbucket.com/abhisit/firefly-rk3288-kernel/src/master/drivers/gpu/arm/midgard/sconscript">sconscript</a> | 27 |
| XCode Config | <a href="https://bitbucket.com/365plus/api/src/master/FacebookSDK v4/Samples/Configurations/Project.xcconfig">Project.xcconfig</a> | 26 |
| BuildStream | <a href="https://bitbucket.com/adam_0/300/src/master/IEEEannot.bst">IEEEannot.bst</a> | 25 |
| Gradle | <a href="https://bitbucket.com/aalmiray/javafx-gradle/src/master/samples/FullyExpressed/build.gradle">build.gradle</a> | 24 |
| Mako | <a href="https://bitbucket.com/50onred/sqlalchemy/src/master/doc/build/templates/layout.mako">layout.mako</a> | 19 |
| Fish | <a href="https://bitbucket.com/ac109158/django-portfolio/src/master/bin/activate.fish">activate.fish</a> | 19 |
| Cython | <a href="https://bitbucket.com/abosamoor/polyglot2/src/master/polyglot2/polyglot2_inner.pyx">polyglot2_inner.pyx</a> | 19 |
| Dart | <a href="https://bitbucket.com/adam8810/chrome-app-samples/src/master/dart/dart/balls.dart">balls.dart</a> | 18 |
| Kotlin | <a href="https://bitbucket.com/adamansky/adamanskybitbucketorg/src/master/kotlin/src/ru/nsu/Lambda.kt">Lambda.kt</a> | 16 |
| Handlebars | <a href="https://bitbucket.com/adam_paterson/blog/src/master/content/themes/cedar/partials/footer.hbs">footer.hbs</a> | 16 |
| Closure Template | <a href="https://bitbucket.com/13threbellion/spotify-plugin-for-stash/src/master/src/main/resources/spotify/widget/track-selector/track-selector.soy">track-selector.soy</a> | 15 |
| V | <a href="https://bitbucket.com/5665tm/mytools/src/master/Vim/bundle/ctags58/Test/bug1111214.v">bug1111214.v</a> | 14 |
| nuspec | <a href="https://bitbucket.com/acrotech/dotspatialpcl/src/master/Branches- Obsolete/Topology_NTS/Nuget_DotSpatialCore.nuspec">Nuget_DotSpatialCore.nuspec</a> | 14 |
| Modula3 | <a href="https://bitbucket.com/__wp__/mb-linux-msli/src/master/uClinux-dist/user/perl/t/lib/warnings/mg">mg</a> | 11 |
| Fragment Shader File | <a href="https://bitbucket.com/adamfallon/maply/src/master/GoogleMaps.framework/Versions/A/Resources/GoogleMaps.bundle/GMSCoreResources.bundle/HybridRoadShader.fsh">HybridRoadShader.fsh</a> | 11 |
| Ruby HTML | <a href="https://bitbucket.com/aalmacin/rails-learning/src/master/blog/path/ruby/2.0.0/gems/sdoc-0.4.1/lib/rdoc/generator/template/sdoc/_context.rhtml">_context.rhtml</a> | 8 |
| Stata | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/external/dmlt/external/gpstuff/SuiteSparse/UMFPACK/Tcov/DO">DO</a> | 8 |
| Jade | <a href="https://bitbucket.com/200bg/aquilo-server/src/master/html/src/index.jade">index.jade</a> | 8 |
| Cabal | <a href="https://bitbucket.com/3noch/hubble/src/master/hubble.cabal">hubble.cabal</a> | 6 |
| Bitbucket Pipeline | <a href="https://bitbucket.com/0x0me/sdsget/src/master/bitbucket-pipelines.yml">bitbucket-pipelines.yml</a> | 5 |
| JSX | <a href="https://bitbucket.com/8hoursdo/rui/src/master/src/lib/components/button.jsx">button.jsx</a> | 5 |
| SAS | <a href="https://bitbucket.com/a3955269/unlockfs/src/master/libjpegtwrp/jconfig.sas">jconfig.sas</a> | 4 |
| Elm | <a href="https://bitbucket.com/a3217055/illumos-2/src/master/usr/src/cmd/man/src/util/ati-tbl.elm">ati-tbl.elm</a> | 4 |
| Mustache | <a href="https://bitbucket.com/4lejandrito/cv-bootstrap/src/master/docs/templates/pages/scaffolding.mustache">scaffolding.mustache</a> | 4 |
| GN | <a href="https://bitbucket.com/aakef/cci/src/master/README.ctp.gni">README.ctp.gni</a> | 2 |
| Vertex Shader File | <a href="https://bitbucket.com/aaalexx/gamejam2013/src/master/cocos2d-x-2.1.5/samples/Javascript/Shared/tests/res/Shaders/example_ColorBars.vsh">example_ColorBars.vsh</a> | 2 |
| Bitbake | <a href="https://bitbucket.com/17twenty/meta-feabhas/src/master/meta-feabhas/recipes-feabhas/images/feabhas-image.bb">feabhas-image.bb</a> | 2 |
| Emacs Dev Env | <a href="https://bitbucket.com/aaleks/compileddatabatch/src/master/fieldtrip/realtime/src/buffer/java/bufferserver/Project.ede">Project.ede</a> | 2 |
| ColdFusion | <a href="https://bitbucket.com/abashelor/mess/src/master/.gem/ruby/1.9.3/gems/pygments.rb-0.5.2/vendor/pygments-main/tests/examplefiles/demo.cfm">demo.cfm</a> | 1 |
| Forth | <a href="https://bitbucket.com/a9group/workspace/src/master/Workspace/menu.fr">menu.fr</a> | 1 |

### How many "pure" projects

That is projects that have 1 language in them. Of course that would not be very interesting by itself, so lets see what the spread is. Turns out most projects have fewer than 25 languages in them with most in the less than 10 bracket.

The peak in the below graph is for 4 languages.

Of course pure projects might only have one programming language, but have lots of supporting other formats such as markdown, json, yml, css, .gitignore and the like. It's probably reasonable to assume that any project with less than 5 languages is "pure" and as it turns out is just over half the total data set. Of course your definition of purity might be different to mine.

There is an odd bump around the 35 language's count though for some reason. I have no reasonable explanation as to why this might be the case.

![scc-data pure projects](/static/an-informal-survey/languagesPerProject.png#center)

The full list of results is included below.

[skip table to next](#projects-with-typescript-but-not-javascript)

| language count | project count |
| -------------- | ------------- |
| 1 | 886559 |
| 2 | 951009 |
| 3 | 989025 |
| 4 | 1070987 |
| 5 | 1012686 |
| 6 | 845898 |
| 7 | 655510 |
| 8 | 542625 |
| 9 | 446278 |
| 10 | 392212 |
| 11 | 295810 |
| 12 | 204291 |
| 13 | 139021 |
| 14 | 110204 |
| 15 | 87143 |
| 16 | 67602 |
| 17 | 61936 |
| 18 | 44874 |
| 19 | 34740 |
| 20 | 32041 |
| 21 | 25416 |
| 22 | 24986 |
| 23 | 23634 |
| 24 | 16614 |
| 25 | 13823 |
| 26 | 10998 |
| 27 | 9973 |
| 28 | 6807 |
| 29 | 7929 |
| 30 | 6223 |
| 31 | 5602 |
| 32 | 6614 |
| 33 | 12155 |
| 34 | 15375 |
| 35 | 7329 |
| 36 | 6227 |
| 37 | 4158 |
| 38 | 3744 |
| 39 | 3844 |
| 40 | 1570 |
| 41 | 1041 |
| 42 | 746 |
| 43 | 1037 |
| 44 | 1363 |
| 45 | 934 |
| 46 | 545 |
| 47 | 503 |
| 48 | 439 |
| 49 | 393 |
| 50 | 662 |
| 51 | 436 |
| 52 | 863 |
| 53 | 393 |
| 54 | 684 |
| 55 | 372 |
| 56 | 366 |
| 57 | 842 |
| 58 | 398 |
| 59 | 206 |
| 60 | 208 |
| 61 | 177 |
| 62 | 377 |
| 63 | 450 |
| 64 | 341 |
| 65 | 86 |
| 66 | 78 |
| 67 | 191 |
| 68 | 280 |
| 69 | 61 |
| 70 | 209 |
| 71 | 330 |
| 72 | 171 |
| 73 | 190 |
| 74 | 142 |
| 75 | 102 |
| 76 | 32 |
| 77 | 57 |
| 78 | 50 |
| 79 | 26 |
| 80 | 31 |
| 81 | 63 |
| 82 | 38 |
| 83 | 26 |
| 84 | 72 |
| 85 | 205 |
| 86 | 73 |
| 87 | 67 |
| 88 | 21 |
| 89 | 15 |
| 90 | 6 |
| 91 | 12 |
| 92 | 10 |
| 93 | 8 |
| 94 | 16 |
| 95 | 24 |
| 96 | 7 |
| 97 | 30 |
| 98 | 4 |
| 99 | 1 |
| 100 | 6 |
| 101 | 7 |
| 102 | 16 |
| 103 | 1 |
| 104 | 5 |
| 105 | 1 |
| 106 | 19 |
| 108 | 2 |
| 109 | 2 |
| 110 | 1 |
| 111 | 3 |
| 112 | 1 |
| 113 | 1 |
| 114 | 3 |
| 115 | 5 |
| 116 | 5 |
| 118 | 1 |
| 120 | 5 |
| 124 | 1 |
| 125 | 1 |
| 131 | 2 |
| 132 | 1 |
| 134 | 2 |
| 136 | 1 |
| 137 | 1 |
| 138 | 1 |
| 142 | 1 |
| 143 | 2 |
| 144 | 1 |
| 158 | 1 |
| 159 | 2 |

### Projects with TypeScript but not JavaScript

Ah the modern world of TypeScript. But for projects that are using TypeScipt how many are using TypeScript exclusively?

| pure TypeScript projects |
| --------------- |
| 27,026 projects |

Have to admit, I am a little surprised by that number. While I understand mixing JavaScript with TypeScript is fairly common I would have thought there would be more projects using the new hotness. This may however be mostly down to the projects I was able to pull though and I suspect a refreshed project list with newer projects would change this number drastically.

### Anyone using CoffeeScript and TypeScript?

| using TypeScript and CoffeeScript |
| --------------- |
| 7,849 projects |

I have a feeling some TypeScript developers are dry heaving at the very thought of this. If it is of any comfort I suspect most of these projects are things like `scc` which uses examples of all languages mixed together for testing purposes.

### The most complex code is written in what language?

The complexity estimate isn't really directly comparable between languages. Pulling from the README

> The complexity estimate is really just a number that is only comparable to files in the same language. It should not be used to compare languages directly without weighting them. The reason for this is that its calculated by looking for branch and loop statements in the code and incrementing a counter for that file.

However like the curse/potty mouth check its fun so lets do it anyway. However to make this fair it really needs to be weighted based on the number of code lines to ensure it is closer to being a fair comparison.


### What's the typical path length, broken up by language

Given that you can either dump all the files you need in a single directory, or span them out using file paths whats the typical path length and number of directories?



### YAML or YML?

Sometime back on the company slack there was a "discussion" with many dying on one hill or the other over the use of .yaml or .yml

The debate can finally(?) be ended. Although I suspect some will still prefer to die on their chosen hill.

| extension | count |
| ----------- | ----- |
| yaml | 3,572,609 |
| yml | 14,076,349 |

### Who comments most-to-least, by language (95th percentile)

### Upper lower or mixed case?

What case style is used on filenames? This includes the extension so you would expect it to be mostly mixed case.

| style | count |
| ----- | ----- |
| mixed | 9,094,732 |
| lower | 2,476 |
| upper | 2,875 |

Which of course is not very interesting because generally file extensions are lowercase. What about if we ignore the file extension?

| style | count |
| ----- | ----- |
| mixed | 8,104,053 |
| lower | 347,458 |
| upper | 614,922 |

Not what I would have expected. Mostly mixed is normal, but I would have thought lower would be more popular.

### Java Factories

Another one that came up in the internal company slack when looking through some old Java code. I thought why not add a check for any Java code that has Factory, FactoryFactory or FactoryFactoryFactory in the name. The idea being to see how many factories are out there.

| type | count | percent |
| ---- | ----- | ------- |
| not factory | 271,375,574 | 97.9% |
| factory | 5,695,568 | 2.09% |
| factoryfactory | 25,316 | 0.009% |
| factoryfactoryfactory | 0 | 0% |

So slightly over 2% of all the Java code that I checked appeared to be a factory or factoryfactory. Thankfully there are no factoryfactoryfactories and perhaps that joke can finally die, although I am sure at least one non-ironic one exist somewhere in some Java 5 monolith that makes more money every day than I will see over my entire working life.

## Future ideas

Id love to do some analysis of tabs vs spaces. Scanning for things like AWS AKIA keys and the like would be pretty neat as well. Id also love to expand out the bitbucket and gitlab coverage and get it broken down via each to see if groups of developers from different camps hang out in different areas.

Shortcomings id love to overcome in the above if I decide to do this again.

 - Keeping the URL properly in the metadata somewhere. Using a filename to store this was a bad idea as it was lossy and means it can be hard to identify the file source and location.
 - Not bother with S3. There is little point to pay the bandwidth cost when I was only using it for storage. Better to just stuff into the tar file from the beginning.
 - Invest some time in learning some tool to help with plotting and charting of results.
 - Use a trie or some other data type to keep a full count of filenames rather than the slightly lossy approach I used.
 - Add an option to scc to check the type of the file based on keywords as examples such as https://bitbucket.org/abellnets/hrossparser/src/master/xml_files/CIDE.C was picked up as being a C file despite obviously being HTML when the content is inspected. To be fair all code counters I tried seem to make this mistake.

## So why bother?

Well I can take some of this information and plug it into searchcode.com, scc. As was the stated goal it is potentially very useful to know how your project compares to others. Besides it was a fun way to spend a few days solving some interesting problems.

In addition I am working on a tool that helps senior-developer or manager types analyze code looking for size, flaws etc... Assuming you have to watch multiple repositories. You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some code-base and getting an overview of what your development team is producing. Something like AWS Macie but for code is the angle I am thinking. It's something I need for my day job and I suspect others may find use in it, or at least thats the theory.

I should probably put an email sign up for that here at some point to gather interest for that.

## Raw / Processed Files

I have included a link to the processed files for those who wish to do their own analysis and corrections. If someone wants to host the raw files to allow others to download them which is 83 GB as a gzip file let me know and I can arrange the handover and link here.