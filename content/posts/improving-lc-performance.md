---
title: Improving lc's performance - Optimising the hell out of a Go application
date: 2028-05-02
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

A further quote on the first `means that we should rather label a project with a slightly inaccurate license than miss its license completely`. Fair enought but against the goals I had for `lc`. I would rather accuracy. Also I think it might be possible to have both given a clever implementation.

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


	$ time lc .
	lc .  196.88s user 1.64s system 106% cpu 3:07.12 total

vs

	$ time ./lc .
	./lc .  226.33s user 2.28s system 735% cpu 31.066 total

then with a tweak to use the faster license keyword method,

	$ time ./lc .
	./lc .  29.59s user 0.98s system 614% cpu 4.975 total

Not a bad improvement. It would appear that moving over to multi processing has speed things up considerably. However there is more that can be done.