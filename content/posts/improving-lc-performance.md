---
title: Improving lc's performance - Optimising the hell out of a Go application
date: 2028-05-02
---

https://blog.sourced.tech/post/gld/

Oh its on now. I can take a log of what I learn from optimising https://boyter.org/posts/sloc-cloc-code/ and apply it here.

The other issue it to resolve some issues I had found with the way things worked.

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

