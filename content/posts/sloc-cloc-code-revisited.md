---
title: Sloc Cloc and Code Revisited - Making a fast Go program faster
date: 2018-08-28
---

Two things prompted me to start looking at my code counter `scc`. The first being the release of Go 1.11. New releases of compilers, libarires and toolchains have a wonderful habit of making things go faster without you having to do anything other than recompile. In addition they often provide new methods which assist with this and are worth exploring.

The other was that the author of `tokei` released a new update v8.0.0 and included a comparison to `scc` on the project page https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md

I had been tracking the improvements in `tokei`, `loc` and `polyglot` over the last few weeks. However what really suprised me was the accuracy issues pointed out, particullary the fact that `scc` version 1.7.0 was misreporting the number of lines.

I tried testing it out on the following example from the `tokei` test suite.

Time to go code spelunking. Since I wrote `scc` and its a fairly small codebase I had a feeling it was an issue to do with the skip ahead logic. When `scc` finds a matching condition it keeps the offset around so it can jump ahead. However if there was an error its possible it would jump over any newlines \n which are used to determine to total count.

The offending code in mind was this one.

{{<highlight go>}}
// If we checked ahead on bytes we are able to jump ahead and save some time reprocessing
// the same values again
index += offsetJump
{{</highlight>}}

Just comm