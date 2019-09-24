---
title: An informal survey of 10 million git projects from Github, Bitbucket and Gitlab
date: 2019-09-20
---

The tool I created [Sloc Cloc and Code (`scc`)](https://github.com/boyter/scc/) counts lines of code, comments and makes a guess at how complex some code is. The latter is something you need a good sample size to make use of. So I thought I would try running it at all the source code I could get my hands on.

However if I am going to run it over all that code which is going to be expensive computationally I may as well try to get some interesting numbers out of it. As such I decided to record everything as I went and produce this post.

In this post I am looking at all the code I downloaded and processed using `scc`. The data set I looked at includes,

 - **9,100,083** repositories
 - **884,968** empty repositories (those with no files)
 - **58,389,641** file looked at in all repositories
 - **40,736,530,379,778** bytes processed (40 TB)
 - **1,086,723,618,560** lines processed
 - **816,822,273,469** code lines identified
 - **124,382,152,510** blank lines identified
 - **145,519,192,581** comment lines identified
 - **71,884,867,919** complexity count according to scc rules
 - **177,938** seconds to process 1TB of JSON (49 hours)

It took about 5 weeks to download and run `scc` over all of the repositories collecting all of the data. It took just over 49 hours to crunch and process the results.

## Methodology

Since I run [searchcode.com](https://searchcode.com/) I already have a collection of over 7,000,000 projects across git, mercurial, subversion and such. So why not try processing them? Working with git is usually the easiest solution so I ignored mercurial and subversion and exported the list of git projects. Turns out I actually have 12 million git repositories being tracked, and I should probably update the page to reflect that.

So now I have 12 million or so git repositories which I need to download and process.

A while back I wrote code to create github badges using `scc` https://boyter.org/posts/sloc-cloc-code-badges/ and since part of that included caching the results, I modified it slightly to cache the results into S3.

With the badge code working in AWS using lambda, I took the exported list and wrote about 15 lines of python to clean the format and make a request to the endpoint. I threw in some python multiprocessing to fork 32 processes to churn through them. 

This worked brilliantly. However the problem with the above was firstly the cost, and secondly because lambda behind API-Gateway/ALB has a 30 second timeout it couldn't process large repositories fast enough. I knew going in that this was not going to be the most cost effective solution but it could have been close to $100 which would have been fine. After processing 1 million or so the cost was about $60 and since I didn't want a $700 AWS bill I decided to rethink my solution.

Since I was already in AWS the hip solution would be to dump the messages into SQS and pull from this queue into EC2 instances or fargate for processing. Then scale out like crazy. However despite working in AWS in my day job I have always believed in [taco bell programming](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html) and as it was only 12 million repositories I opted to implement a simpler solution.

Running this computation locally was out due to the abysmal state of the internet in Australia. However I do run [searchcode.com](https://searchcode.com/) fairly lean. As such it usually has a lot of spare compute. The front-end varnish box for instance is doing the square root of zero most of the time. So why not run the processing there?

I didn't quite taco bell program the solution using bash and gnu tools. What I did was write a simple [Go program](https://github.com/boyter/scc-data/blob/master/process/main.go) to spin up 32 go-routines which read from a channel then spawned `git` and `scc` subprocesses before writing the JSON output into S3. I actually wrote a Python solution at first, but having to install the pip dependencies on my clean varnish box seemed like a bad idea and it keep breaking in odd ways which I didn't feel like debugging.

Running this on the box produced the following sort of metrics in htop, and the multiple git/scc processes running suggested that everything was working as expected, which I confirmed by looking at the results in S3.

![scc-data process load](/static/an-informal-survey/1.png#center)

## Results

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index I thought I would steal the format of that post with regards to how I wanted to present the information. However this raised another question. How does one process 10 million JSON files in an S3 bucket?

The first thought I had was AWS Athena. But since it's going to cost about $2.50 USD **per query** with the amount of data I had I quickly looked for an alternative.

I posted the question on the company slack because hey why should I solve every issue by myself.

One idea raised was to dump the data into a large SQL database. However this means processing the data into the database, then running queries over it multiple times. This feels wasteful because we could just process the data as we read it. I also was worried about building a database this large and then adding the indexes to ensure things run quickly enough.

Seeing as I produced the JSON using spare compute, I thought why not process the results the same way? Of course there is one issue with this. Pulling 1 TB of data out of S3 is going to cost a lot. In the event the program crashes thats going to be annoying. I wanted to pull all the files down locally. One issue with this is that you really do not want to store lots of little files on disk in a single directory. It sucks for runtime performance and file-systems don't like it.

My answer to this was to pull them into a tar file and then process that. Another **very ugly** [Go program](https://github.com/boyter/scc-data/blob/master/main.go) to process the tar file and I could rerun my questions without having to trawl S3 over and over.

With that done, what I needed was a collection of questions to answer. I used the slack brains trust again and crowd-sourced my work colleagues while I came up with some ideas of my own. The result of this mind meld is included below.

### Data Sources

From the three sources, github, bitbucket and gitlab how many projects came from each? Note that this is counted before excluding empty repositories hence the sum is over the number of repositories that actually form the counts below.

| source | count |
| ------ | ----- |
| github | 9,680,111 |
| bitbucket | 248,217 |
| gitlab | 56,722 |

### How many files in a repository?

On to the real questions. Lets start with a simple one. How many files are in an average repository? Do most projects have a few files in them, or many? By looping over the repositories and counting the number of files we can then drop them in buckets of 1, 2, 10, 12 or however many files it has and plot it out.

![scc-data files per project](/static/an-informal-survey/filesPerProject.png#center)

The X-axis in this case being buckets of the count of files, and Y-axis being the count of projects with that many files. This is limited to projects with less than 1000 files because the plot looks like empty with a thin smear on the left side if you include all the outliers.

As it turns out most repositories have less than 200 files in them. 

However what about plotting this by percentile, or more specifically by 95th percentile so its actually worth looking at? Turns out the vast majority of projects have less than 1,000 files in them. While 90% of them have less than 300 files and 85% have less than 200.

![scc-data files per project 95th](/static/an-informal-survey/filesPerProjectPercentile95.png)

If you want to plot this yourself and do a better job than I here is a link to the raw data [filesPerProject.json](/static/an-informal-survey/filesPerProject.json).

### Whats the project breakdown per language?

This means if we see any Java file in a project we increment the Java count by one and for the second file do nothing. This gives a quick view of what languages are most commonly used. Unsurprisingly the most common languages are markdown, .gitignore and plain text.

Markdown is the most commonly used language in any project and included in just over 6 million projects which is about 2/3 of the entire project set. This makes sense since almost all projects include a README.md which is displayed in HTML on all sources.

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

I could have used a trie structure to "compress" the space and gotten absolute numbers. I didn't feel like writing one. I am however curious enough to try this out at a later date to see how much compression we can get out of it.

### Whats the average size of those index pages?

We know that the most common filenames, but what about knowing whats the average size of them? Annoyingly this meant running the above first and then taking the output and reprocessing.

### How many repositories appear to be missing a license?

This is an interesting one. Which repositories have an explicit license file somewhere? Note that the lack of a license file does not mean that the project has none, as it might exist within the README or be indicated through SPDX comment tags in-line.

| has license | count |
| ----------- | ----- |
| yes | 6,502,753 |
| no | 2,597,330 |

![scc-data license count](/static/an-informal-survey/hasLicense.png#center)

### Which languages have the most comments?



### How many projects use multiple .gitignore files?

Some may not know this but it is possible to have multiple .gitignore files in a git project. Given that fact how many projects use multiple .gitignore files? While we are looking how many have none?

// **TODO** find that repository with 25,794 gitignores

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
| JavaServer Pages | 1,037 |
| Python | 1,092 |

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

As you would probably expect Plain Text, SQL, XML, JSON and CSV take the top positions of this one, seeing as they usually contain metadata, database dumps and the like.

Limited to 40 because at some point there is only a hello world example or such available and the result is not very interesting. It is not suprising to see that someone has checked in `sqlite3.c` somewhere but I would be a little worried about that 3,064,594 line Python file and that 1,997,637 line TypeScript monster.

// TODO add links to all of these files

https://github.com/donsheehy/barcode/blob/master/spiral_4D_2k_dim4_standard_rips_threshold0_625_log.m

| language | filename | lines |
| -------- | -------- | ----- |
| Plain Text | 1366100696temp.txt | 347671811 |
| PHP | phpfox_error_log_04_04_12_3d4b11f6ee2a89fd5ace87c910cee04b.php | 121930973 |
| HTML | yo.html | 54596752 |
| LEX | l | 39743785 |
| XML | dblp.xml | 39445222 |
| Autoconf | 21-t2.in | 33526784 |
| CSV | ontology.csv | 31946031 |
| Prolog | top500_full.p | 22428770 |
| JavaScript | mirus.js | 22023354 |
| JSON | douglasCountyVoterRegistration.json | 21104668 |
| Game Maker Language | lg.gml | 13302632 |
| C Header | trk6data.h | 13025371 |
| Objective C++ | review-1.mm | 12788052 |
| SQL | newdump.sql | 11595909 |
| Patch | clook_iosched-team01.patch | 10982879 |
| YAML | data.yml | 10764489 |
| SVG | large-file.svg | 10485763 |
| Sass | large_empty.scss | 10000000 |
| Assembly | J.s | 8388608 |
| LaTeX | tex | 8316556 |
| C++ Header | primpoly_impl.hh | 8129599 |
| Lisp | simN.lsp | 7233972 |
| Perl | aimlCore3.pl | 6539759 |
| SAS | output.sas | 5874153 |
| C | CathDomainDescriptionFile.v3.5.c | 5440052 |
| Lua | giant.lua | 5055019 |
| R | disambisearches.R | 4985492 |
| MUMPS | ref.mps | 4709289 |
| HEX | combine.hex | 4194304 |
| Python | mappings.py | 3064594 |
| Scheme | atomspace.scm | 3027366 |
| C++ | Int.cpp | 2900609 |
| Properties File | nuomi_active_user_ids.properties | 2747671 |
| Alex | Dalek.X | 2459209 |
| TCL | TCL | 2362970 |
| Ruby | smj_12_2004.rb | 2329560 |
| Wolfram | hmm.nb | 2177422 |
| Brainfuck | BF | 2097158 |
| TypeScript | all_6.ts | 1997637 |
| Module-Definition | matrix.def | 1948817 |
| LESS | less | 1930356 |
| Objective C | faster.m | 1913966 |
| Org | default.org | 1875096 |
| Jupyter | ReHDDM - AllGo sxFits-Copy0.ipynb | 1780197 |
| Specman e | twitter.e | 1768135 |
| F* | Pan_troglodytes_monomers.fst | 1739878 |
| Systemd | video_clean_lower_tokenized.target | 1685570 |
| V | ImageMazeChannelValueROM.v | 1440068 |
| Markdown | eukaryota.md | 1432161 |
| TeX | japanischtest.tex | 1337456 |
| Forth | europarl.tok.fr | 1288074 |
| Shell | add_commitids_to_src.sh | 1274873 |
| SKILL | hijacked.il | 1187701 |
| CSS | 7f116c3.css | 1170216 |
| C# | Form1.cs | 1140480 |
| gitignore | .gitignore | 1055167 |
| Boo | 3.out.tex | 1032145 |
| Java | Monster.java | 1000019 |
| ActionScript | as | 1000000 |
| MSBuild | train.props | 989860 |
| D | D | 883308 |
| Coq | CompiledDFAs.v | 873354 |
| Clojure | raw-data.clj | 694202 |
| Swig | 3DEditor.i | 645117 |
| Happy | y | 624673 |
| GLSL | capsid.vert | 593618 |
| Verilog | pipeline.vg | 578418 |
| Standard ML (SML) | Ambit3-HRVbutNoHR.sml | 576071 |
| SystemVerilog | bitcoinminer.v | 561974 |
| Visual Basic | linqStoreProcs.designer.vb | 561067 |
| Go | info.go | 559236 |
| Expect | Argonne_hourly_dewpoint.exp | 552269 |
| Erlang | sdh_analogue_data.erl | 473924 |
| Makefile | Makefile | 462433 |
| QML | 2005.qml | 459113 |
| SPDX | linux-coreos.spdx | 444743 |
| VHDL | cpuTest.vhd | 442043 |
| ASP.NET | AllProducts.aspx | 438423 |
| XML Schema | AdvanceShipNotices.xsd | 436055 |
| Elixir | gene.train.with.rare.ex | 399995 |
| Macromedia eXtensible Markup Language | StaticFlex4PerformanceTest20000.mxml | 399821 |
| Ada | bmm_top.adb | 390275 |
| TypeScript Typings | dojox.d.ts | 384171 |
| Pascal | FHIR.R4.Resources.pas | 363291 |
| COBOL | cpy | 358745 |
| Basic | excel-vba-streams-#1.bas | 333707 |
| Visual Basic for Applications | Dispatcher.cls | 332266 |
| Puppet | main_110.pp | 314217 |
| FORTRAN Legacy | f | 313599 |
| OCaml | Pent.ML | 312749 |
| FORTRAN Modern | slatec.f90 | 298677 |
| CoffeeScript | dictionary.coffee | 271378 |
| Nix | hackage-packages.nix | 259940 |
| Intel HEX | epdc_ED060SCE.fw.ihex | 253836 |
| Scala | models_camaro.sc | 253559 |
| Julia | *IJulia 0*.jl | 221058 |
| SRecode Template | espell.srt | 216243 |
| sed | CSP-2004fe.SED | 214290 |
| ReStructuredText | S40HO033.rst | 211403 |
| Bosque | world_dem_5arcmin_geo.bsq | 199238 |
| Emacs Lisp | ubermacros.el | 195861 |
| F# | Ag_O1X5.5_O2X0.55.eam.fs | 180008 |
| GDScript | 72906.gd | 178628 |
| Gherkin Specification | feature | 175229 |
| Haskell | Excel.hs | 173039 |
| Dart | surnames_list.dart | 153144 |
| Bazel | matplotlib_1.3.1-1_amd64-20140427-1441.build | 149234 |
| Haxe | elf-x86id.hx | 145800 |
| IDL | all-idls.idl | 129435 |
| LD Script | kernel_partitions.lds | 127187 |
| Monkey C | LFO_BT1-point.mc | 120881 |
| Modula3 | tpch22.m3 | 120185 |
| Batch | EZhunter.cmd | 119341 |
| Rust | data.rs | 114408 |
| Ur/Web | dict.ur-en.ur | 113911 |
| Unreal Script | orfs.derep_id97.uc | 110737 |
| Groovy | groovy | 100297 |
| Smarty Template | assign.100000.tpl | 100002 |
| Bitbake | bb | 100000 |
| BASH | palmer-master-thesis.bash | 96911 |
| PSL Assertion | test_uno.psl | 96253 |
| ASP | sat_gbie_01.asp | 95144 |
| Protocol Buffers | select1.proto | 89796 |
| Report Definition Language | ACG.rdl | 84666 |
| Powershell | PresentationFramework.ps1 | 83861 |
| Jinja | jinja2 | 76040 |
| AWK | words-large.awk | 69964 |
| LOLCODE | lol | 67520 |
| Wren | reuse_constants.wren | 65550 |
| JSX | AEscript.jsx | 65108 |
| Rakefile | seed.rake | 63000 |
| Stata | .31113.do | 60343 |
| Vim Script | ddk.vim | 60282 |
| Swift | Google.Protobuf.UnittestEnormousDescriptor.proto.swift | 60236 |
| Korn Shell | attachment-0002.ksh | 58298 |
| AsciiDoc | index.adoc | 52627 |
| Freemarker Template | designed.eml.ftl | 52160 |
| Cython | CALC.pex.netlist.CALC.pxi | 50283 |
| m4 | ax.m4 | 47828 |
| Extensible Stylesheet Language Transformations | green_ccd.xslt | 37247 |
| License | copyright | 37205 |
| JavaServer Pages | 1MB.jsp | 36007 |
| Document Type Definition | bookmap.dtd | 32815 |
| Fish | Godsay.fish | 31112 |
| ClojureScript | core.cljs | 31013 |
| Robot Framework | robot | 30460 |
| Processing | data.pde | 30390 |
| Ruby HTML | big_table.rhtml | 29306 |
| ColdFusion | spreadsheet2009Q1.cfm | 27974 |
| CMake | ListOfVistARoutines.cmake | 27550 |
| ATS | test06.dats | 24350 |
| Nim | windows.nim | 23949 |
| Vue | Ogre.vue | 22916 |
| Razor | validationerror.cshtml | 22832 |
| Spice Netlist | input6.ckt | 22454 |
| Isabelle | WooLam_cert_auto.thy | 22312 |
| XAML | SymbolDrawings.xaml | 20764 |
| Opalang | p4000_g+5.0_m0.0_t00_st_z+0.00_a+0.00_c+0.00_n+0.00_o+0.00_r+0.00_s+0.00.opa | 20168 |
| TOML | too_large.toml | 20000 |
| Madlang | evgg.mad | 19416 |
| Stylus | test.styl | 19127 |
| Go Template | html-template.tmpl | 19016 |
| AutoHotKey | glext.ahk | 18036 |
| ColdFusion CFScript | IntakeHCPCIO.cfc | 17606 |
| Zsh | _oc.zsh | 17307 |
| Twig Template | show.html.twig | 16320 |
| ABAP | ZRIM01F01.abap | 16029 |
| Elm | 57chevy.elm | 14968 |
| Kotlin | _Arrays.kt | 14396 |
| Varnish Configuration | 40_generic_attacks.vcl | 13367 |
| Mustache | huge.mustache | 13313 |
| Alloy | output.als | 12168 |
| Device Tree | tegra132-flounder-emc.dtsi | 11893 |
| MQL4 | PhD Appsolute System.mq4 | 11280 |
| Jade | fugue.jade | 10711 |
| Q# | in_navegador.qs | 10025 |
| JSONL | train.jsonl | 10000 |
| Flow9 | graph2.flow | 9902 |
| Vala | mwp.vala | 8765 |
| Handlebars | theme.scss.hbs | 8259 |
| Crystal | CR | 8084 |
| C Shell | plna.csh | 8000 |
| Hamlet | hamlet | 7882 |
| BuildStream | biometrics.bst | 7746 |
| Mako | verificaciones.mako | 7306 |
| Agda | Pifextra.agda | 6483 |
| Thrift | concourse.thrift | 6471 |
| Fragment Shader File | ms812_bseqoslabel_l.fsh | 6269 |
| Cargo Lock | Cargo.lock | 6202 |
| Xtend | UMLSlicerAspect.xtend | 5936 |
| Arvo | test-extra-large.avsc | 5378 |
| Scons | SConstruct | 5272 |
| Closure Template | buckconfig.soy | 5189 |
| GN | BUILD.gn | 4653 |
| Softbridge Basic | owptext.sbl | 4646 |
| PKGBUILD | PKGBUILD | 4636 |
| Oz | StaticAnalysis.oz | 4500 |
| Lucius | bootstrap.lucius | 3992 |
| Ceylon | RedHatTransformer.ceylon | 3907 |
| Creole | MariaDB_Manager_Monitors.creole | 3855 |
| Luna | Base.luna | 3731 |
| Gradle | dependencies.gradle | 3612 |
| MQL Header | IncGUI.mqh | 3544 |
| Cabal | smartword.cabal | 3452 |
| Emacs Dev Env | ede | 3400 |
| Meson | meson.build | 3264 |
| nuspec | Npm.js.nuspec | 2823 |
| Game Maker Project | LudumDare.yyp | 2679 |
| Julius | default-layout.julius | 2454 |
| Idris | ring_reduce.idr | 2434 |
| Alchemist | out.lmf-dos.crn | 2388 |
| MQL5 | DTS1-Build_814.1_B-test~.mq5 | 2210 |
| Android Interface Definition Language | ITelephony.aidl | 2005 |
| Vertex Shader File | sdk_macros.vsh | 1922 |
| Lean | interactive.lean | 1664 |
| Jenkins Buildfile | Jenkinsfile | 1559 |
| FIDL | amb.in.fidl | 1502 |
| Pony | scenery.pony | 1497 |
| PureScript | prelude.purs | 1225 |
| TaskPaper | task-3275.taskpaper | 1196 |
| Dockerfile | Dockerfile | 1187 |
| Janet | Janet | 1158 |
| Futhark | math.fut | 990 |
| Zig | main.zig | 903 |
| XCode Config | Project-Shared.xcconfig | 522 |
| JAI | LCregistryFile.jai | 489 |
| QCL | bwt.qcl | 447 |
| Ur/Web Project | reader.urp | 346 |
| Cassius | default-layout.cassius | 313 |
| Docker ignore | .dockerignore | 311 |
| Dhall | largeExpressionA.dhall | 254 |
| ignore | .ignore | 192 |
| Bitbucket Pipeline | bitbucket-pipelines.yml | 181 |
| Just | Justfile | 95 |
| Verilog Args File | or1200.irunargs | 60 |
| Polly | polly | 26 |

### Whats the largest file for each language?

Across all the languages we looked at whats the largest file by number of bytes for each one? This means ignoring newlines and the like so its closer to finding checked in data files, which is less interesting but still pretty neat.

| language | filename | bytes |
| -------- | -------- | ----- |
| PHP | phpfox_error_log_04_04_12_3d4b11f6ee2a89fd5ace87c910cee04b.php | 3623132146 |
| Plain Text | train_triplets.txt | 3001659271 |
| CSV | messy-data.csv | 2642779999 |
| SQL | live-last_working-singlesite.sql | 1826019226 |
| XML | dblp.xml | 1490597530 |
| JSON | zcta5.json | 1420311779 |
| HTML | yo.html | 663973891 |
| SVG | p4-s3_I369600.svg | 507593387 |
| Markdown | bookmarks.md | 506929152 |
| YAML | inriaSinglePosQuadNeg.yml | 483874052 |
| Autoconf | ex1M-100d.in | 407888904 |
| JavaScript | mirus.js | 375089434 |
| Shell | LegendOfGrimrock-Linux-2012-12-18.sh | 316750312 |
| Patch | clook_iosched-team01.patch | 306452718 |
| Prolog | network_60percent_3layer_fullconnect.p | 297875240 |
| MUMPS | ref.mps | 279806289 |
| Forth | europarl.tok.fr | 237781843 |
| C | CathDomainDescriptionFile.v3.5.c | 218539312 |
| Ruby | test.set.rb | 217196171 |
| Lua | mbox.data.lua | 207174180 |
| Python | many_indents.py | 200118896 |
| LEX | l | 198839315 |
| Objective C++ | review-1.mm | 189865812 |
| LaTeX | tex | 182964224 |
| Game Maker Language | LL_Roads_OSM.gml | 157716277 |
| Lisp | simN.lsp | 156179291 |
| C Header | head.h | 150084608 |
| Perl | aimlCore3.pl | 120333094 |
| Elixir | pmid.sgd.crawl.ex | 105880942 |
| Specman e | e | 100000000 |
| Systemd | BP.path | 99744310 |
| Wolfram | hmm.nb | 99155670 |
| Objective C | spiral_4D_2k_dim4_standard_rips_threshold0_625_log.m | 95046049 |
| C++ | benchmark150_input_data.cpp | 94302163 |
| Assembly | monotouch.dll.armv7.s | 91289847 |
| F* | Pan_troglodytes_monomers.fst | 87411094 |
| Scheme | atomspace.scm | 84828520 |
| Jupyter | advanced.ipynb | 82015740 |
| HEX | large_plugin.proto.gipfeli.hex | 80591819 |
| C++ Header | primpoly_impl.hh | 77865098 |
| TypeScript | energy.0001.ts | 77418496 |
| Clojure | raw-data.clj | 76901922 |
| XML Schema | schema0.xsd | 71449814 |
| V | TestDataset01-functional.v | 64898063 |
| SystemVerilog | TestDataset01-functional.v | 64898063 |
| Org | default.org | 60472518 |
| C Shell | plna.csh | 59942785 |
| Alex | Dalek.X | 58321141 |
| LOLCODE | lol | 56800001 |
| SKILL | hijacked.il | 56704223 |
| MSBuild | train.props | 56633928 |
| Coq | CompiledDFAs.v | 55121186 |
| GLSL | capsid.vert | 47489317 |
| Module-Definition | wordnet3_0.def | 44690432 |
| CSS | icons.data.svg.css | 44660930 |
| ASP.NET | Master | 43843114 |
| Boo | 3.out.tex | 42848716 |
| Properties File | PuzzlesBundle.properties | 41388895 |
| Happy | y | 39066164 |
| OCaml | acquired.ml | 35694595 |
| Verilog | pipeline.vg | 35028228 |
| Java | ConcourseService.java | 34304913 |
| ActionScript | EmittedBody.as | 33207813 |
| Julia | article.jl | 32926301 |
| TeX | japanischtest.tex | 32077679 |
| SAS | output.sas | 32063584 |
| R | GC_content_all_boxplots.R | 30605657 |
| C# | Reference.cs | 29942447 |
| Monkey C | Al2O3-point.mc | 28004751 |
| TCL | TCL | 27653264 |
| Unreal Script | gene0.uc | 27428041 |
| Ada | outADA.ada | 26524197 |
| Sass | sm30_kernels.sass | 25847506 |
| Emacs Lisp | ubermacros.el | 25394049 |
| Brainfuck | BF | 25165849 |
| Makefile | Makefile | 24492949 |
| Erlang | sdh_analogue_data.erl | 23910042 |
| COBOL | cpy | 23572509 |
| LESS | less | 23568384 |
| Go | bindata12.go | 22020096 |
| D | coral.jar.d | 21323952 |
| SPDX | linux-coreos.spdx | 21230892 |
| XAML | EmojiResourceDictionary.xaml | 20213764 |
| VHDL | cpuTest.vhd | 19889903 |
| TypeScript Typings | dojox.d.ts | 19514050 |
| Expect | webmatrix.exp | 19492535 |
| Bazel | gcc-avr_4.8-2.1_amd64-20140427-2115.build | 19094337 |
| Nix | nix | 19057601 |
| Bosque | world_dem_5arcmin_geo.bsq | 18662400 |
| Standard ML (SML) | Ambit3-HRVbutNoHR.sml | 18006327 |
| Visual Basic | linqStoreProcs.designer.vb | 17680097 |
| Document Type Definition | teste.dtd | 17126304 |
| Groovy | groovy | 16479667 |
| QML | 2005.qml | 15065740 |
| Elm | FASTbig.elm | 14547379 |
| Pascal | FHIR.R4.Resources.pas | 14354478 |
| ASP | 1AOR_A.asa | 13672864 |
| PSL Assertion | test2.psl | 13009924 |
| ReStructuredText | S32HO026.rst | 12978930 |
| CMake | TestHerdt2010OnLineTestFGPI.datref.cmake | 12828369 |
| Gherkin Specification | feature | 11742101 |
| FORTRAN Legacy | hansards.f | 11707317 |
| sed | p1-075-05-025.sed | 11531691 |
| Intel HEX | epdc_ED060SCE.fw.ihex | 11420834 |
| Swig | gl_render.i | 11089573 |
| Puppet | invreachability.0f991c374bb98a060ba5ca19d36c1b7a.pp | 10975229 |
| Report Definition Language | Mapa Compras.rdl | 10813731 |
| FORTRAN Modern | slatec.f90 | 10388406 |
| Macromedia eXtensible Markup Language | simulation_logs.mxml | 10202542 |
| Visual Basic for Applications | Dispatcher.cls | 9679923 |
| JSONL | incanto-j_seg.jsonl | 9670464 |
| Basic | excel-vba-streams-#1.bas | 9593820 |
| gitignore | .gitignore | 8883434 |
| Haskell | JacobiRootsBinary.hs | 8212155 |
| BASH | palmer-master-thesis.bash | 7461570 |
| Device Tree | mnist1k.dts | 7057000 |
| Batch | test.bat | 6801923 |
| Modula3 | tpch22.m3 | 6470073 |
| Swift | Google.Protobuf.UnittestEnormousDescriptor.proto.swift | 6439585 |
| SRecode Template | Hgdata.srt | 6399084 |
| CoffeeScript | spec.coffee | 6326876 |
| Go Template | templates.tmpl | 6095893 |
| Scala | models_camaro.sc | 6008295 |
| Jinja | jinja2 | 5990836 |
| Stata | 32321.do | 5717738 |
| IDL | mshtml.idl | 5487142 |
| Ur/Web | training.ur-en.ur | 5252561 |
| Dart | sha512_long_test_vectors.dart | 5020966 |
| Powershell | Ch15-Supplemental__dnsserverlog.ps1 | 4969479 |
| F# | Ag_O1X5.5_O2X0.55.eam.fs | 4680706 |
| Rakefile | populate_universities.rake | 4636226 |
| Fish | Godsay.fish | 4521571 |
| Mustache | slide_content.mustache | 4478984 |
| GDScript | AE005174.gd | 4403957 |
| JavaServer Pages | footer.jsp | 4188806 |
| Freemarker Template | designed.eml.ftl | 3951567 |
| Rust | lrgrammar.rs | 3887355 |
| Bitbake | gcc_simpoint.bb | 3434673 |
| Jade | base64.jade | 3315461 |
| JSX | AEscript.jsx | 3296858 |
| Smarty Template | assign.100000.tpl | 3288905 |
| Cython | CALC.pex.netlist.CALC.pxi | 3026774 |
| Vim Script | ddk.vim | 2913361 |
| Flow9 | fam88.flow | 2705582 |
| Robot Framework | robot | 2529180 |
| Korn Shell | attachment.ksh | 2380853 |
| Stylus | fonts.styl | 2234665 |
| License | copyright | 2077124 |
| Protocol Buffers | SUNWgnome-themes.proto | 2010262 |
| AsciiDoc | index.adoc | 1991739 |
| Extensible Stylesheet Language Transformations | green_ccd.xslt | 1817759 |
| Razor | Checklist.cshtml | 1799050 |
| Mako | badges_svg.mako | 1773905 |
| m4 | ax.m4 | 1741781 |
| Wren | many_globals.wren | 1615140 |
| ClojureScript | core.cljs | 1548994 |
| Madlang | evgg.mad | 1458158 |
| LD Script | kernel_partitions.lds | 1399083 |
| Opalang | p4000_g+5.0_m0.0_t00_st_z+0.00_a+0.00_c+0.00_n+0.00_o+0.00_r+0.00_s+0.00.opa | 1377267 |
| TOML | sha1map.toml | 1375631 |
| Isabelle | WooLam_cert_auto.thy | 1343764 |
| Haxe | u-boot-rd88ap510avng.hx | 1231151 |
| Processing | textWidth_comic.pde | 1229799 |
| ATS | test03.dats | 1186776 |
| Vue | Ogre.vue | 1133703 |
| Nim | windows.nim | 1041675 |
| ColdFusion CFScript | IntakeHCPCIO.cfc | 970800 |
| Twig Template | show.html.twig | 920098 |
| Kotlin | VK10.kt | 886289 |
| Ruby HTML | big_table.rhtml | 865042 |
| AutoHotKey | compose.generated.ahk | 710113 |
| Thrift | profile.thrift | 702428 |
| Alloy | test.als | 675934 |
| AWK | words-large.awk | 644217 |
| Spice Netlist | input6.ckt | 603911 |
| ColdFusion | welcome.cfm | 602478 |
| Varnish Configuration | 40_generic_attacks.vcl | 569532 |
| ABAP | ZRIM01F01.abap | 564971 |
| PKGBUILD | PKGBUILD | 521679 |
| nuspec | Npm.js.nuspec | 509907 |
| Zsh | _oc.zsh | 502192 |
| Handlebars | index-fr.hbs | 494418 |
| MQL4 | PhD Appsolute System.mq4 | 433413 |
| Arvo | large_schema.avsc | 385753 |
| Xtend | SymbolCanvas.xtend | 369460 |
| BuildStream | biometrics.bst | 368686 |
| Q# | flfacturac.qs | 339495 |
| Fragment Shader File | ms812_bseqoslabel_l.fsh | 299804 |
| Vala | mwp.vala | 293411 |
| Cargo Lock | Cargo.lock | 289000 |
| Agda | Pifextra.agda | 262797 |
| Closure Template | index.soy | 258487 |
| Gradle | dependencies.gradle | 241384 |
| GN | libvpx_srcs.gni | 237122 |
| Scons | SConstruct | 212794 |
| Hamlet | hamlet | 208481 |
| Crystal | chgd.cr | 186169 |
| Vertex Shader File | cds8548.vsh | 181089 |
| Oz | Score.oz | 180776 |
| MQL Header | IncGUI.mqh | 171885 |
| Ceylon | RedHatTransformer.ceylon | 166229 |
| Meson | meson.build | 130647 |
| Alchemist | out.lmf-dos.crn | 120461 |
| Emacs Dev Env | ede | 115474 |
| Luna | Base.luna | 107360 |
| Idris | ring_reduce.idr | 105518 |
| Game Maker Project | LudumDare.yyp | 102189 |
| Julius | default-layout.julius | 98984 |
| Lucius | bootstrap.lucius | 92639 |
| MQL5 | DTS1-Build_814.1_B-test~.mq5 | 88766 |
| Creole | MariaDB_Manager_Monitors.creole | 87913 |
| Cabal | ghcjs-dom-jsffi.cabal | 83109 |
| TaskPaper | task-3275.taskpaper | 75810 |
| Android Interface Definition Language | ITelephony.aidl | 73502 |
| Pony | trixiestage.pony | 73004 |
| Lean | interactive.lean | 68266 |
| PureScript | Types.purs | 55158 |
| Softbridge Basic | asm.sbl | 53428 |
| XCode Config | maxmspsdk.xcconfig | 51627 |
| Jenkins Buildfile | Jenkinsfile | 44391 |
| FIDL | amb.in.fidl | 40651 |
| JAI | LCregistryFile.jai | 36828 |
| Futhark | math.fut | 33391 |
| Zig | main.zig | 28351 |
| Dockerfile | Dockerfile | 20735 |
| Docker ignore | .dockerignore | 16050 |
| Janet | JANET | 15890 |
| Bitbucket Pipeline | bitbucket-pipelines.yml | 11860 |
| Ur/Web Project | reader.urp | 11134 |
| Dhall | largeExpressionA.dhall | 10336 |
| Cassius | navbar.cassius | 9268 |
| QCL | bwt.qcl | 8769 |
| ignore | .ignore | 3954 |
| Just | Justfile | 2276 |
| Verilog Args File | uart_ctrl.irunargs | 1935 |
| Polly | polly | 939 |

### How many "pure" projects

That is projects that have 1 language in them. Of course that would not be very interesting by itself, so lets see what the spread is. Turns out most projects have fewer than 25 languages in them with most in the less than 10 bracket.

The peak in the below graph is for 4 languages.

Of course pure projects might only have one programming language, but have lots of supporting other formats such as markdown, json, yml, css, .gitignore and the like. It's probably reasonable to assume that any project with less than 5 languages is "pure" and as it turns out is just over half the total data set. Of course your definition of purity might be different to mine.

There is an odd bump around the 35 language's count though for some reason. I have no reasonable explanation as to why this might be the case.

![scc-data pure projects](/static/an-informal-survey/languagesPerProject.png#center)

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

Have to admit, I am a little surprised by that number. While I understand mixing JavaScript with TypeScript is fairly common I would have thought there would be more projects using the new hotness. This may however be mostly down to the projects I was able to pull though and a refreshed project list with newer projects may help.

### Anyone using CoffeeScript and TypeScript?

| using TypeScript and CoffeeScript |
| --------------- |
| 7,849 projects |

I have a feeling some TypeScript developers are dry heaving at the very thought of this. If it is of any comfort I suspect most of these projects are things like `scc` which uses examples of all languages mixed together for testing purposes.

### The most complex code is written in what language?

The complexity estimate isn't really directly comparable between languages. Pulling from the README

> The complexity estimate is really just a number that is only comparable to files in the same language. It should not be used to compare languages directly without weighting them. The reason for this is that its calculated by looking for branch and loop statements in the code and incrementing a counter for that file.

However like the curse/potty mouth check its fun so lets do it anyway. However to make this fair it really needs to be weighted based on the number of code lines to ensure it is closer to being a fair comparison.




### Whats the most complex file in each language?

Once again these values are not directly comparable to each other, but it is interesting to see what is considered the most complex in each language.

Some of these files are absolute monsters. For example consider the most complex C++ file [COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp](https://github.com/KhronosGroup/OpenCOLLADA/blob/master/COLLADASaxFrameworkLoader/src/generated15/COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp) which is 28.3 MB of compiler hell (and thankfully appears to be a generated file). 

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

## Future ideas

Id love to do some analysis of tabs vs spaces. Scanning for things like AWS AKIA keys and the like would be pretty neat as well. Id also love to expand out the bitbucket and gitlab coverage and get it broken down via each to see if groups of developers from different camps hang out in different areas.

Shortcomings id love to overcome in the above if I decide to do this again.

 - Keeping the URL properly in the metadata somewhere. Using a filename to store this was a bad idea as it was lossy and means it can be hard to identify the file source and location.
 - Not bother with S3. There is little point to pay the bandwidth cost when I was only using it for storage. Better to just stuff into the tar file from the beginning.
 - Invest some time in learning some tool to help with plotting and charting of results.

## So why bother?

Well I can take some of this information and plug it into searchcode.com, scc. It's potentially very useful to know how your project compares to others out there. Besides it was a fun way to spend a few days solving some interesting problems.

In addition I am working on a tool that helps senior-developer or manager types analyze code looking for size, flaws etc... Assuming you have to watch multiple repositories. You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some code-base and getting an overview of what your development team is producing. Something like AWS Macie but for code is the angle I am thinking. It's something I need for my day job currently.

I should probably put an email sign up for that here at some point to gather interest for that.