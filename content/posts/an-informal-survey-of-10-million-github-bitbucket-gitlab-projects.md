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

As you would expect most repositories have less than 200 files in them. However what about plotting this by percentile?

![scc-data files per project percentile](/static/an-informal-survey/filesPerProjectPercentile.png)

Note the X-axis is logarithmic. Turns out the vast majority of projects have less than 1,000 files in them. While 90% of them have less than 300 files. Projects with 0 files are ignored.

However lets plot the above for the 95th percentile so its actually worth looking at.

![scc-data files per project 95th](/static/an-informal-survey/filesPerProjectPercentile95.png)

Most projects have less than 100 files in them and 85% have less than 200. This feels about right based on the majority of projects I have worked with personally. If you want to plot this yourself and do a better job than I here is a link to the raw data [filesPerProject.json](/static/an-informal-survey/filesPerProject.json).

### Whats the project breakdown per language?

This means if we see any Java file in a project we increment the Java count by one and for the second file do nothing. This gives a quick view of what languages are most commonly used. Somewhat unsurprisingly the most common languages are markdown, .gitignore and plain text.

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

Yes I know I could have used a trie structure to "compress" the space and gotten absolute numbers. I didn't feel like writing one. I am however curious enough to try this out at a later date to see how much compression we can get out of it.

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

// TODO include the location of these files where possible because damn thats interesting

| language | filename | complexity |
| -------- | -------- | ----- |
| C++ | COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp | 682001 |
| JavaScript | blocks.js | 582070 |
| C Header | bigmofoheader.h | 465589 |
| C | fmFormula.c | 445545 |
| Objective C | faster.m | 409792 |
| SQL | dump20120515.sql | 181146 |
| ASP.NET | results-i386.master | 164528 |
| Java | ConcourseService.java | 139020 |
| TCL | 68030_TK.tcl | 136578 |
| C++ Header | TPG_hardcoded.hh | 129465 |
| TypeScript Typings | all.d.ts | 127785 |
| SVG | Class Diagram2.svg | 105353 |
| Lua | luaFile1000kLines.lua | 102960 |
| PHP | fopen.php | 100000 |
| Org | 2015-02-25_idfreeze-2.org | 63326 |
| Ruby | all_search_helpers.rb | 60375 |
| Scheme | test.ss | 50000 |
| Stata | .31113.do | 48600 |
| Elixir | pmid.sgd.crawl.ex | 46479 |
| Brainfuck | Poll.bf | 41399 |
| Perl | r1d7.pl | 41128 |
| Go | segment_words_prod.go | 34715 |
| Python | lrparsing-sqlite.py | 34700 |
| Module-Definition | wordnet3_0.def | 32008 |
| Clojure | raw-data.clj | 29950 |
| C# | Matrix.Product.Generated.cs | 29675 |
| D | parser.d | 27249 |
| FORTRAN Modern | euitm_routines_407c.f90 | 27161 |
| Puppet | sqlite3.c.pp | 25753 |
| SystemVerilog | 6s131.sv | 24300 |
| Autoconf | Makefile.in | 23183 |
| Specman e | hansards.e | 20893 |
| Smarty Template | test-include-09.tpl | 20000 |
| TypeScript | JSONiqParser.ts | 18162 |
| V | altera_mf.v | 13584 |
| F* | slayer-3.fst | 13428 |
| TeX | definitions.tex | 13342 |
| Swift | Google.Protobuf.UnittestEnormousDescriptor.proto.swift | 13017 |
| Assembly | all-opcodes.s | 12800 |
| Bazel | firebird2.5_2.5.2.26540.ds4-10_amd64-20140427-2159.build | 12149 |
| FORTRAN Legacy | lm67.F | 11837 |
| R | Rallfun-v36.R | 11287 |
| ActionScript | AccessorSpray.as | 10804 |
| Haskell | Tags.hs | 10444 |
| Prolog | books_save.p | 10243 |
| Dart | DartParser.dart | 9606 |
| VHDL | unisim_VITAL.vhd | 9590 |
| Batch | test.bat | 9424 |
| Boo | compman.tex | 9280 |
| Coq | NangateOpenCellLibrary.v | 8988 |
| Shell | i3_completion.sh | 8669 |
| Kotlin | 1.kt | 7388 |
| JSX | typescript-parser.jsx | 7123 |
| Makefile | Makefile | 6642 |
| Emacs Lisp | bible.el | 6345 |
| Objective C++ | set.mm | 6285 |
| OCaml | sparcrec.ml | 6285 |
| Expect | condloadstore.stdout.exp | 6144 |
| SAS | import_REDCap.sas | 5783 |
| Julia | pilot-2013-05-14.jl | 5599 |
| Cython | types.pyx | 5278 |
| Modula3 | tpch22.m3 | 5182 |
| Haxe | T1231.hx | 5110 |
| Visual Basic for Applications | Coverage.cls | 5029 |
| Lisp | simN.lsp | 4994 |
| Scala | SpeedTest1MB.sc | 4908 |
| Groovy | ZulTagLib.groovy | 4714 |
| Powershell | PresentationFramework.ps1 | 4108 |
| Ada | bhps-print_full_version.adb | 3961 |
| JavaServer Pages | sink_jq.jsp | 3850 |
| GN | patch-third_party__ffmpeg__ffmpeg_generated.gni | 3742 |
| Basic | MSA_version116_4q.bas | 3502 |
| Pascal | Python_StdCtrls.pas | 3399 |
| Standard ML (SML) | arm.sml | 3375 |
| Erlang | lipsum.hrl | 3228 |
| ASP | mylib.asp | 3149 |
| CSS | three-viewer.css | 3071 |
| Unreal Script | ScriptedPawn.uc | 2909 |
| CoffeeScript | game.coffee | 2772 |
| AutoHotKey | fishlog5.93.ahk | 2764 |
| MQL4 | PhD Appsolute System.mq4 | 2738 |
| Processing | Final.pde | 2635 |
| Isabelle | StdInst.thy | 2401 |
| Razor | Checklist.cshtml | 2341 |
| Sass | _multi-color-css-stackicons-social.scss | 2325 |
| Vala | valaccodebasemodule.vala | 2100 |
| MSBuild | all.props | 2008 |
| Rust | ffi.rs | 1928 |
| QML | Dots.qml | 1875 |
| F# | test.fsx | 1826 |
| Vim Script | netrw.vim | 1790 |
| Korn Shell | attachment.ksh | 1773 |
| Vue | vue | 1738 |
| sed | SED | 1699 |
| GLSL | comp | 1699 |
| Nix | auth.nix | 1615 |
| Mustache | template.mustache | 1561 |
| Bitbake | my-2010.bb | 1549 |
| Ur/Web | votes.ur | 1515 |
| BASH | pgxc_ctl.bash | 1426 |
| MQL Header | hanoverfunctions.mqh | 1393 |
| Visual Basic | LGMDdataDataSet.Designer.vb | 1369 |
| Q# | flfacturac.qs | 1359 |
| C Shell | regtest_hwrf.csh | 1214 |
| MQL5 | DTS1-Build_814.1_B-test~.mq5 | 1186 |
| Xtend | Parser.xtend | 1116 |
| Nim | disas.nim | 1098 |
| CMake | MacroOutOfSourceBuild.cmake | 1069 |
| Protocol Buffers | configure.proto | 997 |
| SKILL | switch.il | 997 |
| COBOL | geekcode.cob | 989 |
| Game Maker Language | hydroEx_River.gml | 982 |
| Gherkin Specification | upload_remixed_program_again_complex.feature | 959 |
| Alloy | battleformulas.als | 948 |
| Bosque | recover.bsq | 924 |
| ColdFusion | jquery.js.cfm | 920 |
| Stylus | buttron.styl | 866 |
| ColdFusion CFScript | apiUtility.cfc | 855 |
| Verilog | exec_matrix.vh | 793 |
| Freemarker Template | DefaultScreenMacros.html.ftl | 771 |
| Crystal | lexer.cr | 753 |
| Forth | e4 | 690 |
| Monkey C | mc | 672 |
| Rakefile | import.rake | 652 |
| Zsh | zshrc | 649 |
| Ruby HTML | ext_report.rhtml | 633 |
| Handlebars | templates.handlebars | 557 |
| SRecode Template | Al3SEbeK61s.srt | 535 |
| Scons | SConstruct | 522 |
| Agda | Square.agda | 491 |
| Ceylon | runtime.ceylon | 467 |
| Julius | default-layout.julius | 436 |
| Wolfram | qmSolidsPs8dContourPlot.nb | 417 |
| Cabal | parconc-examples.cabal | 406 |
| Fragment Shader File | flappybird.fsh | 349 |
| ATS | ats_staexp2_util1.dats | 311 |
| Jinja | php.ini.j2 | 307 |
| Opalang | unicode.opa | 306 |
| Twig Template | product_form.twig | 296 |
| ClojureScript | core.cljs | 271 |
| Hamlet | hamlet | 270 |
| Oz | StaticAnalysis.oz | 267 |
| Elm | Indexer.elm | 267 |
| Meson | meson.build | 248 |
| ABAP | ZRFFORI99.abap | 244 |
| Dockerfile | Dockerfile | 243 |
| Wren | repl.wren | 242 |
| Fish | fisher.fish | 217 |
| Emacs Dev Env | ede | 211 |
| GDScript | tiled_map.gd | 195 |
| IDL | bgfx.idl | 187 |
| Jade | docs.jade | 181 |
| PureScript | List.purs | 180 |
| XAML | Midnight.xaml | 179 |
| Flow9 | TypeMapper.js.flow | 173 |
| Idris | Utils.idr | 166 |
| PSL Assertion | pre_dec.psl | 162 |
| Lean | kernel.lean | 161 |
| MUMPS | link.mps | 161 |
| Vertex Shader File | base.vsh | 152 |
| Go Template | code-generator.tmpl | 148 |
| Mako | pokemon.mako | 137 |
| Closure Template | template.soy | 121 |
| Zig | main.zig | 115 |
| TOML | telex_o.toml | 100 |
| Softbridge Basic | asm.sbl | 98 |
| QCL | bwt.qcl | 96 |
| Futhark | math.fut | 86 |
| Pony | jstypes.pony | 70 |
| LOLCODE | LOLTracer.lol | 61 |
| Alchemist | alchemist.crn | 55 |
| Madlang | Copying.MAD | 44 |
| LD Script | plugin.lds | 39 |
| Device Tree | dts | 22 |
| FIDL | GlobalCapabilitiesDirectory.fidl | 19 |
| JAI | LICENSE.jai | 18 |
| Just | Justfile | 7 |
| Android Interface Definition Language | aidl | 3 |
| Ur/Web Project | jointSpace.urp | 2 |
| Spice Netlist | GRI30.CKT | 2 |

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

Id love to do some analysis of tabs vs spaces. Scanning for things like AKIA keys and the like would be pretty neat as well. Id also love to expand out the bitbucket and gitlab coverage and get it broken down via each to see if groups of developers from different camps hang out in different areas.

## So why bother?

Well I can take some of this information and plug it into searchcode.com, scc. It's potentially very useful to know how your project compares to others out there. Besides it was a fun way to spend a few days solving some interesting problems.

In addition I am working on a tool that helps senior-developer or manager types analyze code looking for size, flaws etc... Assuming you have to watch multiple repositories. You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some code-base and getting an overview of what your development team is producing. Something like AWS Macie but for code is the angle I am thinking. It's something I need for my day job currently.

I should probably put an email sign up for that here at some point to gather interest for that.