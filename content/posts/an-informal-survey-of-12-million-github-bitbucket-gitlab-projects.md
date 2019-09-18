---
title: An informal survey of 12 million git projects from Github, Bitbucket and Gitlab
date: 2019-07-11
---

The tool I created [Sloc Cloc and Code (`scc`)](https://github.com/boyter/scc/) counts lines of code, comments and makes a guess at how complex some code is. The latter is something you need a good sample size to make use of. So I thought I would try running it at all the source code I could get my hands on.

However if I am going to run it over all that code anyway I may as well try to get some interesting numbers out of it.

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

It took over 24 hours to process the results and took about 5 weeks to download and run `scc` over the repositories.

## Methodology

Since I run [searchcode.com](https://searchcode.com/) I already have a collection of over 7,000,000 projects across git, mercurial, subversion and such. So why not try processing them? Working with git is usually the easiest solution so I ignored mercurial and subversion and exported the list of git projects. Turns out I actually have 12 million git repositories being tracked, and I should probably update the page to reflect that.

So now I have 12 million or so git repositories which I need to download and process.

A while back I wrote code to create github badges using `scc` https://boyter.org/posts/sloc-cloc-code-badges/ and since part of that included caching the results, I modified it slightly to cache the results into S3.

With the badge code working in AWS using lambda, I took the exported list and wrote about 15 lines of python to clean the format and make a request to the endpoint. I threw in some python multiprocessing to fork 32 processes to churn through them. 

This worked brilliantly. However the problem with the above was firstly the cost, and secondly because lambda behind API-Gateway/ALB has a 30 second timeout it couldn't process large repositories fast enough. I knew going in that this was not going to be the most cost effective solution but it could have been close to $100 which would have been fine. After processing 1 million or so the cost was about $60 and since I didn't want a $700 AWS bill I decided to rethink my solution.

Since I was already in AWS the cool answer would be to dump the messages into SQS and pull from this queue into multiple EC2 instances for processing, and scale out like crazy. However I always believed in [taco bell programming](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html) and as it was only 12 million repositories I opted to implement a simpler solution.

Running locally was out due to the abysmal state of internet in Australia. However I do run searchcode.com fairly lean. As such it usually has a lot of spare compute. The front-end varnish box for instance is doing the square root of zero most of the time. So why not run the processing there?

I didn't quite taco bell the solution using bash and gnu tools. What I did was write a simple [Go program](https://github.com/boyter/scc-data/blob/master/process/main.go) to spin up 32 go-routines which read from a channel (like SQS but not distributed) then spawned `git` and `scc` subprocesses before writing the JSON output into S3. I actually wrote a Python solution at first, but having to install the pip dependencies on my clean varnish box seemed like a bad idea and it keep breaking in odd ways which I didn't feel like debugging.

Running this on the box produced the following sort of metrics in htop, which is a sign that everything was working as expected.

![scc-data process load](/static/an-informal-survey/1.png#center)

## Results

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index I thought I would steal some of the format they provided. However this raised another question. How does one process 10 million JSON files in an S3 bucket?

The first thought was AWS Athena. But since it's going to cost about $2.50 USD *per query* with the amount of data I had I looked for an alternative.

One idea was to dump the data into a large SQL database. However this means processing the data into the database, then running queries over it perhaps multiple times. This feels wasteful because we could just process the data as we read it.

Seeing as I produced the JSON using spare compute, why not process the results the same way? Of course there is one issue with this. Pulling 1 TB of data out of S3 is going to cost a lot. In the event the program crashes thats going to be annoying. So I wanted to pull all the files down locally. However you really do not want to store lots of little files on disk in a single directory. It sucks for runtime performance and file-systems don't like it much.

My answer to this being to pull them into a tar file and then process that. Another [Go program](https://github.com/boyter/scc-data/blob/master/main.go) to process the tar file and done.

With that done, what I needed was a collection of questions to answer. So I crowd-sourced my work colleagues and came up with some of my own. The result of which is included below.

### How many files in a repository?

Starting with a simple one. How many files are in an average repository? Do most projects have a few files in them, or many? By looping over the repositories and counting the number of files we can then drop them in buckets of 1, 2, 10, 12 or however many files it has and plot it out.

![scc-data process load](/static/an-informal-survey/filesPerProject.png#center)

As you would expect most repositories have less than 100 files in them. However what about plotting this by percentile?

![scc-data process percentile](/static/an-informal-survey/filesPerProjectPercentile.png)

Note the X-axis is lines of code and is logarithmic. Turns out the vast majority of projects have less than 1000 files in them. While 90% of them have less than 300 files.

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

Had you asked me before I started I would have said, readme, main, index, license. Thankfully the results reflect my thoughts pretty well.

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

### Which language developers have the biggest potty mouth?

This is less than an exact science. Picking up cursing/swearing or offensive terms using filenames is never going to be effective. If you do a simple string contains test you pick up all sorts or normal files such as `assemble.sh` and such. So to produce the following I pulled a list of curse words, then checked if any files in each project start with one of those values followed by a period. This would mean a file named `gangbang.java` would be picked up while `assemble.sh` would not. 

The list I used contained some leet speak such as `b00bs` and `b1tch` to try and catch out the most interesting cases.

While not accurate at all and it misses all manner of things it is incredibly fun to see what this produces.

| language | filename curse count |
| -------- | ----------- |
| C | 5 |
| C Header | 2 |
| C# | 1 |
| Dart | 1 |
| Groovy | 3 |

Interesting! Those naught C developers! However what I really want to know is what are the most commonly used curse words.

| word | count |
| ---- | ----- |
| anal | 4 |
| ass | 4 |
| knob | 4 |


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

Ah the modern world of TypeScript. But for projects that are using TypeScipt how many are using TypeScript exclusively?

Of the 4317 projects using TypeScript only 17 use it without any JavaScript.

Have to admit, I am a little surprised by that number. While I understand mixing the two is fairly common I would have thought there would be more projects using the new hotness. This may however be mostly down to the projects I was able to pull though and a refreshed project list with newer projects may help.

### Anyone using CoffeeScript and TypeScript?

3 projects. 

The less said about this the better. I have a feeling some TypeScript developers are dry heaving at the very thought.

### The most complex code is written in what language?

The complexity estimate isn't really directly comparable between languages. Pulling from the README

> The complexity estimate is really just a number that is only comparable to files in the same language. It should not be used to compare languages directly without weighting them. The reason for this is that its calculated by looking for branch and loop statements in the code and incrementing a counter for that file.

However like the curse/potty mouth check its fun so lets do it anyway.

### Whats the most complex file?

### Whats the most complex file in each language?

Sorted by the complexity estimate.

| language | filename | complexity |
| -------- | -------- | ----- |
| JavaScript | worker-xquery.js | 17988 |
| Java | ClientService.java | 16956 |
| PHP | mpdf.php | 10882 |
| C | sqlite3.c | 8516 |
| Autoconf | Makefile.in | 6737 |
| Python | ClientService.py | 6566 |
| C++ | Player.cpp | 6375 |
| Perl | ClientService.pm | 4744 |
| C# | ApplicationBuilder.cs | 2687 |
| SQL | pbbteen_db.sql | 2338 |
| C Header | ClientService.h | 1938 |
| Batch | cpanm.bat | 1732 |
| SystemVerilog | multiplier_32b.v | 1507 |
| C++ Header | function_equal_50.hpp | 1225 |
| Objective C | RegexKitLite.m | 1219 |
| R | CIDE.R | 1163 |
| Shell | ltmain.sh | 1151 |
| Lua | Actor.lua | 1147 |
| Assembly | CIDE.S | 1057 |
| ActionScript | ListBase.as | 1041 |
| Ruby | markdown.rb | 998 |
| Vim Script | netrw.vim | 993 |
| Makefile | snort.mak | 926 |
| Specman e | CIDE.E | 711 |
| TypeScript | mumble_nb_NO.ts | 581 |
| TeX | snort_manual.tex | 533 |
| TCL | testutils.tcl | 426 |
| FORTRAN Legacy | GLMnet.F | 404 |
| Objective C++ | GBAEmulationViewController.mm | 389 |
| VHDL | test.vhd | 385 |
| Emacs Lisp | js2-mode.el | 384 |
| Visual Basic for Applications | IEEEtran.cls | 374 |
| Org | devdraw.org | 332 |
| Groovy | CompletedQuestionnaireService.groovy | 307 |
| CMake | cotire.cmake | 296 |
| Expect | gdb.exp | 288 |
| Haxe | Scene.hx | 269 |
| Smarty Template | Makefile.tpl | 200 |
| CoffeeScript | QR.coffee | 196 |
| Swift | VistaThingViewController.swift | 195 |
| Razor | RangeHelper.cshtml | 194 |
| Processing | LightController.pde | 186 |
| Module-Definition | set.def | 185 |
| Go | user.go | 178 |
| Boo | texinfo.tex | 150 |
| Julia | string.jl | 141 |
| JavaServer Pages | diff.jsp | 140 |
| Korn Shell | common.ksh | 137 |
| BASH | git-completion.bash | 134 |
| Puppet | vhost.pp | 124 |
| Wolfram | tutor.nb | 120 |
| Scala | sc | 118 |
| D | operator_overloading.d | 105 |
| Lisp | swank.lisp | 101 |
| Rust | vector.rs | 94 |
| Forth | zfs.fth | 88 |
| FORTRAN Modern | zmlrpc.f90 | 82 |
| Nim | example.nim | 80 |
| GLSL | target_fbo.frag | 71 |
| OCaml | format.ml | 71 |
| ASP | ckeditor.asp | 70 |
| Sass | _mixins.scss | 65 |
| Twig Template | _systemCheckSection.twig | 58 |
| Standard ML (SML) | hw1.sml | 53 |
| Xtend | DslValidator.xtend | 53 |
| ASP.NET | FlexModule.aspx | 52 |
| Ada | terminal_interface-curses-forms.adb | 52 |
| Brainfuck | hello.bf | 51 |
| Powershell | EntityFramework.psm1 | 51 |
| Mustache | components.mustache | 50 |
| Cython | polyglot2_inner.pyx | 50 |
| Zsh | .zshrc | 46 |
| Prolog | BerkeleyDB.pod.P | 42 |
| Rakefile | databases.rake | 35 |
| JSX | tree-node.jsx | 34 |
| Stylus | gradients.styl | 34 |
| Scons | sconscript | 31 |
| sed | pvcheck.sed | 30 |
| Haskell | Scheduled.hs | 30 |
| Jade | home.jade | 29 |
| AutoHotKey | key.ahk | 29 |
| Vala | TicTacToeBoard.vala | 27 |
| Mako | layout.mako | 26 |
| C Shell | distscript.csh | 24 |
| Fragment Shader File | example_ColorBars.fsh | 24 |
| Game Maker Language | iso-box.gml | 24 |
| Cabal | hubble.cabal | 21 |
| Bazel | README.build | 20 |
| Fish | brew_fish_completion.fish | 20 |
| F# | fs | 20 |
| Ruby HTML | class.rhtml | 19 |
| Dockerfile | Dockerfile | 19 |
| Erlang | wf_tags.erl | 19 |
| Gherkin Specification | yield.feature | 18 |
| QML | MainWindow.qml | 18 |
| Elixir | chap05_test.exs | 17 |
| Dart | clock.dart | 16 |
| Clojure | genclass.clj | 13 |
| Pascal | test.pas | 12 |
| Freemarker Template | pageTag.ftl | 12 |
| Handlebars | handlebars | 11 |
| IDL | libxl_types.idl | 9 |
| Monkey C | kmm_msgs.mc | 8 |
| Modula3 | mg | 8 |
| Protocol Buffers | alert.proto | 7 |
| TypeScript Typings | dx.all.d.ts | 7 |
| Alloy | ALS | 7 |
| Visual Basic | frmAutomatic_v3.vb | 6 |
| Kotlin | example.kt | 5 |
| COBOL | example.cob | 5 |
| CSS | iehacks.css | 5 |
| MSBuild | SocialGame.Services.csproj | 4 |
| Unreal Script | int.uc | 4 |
| V | v | 3 |
| SKILL | base.il | 3 |
| Stata | do | 2 |
| Bitbake | main.bb | 2 |
| Elm | ati-tbl.elm | 2 |
| Scheme | swank-kawa.scm | 2 |
| SVG | dice_clt.svg | 2 |
| Closure Template | config-template.soy | 2 |
| LD Script | u-boot.lds | 1 |
| Ceylon | example.ceylon | 1 |
| XAML | SettingsWindow.xaml | 1 |
| Coq | libavformat.v | 1 |

### Whats the most complex file weighted against lines?

This sounds good in practice, but in reality... anything minified or with no newlines skews the results making this one effectively pointless. As such I have not included this calculation.

### What's the typical path length, broken up by language

Given that you can either dump all the files you need in a single directory, or span them out using file paths whats the typical path length and number of directories?

### YAML or YML?

Sometime back on the company slack there was a "discussion" with many dying on one hill or the other over the use of .yaml or .yml

The debate can finally(?) be ended. Although I suspect some still prefer the hill.

| extension | count |
| ----------- | ----- |
| yaml | 975 |
| yml | 3712 |

### Who comments most-to-least, by language (95th percentile)


### Whats the most commented file?


### Upper lower or mixed case?

What case style is used on filenames? This includes the extension so you would expect it to be mostly mixed case.

| style | count |
| ----- | ----- |
| Mixed | 4322 |
| Lower | 1 |
| Upper | 11 |

Which of course is not very interesting. What about if we ignore the file extension?

| style | count |
| ----- | ----- |
| Mixed | 4005 |
| Lower | 214 |
| Upper | 103 |

What I would have expected really, mostly mixed, followed by lower and then upper.

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