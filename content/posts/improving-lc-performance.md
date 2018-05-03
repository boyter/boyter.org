---
title: Improving lc's performance - Optimising the hell out of a Go application
date: 2028-05-02
---

https://blog.sourced.tech/post/gld/

Oh its on now. I can take a log of what I learn from optimising https://boyter.org/posts/sloc-cloc-code/ and apply it here.

License Checker referred to as `lc` from now on was never designed to be fast. In fact as it came from a Python script any performance improvements were a result of moving from Go and not though me trying to be clever. The application is single threaded for a start. However since I spent time with Sloc Cloc and Code I feel that its time to look at `lc` with fresh eyes and see what can be done.

So the first thing I did was download the source of (isn't free/open source software wonderful) and had a trawl through the code in order to determine what they were doing differently. The first was to see how they walk the file tree.

The first thing I noticed was that in their main.go

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

Because they run `lc` at the root it checks the root directory for license files, where-as `license-detector` starts takes in `*` and expands that out to 956 directories launching a seperate goroutine for each one. This is a limitiation of how `lc` works. However it is worth noting that we can copy the trick. Check the root for license files and then spawn a goroutine for each directory. Something to keep in mind.

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

The first one is against the goals I had for `lc`. I would rather accuracy. In the post the numbers sited for accuracy (and speed) are as such,

| Program | Accuracy | Runtime Seconds |
|---|---|---|
| go-license-detector | 99% (897/902) | 13.5 |
| lc | 88% (797/902) | 548 |

I was curious where the 879 number came from. It looked like it was related to how the speed tests were run,

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


One other thing that bothered me is that `lc` as a SPDX tool calculates the Md5, Sha1 and Sha256 hash for everything it looks at. Since it was done in a fairly stupid way it is also slow as it iterates the bytes in the file at least 3 times just for the hashing algorithms. Again this was a stupid decision by me but it means the benchmark was not truly fair.


Lets get started.

lc at heart is a similar application to scc. Read through a directory, open the files, check for some strings and save those into a list. However it has some optimisations that we can use.

For scanning a file we can use the usual boyer-moore trick of skipping as many bytes as are in 'SPDX-License-Identifier:' to speed up checking for inline licenses. 

Of course the other big thing to improve is that when I wrote lc I made it single threaded. Even just a simple fix there would improve performance by however many CPU's the user has.

The first thing I started with was by adding some trace statements. To start with there is a ~400 ms penalty I have from loading the database

    $ time lc --trace docs
    TRACE 2018-05-01T22:22:50Z: milliseconds load database: 384
    lc --trace docs  0.44s user 0.12s system 139% cpu 0.404 total

Which is annoying because it means no matter what that is the price we pay for processing.

What I wanted to do is move to processing pipelines. So to start by building a very fast way of finding candidate files. The catch is the way licenses are identified. Because a licence file begins at the top of a directory and affects those below it means that I needed a way to keep this information and have it available to sub folders. We also need to look inside each directory as we process looking for new license files.

