---
title: Walk code repositories respecting .gitignore files in Go
date: 2023-08-07
---

Since I maintain a few projects that deal with source code one of the things I needed badly was a way to parse and understand gits .gitignore and .ignore files in order to get as much accuracy as possible.

I had previously tried using code I lifted from [The Platinum Searcher](https://github.com/monochromegane/the_platinum_searcher) albeit with some fixes to avoid crashes. Annoyingly however it never implemented glob's correctly. I tried searching around for another implementation but none appeared to work as expected.

One of the big problems other than globs was working with multiple ignore files, since thats something you can do in a git repository.

Alas this meant diving into how .gitignore files actually work, and how they work were they are nested. I found the following link to be the best example I could find about how nested patterns work https://stackoverflow.com/questions/71735516/proper-way-to-setup-multiple-gitignore-files-in-nested-folders-of-a-repository and along with this test suite https://github.com/svent/gitignore-test started work.

The result is [gocodewalker](https://github.com/boyter/gocodewalker/), a simple library that wraps the newer methods of walking directories in Go which I had previously found to the be the [fastest method of walking](https://engineering.kablamo.com.au/posts/2021/quick-comparison-between-go-file-walk-implementations/).

Usage is fairly simple, although opinionated due to my specific needs, although I have got it working with multiple projects so it is generic enough to be useful.

{{<highlight go>}}
fileListQueue := make(chan *gocodewalker.File, 100)

fileWalker := gocodewalker.NewFileWalker(".", fileListQueue)

// restrict to only process files that have the .go extension
fileWalker.AllowListExtensions = append(fileWalker.AllowListExtensions, "go")

// handle the errors by printing them out and then ignore
errorHandler := func(e error) bool {
    fmt.Println("ERR", e.Error())
    return true
}
fileWalker.SetErrorHandler(errorHandler)

go fileWalker.Start()

for f := range fileListQueue {
    fmt.Println(f.Location)
}
{{</highlight>}}

The above will start walking from the current directory, all files with the `go` extension, printing and then exiting on error and printing out the file locations from a channel. It will also respect all .gitignore and .ignore file rules. For the tests I have tried based on the afore mentioned test suite this produced the correct results.

While I wrote this with the main goal of replacing the file walking in [Sloc Cloc and Code (scc)](https://github.com/boyter/scc/) due to how much is going on in there I have not got around to doing it yet. However other projects such as [lc](https://github.com/boyter/lc), [cs](https://github.com/boyter/cs) and [dcd](https://github.com/boyter/dcd) have all been upgraded to use it. I didn't pay as much attention to performance on the projects as I do to scc but I didn't notice any regressions from this change, since the file walking is using the new Go libraries.

So why the blog? Well I thought it best to advertise this a bit more. Its a fairly painful problem to solve and id rather have one library that everyone can build on exists rather than multiple versions, especially since every other one I tried was not correct. As such at the moment I believe this to be the most accurate code walker that respects .gitignore and .ignore files in the Go ecosystem. Please try it out! If you do find a bug please let me know as its in my best interests to fix it.
