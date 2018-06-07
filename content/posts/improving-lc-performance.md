---
title: Improving lc's performance - Optimising the hell out of a Go application
date: 2028-05-27
---

https://blog.sourced.tech/post/gld/

Oh its on now. I can take a log of what I learn from optimising https://boyter.org/posts/sloc-cloc-code/ and apply it here.

Called out publicly. Its on now anonymous internet person, this slight against my honour cannot be bourne! To be honest I was starting to add license checking into http://searchcode.com/ and http://searchcodeserver.com/ and was looking though how I implemented anyway.

I my defence License Checker referred to as `lc` from now on was never designed to be fast. In fact as it came from a Python script any performance improvements were a result of moving from Go and not though me trying to be clever. The application is single threaded for a start. It was quite literally the first thing I have ever seriously attempted in Go. However since I spent time with Sloc Cloc and Code (`scc`) https://boyter.org/posts/sloc-cloc-code/ where the main goal was performance I felt that it was time to look at `lc` with fresh eyes and see what can be done.

One thing I did was download the source of https://blog.sourced.tech/post/gld/ referred to as `license-detector` from now on and had a trawl through the code in order to determine what they were doing differently (isn't free/open source software wonderful). The first thing I noticed was how they walk the file tree.

In the main.go entrypoint it has the following.

{{<highlight go>}}
wg.Add(nargs)
for i, arg := range args {
	go func(i int, arg string) {
		defer wg.Done()
		matches, err := process(arg)
		res := result{Arg: arg, Matches: matches, Err: err, ErrStr: ""}
		if err != nil {
			res.ErrStr = err.Error()
		}
		results[i] = res
	}(i, arg)
}
wg.Wait()
{{</highlight>}}

So they are running parallel walkers through the directories of their tests. My first thought is that this is rather unfair to `lc` as it was build to produce SPDX outputs. Because of this requirement it is unable to walk through the tree in parallel. It needs to check for a license at the root, and only then is it possible to run it in parallel. The tree looks like so,

```
dataset
├── 30DaysofSwift
│   └── README.md
├── 30-seconds-of-code
│   ├── LICENSE
│   └── README.md
├── 500lines
│   ├── LICENSE.md
│   └── README.md
├── 52-technologies-in-2016
│   ├── LICENSE
│   └── README.md
├── ace
│   ├── LICENSE
│   └── Readme.md
```

Because they run `lc` at the root it checks the root directory for license files, where-as `license-detector` starts takes in `*` and expands that out to 956 directories launching a seperate go-routine for each one. This is a limitiation of how `lc` works. However it is worth noting that we can copy the trick. Check the root for license files and then spawn a goroutine for each directory. This is how `scc` works as well and something to keep in mind.

With that handicap in mind I tried it out on a single directory to force it to be single threaded. The resulting test showed that all of the threading was done at this high level. In fact you can see it pretty easily by running it like so (I used `lc` as the repository to check)

Checking the directory below,

```
$ time license-detector lc
---
license-detector lc  8.03s user 0.33s system 95% cpu 8.733 total
```

And from inside the directory,

```
$ time license-detector *
license-detector *  10.78s user 0.64s system 101% cpu 11.228 total
```

The different runtimes is a huge tip off that one of them is running in parallel. The fact that the the one running in parallel was slower is a little bit of a suprise though.

The other thing I wanted to check was the accuracy. This was especially important to me as I had spent considerable amounts of time trying to make `lc` as accurate as possible. From the blog post, the goals were,

 - Favor false positives over false negatives (target data mining instead of compliance).
 - Perform fast.
 - Detect as many licenses as possible on the hand-collected and hand-checked dataset of 1,000 top-starred repositories on GitHub.
 - Comply with SPDX licenses list and detection guidelines.

A further quote on the first `means that we should rather label a project with a slightly inaccurate license than miss its license completely`. Fair enough but against the goals I had for `lc`. I would rather accuracy. Also I think it might be possible to have both given a clever implementation.

On other issue is that if you allow your program to have inaccurate results than just printing `MIT` for as many files as there are is a reasonable attempt as it is likely to correct at least 30% of the time https://www.blackducksoftware.com/top-open-source-licenses and will be as fast as anything.

In the post the numbers sited for accuracy (and speed) are as such,

| Program | Accuracy | Runtime Seconds |
|---|---|---|
| go-license-detector | 99% (897/902) | 13.5 |
| lc | 88% (797/902) | 548 |

The accuracy number is a little suspect based on the above. For a start it means that a license file was identified and some license attached to it even if it is incorrect. I was a little curious where the 879 number came from. It looked like it was related to how the speed tests were run,

```
$ time license-detector * | grep -Pzo '\n[-0-9a-zA-Z]+\n\tno license' | grep -Pa '\tno ' | wc -l
62
license-detector *  82.28s user 7.50s system 447% cpu 20.041 total
grep --color=auto --exclude-dir={.bzr,CVS,.git,.hg,.svn} -Pzo   0.02s user 0.02s system 0% cpu 20.037 total
grep --color=auto --exclude-dir={.bzr,CVS,.git,.hg,.svn} -Pa '\tno '  0.00s user 0.00s system 0% cpu 20.032 total
wc -l  0.00s user 0.00s system 0% cpu 20.028 total 
```

For `lc` it was run like so

    $ time lc . | grep -vE 'NOASSERTION|----|Directory' | cut -d" " -f1 | sort | uniq | wc -l

Given the above `license-detector` produces the number 62. Given that there are 958 repositories, and 902 with licenese files it appears that its taken by `958 - 62` which is actually 896, but the % of 99.4 percent is correct. However running a benchmark using `time` is not ideal unless you run it multiple times to avoid the OS cache kicking in. Its why I use `hyperfine` for these sort of things. The blog post does not mention anything about avoiding this trap, but I am going to assume it was done in good faith and run multiple times.

There was one other thing nagging me. Was it possible that `lc` was missing files in the estimates because the file identification logic which determines what a license is was wrong? Rather than test I had a poke through the codebase (they mention it on the blog post as well) and lifted the code so I could compare on an equal footing.

I did make one tweak though. I added `readme` to the regular expression matcher because I want to flag those as being potential license files.

{{<highlight go>}}
var (
	licenseFileNames = []string{
		"li[cs]en[cs]e(s?)",
		"legal",
		"copy(left|right|ing)",
		"unlicense",
		"l?gpl([-_ v]?)(\\d\\.?\\d)?",
		"bsd",
		"mit",
		"apache",
		"readme",
	}
	licenseFileRe = regexp.MustCompile(
		fmt.Sprintf("^(|.*[-_. ])(%s)(|[-_. ].*)$",
			strings.Join(licenseFileNames, "|")))
)

func findPossibleLicenseFiles(fileList []string) []string {
	var possibleList []string

	for _, filename := range fileList {
		if licenseFileRe.MatchString(strings.ToLower(filename)) {
			possibleList = append(possibleList, filename)
		}
	}

	return possibleList
}
{{</highlight>}}

One other thing that slows `lc` down is the load of the inital SPDX database. Adding some tracing information shows this to take about `300ms` on my local machine. Its not a huge amount of time, but it means that there will always be this handicap unless something is done. I added some trace statements to track it down,

    $ time lc --trace docs
    TRACE 2018-05-01T22:22:50Z: milliseconds load database: 384
    lc --trace docs  0.44s user 0.12s system 139% cpu 0.404 total

The reason this is slow is that it builds a concordance required for the vector space to work each time it runs. Its possible to do this before the fact and embed it into the JSON directly, however its also possible to just lazily evaulate this when its needed for checking and save some time.

Lastly one other thing that bothered me is that `lc` as a SPDX tool calculates the MD5, SHA1 and SHA256 hash for everything it looks at. Since it was done in a fairly stupid way it is also slow as it iterates the bytes in the file at least 3 times just for the hashing algorithms. Again this was a stupid decision by me but it means the benchmark was not truly fair, as `lc` is doing considerably more work. For the benchmark that was run however there was no need to calculate these values at all as they are never displayed unless the output format is SPDX.


With a fair idea of where the performance issues lets get started. I am not going to take this as far as I went with `scc` which was more about seeing how much performance I could squeeze out of Go but I am going to make this run a lot faster.

At heart `lc` is a similar application to `scc`. Read through a directory, open the files, check for some strings and save those into a list. As such they share some optimisations that we can use.

The first I thought about was the faster tree walk. However I don't think thats easily possible in this case. Because of the SPDX requirement I need `lc` to know what was in the previous directories. It might be possible to use a cache to solve this but we shall see.

For scanning a file we can use the usual boyer-moore trick of skipping as many bytes as are in 'SPDX-License-Identifier:' to speed up checking for inline licenses. 

Of course the other big thing to improve is that when I wrote lc I made it single threaded. Even just a simple fix there would improve performance by however many CPU's the user has.


What I wanted to do is move to processing pipelines. So to start by building a very fast way of finding candidate files. The catch is the way licenses are identified. Because a licence file begins at the top of a directory and affects those below it means that I needed a way to keep this information and have it available to sub folders. We also need to look inside each directory as we process looking for new license files.


Looking

```
$ time lc .
lc .  196.88s user 1.64s system 106% cpu 3:07.12 total
```

to

```
$ time ./lc .
./lc .  29.59s user 0.98s system 614% cpu 4.975 total
```

Not a bad improvement. It would appear that moving over to multi processing has speed things up considerably. However there is more that can be done.

I also added in the tweak to remove the hash calculation if the output is going to be the default tabular.

After tweaking the processing pipeline and running against the sample that sourced had on my local machine I had the following runtime.

```
lc .  73.19s user 2.48s system 698% cpu 10.837 total
```

compared to license-detectors runtime of

```
license-detector *  47.34s user 4.30s system 519% cpu 9.935 total
```

Which is a good place to be. In fact there are a few things I can tweak in `lc` to improve the runtime. The first being that the way it works is slightly inefficient. When scanning directories it checks for files that may contain a possible license. These are analysed to determine the license chain. However the file is then reprocessed as part of producing the hashes. However in the case of tabular output we don't need the hash and in fact we don't need to reprocess the file at all.

For the benchmark we are comparing against this means lc is processing everything twice.

However before that I decided to track down some bugs. The first being why were multiple keywords matching a single license. Each group of keywords is meant to be a unique ngram https://boyter.org/2017/05/identify-software-licenses-python-vector-space-search-ngram-keywords/ however when run the application was finding multiples. This should have never happened. The results should be close to binary, it either is a certain license because it contains the ngrams or not.

A quick look at the script to produce them indicated that there is indeed a bug in the way that the ngrams were calculated. When fixed however the script which was written in Python was horribly slow. I figured in for a penny in for a pound I would rewrite it in Go and get the benefits of a faster runtime along with some parallelism.

The results were interesting, with the new build database script consuming not only all the CPU I could throw at it but also all of the RAM.

![Build Database](/static/improving-lc-performance/build_database.png)

In fact I had to limit it to running on only 4 of the available cores due to the RAM issues. The reason is that I modified how the script run to avoid looping each of the other licences ngrams and instead dump them into a hashmap which I could quickly check for the presense of another ngram. The result was a much faster program but considerably higher memory usage. Considering this meant to be a run once every now and then script however it is not a huge problem.

After thinking about it a bit more, I realised I could switch to pointers in a few smart places, then RAM was no longer an issue, and could then increase the number of CPU's. With pointers what was taking several minutes per license ended up taking a few seconds. With pointers the need to worry about RAM usage also went away and I was able to simplify the code.

The result was a drop in replacement database that worked just as well for all of the test cases I had.

Now is the time to work on performance.

Running against the sample directory

	lc ~/Projects/lc  70.38s user 2.12s system 723% cpu 10.020 total

	license-detector ~/Projects/lc/*  48.50s user 3.39s system 523% cpu 9.903 total

Not much in it. However remember that lc is needlessly processing the file twice. Resolving that gives the following runtime.

	lc ~/Projects/lc  42.58s user 2.34s system 683% cpu 6.569 total

Great. From slightly slower to about 30% faster.

There is one other tweak that could be done however. It would be far faster to check the top 20 most common licenses first, and only fall back to checking the rest if there was no match.

```
(pprof) top20
Showing nodes accounting for 28.63s, 94.86% of 30.18s total
Dropped 175 nodes (cum <= 0.15s)
Showing top 20 nodes out of 48
      flat  flat%   sum%        cum   cum%
    10.23s 33.90% 33.90%     10.23s 33.90%  runtime.indexbytebody
     9.86s 32.67% 66.57%     25.13s 83.27%  bytes.Index
     2.38s  7.89% 74.45%      2.38s  7.89%  runtime.memeqbody
     1.27s  4.21% 78.66%      1.27s  4.21%  bytes.Equal
     1.23s  4.08% 82.74%      1.23s  4.08%  bytes.IndexByte
     0.68s  2.25% 84.99%      0.68s  2.25%  runtime.memclrNoHeapPointers
     0.56s  1.86% 86.85%      1.60s  5.30%  regexp.(*machine).tryBacktrack
     0.38s  1.26% 88.10%      0.38s  1.26%  regexp/syntax.(*Inst).MatchRunePos
     0.33s  1.09% 89.20%      0.33s  1.09%  regexp.(*inputString).step
     0.26s  0.86% 90.06%      0.26s  0.86%  runtime.cgocall
     0.22s  0.73% 90.79%      2.65s  8.78%  regexp.(*machine).backtrack
     0.21s   0.7% 91.48%      0.21s   0.7%  runtime.memmove
     0.19s  0.63% 92.11%      0.19s  0.63%  runtime.indexShortStr
     0.18s   0.6% 92.71%      0.29s  0.96%  bytes.Map
     0.17s  0.56% 93.27%      0.23s  0.76%  regexp.(*bitState).push (inline)
     0.14s  0.46% 93.74%      0.52s  1.72%  regexp/syntax.(*Inst).MatchRune
     0.14s  0.46% 94.20%      0.23s  0.76%  sync.(*Mutex).Lock
     0.07s  0.23% 94.43%     25.33s 83.93%  github.com/boyter/lc/parsers.keywordGuessLicense.func1
     0.07s  0.23% 94.67%      0.17s  0.56%  runtime.scanobject
     0.06s   0.2% 94.86%      3.48s 11.53%  regexp.(*Regexp).replaceAll
```


At some point it was time to look at accuracy. I decided I wanted to do at least two tests. The first would be to run the license detectors against the samples given from the SPDX project itself. All licence detectors should get close to 100% accuracy on this test.

Since I was at it I decided to check times in here as well. This is actually a measure of how quickly the application can start than anything but if you perhaps are using these tools to analyse thousands of directories it may be applicable to you.

To do so a script was created `create_accuracy_checker.py` which takes the license file at the root of lc and uses that to build a collection of directories each named after the SPDX identifier name with a single licence file named `LICENSE.txt` in it. Keep in mind that the file which this is all based on contains my own inclusion of the fair source license which most other tools are unlikely to have.

Then the second script `check_accuracy.py` as run. This collects the list of directories, and then calls each application to report on the licenses in each directory and determine if it was sucessful in identifying it or not. The number of correct guesses is returned and used to calculate success. 

I coded it to work with the following license detectors because I was able to get them to run.

https://github.com/google/licenseclassifier

The results,

```
$ python check_accuracy.py
count::370
checking::lc
correct:369::99.7297297297 percent::time:48.7510910034
checking::license-detector
correct:321::86.7567567568 percent::time:1419.19354796
checking::identify_license
correct:121::32.7027027027 percent::time:399.533063889
checking::askalono
correct:330::89.1891891892 percent::time:166.055674076
```

Don't pay too much attention to the time values. They are just taken using pythons `time.time()` and are best viewed as that it takes about 20x as long to run `license-detector` than it takes `lc` most likely  because it has a slower startup time.

What is more interesting is the correct count and percentage accuracy. Oddly enough the tool owned by Google is by far the least accurate. Most suprising to me is that `askalono` and `license-detector` despite being trained on the SDPX licenses are unable to break the 90% correct mark for this test. `lc` by contrast is 99.7% accurate and only misses out on a single license which is the Diffmark license. I don't know why but I do have this captured in the unit tests to be resolved at some point.

This is a nice start, but what about the reference 1k dataset https://github.com/src-d/go-license-detector/blob/master/licensedb/dataset.zip that sourced used in their blog post.

This required a bit more work. Mostly because I don't know what license each should be. 

Firstly I needed to determine what licenses I should expect to come back for each. I briefly considered doing this by hand, before deciding to write a script that would run each of the tools against each folder and allow me to identify where disprenacies were. I could then manually check which ones were problematic and inspect them to determine the actual licence. With that information I could then determine what the true license was and get an idea about which tool is the most accurate.

It would also allow me to check any tweaks I applied to `lc` in the future and see how accurate they are.

I write a simple script that would run each tool against a single file in each directory and recorded the license guess. I then dumped them all into a spreadsheet for some analysis.

Most consistent license/Least confused licenses
Most confused licenses
Most common licenses
Least common licenses




The nice thing about engineering solutions is that they quite often work. Not only that the work well. It might not be as fancy as using machine learning or other some other method but the results speak for themselves.

What questions do people have? What license is this file? What licence is the product? What licenses are used in this project? What licenses do I think ths project is under?






SCRATCHPAD

./ref1k/androidannotations/LICENSE.txt

Need to have some keyword matching inside here for sample headers and the like