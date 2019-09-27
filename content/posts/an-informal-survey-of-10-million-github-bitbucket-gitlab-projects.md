---
title: Downloading and processing 40 TB of code from 10 million git projects using a dedicated server and Goroutines for under $100
date: 2019-09-20
---

<link rel="stylesheet" href="/static/an-informal-survey/table.css" />
<link rel="stylesheet" href="/static/an-informal-survey/jquery.dataTables.min.css" />
<script src="/static/an-informal-survey/jquery-3.1.1.min.js"></script>
<script src="/static/an-informal-survey/jquery.dataTables.min.js"></script>
<script src="/static/an-informal-survey/table.js"></script>

The tool I created [Sloc Cloc and Code (`scc`)](https://github.com/boyter/scc/) (and now modified and supported by many excellent people) counts lines of code, comments and make a complexity estimate for files inside a code repository. The latter is something you need a good sample size to make good use of. Otherwise what does "This file has complexity 10" tell you? So I thought I would try running it at all the source code I could get my hands on.

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
 - [Presenting and Computing Results](#presenting-and-computing-results)
 - [Cost](#cost)
 - [Data Sources](#data-sources)
 - [How many files in a repository?](#how-many-files-in-a-repository)
 - [Whats the project breakdown per language?](#whats-the-project-breakdown-per-language)
 - [How many files in a repository per language?](#how-many-files-in-a-repository-per-language)
 - [How many lines of code are in a typical file per language?
](#how-many-lines-of-code-are-in-a-typical-file-per-language)
 - [What are the most common filenames?](#what-are-the-most-common-filenames)
 - [How many repositories appear to be missing a license?](#how-many-repositories-appear-to-be-missing-a-license)
 - [Which languages have the most comments?](#which-languages-have-the-most-comments)
 - [How many projects use multiple .gitignore files?](#how-many-projects-use-multiple-gitignore-files)
 - [Which language developers have the biggest potty mouth?](#which-language-developers-have-the-biggest-potty-mouth)
 - [Longest files by lines per language](#longest-files-by-lines-per-language)
 - [Whats the most complex file in each language?](#whats-the-most-complex-file-in-each-language)
 - [Whats the most complex file weighted against lines?](#whats-the-most-complex-file-weighted-against-lines)
 - [Whats the most commented file in each language?](#whats-the-most-commented-file-in-each-language)
 - [How many "pure" projects](#how-many-pure-projects)
 - [Projects with TypeScript but not JavaScript](#projects-with-typescript-but-not-javascript)
 - [Anyone using CoffeeScript and TypeScript?](#anyone-using-coffeescript-and-typescript)
 - [The most complex code is written in what language?](#the-most-complex-code-is-written-in-what-language)
 - [What's the typical path length, broken up by language](#what-s-the-typical-path-length-broken-up-by-language)
 - [YAML or YML?](#yaml-or-yml)
 - [Who comments most-to-least, by language (95th percentile)](#who-comments-most-to-least-by-language-95th-percentile)
 - [Upper, lower or mixed case?](#upper-lower-or-mixed-case)
 - [Java Factories](#java-factories)
 - [Future ideas](#future-ideas)
 - [So why bother?](#so-why-bother)
 - [Raw / Processed Files](#raw-processed-files)

## Methodology

Since I run [searchcode.com](https://searchcode.com/) I already have a collection of over 7,000,000 projects across git, mercurial, subversion and such. So why not try processing them? Working with git is usually the easiest solution so I ignored mercurial and subversion and exported the list of git projects. Turns out I actually have 12 million git repositories being tracked, and I should probably update the page to reflect that.

So now I have 12 million or so git repositories which I need to download and process.

When you run `scc` you can choose to have it output the results in JSON and optionally saving this file to disk like so ` scc --format json --output myfile.json main.go` the results of which look like the following,

{{<highlight json>}}
[
  {
    "Blank": 115,
    "Bytes": 0,
    "Code": 423,
    "Comment": 30,
    "Complexity": 40,
    "Count": 1,
    "Files": [
      {
        "Binary": false,
        "Blank": 115,
        "Bytes": 20396,
        "Callback": null,
        "Code": 423,
        "Comment": 30,
        "Complexity": 40,
        "Content": null,
        "Extension": "go",
        "Filename": "main.go",
        "Hash": null,
        "Language": "Go",
        "Lines": 568,
        "Location": "main.go",
        "PossibleLanguages": [
          "Go"
        ],
        "WeightedComplexity": 0
      }
    ],
    "Lines": 568,
    "Name": "Go",
    "WeightedComplexity": 0
  }
]
{{</highlight>}}

As a larger example here are the results as JSON for the redis project, [redis.json](/static/an-informal-survey/redis.json). All of the results below come from this output without any supporting data sources.

One thing to keep in mind is that `scc` generally categories languages based on extension (except where extension is shared such as Verilog and Coq). As such if someone puts a HTML file with a java extension it will be counted as a java file. Usually this isn't a problem but at scale it is and something I mention at the end where some files were masquerading as another.

A while back I wrote code to create github badges using `scc` https://boyter.org/posts/sloc-cloc-code-badges/ and since part of that included caching the results, I modified it slightly to cache the results as JSON in S3.

With the badge code working in AWS using lambda, I took the exported list and wrote about 15 lines of python to clean the format and make a request to the endpoint. I threw in some python multiprocessing to fork 32 processes to call the endpoint reasonably quickly. 

This worked brilliantly. However the problem with the above was firstly the cost, and secondly because lambda behind API-Gateway/ALB has a 30 second timeout it couldn't process large repositories fast enough. I knew going in that this was not going to be the most cost effective solution but assuming it cost close to $100 I would have been willing to live with it. After processing 1 million repositories I checked and the cost was about $60 and since I didn't want a $700 AWS bill I decided to rethink my solution. Keep in mind that was mostly storage and CPU, or what was needed to collect this information. Assuming I processed or exported the data it was going to increase the cost considerably.

Since I was already in AWS the hip solution would be to dump the url's as messages into SQS and pull from it using EC2 instances or fargate for processing. Then scale out like crazy. However despite working in AWS in my day job I have always believed in [taco bell programming](http://widgetsandshit.com/teddziuba/2010/10/taco-bell-programming.html). Besides it was only 12 million repositories so I opted to implement a simpler (cheaper) solution.

Running this computation locally was out due to the abysmal state of the internet in Australia. However I do run [searchcode.com](https://searchcode.com/) fairly lean using dedicated servers from Hetzner. These boxes are quite powerful, i7 Quad Core 32 GB RAM machines often with 2 TB of disk space (usually unused). As such they usually has a lot of spare compute based on how I use them. The front-end varnish box for instance is doing the square root of zero most of the time. So why not run the processing there?

I didn't quite taco bell program the solution using bash and gnu tools. What I did was write a simple [Go program](https://github.com/boyter/scc-data/blob/master/process/main.go) to spin up 32 go-routines which read from a channel, spawned `git` and `scc` subprocesses before writing the JSON output into S3. I actually wrote a Python solution at first, but having to install the pip dependencies on my clean varnish box seemed like a bad idea and it keep breaking in odd ways which I didn't feel like debugging.

Running this on the box produced the following sort of metrics in htop, and the multiple git/scc processes (scc is not visible in this screen capture) running suggested that everything was working as expected, which I confirmed by looking at the results in S3.

![scc-data process load](/static/an-informal-survey/1.png#center)

## Presenting and Computing Results

Having recently read https://mattwarren.org/2017/10/12/Analysing-C-code-on-GitHub-with-BigQuery/ and https://psuter.net/2019/07/07/z-index I thought I would steal the format of that post with regards to how I wanted to present the information. However this raised another question. How does one process 10 million JSON files taking up just over 1 TB of disk space in an S3 bucket? 

The first thought I had was AWS Athena. But since it's going to cost something like $2.50 USD **per query** for that dataset I quickly looked for an alternative. That said if you kept the data there and processed it infrequently this might still work out to be the cheapest solution.

I posted the question on the company slack because why should I solve issues alone.

One idea raised was to dump the data into a large SQL database. However this means processing the data into the database, then running queries over it multiple times. Plus the structure of the data meant having a few tables which means foreign keys and indexes to ensure some level of performance. This feels wasteful because we could just process the data as we read it once off. I was also worried about building a database this large. With just data it would be over 1 TB in size before adding indexes.

Seeing as I produced the JSON using spare compute, I thought why not process the results the same way? Of course there is one issue with this. Pulling 1 TB of data out of S3 is going to cost a lot. In the event the program crashes that is going to be annoying. To reduce costs I wanted to pull all the files down locally and save them for further processing. Handy tip, you really do not want to store lots of little files on disk in a single directory. It sucks for runtime performance and file-systems don't like it.

My answer to this was another simple [go program](https://github.com/boyter/scc-data/blob/master/scc-tar/main.go) to pull the files down from S3 then store them in a tar file. I could then process that file over and over. The process itself is done though **very ugly** [go program](https://github.com/boyter/scc-data/blob/master/main.go) to process the tar file so I could re-run my questions without having to trawl S3 over and over. I didn't bother with go-routines for this code for two reasons. The first was that I didn't want to max out my server, so this limits it to a single core for the hard CPU work. The second being I didn't want to ensure it was thread-safe.

With that done, what I needed was a collection of questions to answer. I used the slack brains trust again and crowd-sourced my work colleagues while I came up with some ideas of my own. The result of this mind meld is included below.

You can find all the code I used to process the JSON including that which pulled it down locally and the [ugly python script](https://github.com/boyter/scc-data/blob/master/convert_json.py) I used to mangle it into something useful for this post https://github.com/boyter/scc-data Please don't comment on it, I know the code is ugly and it is something I wrote as a throwaway as I am unlikely to ever look at it again. 

If you do want to review code I have written to be read by others have a look at the [source of scc](https://github.com/boyter/scc/).


## Cost

I spent about $60 in compute while trialling lambda. I have not looked at the S3 storage cost yet but it should be close to $25 based on the size. However this is not including the transfer costs which I am also yet to see. Please note I cleared the bucket when I was finished with it so this is not an ongoing cost for me.

However I chose not to use AWS in the end because of cost. So what's the real cost assuming I wanted to do it again?

In my case the cost would be free as I used "free compute" left over from searchcode. Not everyone has compute lying around however. So lets assume I need to get a server to do this.

It could be done for €73 using the cheapest new dedicated server from Hetzner https://www.hetzner.com/dedicated-rootserver However that cost includes a new server setup fee. If you are willing to wait and poke around on their auction house https://www.hetzner.com/sb you can find much cheaper servers with no setup fee at all. At time of writing I found the below machine which would be perfect for this project and is €25.21 a month with no setup fee.

![hetzner server](/static/an-informal-survey/hetzner.png#center)

Best part for me though? You can get the VAT removed if you are outside the EU. So give yourself an additional 10% discount on top if you are in this situation as I am.

So were someone to do this from scratch using the same method I eventually went with it would cost under $100 USD to redo the same calculations, and more likely under $50 if you are a little patient or lucky. This also assumes you use the server for less than 2 months which is enough time to download and process.

If I were to use a gzipped tar file in my analysis (which isn't that hard to do really) I could even do 10x the repositories on the same machine as the resulting file would still be small enough to fit on the same hard disk. That would take longer to download though which is going to increase the cost for each additional month. Going much larger however is going to require some level of sharding of repositories. Still it is safe to say that you could redo the entire process I did or larger one on the same hardware without much effort.

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

However what about plotting this by percentile, or more specifically by 95th percentile so its actually worth looking at? Turns out the vast majority 95% of projects have less than 1,000 files in them. While 90% of them have less than 300 files and 85% have less than 200.

![scc-data files per project 95th](/static/an-informal-survey/filesPerProjectPercentile95.png)

If you want to plot this yourself and do a better job than I here is a link to the raw data [filesPerProject.json](/static/an-informal-survey/filesPerProject.json).

### Whats the project breakdown per language?

This means for each project scanned if a Java file is identified increment the Java count by one and for the second file do nothing. This gives a quick view of what languages are most commonly used. Unsurprisingly the most common languages include markdown, .gitignore and plain text.

Markdown the most commonly used language in any project is included in just over 6 million projects which is about 2/3 of the entire project set. This makes sense since almost all projects include a README.md which is displayed in HTML for repository pages.

The full list is included below.

[skip table to next section](#how-many-files-in-a-repository-per-language)

<div class="table-1"></div>

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

// TODO the number here should match IE tables should have the same length, janet is missing for example

An extension of the above, but averaged over however many files are in each language per repository. So for projects that contain java, how many java files exist in that project, and on average for all projects how many files is that?

You can use this to see if a project is larger or smaller than usual for your language of choice.

[skip table to next section](#how-many-lines-of-code-are-in-a-typical-file-per-language)

<div class="table-2"></div>

| language | average file count |
| -------- | ------------------ |
| ASP | 1 |
| ASP.NET | 9 |
| AWK | 189 |
| ActionScript | 69 |
| Ada | 61 |
| Alex | 406 |
| Alloy | 1 |
| Android Interface Definition Language | 147 |
| Arvo | 1 |
| AsciiDoc | 3 |
| Assembly | 1274 |
| AutoHotKey | 2 |
| Autoconf | 892 |
| BASH | 20 |
| Basic | 2 |
| Batch | 73 |
| Bazel | 6 |
| Bitbake | 1 |
| Bitbucket Pipeline | 1 |
| Boo | 1 |
| Brainfuck | 1 |
| BuildStream | 1 |
| C | 13249 |
| C Header | 10961 |
| C Shell | 1 |
| C# | 2118 |
| C++ | 478 |
| C++ Header | 76 |
| CMake | 22 |
| COBOL | 1 |
| CSS | 124 |
| CSV | 54 |
| Cabal | 1 |
| Ceylon | 1 |
| Clojure | 5 |
| Closure Template | 1 |
| CoffeeScript | 6 |
| ColdFusion | 61 |
| Coq | 5 |
| Creole | 2 |
| Cython | 2 |
| D | 25 |
| Dart | 2 |
| Device Tree | 125 |
| Docker ignore | 1 |
| Dockerfile | 1 |
| Document Type Definition | 5 |
| Elixir | 7 |
| Elm | 2 |
| Emacs Dev Env | 1 |
| Emacs Lisp | 12 |
| Erlang | 2 |
| Expect | 286 |
| Extensible Stylesheet Language Transformations | 1 |
| F# | 5 |
| F* | 17 |
| FORTRAN Legacy | 13 |
| FORTRAN Modern | 18 |
| Fish | 1 |
| Flow9 | 1 |
| Forth | 30 |
| Fragment Shader File | 5 |
| Freemarker Template | 1 |
| GDScript | 1 |
| GLSL | 13 |
| GN | 1 |
| Game Maker Language | 11 |
| Gherkin Specification | 37 |
| Go | 6 |
| Go Template | 31 |
| Gradle | 2 |
| Groovy | 95 |
| HEX | 15 |
| HTML | 646 |
| Handlebars | 6 |
| Happy | 26 |
| Haskell | 1 |
| Haxe | 55 |
| IDL | 1 |
| Intel HEX | 86 |
| JSON | 116 |
| JSX | 6 |
| Jade | 7 |
| Java | 2758 |
| JavaScript | 492 |
| JavaServer Pages | 13 |
| Jenkins Buildfile | 1 |
| Julia | 1 |
| Jupyter | 3 |
| Korn Shell | 53 |
| Kotlin | 4 |
| LD Script | 12 |
| LESS | 21 |
| LEX | 17 |
| LOLCODE | 1 |
| LaTeX | 171 |
| License | 167 |
| Lisp | 41 |
| Lua | 18 |
| MSBuild | 166 |
| Macromedia eXtensible Markup Language | 85 |
| Makefile | 1432 |
| Mako | 2 |
| Markdown | 113 |
| Modula3 | 1 |
| Module-Definition | 91 |
| Monkey C | 4 |
| Mustache | 5 |
| Nim | 2 |
| OCaml | 25 |
| Objective C | 23 |
| Objective C++ | 1 |
| Opalang | 1 |
| Org | 11 |
| PHP | 1467 |
| PKGBUILD | 3392 |
| PSL Assertion | 1 |
| Pascal | 4 |
| Patch | 60 |
| Perl | 530 |
| Plain Text | 1194 |
| Powershell | 5 |
| Processing | 2 |
| Prolog | 22 |
| Properties File | 45 |
| Protocol Buffers | 4 |
| Puppet | 179 |
| Python | 1120 |
| QML | 19 |
| R | 2 |
| Rakefile | 18 |
| Razor | 23 |
| ReStructuredText | 243 |
| Ruby | 617 |
| Ruby HTML | 19 |
| Rust | 7 |
| SAS | 2 |
| SKILL | 7 |
| SQL | 36 |
| SVG | 27 |
| Sass | 234 |
| Scala | 1 |
| Scheme | 9 |
| Scons | 2 |
| Shell | 800 |
| Smarty Template | 18 |
| Specman e | 1 |
| Standard ML (SML) | 5 |
| Stata | 1 |
| Stylus | 10 |
| Swift | 3 |
| Swig | 11 |
| SystemVerilog | 8 |
| Systemd | 92 |
| TCL | 137 |
| TeX | 42 |
| Thrift | 1 |
| Twig Template | 200 |
| TypeScript | 3 |
| TypeScript Typings | 32 |
| Unreal Script | 3 |
| Ur/Web | 1 |
| V | 1 |
| VHDL | 8 |
| Vala | 2 |
| Varnish Configuration | 1 |
| Vertex Shader File | 4 |
| Vim Script | 1 |
| Visual Basic | 93 |
| Visual Basic for Applications | 2 |
| Wolfram | 1 |
| XAML | 4 |
| XCode Config | 3 |
| XML | 269 |
| XML Schema | 6 |
| Xtend | 5 |
| YAML | 76 |
| Zsh | 1 |
| gitignore | 32 |
| ignore | 1 |
| m4 | 209 |
| nuspec | 73 |
| sed | 38 |


### How many lines of code are in a typical file per language?

I suppose you could also look at this as what languages on average have the largest files? Using the average/mean for this pushes the results out to stupidly high numbers. This is because projects such as sqlite.c which is included in many projects is joined from many files into one, but nobody ever works on that single large file (I hope!).

So I calculated this using the median value. Even so there are still some definitions with stupidly high numbers such as Bosque and JavaScript. 

So I figured why not have both? I did one small change based on the suggestion of [Darrell](https://www.packtpub.com/au/big-data-and-business-intelligence/hands-deep-learning-go) (Kablamo's resident and most excellent data scientist) and modified the average value to ignore files over 5000 lines to remove the outliers.

[skip table to next section](#what-are-the-most-common-filenames)

<div class="table-3"></div>

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

The makefile being the most common surprised me a little, but then I remembered it is used in many new JavaScript projects. Another interesting thing to note is that it appears jQuery is still king and reports of its death are greatly exaggerated.

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

Note that due to memory constraints I made this process slightly lossy. Every 100 projects checked I would check the map and if an identified filename had < 10 counts it was dropped from the list. It could come back for the next run and if there was > 10 at this point it would remain. It shouldn't happen that often but it is possible the counts may be out by some amount if some common name appeared sparsely in the first batch of repositories before becoming common. In short they are not absolute numbers but should be close enough.

I could have used a trie structure to "compress" the space and gotten absolute numbers for this, but I didn't feel like writing one and just abused the map slightly to save enough memory and achieve my goal. I am however curious enough to try this out at a later date to see how a trie would perform.

### How many repositories appear to be missing a license?

This is an interesting one. Which repositories have an explicit license file somewhere? Note that the lack of a license file here does not mean that the project has none, as it might exist within the README or be indicated through SPDX comment tags in-line. it just means that `scc` could not find an explicit license file using its own criteria which at time of writing means a file ignoring case named "license", "licence", "copying", "copying3", "unlicense", "unlicence", "license-mit", "licence-mit" or "copyright".

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

Working this out is not an exact science. It falls into the NLP class of problems really. Picking up cursing/swearing or offensive terms using filenames from a defined list is never going to be effective. If you do a simple string contains test you pick up all sorts or normal files such as `assemble.sh` and such. So to produce the following I pulled a list of curse words, then checked if any files in each project start with one of those values followed by a period. This would mean a file named `gangbang.java` would be picked up while `assemble.sh` would not. However this is going to miss all sorts of cases such as `pu55syg4rgle.java` and other such crude names.

The list I used contained some leet speak such as `b00bs` and `b1tch` to try and catch some of the most interesting cases. The full list is [here](/static/an-informal-survey/curse.txt).

While not accurate at all as mentioned it is incredibly fun to see what this produces. So lets start with a list of which languages have the most curse words. However we should probably weight this against how much code exists as well. So here are the top ones.

| language | filename curse count | percent of files |
| -------- | -------------------- | ---------------- |
| C Header | 7,660 | 0.00126394567906% |
| Java | 7,023 | 0.00258792635479% |
| C | 6,897 | 0.00120706524533% |
| PHP | 5,713 | 0.00283428484703% |
| JavaScript | 4,306 | 0.00140692338568% |
| HTML | 3,560 | 0.00177646776919% |
| Ruby | 3,121 | 0.00223136542655% |
| JSON | 1,598 | 0.00293688627715% |
| C++ | 1,543 | 0.00135977378652% |
| Dart | 1,533 | 0.19129310646% |
| Rust | 1,504 | 0.038465935524% |
| Go Template | 1,500 | 0.0792233157387% |
| SVG | 1,234 | 0.00771043360379% |
| XML | 1,212 | 0.000875741051608% |
| Python | 1,092 | 0.00119138129893% |
| JavaServer Pages | 1,037 | 0.0215440542669% |

Interesting! My first thought was "those naughty C developers!" but as it turns out while they have a high count they write so much code it probably isn't that big a deal. However pretty clearly Dart developers have an axe to grind! If you know someone coding in Dart you may want to go offer them a hug.

I also want to know what are the most commonly used curse words. Lets see how dirty a mind we have collectively. A few of the top ones I could see being legitimate names (if you squint), but the majority would certainly produce few comments in a PR and a raised eyebrow.

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

Note that some of the more offensive words in the list did have matching filenames which I find rather shocking considering what they were. Thankfully they were not very common and didn't make my list above which was limited to those which had counts over 100. I am hoping that those files only exist for testing allow/deny lists and such.

### Longest files by lines per language

As you would probably expect Plain Text, SQL, XML, JSON and CSV take the top positions of this one, seeing as they usually contain meta-data, database dumps and the like.

Limited to 40 because at some point there is only a hello world example or such available and the result is not very interesting. It is not surprising to see that someone has checked in `sqlite3.c` somewhere but I would be a little worried about that 3,064,594 line Python file and that 1,997,637 line TypeScript monster.

**NB** Some of the links below MAY not translate 100% due to throwing away some information when I created the files. Most should work, but a few you may need to mangle the URL to resolve.

[skip table to next section](#whats-the-largest-file-for-each-language)

<div class="table-4"></div>

| language | filename | lines |
| -------- | -------- | ----- |
| Plain Text | <a href="https://github.com/igorshing/flow/blob/master/data/1366100696temp.txt">1366100696temp.txt</a> | 347,671,811 |
| PHP | <a href="https://github.com/aadityajs/keylinkz/blob/master/file/log/phpfox_error_log_04_04_12_3d4b11f6ee2a89fd5ace87c910cee04b.php">phpfox_error_log_04_04_12_3d4b11f6ee2a89fd5ace87c910cee04b.php</a> | 121,930,973 |
| HTML | <a href="https://github.com/vanbug/codes/blob/master/yo.html">yo.html</a> | 54,596,752 |
| LEX | <a href="https://github.com/phoenixiizero/snes9x-3d/blob/master/gtk/l">l</a> | 39,743,785 |
| XML | <a href="https://bitbucket.com/mellson/dblp-statistics/src/master/SBDM Exercise 2/dblp.xml">dblp.xml</a> | 39,445,222 |
| Autoconf | <a href="https://github.com/rubusch/usi-compilers/blob/master/082__compiler/testsrepo/04while/21-t2.in">21-t2.in</a> | 33,526,784 |
| CSV | <a href="https://github.com/allisonbmccoy/smart-summarization/blob/master/knowledgebases/ontology.csv">ontology.csv</a> | 31,946,031 |
| Prolog | <a href="https://github.com/jrvalcourt/salary-prediction/blob/master/temp/top500_full.p">top500_full.p</a> | 22,428,770 |
| JavaScript | <a href="https://bitbucket.com/eternum/rails-facebook-webgl/src/master/app/assets/three/mirus.js">mirus.js</a> | 22,023,354 |
| JSON | <a href="https://github.com/nicknisi/safeomaha-data/blob/master/formatted_data/douglasCountyVoterRegistration.json">douglasCountyVoterRegistration.json</a> | 21,104,668 |
| Game Maker Language | <a href="https://github.com/shajain/i590project/blob/master/lgEvans/lg.gml">lg.gml</a> | 13,302,632 |
| C Header | <a href="https://github.com/alinefr/netcat-cpi-kernel-module/blob/master/tracks/trk6data.h">trk6data.h</a> | 13,025,371 |
| Objective C++ | <a href="https://bitbucket.com/vanghdi/yelp/src/master/data/yelp/review-1.mm">review-1.mm</a> | 12,788,052 |
| SQL | <a href="https://github.com/rigidus/bzzr/blob/master/newdump.sql">newdump.sql</a> | 11,595,909 |
| Patch | <a href="https://github.com/lnava/cs411g1/blob/master/clook_iosched-team01.patch">clook_iosched-team01.patch</a> | 10,982,879 |
| YAML | <a href="https://github.com/cclausen/communtu/blob/master/db/data.yml">data.yml</a> | 10,764,489 |
| SVG | <a href="https://github.com/ruby-gnome2/ruby-gnome2/blob/master/rsvg2/test/tmp/large-file.svg">large-file.svg</a> | 10,485,763 |
| Sass | <a href="https://bitbucket.com/abegarcia/lifyember/src/master/node_modules/node-sass/libsass/sass-spec/spec/benchmarks/large_empty.scss">large_empty.scss</a> | 10,000,000 |
| Assembly | <a href="https://github.com/bogwonch/thesis/blob/master/MIPS/1-INST-JMP/J.s">J.s</a> | 8,388,608 |
| LaTeX | <a href="https://github.com/zbhappy/c/blob/master/file/tex">tex</a> | 8,316,556 |
| C++ Header | <a href="https://github.com/algotrust/qmlib/blob/master/include/qmlib/math/random/impl/primpoly_impl.hh">primpoly_impl.hh</a> | 8,129,599 |
| Lisp | <a href="https://github.com/ayoub-89/nltk_data/blob/master/corpora/lin_thesaurus/simN.lsp">simN.lsp</a> | 7,233,972 |
| Perl | <a href="https://github.com/logicmoo/jellyfish/blob/master/temp/aimlCore3.pl">aimlCore3.pl</a> | 6,539,759 |
| SAS | <a href="https://github.com/herry13/fdt/blob/master/benchmark/cloud/cloud.old2/output.sas">output.sas</a> | 5,874,153 |
| C | <a href="https://github.com/anumq/protein/blob/master/Imp6/sourceFiles/CathDomainDescriptionFile.v3.5.c">CathDomainDescriptionFile.v3.5.c</a> | 5,440,052 |
| Lua | <a href="https://github.com/nan0meter/helix/blob/master/Content/Scenes/giant/giant.lua">giant.lua</a> | 5,055,019 |
| R | <a href="https://bitbucket.com/richardberendsen/rdwps/src/master/R/disambisearches.R">disambisearches.R</a> | 4,985,492 |
| MUMPS | <a href="https://bitbucket.com/dzhang50/gpm/src/master/spec2006/450.soplex/ref.mps">ref.mps</a> | 4,709,289 |
| HEX | <a href="https://bitbucket.com/bcforres/18545/src/master/roms/bin/combine.hex">combine.hex</a> | 4,194,304 |
| Python | <a href="https://github.com/anirudhvenkats/clowdflows/blob/master/workflows/segmine/data/mappings.py">mappings.py</a> | 3,064,594 |
| Scheme | <a href="https://github.com/cosmoharrigan/test-datasets/blob/master/pln/tuffy/smokes/tests/03-08-14/atomspace.scm">atomspace.scm</a> | 3,027,366 |
| C++ | <a href="https://github.com/arandur/prog3b/blob/master/src/Int.cpp">Int.cpp</a> | 2,900,609 |
| Properties File | <a href="https://github.com/gunner14/old_rr_code/blob/master/java_workplace/sns-xiaonei/xiaonei-guide/trunk/src/main/resources/nuomi_active_user_ids.properties">nuomi_active_user_ids.properties</a> | 2,747,671 |
| Alex | <a href="https://bitbucket.com/brendenl92/coldest-steeliest/src/master/Cold Steel/Release/media/Models/Dalek.X">Dalek.X</a> | 2,459,209 |
| TCL | <a href="https://github.com/pdsteele/socialnetworksproject/blob/master/datasets/TCL">TCL</a> | 2,362,970 |
| Ruby | <a href="https://github.com/bonifacefr/oddborg-1/blob/master/ext/fiparse/test/data/smj_12_2004.rb">smj_12_2004.rb</a> | 2,329,560 |
| Wolfram | <a href="https://github.com/liei/shoebox/blob/master/hmm.nb">hmm.nb</a> | 2,177,422 |
| Brainfuck | <a href="https://github.com/bletchley13/signature-based-malware-detection/blob/master/FFBloomFilter/BF">BF</a> | 2,097,158 |
| TypeScript | <a href="https://github.com/selbst/handy-chem/blob/master/HandwritingV010/testingcharacters/0/all_6.ts">all_6.ts</a> | 1,997,637 |
| Module-Definition | <a href="https://github.com/fukayatsu/kani_acid/blob/master/lib/mecab-naist-jdic/matrix.def">matrix.def</a> | 1,948,817 |
| LESS | <a href="https://github.com/er2/euler/blob/master/less">less</a> | 1,930,356 |
| Objective C | <a href="https://github.com/chinnabommu/computervisionwip/blob/master/imports/fast/fast-matlab-src-2.1/faster.m">faster.m</a> | 1,913,966 |
| Org | <a href="https://github.com/dyfeng/linuxscripts/blob/master/sogou_dict_import/default.org">default.org</a> | 1,875,096 |
| Jupyter | <a href="https://github.com/dunovank/pynb/blob/master/RADD/RADD/Proactive/ProHDDM/X/ReHDDM - AllGo sxFits-Copy0.ipynb">ReHDDM - AllGo sxFits-Copy0.ipynb</a> | 1,780,197 |
| Specman e | <a href="https://github.com/yecol/yecolhubio/blob/master/twitter/twitter.e">twitter.e</a> | 1,768,135 |
| F* | <a href="https://gitlab.com/projet_alphasat/projet_alphasat/blob/master/Pan_troglodytes_monomers.fst">Pan_troglodytes_monomers.fst</a> | 1,739,878 |
| Systemd | <a href="https://github.com/cocoxu/shakespeare/blob/master/models/Translators/video_corpus_baseline/data/video_clean_lower_tokenized.target">video_clean_lower_tokenized.target</a> | 1,685,570 |
| V | <a href="https://github.com/thepedestrian/fpga-simple-maze-game-using-vga-output/blob/master/SRC/FPGA-Verilog-Code/ImageMazeChannelValueROM.v">ImageMazeChannelValueROM.v</a> | 1,440,068 |
| Markdown | <a href="https://github.com/subjectraw/subjectraw/blob/master/subject/data/eng/eukaryota.md">eukaryota.md</a> | 1,432,161 |
| TeX | <a href="https://github.com/rogerbraun/wadoku-scripts/blob/master/japanischtest.tex">japanischtest.tex</a> | 1,337,456 |
| Forth | <a href="https://github.com/mar-one/machine-trans-shared-task/blob/master/data/corpus/europarl.tok.fr">europarl.tok.fr</a> | 1,288,074 |
| Shell | <a href="https://github.com/jcs/openbsd-commitid/blob/master/out/add_commitids_to_src.sh">add_commitids_to_src.sh</a> | 1,274,873 |
| SKILL | <a href="https://github.com/jacktsai/tos/blob/master/9.13/Assembly-CSharp/hijacked.il">hijacked.il</a> | 1,187,701 |
| CSS | <a href="https://github.com/pligo/icantgo/blob/master/web/css/7f116c3.css">7f116c3.css</a> | 1,170,216 |
| C# | <a href="https://github.com/sdanil/test/blob/master/Form1.cs">Form1.cs</a> | 1,140,480 |
| gitignore | <a href="https://github.com/arikanu/harpy/blob/master/harpy/.gitignore">.gitignore</a> | 1,055,167 |
| Boo | <a href="https://github.com/ph111p/bwinf_2014_runde2/blob/master/Aufgabe_1/3.out.tex">3.out.tex</a> | 1,032,145 |
| Java | <a href="https://github.com/castlely/compiler_tiger_lab1/blob/master/test/Monster.java">Monster.java</a> | 1,000,019 |
| ActionScript | <a href="https://github.com/tarzzz/ds/blob/master/linked-list/as">as</a> | 1,000,000 |
| MSBuild | <a href="https://github.com/chrisleewashere/swirl-osx/blob/master/corpus/train.props">train.props</a> | 989,860 |
| D | <a href="https://github.com/khalefa/dataset/blob/master/D">D</a> | 883,308 |
| Coq | <a href="https://bitbucket.com/mpettersson/reinsverifier/src/master/REINS/CompiledDFAs.v">CompiledDFAs.v</a> | 873,354 |
| Clojure | <a href="https://github.com/candera/cs-atom/blob/master/raw-data.clj">raw-data.clj</a> | 694,202 |
| Swig | <a href="https://bitbucket.com/roman_shafeyev/navsystem/src/master/workspace/NavCenter/3DEditor/3DEditor.i">3DEditor.i</a> | 645,117 |
| Happy | <a href="https://github.com/symbolicpower/perceptrondict/blob/master/y">y</a> | 624,673 |
| GLSL | <a href="https://github.com/aminems/opendwarfs/blob/master/test/n-body-methods/gem/capsid.vert">capsid.vert</a> | 593,618 |
| Verilog | <a href="https://github.com/sammsiontir/eecs470_superernie/blob/master/synth_report_0420/pipeline.vg">pipeline.vg</a> | 578,418 |
| Standard ML (SML) | <a href="https://github.com/amtriathlon/goldencheetah/blob/master/test/rides/Ambit3-HRVbutNoHR.sml">Ambit3-HRVbutNoHR.sml</a> | 576,071 |
| SystemVerilog | <a href="https://gitlab.com/andresavilas/ece337project/blob/master/mapped/bitcoinminer.v">bitcoinminer.v</a> | 561,974 |
| Visual Basic | <a href="https://bitbucket.com/mscalella/pronto/src/master/BussinessLogic/linqStoreProcs.designer.vb">linqStoreProcs.designer.vb</a> | 561,067 |
| Go | <a href="https://github.com/reusee/go-qt/blob/master/smoke_info/info.go">info.go</a> | 559,236 |
| Expect | <a href="https://github.com/jalwes/30_year_average/blob/master/Argonne_Hourly_Data/Argonne_hourly_dewpoint.exp">Argonne_hourly_dewpoint.exp</a> | 552,269 |
| Erlang | <a href="https://github.com/siteview/erlide/blob/master/com.siteview.kernel.core/modules/nnsdh/sdh_analogue_data.erl">sdh_analogue_data.erl</a> | 473,924 |
| Makefile | <a href="https://github.com/kssanath/ece497/blob/master/qt-everywhere-opensource-src-4.6.2/src/3rdparty/webkit/WebCore/Makefile">Makefile</a> | 462,433 |
| QML | <a href="https://github.com/kasra-hosseini/obspydmt/blob/master/obspyDMT/gcmt_catalog/COMBO/2005.qml">2005.qml</a> | 459,113 |
| SPDX | <a href="https://github.com/triplecheck/misc/blob/master/misc_spdx/linux-coreos.spdx">linux-coreos.spdx</a> | 444,743 |
| VHDL | <a href="https://github.com/mbarga/archive-cpu/blob/master/mapped/cpuTest.vhd">cpuTest.vhd</a> | 442,043 |
| ASP.NET | <a href="https://github.com/claq2/lcbodrinkfinder/blob/master/TestLcbo/AllProducts.aspx">AllProducts.aspx</a> | 438,423 |
| XML Schema | <a href="https://github.com/dvhill/impengineering/blob/master/xsd/rsx/7.4.1/856/AdvanceShipNotices.xsd">AdvanceShipNotices.xsd</a> | 436,055 |
| Elixir | <a href="https://github.com/lulance/courseranlangp/blob/master/h1-p/gene.train.with.rare.ex">gene.train.with.rare.ex</a> | 399,995 |
| Macromedia eXtensible Markup Language | <a href="https://bitbucket.com/jackcviers/flex-3-flex-4-performance-test/src/master/Flex4PerformanceTest/src/StaticFlex4PerformanceTest20000.mxml">StaticFlex4PerformanceTest20000.mxml</a> | 399,821 |
| Ada | <a href="https://github.com/raghup17/bmm/blob/master/hls/bmm_top/solution1/.autopilot/db/bmm_top.adb">bmm_top.adb</a> | 390,275 |
| TypeScript Typings | <a href="https://github.com/vansimke/dojotypedescriptiongenerator/blob/master/DojoTypeDescriptor/Scripts/typings/dojox.d.ts">dojox.d.ts</a> | 384,171 |
| Pascal | <a href="https://github.com/grahamegrieve/fhirserver/blob/master/library/r4/FHIR.R4.Resources.pas">FHIR.R4.Resources.pas</a> | 363,291 |
| COBOL | <a href="https://github.com/nesl/scpi-scripts/blob/master/kei/cpy">cpy</a> | 358,745 |
| Basic | <a href="https://github.com/jcorrius/go-oo-mingw32-soc/blob/master/test/macro/vba_streams/excel-vba-streams-#1.bas">excel-vba-streams-#1.bas</a> | 333,707 |
| Visual Basic for Applications | <a href="https://github.com/franc90/furnacedriver/blob/master/FurnaceDriver/FurnaceDriver_rpy/Default/Dispatcher.cls">Dispatcher.cls</a> | 332,266 |
| Puppet | <a href="https://github.com/malkia/multi_msvcrt/blob/master/main_110.pp">main_110.pp</a> | 314,217 |
| FORTRAN Legacy | <a href="https://github.com/yinyanghu/dmar/blob/master/Code/SVM/resultsX/f">f</a> | 313,599 |
| OCaml | <a href="https://github.com/merelyapseudonym/afp/blob/master/thys/Flyspeck-Tame/Archives/Pent.ML">Pent.ML</a> | 312,749 |
| FORTRAN Modern | <a href="https://github.com/johannesgerer/jburkardt-f/blob/master/slatec/slatec.f90">slatec.f90</a> | 298,677 |
| CoffeeScript | <a href="https://github.com/cherifya/letterpresser/blob/master/js/dictionary.coffee">dictionary.coffee</a> | 271,378 |
| Nix | <a href="https://github.com/edolstra/nixpkgs/blob/master/pkgs/development/haskell-modules/hackage-packages.nix">hackage-packages.nix</a> | 259,940 |
| Intel HEX | <a href="https://github.com/giorgio130/linux-2635-kobo-multitouch/blob/master/firmware/imx/epdc_ED060SCE.fw.ihex">epdc_ED060SCE.fw.ihex</a> | 253,836 |
| Scala | <a href="https://github.com/nette22/threeflowjs/blob/master/examples/renders/models_camaro.sc">models_camaro.sc</a> | 253,559 |
| Julia | <a href="https://github.com/carljv/bayescomp/blob/master/src/julia/*IJulia 0*.jl">*IJulia 0*.jl</a> | 221,058 |
| SRecode Template | <a href="https://github.com/malex984/mysettings/blob/master/.epsilon/espell.srt">espell.srt</a> | 216,243 |
| sed | <a href="https://github.com/sncosmo/sncosmohubio/blob/master/data/models/pierel/CSP-2004fe.SED">CSP-2004fe.SED</a> | 214,290 |
| ReStructuredText | <a href="https://github.com/ledmonster/japanese-law/blob/master/doc/S40/S40HO033.rst">S40HO033.rst</a> | 211,403 |
| Bosque | <a href="https://github.com/jalbertbowden/world-data/blob/master/world-dem-5-arcmin/world_dem_5arcmin_geo.bsq/world_dem_5arcmin_geo.bsq">world_dem_5arcmin_geo.bsq</a> | 199,238 |
| Emacs Lisp | <a href="https://github.com/cmungall/uberon/blob/master/util/ubermacros.el">ubermacros.el</a> | 195,861 |
| F# | <a href="https://bitbucket.com/akohlmey/lammps/src/master/examples/USER/misc/momb/Ag_O1X5.5_O2X0.55.eam.fs">Ag_O1X5.5_O2X0.55.eam.fs</a> | 180,008 |
| GDScript | <a href="https://github.com/hugo53/vinearts/blob/master/giaoduc.net.vn/Xa-hoi/Chum-anh-Phat-hien-chan-dong-tai-chua-Dam-Bac-Ninh/72906.gd">72906.gd</a> | 178,628 |
| Gherkin Specification | <a href="https://github.com/czlyc/2c-web-research/blob/master/data/raw/8/feature">feature</a> | 175,229 |
| Haskell | <a href="https://github.com/jjinkou2/agentcom/blob/master/Excel.hs">Excel.hs</a> | 173,039 |
| Dart | <a href="https://github.com/mattliberty/wordgen/blob/master/source/surnames_list.dart">surnames_list.dart</a> | 153,144 |
| Bazel | <a href="https://github.com/nonas/debian-clang/blob/master/tests/build_timeout/buildlogs/run1/matplotlib_1.3.1-1_amd64-20140427-1441.build">matplotlib_1.3.1-1_amd64-20140427-1441.build</a> | 149,234 |
| Haxe | <a href="https://github.com/ivideo/easytake/blob/master/FFmpeg-iOS-Encoder-master/hahah/ffmpeg-iOS/yasm-1.1.0/results/elf-x86id.hx">elf-x86id.hx</a> | 145,800 |
| IDL | <a href="https://github.com/brownplt/strobe/blob/master/data/all-idls.idl">all-idls.idl</a> | 129,435 |
| LD Script | <a href="https://github.com/t-crest/ospat/blob/master/misc/ldscripts/patmos/prep/kernel_partitions.lds">kernel_partitions.lds</a> | 127,187 |
| Monkey C | <a href="https://github.com/jlesniewski/pycrysfml/blob/master/hklgen/LFO/M3/LFO_BT1-point.mc">LFO_BT1-point.mc</a> | 120,881 |
| Modula3 | <a href="https://github.com/damsl/k3-mosaic/blob/master/tests/m3/tpch22.m3">tpch22.m3</a> | 120,185 |
| Batch | <a href="https://github.com/malific/script-shop/blob/master/EZhunter.cmd">EZhunter.cmd</a> | 119,341 |
| Rust | <a href="https://github.com/jankeromnes/gecko-dev/blob/master/third_party/rust/encoding_rs/src/data.rs">data.rs</a> | 114,408 |
| Ur/Web | <a href="https://github.com/deepuiitk/indian-parallel-corpora/blob/master/ur-en/tok/dict.ur-en.ur">dict.ur-en.ur</a> | 113,911 |
| Unreal Script | <a href="https://github.com/polyatail/scher_et_al_2013/blob/master/Figure_3/Panel_C/orfs.derep_id97.uc">orfs.derep_id97.uc</a> | 110,737 |
| Groovy | <a href="https://bitbucket.com/nfredricks/vim-files/src/master/tags/groovy">groovy</a> | 100,297 |
| Smarty Template | <a href="https://github.com/rodneyrehm/php-template-engines/blob/master/test/tests/smarty3/templates/assign.100000.tpl">assign.100000.tpl</a> | 100,002 |
| Bitbake | <a href="https://github.com/kellyhou/clientserver/blob/master/Examples/sys_net/io/bb">bb</a> | 100,000 |
| BASH | <a href="https://github.com/palmer-dabbelt/tek/blob/master/test/tek/palmer-master-thesis.bash">palmer-master-thesis.bash</a> | 96,911 |
| PSL Assertion | <a href="https://github.com/khayer/blat_parser/blob/master/lib/blat_parser/test_uno.psl">test_uno.psl</a> | 96,253 |
| ASP | <a href="https://github.com/grote/oclingo/blob/master/tests/gbie/instances/sat_gbie_01.asp">sat_gbie_01.asp</a> | 95,144 |
| Protocol Buffers | <a href="https://github.com/burrows-labs/sqllogictest/blob/master/proto/select1.proto">select1.proto</a> | 89,796 |
| Report Definition Language | <a href="https://github.com/vinhdoan/angroupdemo/blob/master/Reports/ACG.rdl">ACG.rdl</a> | 84,666 |
| Powershell | <a href="https://github.com/dwj7738/my-powershell-repository/blob/master/Modules/WPK/GeneratedControls/PresentationFramework.ps1">PresentationFramework.ps1</a> | 83,861 |
| Jinja | <a href="https://github.com/truebluedata/chakravyuhaiiitd/blob/master/jinja2">jinja2</a> | 76,040 |
| AWK | <a href="https://github.com/apurtell/llvm-test-suite/blob/master/MultiSource/Benchmarks/MallocBench/perl/INPUT/words-large.awk">words-large.awk</a> | 69,964 |
| LOLCODE | <a href="https://github.com/eldog/fface/blob/master/src/fsort/lol">lol</a> | 67,520 |
| Wren | <a href="https://github.com/munificent/wren/blob/master/test/limit/reuse_constants.wren">reuse_constants.wren</a> | 65,550 |
| JSX | <a href="https://github.com/imclab/drawgrid/blob/master/scripts/AEscript.jsx">AEscript.jsx</a> | 65,108 |
| Rakefile | <a href="https://github.com/vajapravin/pokemon_rails/blob/master/lib/tasks/seed.rake">seed.rake</a> | 63,000 |
| Stata | <a href="https://github.com/funzelknut/migrationsvariable/blob/master/Stata/DoFile/Logic/combinations/.31113.do">.31113.do</a> | 60,343 |
| Vim Script | <a href="https://github.com/yuratomo/cpp-api-ddk/blob/master/autoload/cppapi/ddk.vim">ddk.vim</a> | 60,282 |
| Swift | <a href="https://github.com/alexeyxo/protobuf-swift/blob/master/plugin/Tests/pbTests/Google.Protobuf.UnittestEnormousDescriptor.proto.swift">Google.Protobuf.UnittestEnormousDescriptor.proto.swift</a> | 60,236 |
| Korn Shell | <a href="https://github.com/ggouaillardet/ompi-www/blob/master/community/lists/devel/attachments/20090617/3f35b1fc/attachment-0002.ksh">attachment-0002.ksh</a> | 58,298 |
| AsciiDoc | <a href="https://github.com/cafe008/spring-framework/blob/master/src/asciidoc/index.adoc">index.adoc</a> | 52,627 |
| Freemarker Template | <a href="https://github.com/livesense/orglivesensesamplesimpleportal/blob/master/src/main/resources/apps/simpleportal/htmlmail/designed.eml.ftl">designed.eml.ftl</a> | 52,160 |
| Cython | <a href="https://github.com/szeng2013/eecs392/blob/master/391_Project/CALC/CALC.pex.netlist.CALC.pxi">CALC.pex.netlist.CALC.pxi</a> | 50,283 |
| m4 | <a href="https://github.com/tjgiese/atizer/blob/master/python/atizer/m4/m4/ax.m4">ax.m4</a> | 47,828 |
| Extensible Stylesheet Language Transformations | <a href="https://github.com/cmps290t/cmps290t/blob/master/templates/green_ccd.xslt">green_ccd.xslt</a> | 37,247 |
| License | <a href="https://github.com/xnox/android/blob/master/copyright">copyright</a> | 37,205 |
| JavaServer Pages | <a href="https://github.com/julien1990/wtp-sourceediting/blob/master/tests/org.eclipse.jst.jsp.ui.tests.performance/data/1MB.jsp">1MB.jsp</a> | 36,007 |
| Document Type Definition | <a href="https://github.com/braunoeder/yesodcms/blob/master/dita/dtd/bookmap/dtd/bookmap.dtd">bookmap.dtd</a> | 32,815 |
| Fish | <a href="https://gitlab.com/mitzip/fish-config/blob/master/functions/Godsay.fish">Godsay.fish</a> | 31,112 |
| ClojureScript | <a href="https://github.com/timvisher/painful-clojurescript-compilation/blob/master/src/painful_clojurescript_compilation/core.cljs">core.cljs</a> | 31,013 |
| Robot Framework | <a href="https://github.com/tomasz-kucharski/robocode/blob/master/doc/src_OpenGL/robot">robot</a> | 30,460 |
| Processing | <a href="https://github.com/bombilee/nxv11/blob/master/LidarSpoofing/data.pde">data.pde</a> | 30,390 |
| Ruby HTML | <a href="https://github.com/vijedi/javascript_framework_test/blob/master/app/views/home/big_table.rhtml">big_table.rhtml</a> | 29,306 |
| ColdFusion | <a href="https://github.com/llimllib/personal_code/blob/master/web/bnia/data/spreadsheet2009Q1.cfm">spreadsheet2009Q1.cfm</a> | 27,974 |
| CMake | <a href="https://github.com/luisibanez/vista-debian-med-package/blob/master/CMake/ListOfVistARoutines.cmake">ListOfVistARoutines.cmake</a> | 27,550 |
| ATS | <a href="https://github.com/ashalkhakov/ats-postiats/blob/master/npm-utils/contrib/libats-/hwxi/Andes/TEST/test06.dats">test06.dats</a> | 24,350 |
| Nim | <a href="https://github.com/renox/nimrod/blob/master/lib/windows/windows.nim">windows.nim</a> | 23,949 |
| Vue | <a href="https://github.com/deepfire/tech/blob/master/Ogre.vue">Ogre.vue</a> | 22,916 |
| Razor | <a href="https://github.com/agglerithm/readathonentry/blob/master/src/ReadAThonEntry/Views/Home/validationerror.cshtml">validationerror.cshtml</a> | 22,832 |
| Spice Netlist | <a href="https://github.com/danielsig727/dcs_labs/blob/master/DCS_FinalProject/input6.ckt">input6.ckt</a> | 22,454 |
| Isabelle | <a href="https://github.com/jshs/scyther-proof/blob/master/experiments/effect_of_reuse_and_minimization/output_FN/WooLam_cert_auto.thy">WooLam_cert_auto.thy</a> | 22,312 |
| XAML | <a href="https://github.com/tomba/dwarrowdelf/blob/master/Tests/WPFMapControlTest/SymbolDrawings.xaml">SymbolDrawings.xaml</a> | 20,764 |
| Opalang | <a href="https://github.com/kevtron/uniformsphere/blob/master/sample_data/p4000_g+5.0_m0.0_t00_st_z+0.00_a+0.00_c+0.00_n+0.00_o+0.00_r+0.00_s+0.00.opa">p4000_g+5.0_m0.0_t00_st_z+0.00_a+0.00_c+0.00_n+0.00_o+0.00_r+0.00_s+0.00.opa</a> | 20,168 |
| TOML | <a href="https://github.com/karupanerura/toml-parser/blob/master/xt/toml/too_large.toml">too_large.toml</a> | 20,000 |
| Madlang | <a href="https://github.com/cesarotti/dark-photons/blob/master/madgraph/madgraph_binaries/vendor/StdHEP/example/evgg.mad">evgg.mad</a> | 19,416 |
| Stylus | <a href="https://bitbucket.com/johanneskoch/interaktionskoll-client/src/master/node_modules/stylus-brunch/node_modules/stylus/testing/test.styl">test.styl</a> | 19,127 |
| Go Template | <a href="https://github.com/jtimothyking/perl6-bench/blob/master/data/html-template.tmpl">html-template.tmpl</a> | 19,016 |
| AutoHotKey | <a href="https://github.com/tinku99/ahk-hello-gl-ch2/blob/master/glext.ahk">glext.ahk</a> | 18,036 |
| ColdFusion CFScript | <a href="https://github.com/mfgglobalsolutions/collectmed/blob/master/collectmed1.0/CustomTags/com/common/db/IntakeHCPCIO.cfc">IntakeHCPCIO.cfc</a> | 17,606 |
| Zsh | <a href="https://github.com/voronenko/dotfiles/blob/master/completions/_oc.zsh">_oc.zsh</a> | 17,307 |
| Twig Template | <a href="https://github.com/terokaisti/elfinderbundle/blob/master/src/AlphaLemon/ElFinderBundle/Resources/views/ElFinder/show.html.twig">show.html.twig</a> | 16,320 |
| ABAP | <a href="https://github.com/yetaai/sap/blob/master/ZIM2Reports/ZRIM01F01.abap">ZRIM01F01.abap</a> | 16,029 |
| Elm | <a href="https://github.com/frankyn/csgraphics-fall13/blob/master/project1/data/viewpoint/57chevy.elm">57chevy.elm</a> | 14,968 |
| Kotlin | <a href="https://github.com/jetbrains/kotlin/blob/master/libraries/stdlib/common/src/generated/_Arrays.kt">_Arrays.kt</a> | 14,396 |
| Varnish Configuration | <a href="https://github.com/aureq/securityvcl/blob/master/vcl/breach/40_generic_attacks.vcl">40_generic_attacks.vcl</a> | 13,367 |
| Mustache | <a href="https://github.com/financial-times/o-table/blob/master/demos/src/huge.mustache">huge.mustache</a> | 13,313 |
| Alloy | <a href="https://github.com/epintos/fajita/blob/master/fajita/result/unroll_2/tacoOutput/output.als">output.als</a> | 12,168 |
| Device Tree | <a href="https://gitlab.com/mac/android_kernel_htc_flounder/blob/master/arch/arm64/boot/dts/tegra132-flounder-emc.dtsi">tegra132-flounder-emc.dtsi</a> | 11,893 |
| MQL4 | <a href="https://github.com/lvcster/java-examples/blob/master/PhD Appsolute System.mq4">PhD Appsolute System.mq4</a> | 11,280 |
| Jade | <a href="https://github.com/ernesto-licea/basictheme/blob/master/views/basic/images/icons/fugue.jade">fugue.jade</a> | 10,711 |
| Q# | <a href="https://github.com/afibanez/eneboo-modules/blob/master/direccion/analisis/scripts/in_navegador.qs">in_navegador.qs</a> | 10,025 |
| JSONL | <a href="https://github.com/aneeshmg/python/blob/master/NLP-TextEntailment/data/train.jsonl">train.jsonl</a> | 10,000 |
| Flow9 | <a href="https://github.com/hitchiker42/my-code/blob/master/cs758/asst-11/graph2.flow">graph2.flow</a> | 9,902 |
| Vala | <a href="https://github.com/stronnag/mwptools/blob/master/mwp/mwp.vala">mwp.vala</a> | 8,765 |
| Handlebars | <a href="https://github.com/jonschlinkert/liquid-to-handlebars/blob/master/test/expected/shopify-narrative/assets/theme.scss.hbs">theme.scss.hbs</a> | 8,259 |
| Crystal | <a href="https://github.com/000861/openfoam-21x/blob/master/tutorials/combustion/PDRFoam/flamePropagationWithObstacles/0/CR">CR</a> | 8,084 |
| C Shell | <a href="https://gitlab.com/bgcx262/zswi2010-svn-to-git/blob/master/trunk/data/plna.csh">plna.csh</a> | 8,000 |
| Hamlet | <a href="https://github.com/aliced3645/os/blob/master/weenix/user/hamlet">hamlet</a> | 7,882 |
| BuildStream | <a href="https://github.com/mrzork/proyectomaestria/blob/master/Final/Cites/Biometrics/biometrics.bst">biometrics.bst</a> | 7,746 |
| Mako | <a href="https://github.com/daniel2101/verificaciones/blob/master/report/verificaciones.mako">verificaciones.mako</a> | 7,306 |
| Agda | <a href="https://github.com/zsparks/pi-dual/blob/master/Univalence/Obsolete/Pifextra.agda">Pifextra.agda</a> | 6,483 |
| Thrift | <a href="https://github.com/cinchapi/concourse/blob/master/interface/concourse.thrift">concourse.thrift</a> | 6,471 |
| Fragment Shader File | <a href="https://github.com/jcamposr/wis20/blob/master/Simplex/ms812_bseqoslabel_l.fsh">ms812_bseqoslabel_l.fsh</a> | 6,269 |
| Cargo Lock | <a href="https://github.com/mozilla/servo/blob/master/Cargo.lock">Cargo.lock</a> | 6,202 |
| Xtend | <a href="https://github.com/arnobl/kompren/blob/master/kompren-examples/examples.umlFootprinting/src/main/java/umlfootprinter/UMLSlicerAspect.xtend">UMLSlicerAspect.xtend</a> | 5,936 |
| Arvo | <a href="https://github.com/scaleunlimited/cascadingavro/blob/master/scheme/src/test/resources/cascading/avro/test-extra-large.avsc">test-extra-large.avsc</a> | 5,378 |
| Scons | <a href="https://github.com/dxx-rebirth/dxx-rebirth/blob/master/SConstruct">SConstruct</a> | 5,272 |
| Closure Template | <a href="https://github.com/facebook/buck/blob/master/docs/files-and-dirs/buckconfig.soy">buckconfig.soy</a> | 5,189 |
| GN | <a href="https://github.com/v8/v8/blob/master/BUILD.gn">BUILD.gn</a> | 4,653 |
| Softbridge Basic | <a href="https://gitlab.com/bgcx261/znos-git/blob/master/build/usr/octopus/port/live/owptext.sbl">owptext.sbl</a> | 4,646 |
| PKGBUILD | <a href="https://bitbucket.com/axil42/aur-mirror/src/master/stepmania-extras/PKGBUILD">PKGBUILD</a> | 4,636 |
| Oz | <a href="https://github.com/aglie/mozart2/blob/master/lib/compiler/StaticAnalysis.oz">StaticAnalysis.oz</a> | 4,500 |
| Lucius | <a href="https://github.com/dsmatter/timetracker/blob/master/templates/bootstrap.lucius">bootstrap.lucius</a> | 3,992 |
| Ceylon | <a href="https://github.com/ceylon/ceylonast/blob/master/source/ceylon/ast/redhat/RedHatTransformer.ceylon">RedHatTransformer.ceylon</a> | 3,907 |
| Creole | <a href="https://github.com/bsmr-mariadb/mariadb-manager-monitor/blob/master/MariaDB_Manager_Monitors.creole">MariaDB_Manager_Monitors.creole</a> | 3,855 |
| Luna | <a href="https://github.com/luna/luna/blob/master/stdlib/Std/src/Base.luna">Base.luna</a> | 3,731 |
| Gradle | <a href="https://github.com/jasig/cas/blob/master/gradle/dependencies.gradle">dependencies.gradle</a> | 3,612 |
| MQL Header | <a href="https://github.com/ro31337/romanpushkin-dailygrid/blob/master/IncGUI.mqh">IncGUI.mqh</a> | 3,544 |
| Cabal | <a href="https://github.com/keqh-remote/cabals-mirror/blob/master/smartword.cabal">smartword.cabal</a> | 3,452 |
| Emacs Dev Env | <a href="https://github.com/a3090103838/emacs-24-mac/blob/master/info/ede">ede</a> | 3,400 |
| Meson | <a href="https://github.com/keruspe/systemd/blob/master/meson.build">meson.build</a> | 3,264 |
| nuspec | <a href="https://github.com/giggio/npm-nuget/blob/master/Npm.js.nuspec">Npm.js.nuspec</a> | 2,823 |
| Game Maker Project | <a href="https://github.com/kgs0142/ludum-dare/blob/master/LD40/LudumDare.yyp">LudumDare.yyp</a> | 2,679 |
| Julius | <a href="https://github.com/ahushh/monaba/blob/master/monaba/templates/default-layout.julius">default-layout.julius</a> | 2,454 |
| Idris | <a href="https://github.com/francks/ringidris/blob/master/Provers/ring_reduce.idr">ring_reduce.idr</a> | 2,434 |
| Alchemist | <a href="https://github.com/nim-hrkn/ecalj/blob/master/TestInstall/crn/out.lmf-dos.crn">out.lmf-dos.crn</a> | 2,388 |
| MQL5 | <a href="https://github.com/dennislwm/mlea/blob/master/MQL5/Experts/Commercial/DTS1-Build_814.1_B-test~.mq5">DTS1-Build_814.1_B-test~.mq5</a> | 2,210 |
| Android Interface Definition Language | <a href="https://github.com/android/platform_frameworks_base/blob/master/telephony/java/com/android/internal/telephony/ITelephony.aidl">ITelephony.aidl</a> | 2,005 |
| Vertex Shader File | <a href="https://github.com/bubbasacs/finalproj/blob/master/src/materialsystem/stdshaders/sdk_macros.vsh">sdk_macros.vsh</a> | 1,922 |
| Lean | <a href="https://github.com/leanprover/lean/blob/master/library/init/meta/interactive.lean">interactive.lean</a> | 1,664 |
| Jenkins Buildfile | <a href="https://github.com/elektrainitiative/libelektra/blob/master/scripts/jenkins/Jenkinsfile">Jenkinsfile</a> | 1,559 |
| FIDL | <a href="https://github.com/otcshare/automotive-message-broker/blob/master/docs/amb.in.fidl">amb.in.fidl</a> | 1,502 |
| Pony | <a href="https://bitbucket.com/thecomet/ponycraft-prototype/src/master/scripts/maps/demomap/scenery.pony">scenery.pony</a> | 1,497 |
| PureScript | <a href="https://github.com/maxnordlund/purescript/blob/master/prelude/prelude.purs">prelude.purs</a> | 1,225 |
| TaskPaper | <a href="https://github.com/jdzak/ncs_navigator_core/blob/master/audit/task-3275.taskpaper">task-3275.taskpaper</a> | 1,196 |
| Dockerfile | <a href="https://github.com/iplantcollaborativeopensource/discoveryenvironmentbackend/blob/master/docker/backwards-compat/Dockerfile">Dockerfile</a> | 1,187 |
| Janet | <a href="https://github.com/bianary/moosehead/blob/master/player/Janet">Janet</a> | 1,158 |
| Futhark | <a href="https://github.com/hiperfit/futhark/blob/master/futlib/math.fut">math.fut</a> | 990 |
| Zig | <a href="https://github.com/aurametrix/aurametrixhubio/blob/master/Games/Tetris-zig/src/main.zig">main.zig</a> | 903 |
| XCode Config | <a href="https://github.com/krzyzanowskim/cryptoswift/blob/master/config/Project-Shared.xcconfig">Project-Shared.xcconfig</a> | 522 |
| JAI | <a href="https://github.com/andy-hay/lightzone/blob/master/lightcrafts/resources/com/lightcrafts/mediax/jai/LCregistryFile.jai">LCregistryFile.jai</a> | 489 |
| QCL | <a href="https://bitbucket.com/gltronred/quipper-cabal/src/master/Programs/QCLParser/bwt.qcl">bwt.qcl</a> | 447 |
| Ur/Web Project | <a href="https://github.com/huluwa/bazqux-urweb/blob/master/reader.urp">reader.urp</a> | 346 |
| Cassius | <a href="https://github.com/nubis/haskellers/blob/master/cassius/default-layout.cassius">default-layout.cassius</a> | 313 |
| Docker ignore | <a href="https://github.com/ahbeng/nusmods/blob/master/.dockerignore">.dockerignore</a> | 311 |
| Dhall | <a href="https://github.com/github/linguist/blob/master/samples/Dhall/largeExpressionA.dhall">largeExpressionA.dhall</a> | 254 |
| ignore | <a href="https://github.com/9renpoto/dotfiles/blob/master/.ignore">.ignore</a> | 192 |
| Bitbucket Pipeline | <a href="https://github.com/ghb24/neci_stable/blob/master/bitbucket-pipelines.yml">bitbucket-pipelines.yml</a> | 181 |
| Just | <a href="https://github.com/sporto/kic/blob/master/api/graphql/Justfile">Justfile</a> | 95 |
| Verilog Args File | <a href="https://github.com/doswellf/combinator-uvm/blob/master/uvm_ref/1.2/uvm_ref_flow_1.2/designs/socv/rtl/rtl_lpw/opencores/or1200.irunargs">or1200.irunargs</a> | 60 |
| Polly | <a href="https://github.com/hsoft/aurdiff/blob/master/aur/polly">polly</a> | 26 |

### Whats the most complex file in each language?

Once again these values are not directly comparable to each other, but it is interesting to see what is considered the most complex in each language.

Some of these files are absolute monsters. For example consider the most complex C++ file I found [COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp](https://github.com/KhronosGroup/OpenCOLLADA/blob/master/COLLADASaxFrameworkLoader/src/generated15/COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp) which is 28.3 MB of compiler hell (and thankfully appears to be generated).

**NB** Some of the links below MAY not translate 100% due to throwing away some information when I created the files. Most should work, but a few you may need to mangle the URL to resolve.

[skip table to next section](#whats-the-most-complex-file-weighted-against-lines)

<div class="table-5"></div>

| language | filename | complexity |
| -------- | -------- | ---------- |
| C++ | <a href="https://bitbucket.com/zhangjingguo/opencollada/src/master/COLLADASaxFrameworkLoader/src/generated15/COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp">COLLADASaxFWLColladaParserAutoGen15PrivateValidation.cpp</a> | 682,001 |
| JavaScript | <a href="https://github.com/gmarty/smsstarec/blob/master/compiled/blocks.js">blocks.js</a> | 582,070 |
| C Header | <a href="https://github.com/bathtub/c---project-with-ruby-tests/blob/master/src/bigmofoheader.h">bigmofoheader.h</a> | 465,589 |
| C | <a href="https://github.com/alexrhein/typechef-linuxanalysis/blob/master/fmFormula.c">fmFormula.c</a> | 445,545 |
| Objective C | <a href="https://github.com/chinnabommu/computervisionwip/blob/master/imports/fast/fast-matlab-src-2.1/faster.m">faster.m</a> | 409,792 |
| SQL | <a href="https://github.com/iklementiev/smscenter/blob/master/dump20120515.sql">dump20120515.sql</a> | 181,146 |
| ASP.NET | <a href="https://github.com/openindiana/oi-userland/blob/master/components/developer/gcc-7/test/results-i386.master">results-i386.master</a> | 164,528 |
| Java | <a href="https://github.com/cinchapi/concourse/blob/master/concourse-driver-java/src/main/java/com/cinchapi/concourse/thrift/ConcourseService.java">ConcourseService.java</a> | 139,020 |
| TCL | <a href="https://github.com/mheinrichs/68030tk/blob/master/Logic/68030_TK.tcl">68030_TK.tcl</a> | 136,578 |
| C++ Header | <a href="https://github.com/abdollah110/tauhlt/blob/master/CalibCalorimetry/EcalTPGTools/test/TPG_hardcoded.hh">TPG_hardcoded.hh</a> | 129,465 |
| TypeScript Typings | <a href="https://github.com/teppeis/closure-librarydts/blob/master/all.d.ts">all.d.ts</a> | 127,785 |
| SVG | <a href="https://github.com/tarekauel/planspiel/blob/master/Class Diagram2.svg">Class Diagram2.svg</a> | 105,353 |
| Lua | <a href="https://github.com/ldeniau/mad/blob/master/src/blackBoxTest/luaFile1000kLines.lua">luaFile1000kLines.lua</a> | 102,960 |
| PHP | <a href="https://github.com/bit3archive/php-benchmark/blob/master/fopen.php">fopen.php</a> | 100,000 |
| Org | <a href="https://github.com/mquinson/smpi-modeling/blob/master/collectives/log/2015-02-25_idfreeze-2.org">2015-02-25_idfreeze-2.org</a> | 63,326 |
| Ruby | <a href="https://github.com/calebbarr/tent-of-meeting/blob/master/resources/all_search_helpers.rb">all_search_helpers.rb</a> | 60,375 |
| Scheme | <a href="https://github.com/shilrobot/shilscript_plus_plus/blob/master/scripts/test.ss">test.ss</a> | 50,000 |
| Stata | <a href="https://github.com/funzelknut/migrationsvariable/blob/master/Stata/DoFile/Logic/combinations/.31113.do">.31113.do</a> | 48,600 |
| Elixir | <a href="https://github.com/teamcohen/querendipity/blob/master/data/pmid.sgd.crawl.ex">pmid.sgd.crawl.ex</a> | 46,479 |
| Brainfuck | <a href="https://bitbucket.com/pholey/poll/src/master/Brainfuck/Poll.bf">Poll.bf</a> | 41,399 |
| Perl | <a href="https://github.com/aanavas/srproject/blob/master/t2p/r1d7.pl">r1d7.pl</a> | 41,128 |
| Go | <a href="https://github.com/tsileo/blobstash/blob/master/vendor/github.com/blevesearch/segment/segment_words_prod.go">segment_words_prod.go</a> | 34,715 |
| Python | <a href="https://github.com/wks/lrparsing3/blob/master/doc/examples/lrparsing-sqlite.py">lrparsing-sqlite.py</a> | 34,700 |
| Module-Definition | <a href="https://github.com/mihania/slovo/blob/master/src/WindowsPhone/Slovo.UI/Data/wordnet3_0.def">wordnet3_0.def</a> | 32,008 |
| Clojure | <a href="https://github.com/candera/cs-atom/blob/master/raw-data.clj">raw-data.clj</a> | 29,950 |
| C# | <a href="https://github.com/accord-net/framework/blob/master/Sources/Accord.Math/Matrix/Matrix.Product.Generated.cs">Matrix.Product.Generated.cs</a> | 29,675 |
| D | <a href="https://github.com/cybershadow/seatd/blob/master/src/seatd/parser.d">parser.d</a> | 27,249 |
| FORTRAN Modern | <a href="https://github.com/rfitzp/tomuhawc/blob/master/chease_src/euitm_routines_407c.f90">euitm_routines_407c.f90</a> | 27,161 |
| Puppet | <a href="https://github.com/joliebig/crefactor-sqliteevaluation/blob/master/sqlite3.c.pp">sqlite3.c.pp</a> | 25,753 |
| SystemVerilog | <a href="https://github.com/rajdeep87/verilog-c/blob/master/safe/hwmcc15/6s131/6s131.sv">6s131.sv</a> | 24,300 |
| Autoconf | <a href="https://github.com/lronaldo/cpctelera/blob/master/cpctelera/tools/sdcc-3.6.8-r9946/src/device/lib/pic16/libio/Makefile.in">Makefile.in</a> | 23,183 |
| Specman e | <a href="https://github.com/alopez/en600468/blob/master/aligner/data/hansards.e">hansards.e</a> | 20,893 |
| Smarty Template | <a href="https://github.com/jouvin/pan/blob/master/panc/tests/Performance/tests/include/test-include-09.tpl">test-include-09.tpl</a> | 20,000 |
| TypeScript | <a href="UNKNOWN/blob/master/lib/compiler/parsers/JSONiqParser.ts">JSONiqParser.ts</a> | 18,162 |
| V | <a href="https://github.com/amartya00/verilog/blob/master/gplgpu/gplgpu/hdl/sim_lib/altera_mf.v">altera_mf.v</a> | 13,584 |
| F* | <a href="https://github.com/mmjb/kittel-koat/blob/master/koat-evaluation/examples/T2/slayer-3.fst">slayer-3.fst</a> | 13,428 |
| TeX | <a href="https://bitbucket.com/kommusoft/publications/src/master/urbandictionaryprintable/definitions.tex">definitions.tex</a> | 13,342 |
| Swift | <a href="https://github.com/alexeyxo/protobuf-swift/blob/master/plugin/Tests/pbTests/Google.Protobuf.UnittestEnormousDescriptor.proto.swift">Google.Protobuf.UnittestEnormousDescriptor.proto.swift</a> | 13,017 |
| Assembly | <a href="https://bitbucket.com/bminor/binutils-gdb/src/master/gas/testsuite/gas/tic54x/all-opcodes.s">all-opcodes.s</a> | 12,800 |
| Bazel | <a href="https://github.com/nonas/debian-clang/blob/master/tests/build_timeout/buildlogs/run1/firebird2.5_2.5.2.26540.ds4-10_amd64-20140427-2159.build">firebird2.5_2.5.2.26540.ds4-10_amd64-20140427-2159.build</a> | 12,149 |
| FORTRAN Legacy | <a href="https://github.com/bakhtatou/ecalj/blob/master/lm7K/lm67src/lm67.F">lm67.F</a> | 11,837 |
| R | <a href="https://github.com/nicebread/wrs/blob/master/pkg/R/Rallfun-v36.R">Rallfun-v36.R</a> | 11,287 |
| ActionScript | <a href="https://github.com/3bu1/crossbridge/blob/master/avmplus/test/acceptance/as3/Definitions/FunctionAccessors/AccessorSpray.as">AccessorSpray.as</a> | 10,804 |
| Haskell | <a href="https://bitbucket.com/plooney/lamdicom/src/master/Tags.hs">Tags.hs</a> | 10,444 |
| Prolog | <a href="https://github.com/nhuntwalker/mystuff/blob/master/books/books_save.p">books_save.p</a> | 10,243 |
| Dart | <a href="https://github.com/financecoding/dartlr/blob/master/tests/out/DartParser.dart">DartParser.dart</a> | 9,606 |
| VHDL | <a href="https://github.com/arunkumarcea/ahir/blob/master/vhdl/unisims/unisim_VITAL.vhd">unisim_VITAL.vhd</a> | 9,590 |
| Batch | <a href="https://github.com/alepharchives/arabica/blob/master/tests/XSLT/testsuite/test.bat">test.bat</a> | 9,424 |
| Boo | <a href="https://github.com/nddrylliog/ooc-legacy/blob/master/legacy-doc/compman.tex">compman.tex</a> | 9,280 |
| Coq | <a href="https://github.com/juliankemmerer/drexel-ecec575/blob/master/Encounter/NangateOpenCellLibrary/Front_End/Verilog/NangateOpenCellLibrary.v">NangateOpenCellLibrary.v</a> | 8,988 |
| Shell | <a href="https://github.com/existme/myvimconfig/blob/master/zsh/completion/i3_completion.sh">i3_completion.sh</a> | 8,669 |
| Kotlin | <a href="https://github.com/jetbrains/kotlin/blob/master/compiler/tests-spec/testData/diagnostics/notLinked/dfa/pos/1.kt">1.kt</a> | 7,388 |
| JSX | <a href="https://github.com/shibukawa/typescript-parserjsx/blob/master/src/typescript-parser.jsx">typescript-parser.jsx</a> | 7,123 |
| Makefile | <a href="https://github.com/kharmajbird/jayos/blob/master/jlfs/Makefile">Makefile</a> | 6,642 |
| Emacs Lisp | <a href="https://github.com/bbohrer/emacs/blob/master/correct/bible.el">bible.el</a> | 6,345 |
| Objective C++ | <a href="https://github.com/metamath/setmm/blob/master/set.mm">set.mm</a> | 6,285 |
| OCaml | <a href="https://github.com/nrnrnr/qc--/blob/master/gen/sparcrec.ml">sparcrec.ml</a> | 6,285 |
| Expect | <a href="https://bitbucket.com/chameleonos/android_external_valgrind/src/master/main/none/tests/s390x/condloadstore.stdout.exp">condloadstore.stdout.exp</a> | 6,144 |
| SAS | <a href="https://github.com/gracieha/fixit/blob/master/import_REDCap.sas">import_REDCap.sas</a> | 5,783 |
| Julia | <a href="https://github.com/open-data/ckan-datatools/blob/master/data/pilot-2013-05-14.jl">pilot-2013-05-14.jl</a> | 5,599 |
| Cython | <a href="https://github.com/facebook/fbthrift/blob/master/thrift/compiler/test/fixtures/mcpp2-compare/gen-py3/module/types.pyx">types.pyx</a> | 5,278 |
| Modula3 | <a href="https://github.com/damsl/k3-mosaic/blob/master/tests/m3/tpch22.m3">tpch22.m3</a> | 5,182 |
| Haxe | <a href="https://github.com/saumya/nuggeta/blob/master/src-nuggeta/com/nuggeta/temp/k/l/m/T1231.hx">T1231.hx</a> | 5,110 |
| Visual Basic for Applications | <a href="https://gitlab.com/celnet/celnet/blob/master/Bt-UAT/src/classes/Coverage.cls">Coverage.cls</a> | 5,029 |
| Lisp | <a href="https://github.com/ayoub-89/nltk_data/blob/master/corpora/lin_thesaurus/simN.lsp">simN.lsp</a> | 4,994 |
| Scala | <a href="https://github.com/byvoid/sugarcpp/blob/master/src/SugarCpp.Test/Performance/SpeedTest1MB.sc">SpeedTest1MB.sc</a> | 4,908 |
| Groovy | <a href="https://github.com/nagysz/zkui/blob/master/grails-app/taglib/org/grails/plugins/zkui/ZulTagLib.groovy">ZulTagLib.groovy</a> | 4,714 |
| Powershell | <a href="https://github.com/carneycalcutt/windowspowershell/blob/master/Modules/WPK/GeneratedControls/PresentationFramework.ps1">PresentationFramework.ps1</a> | 4,108 |
| Ada | <a href="https://github.com/grahamstark/tax_benefit_model_components/blob/master/src/uk/raw/bhps/bhps-print_full_version.adb">bhps-print_full_version.adb</a> | 3,961 |
| JavaServer Pages | <a href="https://github.com/builtlean/builtlean/blob/master/styles/sink_jq.jsp">sink_jq.jsp</a> | 3,850 |
| GN | <a href="https://github.com/reallyenglish/freebsd-ports/blob/master/www/chromium/files/patch-third_party__ffmpeg__ffmpeg_generated.gni">patch-third_party__ffmpeg__ffmpeg_generated.gni</a> | 3,742 |
| Basic | <a href="https://github.com/hpux735/spectrum-analyzer/blob/master/Spectrum Analyzer/MSA_version116_4q.bas">MSA_version116_4q.bas</a> | 3,502 |
| Pascal | <a href="https://github.com/katrid/python4delphi/blob/master/PythonVCL/Components/Sources/VCL/D4/Python_StdCtrls.pas">Python_StdCtrls.pas</a> | 3,399 |
| Standard ML (SML) | <a href="https://github.com/dsheets/hol/blob/master/examples/l3-machine-code/arm/model/arm.sml">arm.sml</a> | 3,375 |
| Erlang | <a href="https://github.com/h4xxel/prog2/blob/master/inl2/lipsum.hrl">lipsum.hrl</a> | 3,228 |
| ASP | <a href="https://github.com/cinsoft/my-library/blob/master/mylib.asp">mylib.asp</a> | 3,149 |
| CSS | <a href="https://github.com/kaosat-dev/polymer-threejs/blob/master/elements/three-viewer/vendor/three-viewer.css">three-viewer.css</a> | 3,071 |
| Unreal Script | <a href="https://github.com/svn2github/deus-ex-plus/blob/master/Classes/ScriptedPawn.uc">ScriptedPawn.uc</a> | 2,909 |
| CoffeeScript | <a href="https://github.com/uhyo/jinrou/blob/master/server/rpc/game/game.coffee">game.coffee</a> | 2,772 |
| AutoHotKey | <a href="https://github.com/billman87/fishlog/blob/master/fishlog5.93.ahk">fishlog5.93.ahk</a> | 2,764 |
| MQL4 | <a href="https://github.com/lvcster/java-examples/blob/master/PhD Appsolute System.mq4">PhD Appsolute System.mq4</a> | 2,738 |
| Processing | <a href="https://github.com/apcs-k/per10-zilbersher-reschke-lasercore/blob/master/Final/Final.pde">Final.pde</a> | 2,635 |
| Isabelle | <a href="https://github.com/shxycwxj/topos/blob/master/thy_lib/isabelle_afp/Collections/gen_algo/StdInst.thy">StdInst.thy</a> | 2,401 |
| Razor | <a href="https://github.com/nathantownsend/protodev/blob/master/DEQMYCOAL.web/Views/ePermitCompleteness/Checklist.cshtml">Checklist.cshtml</a> | 2,341 |
| Sass | <a href="https://github.com/aleph3d/wafer/blob/master/SOURCE/THIRDPARTY/Stackicons/scss/_multi-color-css-stackicons-social.scss">_multi-color-css-stackicons-social.scss</a> | 2,325 |
| Vala | <a href="https://github.com/gnome/vala/blob/master/codegen/valaccodebasemodule.vala">valaccodebasemodule.vala</a> | 2,100 |
| MSBuild | <a href="https://github.com/blackoutjack/jamweaver/blob/master/src/native/all.props">all.props</a> | 2,008 |
| Rust | <a href="https://github.com/blei/rust-dumb-gtk/blob/master/src/ffi.rs">ffi.rs</a> | 1,928 |
| QML | <a href="https://github.com/rakesh91/qt_mobile_apps/blob/master/DOTS/SmartDots-build-simulator/qml/Dots/Dots.qml">Dots.qml</a> | 1,875 |
| F# | <a href="https://github.com/jack-pappas/fsharp/blob/master/tests/fsharp/core/libtest/test.fsx">test.fsx</a> | 1,826 |
| Vim Script | <a href="https://github.com/anoxic/dotfiles/blob/master/vim/autoload/netrw.vim">netrw.vim</a> | 1,790 |
| Korn Shell | <a href="https://github.com/ggouaillardet/ompi-www/blob/master/community/lists/devel/attachments/20090108/42143e6f/attachment.ksh">attachment.ksh</a> | 1,773 |
| Vue | <a href="https://github.com/sebabelmar/sebabelmarhubio/blob/master/img/Seba Belmar - Software Engineer_files/vue">vue</a> | 1,738 |
| sed | <a href="https://bitbucket.com/foss4mv/scarletdme/src/master/GPL.BP/SED">SED</a> | 1,699 |
| GLSL | <a href="https://github.com/asirjoosingh/renorm_gamess/blob/master/comp">comp</a> | 1,699 |
| Nix | <a href="https://bitbucket.com/ifenglin/ideploy/src/master/Splunk_TA_nix/samples/auth.nix">auth.nix</a> | 1,615 |
| Mustache | <a href="https://github.com/browniefed/parsetemplateexample/blob/master/public/template.mustache">template.mustache</a> | 1,561 |
| Bitbake | <a href="https://github.com/rvclayton/bibtex/blob/master/my-2010.bb">my-2010.bb</a> | 1,549 |
| Ur/Web | <a href="https://github.com/deepuiitk/indian-parallel-corpora/blob/master/ur-en/votes.ur">votes.ur</a> | 1,515 |
| BASH | <a href="https://github.com/andrei-mart/postgres-xc/blob/master/contrib/pgxc_ctl/pgxc_ctl.bash">pgxc_ctl.bash</a> | 1,426 |
| MQL Header | <a href="https://github.com/ujfjhz/costbalancer/blob/master/Include/hanoverfunctions.mqh">hanoverfunctions.mqh</a> | 1,393 |
| Visual Basic | <a href="https://github.com/mateso/lgmd2ward/blob/master/lgmd2ward/LGMDdataDataSet.Designer.vb">LGMDdataDataSet.Designer.vb</a> | 1,369 |
| Q# | <a href="https://github.com/mariomop/abanq-ar/blob/master/modulos/facturacion/facturacion/scripts/flfacturac.qs">flfacturac.qs</a> | 1,359 |
| C Shell | <a href="https://bitbucket.com/dargueso/unsw-ccrc-wrf/src/master/WRFV3/tools/regtest_hwrf.csh">regtest_hwrf.csh</a> | 1,214 |
| MQL5 | <a href="https://github.com/dennislwm/mlea/blob/master/MQL5/Experts/Commercial/DTS1-Build_814.1_B-test~.mq5">DTS1-Build_814.1_B-test~.mq5</a> | 1,186 |
| Xtend | <a href="https://github.com/knisterpeter/djeypeg/blob/master/parser/src/main/java/de/matrixweb/djeypeg/internal/Parser.xtend">Parser.xtend</a> | 1,116 |
| Nim | <a href="https://github.com/comex/imaon/blob/master/disas.nim">disas.nim</a> | 1,098 |
| CMake | <a href="https://github.com/adc90/sandbox/blob/master/cmake/tutorial1/src/cmake/modules/MacroOutOfSourceBuild.cmake">MacroOutOfSourceBuild.cmake</a> | 1,069 |
| Protocol Buffers | <a href="https://github.com/areascout/vice-gles2/blob/master/configure.proto">configure.proto</a> | 997 |
| SKILL | <a href="https://github.com/kth-prosper/main/blob/master/verification/out/from_hol2/switch.il">switch.il</a> | 997 |
| COBOL | <a href="https://github.com/rflejeune/geekcode/blob/master/geekcode.cob">geekcode.cob</a> | 989 |
| Game Maker Language | <a href="https://github.com/bkiselka/hale/blob/master/doc/plugins/eu.esdihumboldt.hale.doc.user.examples.meridian2/hydro/hydroEx_River.gml">hydroEx_River.gml</a> | 982 |
| Gherkin Specification | <a href="https://github.com/catrobat/catroweb-symfony/blob/master/tests/behat/features/api/upload_remixed_program_again_complex.feature">upload_remixed_program_again_complex.feature</a> | 959 |
| Alloy | <a href="https://github.com/iyouboushi/mirc-battlearena/blob/master/battlearena/battleformulas.als">battleformulas.als</a> | 948 |
| Bosque | <a href="https://github.com/umeshsahoo/website_umesh/blob/master/servlet/oracle/product/10.2.0/server/RDBMS/ADMIN/recover.bsq">recover.bsq</a> | 924 |
| ColdFusion | <a href="https://bitbucket.com/busches/lucee/src/master/lucee-cfml/lucee-admin/jquery.js.cfm">jquery.js.cfm</a> | 920 |
| Stylus | <a href="https://gitlab.com/artisin/dreamdocs/blob/master/client/styles/imports/buttron.styl">buttron.styl</a> | 866 |
| ColdFusion CFScript | <a href="https://github.com/blueriver/muracms/blob/master/core/mura/client/api/json/v1/apiUtility.cfc">apiUtility.cfc</a> | 855 |
| Verilog | <a href="https://bitbucket.com/gdevic/a-z80/src/master/cpu/control/exec_matrix.vh">exec_matrix.vh</a> | 793 |
| Freemarker Template | <a href="https://github.com/jonesde/moqui/blob/master/runtime/template/screen-macro/DefaultScreenMacros.html.ftl">DefaultScreenMacros.html.ftl</a> | 771 |
| Crystal | <a href="https://github.com/mverzilli/crystal/blob/master/src/compiler/crystal/syntax/lexer.cr">lexer.cr</a> | 753 |
| Forth | <a href="https://github.com/mdko/cs478/blob/master/project-toolkits/toolkitc/bin/e4">e4</a> | 690 |
| Monkey C | <a href="https://github.com/nasahackto/mesh/blob/master/mesh-1.4/mesh/perl/mc">mc</a> | 672 |
| Rakefile | <a href="https://github.com/structuralartistry/wavelineup3/blob/master/lib/tasks/import.rake">import.rake</a> | 652 |
| Zsh | <a href="https://github.com/kino/mydotfile/blob/master/homefile/zshrc">zshrc</a> | 649 |
| Ruby HTML | <a href="https://github.com/mallikarjunrao/hmm_application/blob/master/cravecupcakes/trunk/app/views/ownify/sales/ext_report.rhtml">ext_report.rhtml</a> | 633 |
| Handlebars | <a href="https://github.com/sakai-mirror/roster2/blob/master/src/webapp/templates/templates.handlebars">templates.handlebars</a> | 557 |
| SRecode Template | <a href="https://github.com/samdutton/chromesearch/blob/master/tracks/Al3SEbeK61s.srt">Al3SEbeK61s.srt</a> | 535 |
| Scons | <a href="https://gitlab.com/ineris/amc/blob/master/share/SConstruct">SConstruct</a> | 522 |
| Agda | <a href="https://github.com/hott/hott-agda/blob/master/core/lib/cubical/Square.agda">Square.agda</a> | 491 |
| Ceylon | <a href="https://github.com/unratito/ceylonlanguage/blob/master/test/metamodel/runtime.ceylon">runtime.ceylon</a> | 467 |
| Julius | <a href="https://github.com/ahushh/monaba/blob/master/monaba/templates/default-layout.julius">default-layout.julius</a> | 436 |
| Wolfram | <a href="https://github.com/peeterjoot/mathematica/blob/master/phy487/qmSolidsPs8dContourPlot.nb">qmSolidsPs8dContourPlot.nb</a> | 417 |
| Cabal | <a href="https://github.com/simonmar/parconc-examples/blob/master/parconc-examples.cabal">parconc-examples.cabal</a> | 406 |
| Fragment Shader File | <a href="https://github.com/benraziel/flappybird-shader/blob/master/flappybird.fsh">flappybird.fsh</a> | 349 |
| ATS | <a href="https://github.com/alex-ren/atstools/blob/master/src/ats_staexp2_util1.dats">ats_staexp2_util1.dats</a> | 311 |
| Jinja | <a href="https://github.com/f500/ansible-php_cli/blob/master/templates/php.ini.j2">php.ini.j2</a> | 307 |
| Opalang | <a href="https://github.com/alexkit/opalang/blob/master/lib/stdlib/core/unicode.opa">unicode.opa</a> | 306 |
| Twig Template | <a href="https://github.com/babyonline/opencart/blob/master/upload/admin/view/template/catalog/product_form.twig">product_form.twig</a> | 296 |
| ClojureScript | <a href="https://github.com/clojure/clojurescript/blob/master/src/main/cljs/cljs/core.cljs">core.cljs</a> | 271 |
| Hamlet | <a href="https://github.com/pgarst/javabio/blob/master/Data/Text/hamlet">hamlet</a> | 270 |
| Oz | <a href="https://github.com/doublec/mozart/blob/master/share/lib/compiler/StaticAnalysis.oz">StaticAnalysis.oz</a> | 267 |
| Elm | <a href="https://github.com/cthree/dotfiles/blob/master/config/atom/packages/elmjutsu/elm/Indexer.elm">Indexer.elm</a> | 267 |
| Meson | <a href="https://github.com/ixit/mesa-3d/blob/master/meson.build">meson.build</a> | 248 |
| ABAP | <a href="https://github.com/yetaai/sap/blob/master/ZBCS01Reports/ZRFFORI99.abap">ZRFFORI99.abap</a> | 244 |
| Dockerfile | <a href="https://github.com/osgeo/gdal/blob/master/gdal/docker/alpine-normal/Dockerfile">Dockerfile</a> | 243 |
| Wren | <a href="https://github.com/munificent/wren/blob/master/src/module/repl.wren">repl.wren</a> | 242 |
| Fish | <a href="https://github.com/adampash/dotfiles/blob/master/config/fish/functions/fisher.fish">fisher.fish</a> | 217 |
| Emacs Dev Env | <a href="https://github.com/timvisher/emacsbak/blob/master/info/ede">ede</a> | 211 |
| GDScript | <a href="https://github.com/grandmasterhack/1gam/blob/master/2017/June/Godot Picking Sticks/addons/vnen.tiled_importer/tiled_map.gd">tiled_map.gd</a> | 195 |
| IDL | <a href="https://github.com/bkaradzic/bgfx/blob/master/scripts/bgfx.idl">bgfx.idl</a> | 187 |
| Jade | <a href="https://github.com/jaeh/printit/blob/master/views/printit/pages/docs.jade">docs.jade</a> | 181 |
| PureScript | <a href="https://github.com/purescript-contrib/purescript-lists/blob/master/test/Test/Data/List.purs">List.purs</a> | 180 |
| XAML | <a href="https://github.com/btsmarco/theagpeya/blob/master/CopticAgpeya/English/Midnight.xaml">Midnight.xaml</a> | 179 |
| Flow9 | <a href="https://github.com/samst0r/samst0rhubio/blob/master/node_modules/graphql-compose/mjs/TypeMapper.js.flow">TypeMapper.js.flow</a> | 173 |
| Idris | <a href="https://github.com/cheepnis/idris-dev/blob/master/libs/base/Language/Reflection/Utils.idr">Utils.idr</a> | 166 |
| PSL Assertion | <a href="https://github.com/endyson/sept-13-2011/blob/master/sim/psl/pre_dec.psl">pre_dec.psl</a> | 162 |
| Lean | <a href="https://github.com/avigad/libraries/blob/master/library/standard/kernel.lean">kernel.lean</a> | 161 |
| MUMPS | <a href="https://github.com/openzelda/content-package/blob/master/scripts/link.mps">link.mps</a> | 161 |
| Vertex Shader File | <a href="https://github.com/sharaugn/mc-reloaded-shaders/blob/master/base.vsh">base.vsh</a> | 152 |
| Go Template | <a href="https://github.com/aicp/frameworks_native/blob/master/vulkan/libvulkan/code-generator.tmpl">code-generator.tmpl</a> | 148 |
| Mako | <a href="https://github.com/epithumia/spline-pokedex/blob/master/splinext/pokedex/templates/pokedex/search/pokemon.mako">pokemon.mako</a> | 137 |
| Closure Template | <a href="https://github.com/gan/ganhubio/blob/master/blockly-games/genetics/template.soy">template.soy</a> | 121 |
| Zig | <a href="https://github.com/aurametrix/aurametrixhubio/blob/master/Games/Tetris-zig/src/main.zig">main.zig</a> | 115 |
| TOML | <a href="https://github.com/monome/teletype/blob/master/docs/ops/telex_o.toml">telex_o.toml</a> | 100 |
| Softbridge Basic | <a href="https://github.com/hardbol/spitbol/blob/master/gas/asm.sbl">asm.sbl</a> | 98 |
| QCL | <a href="https://bitbucket.com/gltronred/quipper-cabal/src/master/Programs/QCLParser/bwt.qcl">bwt.qcl</a> | 96 |
| Futhark | <a href="https://github.com/hiperfit/futhark/blob/master/futlib/math.fut">math.fut</a> | 86 |
| Pony | <a href="https://github.com/rockneurotiko/rockneurotikohubio/blob/master/RandomThings/Pony/json/jstypes.pony">jstypes.pony</a> | 70 |
| LOLCODE | <a href="https://bitbucket.com/animeshsinha/linguist-github/src/master/samples/LOLCODE/LOLTracer.lol">LOLTracer.lol</a> | 61 |
| Alchemist | <a href="https://github.com/boyter/scc/blob/master/alchemist.crn">alchemist.crn</a> | 55 |
| Madlang | <a href="https://github.com/aldomx/stepmania/blob/master/Docs/Copying.MAD">Copying.MAD</a> | 44 |
| LD Script | <a href="https://github.com/rockbox/rockbox/blob/master/apps/plugins/plugin.lds">plugin.lds</a> | 39 |
| Device Tree | <a href="https://github.com/wanghao-xznu/vte/blob/master/testcases/third_party_suite/dt/dt.d/dts">dts</a> | 22 |
| FIDL | <a href="https://github.com/bmwcarit/joynr/blob/master/basemodel/src/main/franca/joynr/GlobalCapabilitiesDirectory.fidl">GlobalCapabilitiesDirectory.fidl</a> | 19 |
| JAI | <a href="https://github.com/mihxil/mmbase/blob/master/documentation/releases/legal/LICENSE.jai">LICENSE.jai</a> | 18 |
| Just | <a href="https://github.com/opetushallitus/eperusteet/blob/master/Justfile">Justfile</a> | 7 |
| Android Interface Definition Language | <a href="https://github.com/zhaojl/demo/blob/master/android_base/aidl">aidl</a> | 3 |
| Ur/Web Project | <a href="https://bitbucket.com/rkeatin3/code-samples/src/master/C++(ROS)/ME530646/ur5/jointSpace.urp">jointSpace.urp</a> | 2 |
| Spice Netlist | <a href="https://github.com/acuoci/edcsmoke/blob/master/run/kineticMechanisms/thermodynamics/GRI30.CKT">GRI30.CKT</a> | 2 |

### Whats the most complex file weighted against lines?

This sounds good in practice, but in reality... anything minified or with no newlines skews the results making this one effectively pointless. As such I have not included this calculation. I have however created an issue inside `scc` to support detection of minified code so it can be removed from the calculation results https://github.com/boyter/scc/issues/91

It's probably possible to infer this using just the data at hand, but id like to make it a more robust check that anyone using `scc` can benefit from.

### Whats the most commented file in each language?

Whats the most commented file in each language? I have no idea what sort of information you can get out of this that might be useful but it is interesting to have a look.

**NB** Some of the links below MAY not translate 100% due to throwing away some information when I created the files. Most should work, but a few you may need to mangle the URL to resolve.

[skip table to next section](#how-many-pure-projects)

<div class="table-6"></div>

| language | filename | comment lines |
| -------- | -------- | ------------- |
| Prolog | <a href="https://github.com/ncvc/sentiment/blob/master/ts-with-score-multiplier.p">ts-with-score-multiplier.p</a> | 5,603,870 |
| C | <a href="https://github.com/aclements/thesis/blob/master/thesis/data/testgen.c">testgen.c</a> | 1,705,508 |
| Python | <a href="https://github.com/maxsong123/bearded-wight/blob/master/Untitled0.py">Untitled0.py</a> | 1,663,466 |
| JavaScript | <a href="https://github.com/meotimdihia/pythontest/blob/master/100MB.js">100MB.js</a> | 1,165,656 |
| SVG | <a href="https://bitbucket.com/nicholma/cs4021-advanced-architecture-misc/src/master/Interleaves/alt/p4-s3_I369600.svg">p4-s3_I369600.svg</a> | 1,107,955 |
| SQL | <a href="https://github.com/freeside/freeside/blob/master/FS-Test/share/test.sql">test.sql</a> | 858,993 |
| C Header | <a href="https://github.com/findingdestity/vuforiaaugmentedreality/blob/master/VuforiaAugmentedReality/VuforiaAugmentedReality/Models/head.h">head.h</a> | 686,587 |
| C++ | <a href="https://github.com/major-lab/mccore/blob/master/lib/ResidueTopology.cc">ResidueTopology.cc</a> | 663,024 |
| Autoconf | <a href="https://github.com/revivo/py_snippets/blob/master/data/square_detector_local.in">square_detector_local.in</a> | 625,464 |
| TypeScript | <a href="https://github.com/forivall/typescript/blob/master/tests/cases/fourslash/reallyLargeFile.ts">reallyLargeFile.ts</a> | 583,708 |
| LEX | <a href="https://github.com/furushchev/jsk_demos/blob/master/jsk_2015_06_hrp_drc/drc_task_common/euslisp/vehicle/polaris-xp900.l">polaris-xp900.l</a> | 457,288 |
| XML | <a href="https://github.com/cyberdrcarr/knowledgemanagementframework/blob/master/QA/CommonDataLayer/Test1-CDL-soapui-project.xml">Test1-CDL-soapui-project.xml</a> | 411,321 |
| HTML | <a href="https://github.com/alvarobp/donde_estudio/blob/master/test/fixtures/todos_centros.html">todos_centros.html</a> | 366,776 |
| Pascal | <a href="https://github.com/grahamegrieve/fhirserver/blob/master/library/r4/FHIR.R4.Resources.pas">FHIR.R4.Resources.pas</a> | 363,289 |
| SystemVerilog | <a href="https://github.com/t-crest/bluetree/blob/master/mkToplevelBT64.v">mkToplevelBT64.v</a> | 338,042 |
| PHP | <a href="https://github.com/easyvyc/easywebmanager/blob/master/site/classes/lib/cool-php-captcha/resources/words/lt.php">lt.php</a> | 295,054 |
| TypeScript Typings | <a href="https://github.com/vansimke/dojotypedescriptiongenerator/blob/master/DojoTypeDescriptor/Scripts/typings/dojox.d.ts">dojox.d.ts</a> | 291,002 |
| Verilog | <a href="https://github.com/krios262/551project/blob/master/synthVdotP/CVP14_synth.vg">CVP14_synth.vg</a> | 264,649 |
| Lua | <a href="https://github.com/kinshi/tarkin_scripts/blob/master/scripts/object/mobile/objects.lua">objects.lua</a> | 205,006 |
| V | <a href="https://github.com/bart-group/bart/blob/master/tests/ARTIETests/testfiles/TestDataset01-functional.v">TestDataset01-functional.v</a> | 201,973 |
| Java | <a href="https://github.com/christianharrington/mdd/blob/master/IfcXML/src/org/tech/iai/ifc/xml/ifc/_2x3/final_/FinalPackage.java">FinalPackage.java</a> | 198,035 |
| C++ Header | <a href="https://github.com/pykoder/redemption/blob/master/tests/includes/fixtures/test_cliprdr_channel_xfreerdp_full_authorisation.hpp">test_cliprdr_channel_xfreerdp_full_authorisation.hpp</a> | 196,958 |
| Shell | <a href="https://github.com/jcs/openbsd-commitid/blob/master/out/add_commitids_to_src.sh">add_commitids_to_src.sh</a> | 179,223 |
| C# | <a href="https://github.com/arventwei/wcell/blob/master/Core/WCell.Constants/Items/ItemId.cs">ItemId.cs</a> | 171,944 |
| FORTRAN Modern | <a href="https://github.com/johannesgerer/jburkardt-f/blob/master/slatec/slatec.f90">slatec.f90</a> | 169,817 |
| Assembly | <a href="https://github.com/dpeddi/ws-28xx-hacking/blob/master/HeavyWeather.asm">HeavyWeather.asm</a> | 169,645 |
| Module-Definition | <a href="https://github.com/msherman13/e6321_top_half/blob/master/apr/top_level.final.def">top_level.final.def</a> | 139,150 |
| FORTRAN Legacy | <a href="https://github.com/wch/r-source/blob/master/src/modules/lapack/dlapack.f">dlapack.f</a> | 110,640 |
| VHDL | <a href="https://github.com/mbarga/archive-cpu/blob/master/mapped/cpuTest.vhd">cpuTest.vhd</a> | 107,882 |
| Groovy | <a href="https://bitbucket.com/nfredricks/vim-files/src/master/tags/groovy">groovy</a> | 98,985 |
| IDL | <a href="https://github.com/brownplt/strobe/blob/master/data/all-idls.idl">all-idls.idl</a> | 91,771 |
| Wolfram | <a href="https://github.com/gillespie/torsions/blob/master/LinKnots/K2KL.nb">K2KL.nb</a> | 90,224 |
| Go | <a href="https://github.com/tsileo/blobstash/blob/master/vendor/gopkg.in/src-d/enry.v1/data/frequencies.go">frequencies.go</a> | 89,661 |
| Scheme | <a href="https://github.com/mojmir-svoboda/dbgtoolkit/blob/master/3rd/s7/s7test.scm">s7test.scm</a> | 88,907 |
| D | <a href="https://github.com/khanhbui/jpf/blob/master/old_projects/jpf-symbc/.hg/store/data/lib/coral.jar.d">coral.jar.d</a> | 80,674 |
| Coq | <a href="https://github.com/amigabill/minimig-de1/blob/master/lib/altera/cycloneiv_hssi_atoms.v">cycloneiv_hssi_atoms.v</a> | 74,936 |
| Specman e | <a href="https://github.com/shihyu/mytool/blob/master/mybin/se/macros/sysobjs.e">sysobjs.e</a> | 65,146 |
| Puppet | <a href="https://github.com/joliebig/crefactor-sqliteevaluation/blob/master/sqlite3.c.pp">sqlite3.c.pp</a> | 63,656 |
| Wren | <a href="https://github.com/munificent/wren/blob/master/test/limit/many_globals.wren">many_globals.wren</a> | 61,388 |
| Boo | <a href="https://github.com/dt888/starlink/blob/master/applications/kappa/sun95.tex">sun95.tex</a> | 57,018 |
| Ruby | <a href="https://github.com/pburba/demo_app/blob/master/app/models/bigfile.rb">bigfile.rb</a> | 50,000 |
| Objective C | <a href="https://github.com/jmcarp/fmri-pipe/blob/master/joblog/job_sub011.m">job_sub011.m</a> | 44,788 |
| CSS | <a href="https://github.com/26mansi/raxa-jss/blob/master/src/resources/css/screener.css">screener.css</a> | 43,785 |
| Swig | <a href="https://bitbucket.com/abellnets/hrossparser/src/master/xml_files/CIDE.I">CIDE.I</a> | 37,235 |
| Fish | <a href="https://gitlab.com/mitzip/fish-config/blob/master/functions/Godsay.fish">Godsay.fish</a> | 31,103 |
| Sass | <a href="https://github.com/wangbiaouestc/clpeak/blob/master/OpsBench/ma-thesis/bench/results/instruction/sm30_kernels.sass">sm30_kernels.sass</a> | 30,306 |
| CoffeeScript | <a href="https://github.com/trshugu/nt/blob/master/tmp.coffee">tmp.coffee</a> | 29,088 |
| Erlang | <a href="https://github.com/nussiminen/git_nussia/blob/master/nci_ft_ricm_dul_SUITE.erl">nci_ft_ricm_dul_SUITE.erl</a> | 28,306 |
| Lisp | <a href="https://github.com/mbcode/kmb/blob/master/km_2-5-33.lisp">km_2-5-33.lisp</a> | 27,579 |
| YAML | <a href="https://github.com/mariouriarte/anbeed/blob/master/data/fixtures/ciudades.yml">ciudades.yml</a> | 27,168 |
| R | <a href="https://github.com/cran/phylosim/blob/master/R/PhyloSimSource.R">PhyloSimSource.R</a> | 26,023 |
| Scala | <a href="https://github.com/ajanker/typechef/blob/master/CTypeChecker/src/test/scala/de/fosd/typechef/typesystem/generated/GeneratedRedeclTests.scala">GeneratedRedeclTests.scala</a> | 24,647 |
| Emacs Lisp | <a href="https://gitlab.com/com-informatimago/emacs/blob/master/pjb-java.el">pjb-java.el</a> | 24,375 |
| Haskell | <a href="https://github.com/weltensegler/zeno/blob/master/src/Calculus/Dipole80.hs">Dipole80.hs</a> | 24,245 |
| ATS | <a href="https://github.com/ashalkhakov/ats-postiats/blob/master/npm-utils/contrib/libats-/hwxi/Andes/TEST/test06.dats">test06.dats</a> | 24,179 |
| m4 | <a href="https://github.com/tjgiese/atizer/blob/master/python/atizer/m4/m4/ax.m4">ax.m4</a> | 22,675 |
| ActionScript | <a href="https://github.com/oyhc/simonynx/blob/master/hero/src/cmodule/ALCSWF/__2E_str95.as">__2E_str95.as</a> | 21,173 |
| Objective C++ | <a href="https://github.com/antonbikineev/clang/blob/master/test/Analysis/edges-new.mm">edges-new.mm</a> | 20,789 |
| Visual Basic | <a href="https://github.com/celinak/directobservationtoolsforwindows/blob/master/MapWindow/Classes/Projections/clsProjections.vb">clsProjections.vb</a> | 20,641 |
| TCL | <a href="https://github.com/mheinrichs/68030tk/blob/master/Logic/68030_TK.tcl">68030_TK.tcl</a> | 20,616 |
| Nix | <a href="https://github.com/matthewbauer/matthewbauerhubio/blob/master/nix">nix</a> | 19,605 |
| Perl | <a href="https://github.com/imazen/repositext/blob/master/vendor/lf_aligner_3.12/scripts/LF_aligner_3.12_with_modules.pl">LF_aligner_3.12_with_modules.pl</a> | 18,013 |
| Ada | <a href="https://github.com/landgraf/matreshka/blob/master/source/amf/uml/amf-internals-tables-uml_metamodel-objects.adb">amf-internals-tables-uml_metamodel-objects.adb</a> | 14,535 |
| Batch | <a href="https://github.com/asfuyao/asfuyao/blob/master/Windows/微软产品激活/Microsoft Activation Script _0.6_中英双语/MAS_0.6_en.cmd">MAS_0.6_en.cmd</a> | 14,402 |
| OCaml | <a href="https://github.com/camlspotter/ocamlpro-ocaml-branch/blob/master/examples/00036_mandelbrot/code_new.ml">code_new.ml</a> | 13,648 |
| LaTeX | <a href="https://github.com/gnuplot/tex_demos/blob/master/demo/output/context/pm3dcolors.tex">pm3dcolors.tex</a> | 13,092 |
| Properties File | <a href="https://github.com/open-wide/owsi-nuxeo-translations-explorer/blob/master/l10n/5.6/messages_ar_SA.properties">messages_ar_SA.properties</a> | 13,074 |
| MSBuild | <a href="https://github.com/muraad/bc-csharp/blob/master/crypto/ncrypto.csproj">ncrypto.csproj</a> | 11,302 |
| ASP.NET | <a href="https://github.com/fran9rodriguez/socios/blob/master/SocIoS Front End/SociosFrontEnd/DesktopModules/EasyDNNGallery/GallerySettings.ascx">GallerySettings.ascx</a> | 10,969 |
| Powershell | <a href="https://github.com/uti7/foo/blob/master/mail_imap.ps1">mail_imap.ps1</a> | 10,798 |
| Standard ML (SML) | <a href="https://github.com/petersewell/netsem/blob/master/unmaintained/Net/TCP/Spec2/TCP1_hostLTSScript.sml">TCP1_hostLTSScript.sml</a> | 10,790 |
| Dart | <a href="https://github.com/nkratzke/nkratzkehubio/blob/master/assets/ss2018/webtech/games/team-4g/packages/$sdk/lib/html/dart2js/html_dart2js.dart">html_dart2js.dart</a> | 10,547 |
| AutoHotKey | <a href="https://github.com/dajunx/cplusplus/blob/master/ahk_script/others/studio.ahk">studio.ahk</a> | 10,391 |
| Expect | <a href="https://github.com/vicamo/b2g_mozilla-central/blob/master/cmd/macfe/projects/client/Navigator.exp">Navigator.exp</a> | 10,063 |
| Julia | <a href="https://github.com/stevengj/petscjl/blob/master/src/generated/PETScRealSingle.jl">PETScRealSingle.jl</a> | 9,417 |
| Makefile | <a href="https://github.com/objeck/objeck-lang/blob/master/misc/wxWidgets/stc/lexer/Makefile">Makefile</a> | 9,204 |
| Forth | <a href="https://github.com/mar-one/machine-trans-shared-task/blob/master/data/corpus/europarl.lowercased.fr">europarl.lowercased.fr</a> | 9,107 |
| ColdFusion | <a href="https://github.com/phillipsenn/matrix/blob/master/js/js.cfm">js.cfm</a> | 8,786 |
| TeX | <a href="https://github.com/delcmo/dissertation/blob/master/hyperref.sty">hyperref.sty</a> | 8,591 |
| Opalang | <a href="https://github.com/ajbetteridge/opalang/blob/master/lib/stdlib/core/i18n/i18n_language.opa">i18n_language.opa</a> | 7,860 |
| LESS | <a href="https://github.com/2jdesign/magento2/blob/master/lib/web/css/docs/source/_variables.less">_variables.less</a> | 7,394 |
| Swift | <a href="https://github.com/smart-on-fhir/swift-fhir/blob/master/Sources/Models/CodeSystems.swift">CodeSystems.swift</a> | 6,847 |
| Bazel | <a href="https://github.com/nonas/debian-clang/blob/master/tests/build_timeout/buildlogs/run1/gcc-mingw-w64_12_amd64-20140427-2100.build">gcc-mingw-w64_12_amd64-20140427-2100.build</a> | 6,429 |
| Kotlin | <a href="https://github.com/jetbrains/kotlin/blob/master/libraries/stdlib/common/src/generated/_Arrays.kt">_Arrays.kt</a> | 5,887 |
| SAS | <a href="https://github.com/ikonovalov/sas-bug/blob/master/sas-checkstyle/src/main/resources/202_002_Stream_DQ_DRVT.sas">202_002_Stream_DQ_DRVT.sas</a> | 5,597 |
| Haxe | <a href="https://github.com/waneck/hx-javastd/blob/master/src/com/sun/rowset/CachedRowSetImpl.hx">CachedRowSetImpl.hx</a> | 5,438 |
| Rust | <a href="https://github.com/autonome/gecko-dev/blob/master/third_party/rust/lalrpop-snap/src/parser/lrgrammar.rs">lrgrammar.rs</a> | 5,150 |
| Monkey C | <a href="https://github.com/nasahackto/mesh/blob/master/mesh-1.4/mesh/perl/mc">mc</a> | 5,044 |
| Cython | <a href="https://github.com/strawlab/python-pcl/blob/master/pcl/pcl_common_172.pxd">pcl_common_172.pxd</a> | 5,030 |
| Nim | <a href="https://github.com/comex/imaon/blob/master/disas.nim">disas.nim</a> | 4,547 |
| Game Maker Language | <a href="https://github.com/ecriss/gmspineapi/blob/master/gm_spineapi.gml">gm_spineapi.gml</a> | 4,345 |
| ABAP | <a href="https://github.com/yetaai/sap/blob/master/ZDFIReports/ZACO19U_SHOP_NEW_1.abap">ZACO19U_SHOP_NEW_1.abap</a> | 4,244 |
| XAML | <a href="https://github.com/pittruff/mystik/blob/master/MyStik/RaumPlan/Raumplan.xaml">Raumplan.xaml</a> | 4,193 |
| Razor | <a href="https://github.com/jonezy/epilogger/blob/master/Epilogger.Web/Views/Home/Privacy.cshtml">Privacy.cshtml</a> | 4,092 |
| Varnish Configuration | <a href="https://github.com/aureq/securityvcl/blob/master/vcl/breach/46_slr_et_rfi_attacks.vcl">46_slr_et_rfi_attacks.vcl</a> | 3,924 |
| Basic | <a href="https://github.com/hpux735/spectrum-analyzer/blob/master/Spectrum Analyzer/MSA_version116_4q.bas">MSA_version116_4q.bas</a> | 3,892 |
| Isabelle | <a href="https://github.com/tangentstorm/tangentlabs/blob/master/isar/Pick.thy">Pick.thy</a> | 3,690 |
| Protocol Buffers | <a href="https://github.com/nospamdan/frameworks_base/blob/master/proto/src/metrics_constants.proto">metrics_constants.proto</a> | 3,682 |
| BASH | <a href="https://github.com/c0moshack/c0moshack/blob/master/dotfiles/bashrc">bashrc</a> | 3,606 |
| Clojure | <a href="https://github.com/dedeibel/dilist/blob/master/experiment/all-playlists-output.clj">all-playlists-output.clj</a> | 3,440 |
| F# | <a href="https://github.com/chrisa23/fmat/blob/master/src/Fmat.Numerics/GenericMatrixDoc.fs">GenericMatrixDoc.fs</a> | 3,383 |
| Thrift | <a href="https://github.com/evernote/evernote-thrift/blob/master/src/NoteStore.thrift">NoteStore.thrift</a> | 3,377 |
| COBOL | <a href="https://github.com/therocket/mixanalytics/blob/master/lib/db2include/cobol_mf/db2ApiDf.cbl">db2ApiDf.cbl</a> | 3,319 |
| JavaServer Pages | <a href="https://github.com/builtlean/builtlean/blob/master/styles/sink_jq.jsp">sink_jq.jsp</a> | 3,204 |
| Modula3 | <a href="https://github.com/jeffmendoza/86duino/blob/master/build/linux/work/DJGPP/info/gdb.i3">gdb.i3</a> | 3,124 |
| Visual Basic for Applications | <a href="https://bitbucket.com/ckuyehar/openahlta/src/master/Source/Data Manager/Back End/HL7xmlBuilder.cls">HL7xmlBuilder.cls</a> | 2,987 |
| Oz | <a href="https://github.com/raphinou/oz-compiler/blob/master/perfs/timing.oz">timing.oz</a> | 2,946 |
| Closure Template | <a href="https://github.com/facebook/buck/blob/master/docs/files-and-dirs/buckconfig.soy">buckconfig.soy</a> | 2,915 |
| Agda | <a href="https://github.com/zsparks/pi-dual/blob/master/Univalence/Obsolete/Pifextra.agda">Pifextra.agda</a> | 2,892 |
| Stata | <a href="https://github.com/ibli/ibli_borena_hh_survey/blob/master/R2_2cleaningprocess.do">R2_2cleaningprocess.do</a> | 2,660 |
| ColdFusion CFScript | <a href="https://github.com/mfgglobalsolutions/collectmed/blob/master/collectmed1.0/CustomTags/com/common/Intake.cfc">Intake.cfc</a> | 2,578 |
| Luna | <a href="https://github.com/luna/luna/blob/master/stdlib/Std/src/Base.luna">Base.luna</a> | 2,542 |
| Unreal Script | <a href="https://github.com/arcaneflux/hostile-worlds/blob/master/src/Hostile Worlds/Development/Src/Engine/Classes/UIRoot.uc">UIRoot.uc</a> | 2,449 |
| CMake | <a href="https://github.com/ipfire/ipfire-2x/blob/master/config/rootfiles/oldcore/66/filelists/cmake">cmake</a> | 2,425 |
| Org | <a href="https://github.com/willijar/lens/blob/master/doc/lens-wsn.org">lens-wsn.org</a> | 2,417 |
| Flow9 | <a href="https://github.com/hitode909/higashi-dance-network/blob/master/flow-typed/jquery/index.js.flow">index.js.flow</a> | 2,361 |
| MQL Header | <a href="https://github.com/ro31337/romanpushkin-dailygrid/blob/master/IncGUI.mqh">IncGUI.mqh</a> | 2,352 |
| JSX | <a href="https://github.com/lezuse/photoshop-scripts/blob/master/default/ContactSheetII.jsx">ContactSheetII.jsx</a> | 2,243 |
| MQL4 | <a href="https://github.com/lvcster/java-examples/blob/master/PhD Appsolute System.mq4">PhD Appsolute System.mq4</a> | 2,061 |
| Ruby HTML | <a href="https://github.com/srvanderplas/dissertation/blob/master/Presentations/Final Oral/FinalOral-Old.Rhtml">FinalOral-Old.Rhtml</a> | 2,061 |
| GDScript | <a href="https://github.com/laurentbartholdi/fr/blob/master/gap/group.gd">group.gd</a> | 2,023 |
| Processing | <a href="https://github.com/alexisgrinbold/pjs-2d-game-engine/blob/master/mario/testcode.pde">testcode.pde</a> | 2,014 |
| PSL Assertion | <a href="https://github.com/seomoz/url-py/blob/master/url/psl/2016-08-16.psl">2016-08-16.psl</a> | 2,011 |
| ASP | <a href="https://github.com/zhou-hui/zblog/blob/master/Release/zb_system/FUNCTION/c_system_plugin.asp">c_system_plugin.asp</a> | 1,878 |
| AWK | <a href="https://github.com/azizyemloul/plover-france-dict/blob/master/Atelier/dic-generator.awk">dic-generator.awk</a> | 1,732 |
| Jinja | <a href="https://github.com/dfederlein/ansible-aiua/blob/master/playbooks/roles/php5/templates/etc/php5/fpm/php.ini.j2">php.ini.j2</a> | 1,668 |
| Zsh | <a href="https://github.com/saizai/dotfiles/blob/master/.zshrc">.zshrc</a> | 1,588 |
| Q# | <a href="https://github.com/siagal/eneboo-modules/blob/master/direccion/analisis/scripts/in_navegador.qs">in_navegador.qs</a> | 1,568 |
| sed | <a href="https://github.com/alexjordan/patmos-benchmarks/blob/master/MiBench/office/ghostscript/src/Makefile.sed">Makefile.sed</a> | 1,554 |
| Stylus | <a href="https://github.com/leiferikb/bitpop-private/blob/master/bitpop_specific/extensions/bittorrent_surf/app/popup/popup.styl">popup.styl</a> | 1,550 |
| Bitbake | <a href="https://github.com/sasha-tvo/beam-splitting/blob/master/Lib/Doxyfile.bb">Doxyfile.bb</a> | 1,533 |
| Rakefile | <a href="https://github.com/ccls/odms/blob/master/lib/tasks/samples.rake">samples.rake</a> | 1,509 |
| Gherkin Specification | <a href="https://bitbucket.com/hagashennaidu/warewolf-esb/src/master/Dev/Dev2.Activities.Specs/Composition/WorkflowExecution.feature">WorkflowExecution.feature</a> | 1,421 |
| Crystal | <a href="https://github.com/manastech/crystal/blob/master/src/string.cr">string.cr</a> | 1,412 |
| Android Interface Definition Language | <a href="https://github.com/android/platform_frameworks_base/blob/master/telephony/java/com/android/internal/telephony/ITelephony.aidl">ITelephony.aidl</a> | 1,410 |
| Xtend | <a href="https://github.com/skunkiferous/meta/blob/master/api/src/main/java/com/blockwithme/meta/Properties.xtend">Properties.xtend</a> | 1,363 |
| SKILL | <a href="https://github.com/saycv/saycv_cadence_skillmngt/blob/master/_src/destub/src/DT_destub.il">DT_destub.il</a> | 1,181 |
| Madlang | <a href="https://github.com/madrocker/kernels/blob/master/15March/.config.mad">.config.mad</a> | 1,137 |
| Spice Netlist | <a href="https://github.com/gauxonz/prp_2013/blob/master/Lib/APEXLINEAR.ckt">APEXLINEAR.ckt</a> | 1,114 |
| QML | <a href="https://bitbucket.com/patrickfi/combinedindirectgestures/src/master/qml/MainFULL.qml">MainFULL.qml</a> | 1,078 |
| GLSL | <a href="https://github.com/carlos-felipe88/spacecraft/blob/master/data/shader/subPlanetNoise.frag">subPlanetNoise.frag</a> | 1,051 |
| Ur/Web | <a href="https://github.com/vagoff/the-matrix/blob/master/initial.ur">initial.ur</a> | 1,018 |
| Alloy | <a href="https://github.com/davletd/productlinetesting/blob/master/ProductLineTesting/AlloyModels/TransactionFeatureFinal.als">TransactionFeatureFinal.als</a> | 1,012 |
| Vala | <a href="https://github.com/kamilprusko/puzzle/blob/master/src/puzzle-piece.vala">puzzle-piece.vala</a> | 968 |
| Smarty Template | <a href="https://github.com/poganini/ee/blob/master/themes/Ensau.tpl">Ensau.tpl</a> | 965 |
| Mako | <a href="https://github.com/andrewsallans/centerforopenscienceorg/blob/master/www/jobs.mako">jobs.mako</a> | 950 |
| TOML | <a href="https://github.com/chuqingq/codeeveryday/blob/master/golang/20170420_go_reverseproxy_traefik/traefik.toml">traefik.toml</a> | 938 |
| gitignore | <a href="https://github.com/michalsc/aros/blob/master/.gitignore">.gitignore</a> | 880 |
| Elixir | <a href="https://github.com/alexbaranosky/elixir/blob/master/lib/elixir/macros.ex">macros.ex</a> | 832 |
| GN | <a href="https://github.com/autonome/gecko-dev/blob/master/media/webrtc/trunk/build/config/android/rules.gni">rules.gni</a> | 827 |
| Korn Shell | <a href="https://github.com/filipinotech/illumos-gate/blob/master/usr/src/lib/brand/lx/zone/lx_distro_install.ksh">lx_distro_install.ksh</a> | 807 |
| LD Script | <a href="https://bitbucket.com/imoseyon/d2vzw-alpha/src/master/arch/arm/kernel/vmlinux.lds">vmlinux.lds</a> | 727 |
| Scons | <a href="https://github.com/ajdavis/mongo/blob/master/SConstruct">SConstruct</a> | 716 |
| Handlebars | <a href="https://github.com/palanieswaran/cs247projectwebsite/blob/master/views/Consent-Form.handlebars">Consent-Form.handlebars</a> | 714 |
| Device Tree | <a href="https://github.com/coreboot/coreboot/blob/master/src/mainboard/cavium/cn8100_sff_evb/ddr4-common.dtsi">ddr4-common.dtsi</a> | 695 |
| FIDL | <a href="https://github.com/otcshare/automotive-message-broker/blob/master/docs/amb.in.fidl">amb.in.fidl</a> | 686 |
| Julius | <a href="https://github.com/sseefried/play-space-online/blob/master/julius/glMatrix.julius">glMatrix.julius</a> | 686 |
| C Shell | <a href="https://github.com/pmaksim1/bin/blob/master/setup_grid.csh">setup_grid.csh</a> | 645 |
| Lean | <a href="https://bitbucket.com/leanprover/lean/src/master/library/data/list/perm.lean">perm.lean</a> | 642 |
| Idris | <a href="https://github.com/eckart/idris-tutorial/blob/master/Overview.idr">Overview.idr</a> | 637 |
| PureScript | <a href="https://github.com/purescript/purescript-arrays/blob/master/src/Data/Array.purs">Array.purs</a> | 631 |
| Freemarker Template | <a href="https://github.com/oscar810429/painiu-project/blob/master/web/WEB-INF/templates/search/result_softwares.ftl">result_softwares.ftl</a> | 573 |
| ClojureScript | <a href="https://github.com/dwaynekj/lt-cljs-tutorial/blob/master/lt-cljs-tutorial.cljs">lt-cljs-tutorial.cljs</a> | 518 |
| Fragment Shader File | <a href="https://github.com/imclab/aluminum/blob/master/osx/examples/nautilus/resources/bulb.fsh">bulb.fsh</a> | 464 |
| Elm | <a href="https://github.com/catherinemoresco/catherinemorescohubio/blob/master/static/fourier-elm/elm-stuff/packages/evancz/elm-html/4.0.2/src/Html/Attributes.elm">Attributes.elm</a> | 434 |
| Jade | <a href="https://github.com/benbaker/zooid/blob/master/zooid_web/views/control/index.jade">index.jade</a> | 432 |
| Vue | <a href="https://github.com/iview/iview/blob/master/examples/routers/form.vue">form.vue</a> | 418 |
| Gradle | <a href="https://github.com/wso2/emm-agent-android/blob/master/client/client/build.gradle">build.gradle</a> | 416 |
| Lucius | <a href="https://github.com/dsmatter/timetracker/blob/master/templates/bootstrap.lucius">bootstrap.lucius</a> | 404 |
| Go Template | <a href="https://github.com/disposaboy/margo/blob/master/vendor/github.com/ugorji/go/codec/fast-path.go.tmpl">fast-path.go.tmpl</a> | 400 |
| Meson | <a href="https://github.com/tieto/pidgin/blob/master/meson.build">meson.build</a> | 306 |
| F* | <a href="https://github.com/fstarlang/fstar/blob/master/examples/low-level/crypto/Crypto.Symmetric.Poly1305.Bignum.Lemmas.Part1.fst">Crypto.Symmetric.Poly1305.Bignum.Lemmas.Part1.fst</a> | 289 |
| Ceylon | <a href="https://github.com/ceylon/ceylon-ide-intellij/blob/master/source/org/eclipse/ceylon/ide/intellij/psi/IdeaCeylonParser.ceylon">IdeaCeylonParser.ceylon</a> | 286 |
| MQL5 | <a href="https://github.com/dennislwm/mlea/blob/master/MQL5/Experts/Zigzag/ZigzagPattern_oldest.mq5">ZigzagPattern_oldest.mq5</a> | 282 |
| XCode Config | <a href="https://github.com/krzyzanowskim/cryptoswift/blob/master/config/Project-Shared.xcconfig">Project-Shared.xcconfig</a> | 265 |
| Futhark | <a href="https://github.com/hiperfit/futhark/blob/master/tests/blackscholes.fut">blackscholes.fut</a> | 257 |
| Pony | <a href="https://bitbucket.com/thecomet/ponycraft-prototype/src/master/scripts/maps/demomap/scenery.pony">scenery.pony</a> | 252 |
| Vertex Shader File | <a href="https://bitbucket.com/arif_uap/flipmymob-social-madness-iphone/src/master/FlipMobiPhone/cocos3d/GLSL/CC3TexturableRigidBones.vsh">CC3TexturableRigidBones.vsh</a> | 205 |
| Softbridge Basic | <a href="https://github.com/snowballstem/snowball/blob/master/algorithms/greek.sbl">greek.sbl</a> | 192 |
| Cabal | <a href="https://github.com/tener/deeplearning-thesis/blob/master/deeplearning.cabal">deeplearning.cabal</a> | 180 |
| nuspec | <a href="https://github.com/prashantvc/xamarinauth/blob/master/nuget/Xamarin.Auth.XamarinForms.nuspec">Xamarin.Auth.XamarinForms.nuspec</a> | 156 |
| Dockerfile | <a href="https://github.com/snewhouse/ngs/blob/master/containerized/pipeline/Dockerfile">Dockerfile</a> | 152 |
| Mustache | <a href="https://bitbucket.com/moodle/moodle/src/master/admin/tool/analytics/templates/models_list.mustache">models_list.mustache</a> | 141 |
| LOLCODE | <a href="https://bitbucket.com/animeshsinha/linguist-github/src/master/samples/LOLCODE/LOLTracer.lol">LOLTracer.lol</a> | 139 |
| BuildStream | <a href="https://github.com/npadmana/npadmana_config/blob/master/texmf/bibtex/bst/mybst/astrobib.bst">astrobib.bst</a> | 120 |
| Janet | <a href="https://github.com/bianary/moosehead/blob/master/player/Janet">Janet</a> | 101 |
| Cassius | <a href="https://github.com/trevorssmith1392/yuplanner/blob/master/templates/xweek.cassius">xweek.cassius</a> | 94 |
| Docker ignore | <a href="https://github.com/ahbeng/nusmods/blob/master/.dockerignore">.dockerignore</a> | 92 |
| Hamlet | <a href="https://github.com/raphaelj/getwebborg/blob/master/templates/upload.hamlet">upload.hamlet</a> | 90 |
| QCL | <a href="https://github.com/unixpickle/quantumprogramming/blob/master/mylib2/mod.qcl">mod.qcl</a> | 88 |
| Dhall | <a href="https://github.com/trskop/command-wrapper/blob/master/dhall/Exec/completion/nix.bash.dhall">nix.bash.dhall</a> | 86 |
| ignore | <a href="https://github.com/wy8023b/ka7ku/blob/master/.ignore">.ignore</a> | 60 |
| Just | <a href="https://github.com/sporto/kic/blob/master/api/graphql/Justfile">Justfile</a> | 46 |
| SRecode Template | <a href="https://bitbucket.com/andrewjchen/dotfiles/src/master/emacs.d/plugins/cedet/srecode/templates/srecode-test.srt">srecode-test.srt</a> | 35 |
| Bitbucket Pipeline | <a href="https://bitbucket.com/c2tarun/integrated-genome-browser/src/master/bitbucket-pipelines.yml">bitbucket-pipelines.yml</a> | 30 |
| Ur/Web Project | <a href="https://github.com/huluwa/bazqux-urweb/blob/master/reader.urp">reader.urp</a> | 22 |
| Alchemist | <a href="https://github.com/bakhtatou/ecalj/blob/master/lm7K/fp/test/ctrl.crn">ctrl.crn</a> | 16 |
| Zig | <a href="https://github.com/aurametrix/aurametrixhubio/blob/master/Games/Tetris-zig/src/main.zig">main.zig</a> | 12 |
| MUMPS | <a href="https://github.com/milindparikh/mps/blob/master/rel/files/mps">mps</a> | 11 |
| Bosque | <a href="https://github.com/boyter/scc/blob/master/bosque.bsq">bosque.bsq</a> | 8 |
| Report Definition Language | <a href="https://github.com/jayaddison/autochef/blob/master/idx/rdl/example.rdl">example.rdl</a> | 4 |
| Emacs Dev Env | <a href="https://bitbucket.com/hoangtu/my-emacs-prelude/src/master/cedet/lisp/cedet/Project.ede">Project.ede</a> | 3 |
| Cargo Lock | <a href="https://bitbucket.com/dorianpula/rookeries/src/master/Cargo.lock">Cargo.lock</a> | 2 |
| JAI | <a href="https://github.com/thekla/thekla_atlas/blob/master/src/thekla/thekla_atlas.jai">thekla_atlas.jai</a> | 1 |

### How many "pure" projects

Assuming you define pure to mean a project that has 1 language in it. Of course that would not be very interesting by itself, so lets see what the spread is. As it turns out most projects have fewer than 25 languages in them with most in the less than 10 bracket.

The peak in the below graph is for 4 languages.

Of course pure projects might only have one programming language, but have lots of supporting other formats such as markdown, json, yml, css, .gitignore which are picked up by scc. It's probably reasonable to assume that any project with less than 5 languages is "pure" (for some level of purity) and as it turns out is just over half the total data set. Of course your definition of purity might be different to mine so feel free to adjust to whatever number you like.

What suprises me is an odd bump around 34-35 languages. I have no reasonable explanation as to why this might be the case and it probably warrents some investigation.

![scc-data pure projects](/static/an-informal-survey/languagesPerProject.png#center)

The full list of results is included below.

[skip table to next section](#projects-with-typescript-but-not-javascript)

| language count | project count |
| -------------- | ------------- |
| 1 | 886,559 |
| 2 | 951,009 |
| 3 | 989,025 |
| 4 | 1,070,987 |
| 5 | 1,012,686 |
| 6 | 845,898 |
| 7 | 655,510 |
| 8 | 542,625 |
| 9 | 446,278 |
| 10 | 392,212 |
| 11 | 295,810 |
| 12 | 204,291 |
| 13 | 139,021 |
| 14 | 110,204 |
| 15 | 87,143 |
| 16 | 67,602 |
| 17 | 61,936 |
| 18 | 44,874 |
| 19 | 34,740 |
| 20 | 32,041 |
| 21 | 25,416 |
| 22 | 24,986 |
| 23 | 23,634 |
| 24 | 16,614 |
| 25 | 13,823 |
| 26 | 10,998 |
| 27 | 9,973 |
| 28 | 6,807 |
| 29 | 7,929 |
| 30 | 6,223 |
| 31 | 5,602 |
| 32 | 6,614 |
| 33 | 12,155 |
| 34 | 15,375 |
| 35 | 7,329 |
| 36 | 6,227 |
| 37 | 4,158 |
| 38 | 3,744 |
| 39 | 3,844 |
| 40 | 1,570 |
| 41 | 1,041 |
| 42 | 746 |
| 43 | 1,037 |
| 44 | 1,363 |
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
 - Add an option to scc to check the type of the file based on keywords as examples such as https://bitbucket.org/abellnets/hrossparser/src/master/xml_files/CIDE.C was picked up as being a C file despite obviously being HTML when the content is inspected. To be fair all code counters I tried behave the same way.

## So why bother?

Well I can take some of this information and plug it into searchcode.com and scc even if just as some useful data points. The stated goal was pretty much this and it is potentially very useful to know how your project compares to others. Besides it was a fun way to spend a few days solving some interesting problems.

In addition, I am working on a tool that helps senior-developer or manager types analyze code looking for languages, large files, flaws etc... with the assumption you have to watch multiple repositories. You put in some code and it will tell you how maintainable it is and what skills you need to maintain it. Useful for determining if you should buy or maintain some code-base and getting an overview of what your development team is producing. Should in theory help teams scale through shared resources. Something like AWS Macie but for code is the angle I am working with. It's something I need for my day job and I suspect others may find use in it, or at least thats the theory.

I should probably put an email sign up for that here at some point to gather interest for that.

## Raw / Processed Files

I have included a link to the processed files for those who wish to do their own analysis and corrections. If someone wants to host the raw files to allow others to download them which is 83 GB as a gzip file let me know and I can arrange the handover and link here.