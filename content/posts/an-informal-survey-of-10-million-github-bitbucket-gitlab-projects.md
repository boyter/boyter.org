---
title: An informal survey of 10 million git projects from Github, Bitbucket and Gitlab
date: 2019-07-11
---

The tool I created [Sloc Cloc and Code (`scc`)](https://github.com/boyter/scc/) counts lines of code, comments and makes a guess at how complex some code is. The latter is something you need a good sample size to make use of. So I thought I would try running it at all the source code I could get my hands on.

However if I am going to run it over all that code anyway I may as well try to get some interesting numbers out of it.

In this post I am looking at all the code I downloaded and processed using `scc`. The data set I looked at includes,

 - **9,100,083** repositories
 - **884,968** empty repositories (those with no files)
 - **58,389,641** files
 - **40,736,530,379,778** bytes
 - **1,086,723,618,560** lines
 - **816,822,273,469** code lines
 - **124,382,152,510** blank lines
 - **145,519,192,581** comment lines 
 - **71,884,867,919** complexity count
 - **83,407** seconds to process

It took just under a day to process the results and about 5 weeks to download and run `scc` over all of the repositories.

## Methodology

Since I run [searchcode.com](https://searchcode.com/) I already have a collection of over 7,000,000 projects across git, mercurial, subversion and such. So why not try processing them? Working with git is usually the easiest solution so I ignored mercurial and subversion and exported the list of git projects. Turns out I actually have 12 million git repositories being tracked, and I should probably update the page to reflect that.

So now I have 12 million or so git repositories which I need to download and process.

A while back I wrote code to create github badges using `scc` https://boyter.org/posts/sloc-cloc-code-badges/ and since part of that included caching the results, I modified it slightly to cache the results into S3.

With the badge code working in AWS using lambda, I took the exported list and wrote about 15 lines of python to clean the format and make a request to the endpoint. I threw in some python multiprocessing to fork 32 processes to churn through them. 

This worked brilliantly. However the problem with the above was firstly the cost, and secondly because lambda behind API-Gateway/ALB has a 30 second timeout it couldn't process large repositories fast enough. I knew going in that this was not going to be the most cost effective solution but it could have been close to $100 which would have been fine. After processing 1 million or so the cost was about $60 and since I didn't want a $700 AWS bill I decided to rethink my solution.

Since I was already in AWS the hip solution would be to dump the messages into SQS and pull from this queue into EC2 instances or fargate for processing. Then scale out like crazy. However despite working in AWS in my day job I have always believed in [taco bell programming](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html) and as it was only 12 million repositories I opted to implement a simpler solution.

Running this computation locally was out due to the abysmal state of the internet in Australia. However I do run searchcode.com fairly lean. As such it usually has a lot of spare compute. The front-end varnish box for instance is doing the square root of zero most of the time. So why not run the processing there?

I didn't quite taco bell program the solution using bash and gnu tools. What I did was write a simple [Go program](https://github.com/boyter/scc-data/blob/master/process/main.go) to spin up 32 go-routines which read from a channel then spawned `git` and `scc` subprocesses before writing the JSON output into S3. I actually wrote a Python solution at first, but having to install the pip dependencies on my clean varnish box seemed like a bad idea and it keep breaking in odd ways which I didn't feel like debugging.

Running this on the box produced the following sort of metrics in htop, and the multiple git/scc processes running suggested that everything was working as expected, which I confirmed by looking at the results in S3.

![scc-data process load](/static/an-informal-survey/1.png#center)

## Results

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index I thought I would steal some of the format of that post. However this raised another question. How does one process 10 million JSON files in an S3 bucket?

The first thought was AWS Athena. But since it's going to cost about $2.50 USD **per query** with the amount of data I had I looked for an alternative.

One idea was to dump the data into a large SQL database. However this means processing the data into the database, then running queries over it perhaps multiple times. This feels wasteful because we could just process the data as we read it.

Seeing as I produced the JSON using spare compute, why not process the results the same way? Of course there is one issue with this. Pulling 1 TB of data out of S3 is going to cost a lot. In the event the program crashes thats going to be annoying. So I wanted to pull all the files down locally. One issue with this is that you really do not want to store lots of little files on disk in a single directory. It sucks for runtime performance and file-systems don't like it.

My answer to this was to pull them into a tar file and then process that. Another [Go program](https://github.com/boyter/scc-data/blob/master/main.go) to process the tar file and done.

With that done, what I needed was a collection of questions to answer. I crowd-sourced my work colleagues and came up with some of my own. The result of which is included below.

### Data Sources

From the three sources, github, bitbucket and gitlab how many projects came from each?

| source | count |
| ------ | ----- |
| github | 9,680,111 |
| bitbucket | 248,217 |
| gitlab | 56,722 |

### How many files in a repository?

On to the real stats. Lets start with a simple one. How many files are in an average repository? Do most projects have a few files in them, or many? By looping over the repositories and counting the number of files we can then drop them in buckets of 1, 2, 10, 12 or however many files it has and plot it out.

![scc-data files per project](/static/an-informal-survey/filesPerProject.png#center)

The X-axis in this case being buckets of the count of files, and Y-axis being the count of projects with that many files. This is limited to projects with less than 1000 files because the plot looks like empty with a thin smear on the left side.

As you would expect most repositories have less than 200 files in them. However what about plotting this by percentile?

![scc-data files per project percentile](/static/an-informal-survey/filesPerProjectPercentile.png)

Note the X-axis is logarithmic. Turns out the vast majority of projects have less than 1,000 files in them. While 90% of them have less than 300 files. Projects with 0 files are ignored.

However lets just to the above for the first 95th percentile so its actually worth looking at.

![scc-data files per project 95th](/static/an-informal-survey/filesPerProjectPercentile95.png)

Most projects have less than 100 files in them and 85% have less than 200. If you want to plot this yourself and do a better job than I here is a link to the raw data [filesPerProject.json](/static/an-informal-survey/filesPerProject.json).

### Whats the breakdown per language?

That is, how many files of each language did we process starting with a visual indication.

![scc-data language breakdown](/static/an-informal-survey/countProjectsPerLanguage.png)

The full list is included below.

| language | file count |
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
| makefile | 59141098 |
| index | 33962093 |
| readme | 22964539 |
| jquery | 20015171 |
| main | 12308009 |
| package | 10975828 |
| license | 10441647 |
| \__init__ | 10193245 |
| strings | 8414494 |
| android | 7915225 |
| config | 7391812 |
| default | 5563255 |
| build | 5510598 |
| setup | 5291751 |
| test | 5282106 |
| irq | 4914052 |
| 15 | 4295032 |
| country | 4274451 |
| pom | 4054543 |
| io | 3642747 |
| system | 3629821 |
| common | 3629698 |
| gpio | 3622587 |
| core | 3571098 |
| module | 3549789 |
| init | 3378919 |
| dma | 3301536 |
| bootstrap | 3162859 |
| application | 3000210 |
| time | 2928715 |
| cmakelists | 2907539 |
| plugin | 2881206 |
| base | 2805340 |
| s15 | 2733747 |
| androidmanifest | 2727041 |
| cache | 2695345 |
| debug | 2687902 |
| file | 2629406 |
| app | 2588208 |
| version | 2580288 |
| assemblyinfo | 2485708 |
| exception | 2471403 |
| project | 2432361 |
| util | 2412138 |
| user | 2343408 |
| clock | 2283091 |
| timex | 2280225 |
| pci | 2231228 |
| style | 2226920 |
| styles | 2212127 |

Note that due to memory constraints I had to make this process slightly lossy. Every 100 projects checked I would check the map and if an identified filename had < 10 counts it was dropped from the list. It could come back for the next run and if there was > 10 at this point it would remain. It shouldn't happen that often but it is possible the counts may be out by some amount if some common name appeared sparsely in the first batch of repositories before becoming common. In short they are not absolute numbers but should be close enough.

### Whats the average size of those index pages?

We know that the most common filenames, but what about knowing whats the average size of them? Annoyingly this meant running the above first and then taking the output and reprocessing.

### How many repositories appear to be missing a license?

This is an interesting one. Which repositories have an explicit license file somewhere? Not that the lack of a license file does not mean that the project has none, it might exist within the README for example or be indicated through SPDX comment tags.

| has license | count |
| ----------- | ----- |
| yes | 6,502,753 |
| no | 2,597,330 |

![scc-data license count](/static/an-informal-survey/hasLicense.png#center)

### Which languages have the most comments?

### How many projects use multiple .gitignore files?

Some may not know this but it is possible to have multiple .gitignore files in a git project. Given that fact how many projects use multiple .gitignore files? While we are looking how many have none?

![scc-data process load](/static/an-informal-survey/gitignorePerProject.png#center)

As you would expect the majority of projects have either 0 or 1 gitignore file. However a lot more than I would have suspected have more.

### Which language developers have the biggest potty mouth?

This is less than an exact science. Picking up cursing/swearing or offensive terms using filenames is never going to be effective. If you do a simple string contains test you pick up all sorts or normal files such as `assemble.sh` and such. So to produce the following I pulled a list of curse words, then checked if any files in each project start with one of those values followed by a period. This would mean a file named `gangbang.java` would be picked up while `assemble.sh` would not. 

The list I used contained some leet speak such as `b00bs` and `b1tch` to try and catch out the most interesting cases.

While not accurate at all and it misses all manner of things it is incredibly fun to see what this produces.

| language | filename curse count |
| -------- | ----------- |
| C Header | 7660 |
| Java | 7023 |
| C | 6897 |
| PHP | 5713 |
| JavaScript | 4306 |
| HTML | 3560 |
| Ruby | 3121 |
| JSON | 1598 |
| C++ | 1543 |
| Dart | 1533 |
| Rust | 1504 |
| Go Template | 1500 |
| SVG | 1234 |
| XML | 1212 |
| JavaServer Pages | 1037 |
| Python | 1092 |

Interesting! Those naughty C developers! However we should probably weight this against how much code exists. Which produces the following,

ADD WEIGHTED BY LANGUAGE COUNT HERE

However what I really want to know is what are the most commonly used curse words. Lets see collectively how dirty a mind we have. A few of the top ones I could see being legitimate names, but the majority would certainly produce few comments in a PR if not a raised eyebrow.

| word | count |
| ---- | ----- |
| ass | 11358 |
| knob | 10368 |
| balls | 8001 |
| xxx | 7205
| sex | 5021 |
| nob | 3385 |
| pawn | 2919 |
| hell | 2819 |
| crap | 1112 |
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

### Top 40 longest files in lines per language

As you would probably expect Plain Text, SQL, XML, JSON and CSV take the top positions of this one, seeing as they usually contain metadata, database dumps and the like.

Limited to 40 because at some point there is only a hello world example or such available and the result is not very interesting. It is not suprising to see that someone has checked in `sqlite3.c` somewhere but I would be a little worried about that 25k line Python file and that 9k line TypeScript monster.

https://github.com/donsheehy/barcode/blob/master/spiral_4D_2k_dim4_standard_rips_threshold0_625_log.m

| language | filename | lines |
| -------- | -------- | ----- |
| JSON | model.json | 11313134 |
| Sass | large_empty.scss | 10000000 |
| CSV | return_data_sp500.csv | 6486577 |
| Plain Text | bgramPickle.txt | 5264667 |
| SQL | V1_08.12.2014.13.44__T_ADDRESS_DATA.sql | 914442 |
| XML | 13.xml | 463337 |
| SVG | membres-publications.svg | 444080 |
| C Header | firmware_nautilus_2_0-3006x_nscd.h | 417297 |
| JavaScript | mandreel.js | 277403 |
| C | sqlite3.c | 141343 |
| PHP | Players.php | 131168 |
| Java | ClientService.java | 121051 |
| HTML | benchmark.html | 111608 |
| Patch | klips.patch | 111156 |
| Perl | Language_Codes.pm | 97190 |
| Assembly | CIDE.S | 94241 |
| Prolog | CIDE.P | 68311 |
| C++ | LuaCocos2d.cpp | 67887 |
| Autoconf | Makefile.in | 52450 |
| HEX | ipw2100-1.3.fw.hex | 26149 |
| Python | ClientService.py | 25602 |
| C# | Reference.cs | 23985 |
| CSS | xenon.css | 22560 |
| Lua | weaponfactorytweakdata.lua | 21229 |
| TeX | xenapi-datamodel.tex | 20245 |
| LaTeX | TeXbyTopic.tex | 19093 |
| Intel HEX | bnx2x-e2-7.2.51.0.fw.ihex | 18459 |
| Ruby | markdown.rb | 15961 |
| Happy | gram.y | 14004 |
| SystemVerilog | multiplier_32b.v | 13932 |
| Emacs Lisp | color-theme-library.el | 13539 |
| ASP.NET | AdminService_14.asmx | 13234 |
| Batch | cpanm.bat | 12633 |
| Shell | ltmain.sh | 11030 |
| m4 | aclocal.m4 | 10027 |
| Makefile | snort.mak | 9996 |
| Vim Script | netrw.vim | 9858 |
| ActionScript | ListBase.as | 9397 |
| gitignore | .gitignore | 9066 |
| TypeScript | mumble_de.ts | 9013 |

### Whats the largest file for each language?

Across all the languages we looked at whats the largest file by number of bytes for each one? This means ignoring newlines and the like so its closer to finding checked in data files, which is less interesting but still pretty neat.

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

That is projects that have 1 language in them. Of course that would not be very interesting by itself, so lets see what the spread is. Turns out most projects have fewer than 20 languages in them with most in the less than 10 bracket.

Of course pure projects might only have one programming language, but have lots of supporting other formats such as markdown, json, yml, css, .gitignore and the like. It's probably reasonable to assume that any project with less than 5 languages is "pure" and as it turns out is the majority.

![scc-data pure projects](/static/an-informal-survey/languagesPerProject.png#center)

### Projects with TypeScript but not JavaScript

Ah the modern world of TypeScript. But for projects that are using TypeScipt how many are using TypeScript exclusively?

| pure TypeScript projects |
| --------------- |
| 27,026 projects |

Have to admit, I am a little surprised by that number. While I understand mixing JavaScript with TypeScript is fairly common I would have thought there would be more projects using the new hotness. This may however be mostly down to the projects I was able to pull though and a refreshed project list with newer projects may help.

### Anyone using CoffeeScript and TypeScript?

| TypeScript and CoffeeScript |
| --------------- |
| 7,849 projects |

The less said about this the better. I have a feeling some TypeScript developers are dry heaving at the very thought. If its any comfort I suspect most of them are things like scc which uses examples of all languages for testing purposes.

### The most complex code is written in what language?

The complexity estimate isn't really directly comparable between languages. Pulling from the README

> The complexity estimate is really just a number that is only comparable to files in the same language. It should not be used to compare languages directly without weighting them. The reason for this is that its calculated by looking for branch and loop statements in the code and incrementing a counter for that file.

However like the curse/potty mouth check its fun so lets do it anyway.

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

This sounds good in practice, but in reality... anything minified or with no newlines skews the results making this one effectively pointless. As such I have not included this calculation. I have however created an issue inside `scc` to support detection of minified code so it can be removed from the calculation results https://github.com/boyter/scc/issues/91

### What's the typical path length, broken up by language

Given that you can either dump all the files you need in a single directory, or span them out using file paths whats the typical path length and number of directories?

### YAML or YML?

Sometime back on the company slack there was a "discussion" with many dying on one hill or the other over the use of .yaml or .yml

The debate can finally(?) be ended. Although I suspect some still prefer their hill.

| extension | count |
| ----------- | ----- |
| yaml | 3,572,609 |
| yml | 14,076,349 |

### Who comments most-to-least, by language (95th percentile)


### Whats the most commented file?


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

## So why bother?

Well I can take some of this information and plug it into searchcode.com, scc. It's potentially very useful to know how your project compares to others out there. Besides it was a fun way to spend a few days solving some interesting problems.

In addition I am working on a tool that helps senior-developer or manager types analyze code looking for size, flaws etc... Assuming you have to watch multiple repositories. You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some code-base and getting an overview of what your development team is producing. Something like AWS Macie but for code is the angle I am thinking. It's something I need for my day job currently.

I should probably put an email sign up for that here at some point to gather interest for that.