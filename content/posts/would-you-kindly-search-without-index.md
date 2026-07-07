---
title: "Would You Kindly... Search Without an Index?"
date: 2096-06-28
---

I am boyter, and I'm here to ask you a question.

> Is a developer not entitled to the relevance of his own query?

- "No!" says the man in Algorithms, "It belongs to the poor... performance on cold starts."
- "No!" says the man in the Search Engine Temple, "It belongs to the inverted index."
- "No!" says the man in the Trigram Cathedral, "It belongs to the trigram postings list, pre-computed and eternal."

I rejected those answers; instead, I chose something different.

I chose the impossible.

I chose... [**codespelunker**](https://github.com/boyter/cs) (cs).

A tool where the grep lover would not fear the cold cache,
where the relevance engineer would not be bound by stale shards,
where the great monorepo would not be constrained by the small index folder.

And with a quick install (and a warm filesystem cache), `cs` can become your search as well.

## Updates to `cs` and `scc`

Man I wish I had been clever/creative enough to have used that when I re-released `cs` a while ago.

For those missing the reference, it's a modification of Andrew Ryan's speech at the start of the excellent game Bioshock.

Anyway I do have some interesting news about both with regards to performance. The most recent release of both have a massive uplift in performance that borders on the absurd. Wall clock down ~30% and CPU time down by nearly 4x. Numbers below, searching for nvidia in a recent checkout of the linux kernel.

```bash
$ hyperfine --warmup 3 'cs_new nvidia' 'cs_old nvidia'
Benchmark 1: cs_new nvidia
  Time (mean ± σ):      2.765 s ±  0.132 s    [User: 2.595 s, System: 4.364 s]
  Range (min … max):    2.627 s …  3.022 s    10 runs

Benchmark 2: cs_old nvidia
  Time (mean ± σ):      3.594 s ±  0.017 s    [User: 9.509 s, System: 6.106 s]
  Range (min … max):    3.568 s …  3.621 s    10 runs

Summary
  cs_new nvidia ran
    1.30 ± 0.06 times faster than cs_old nvidia
```

The main part to note there is the user time, dropping from 9.5 seconds to 2.6. Please note it.

So how was this achieved?

Some of the performance in the above (and all the gains in `scc`) are due to fixes implemented in [gocodewalker](https://github.com/boyter/gocodewalker/).

While the improvements in `gocodewalker` are impressive... they are boring... well to me. Also its my blog and I don't feel like digging into them this time. In short a regex recompile was moved so its not run inside a loop, some code to avoid duplicate work checking for matches in that loop. Honestly, I can barely remember what they were, beyond the result of looking at profiles for a while. Honestly these sort of wins are usually the result of me being dumb at the time and just correcting my own mistakes later on and somehow expecting others to tell me how great I am for it.

The other big performance gains in `cs`, and the arguably more interesting ones can be found due to tweaks in [go-string](https://github.com/boyter/go-string/).

See one thing I have been doing recently is pointing [searchcode.com](https://searchcode.com/) at different repositories to learn how they work. Most recently I pointed it at [fzf](https://github.com/junegunn/fzf). For those who don't know it's a stupidly fast fuzzy finder. I asked my LLM to find any interesting algorithms and explain them to me. I have been doing this across a lot of repositories recently. This is a similar idea to [this blog post](https://blog.mbrt.dev/posts/ripgrep/), except on demand and for whatever repository I deem interesting at the time.

One thing I found when doing this was how `fzf` matches characters, using an especially [optimized SIMD algorithm]( https://github.com/junegunn/fzf/blob/master/src/algo/SIMD.md) for matching two characters. This is used to search through strings looking for matches in a case insensitive manner. Which is the exact process I use in `go-string`.

Knowing this existed, I rewrote how `go-string` works borrowing some ideas from ripgrep. What happens now in `go-string` is that it looks through the needle to find the least common character. I added a pre computed table `zjqxvbpygfwmucldrhnioate` of least common to most common characters in code. We pick the first one we can find from the needle and the use the `fzf` `indexByteTwo` algorithm to look for that character, and when we find a match then check if it is a real match.

You may note that the letters s and k are missing from that table and be wondering why? It does not work for characters with unicode variants, so k and s which have ſ and K (long s and kelvin). So we don't use them!

Ah ha! I hear you say! What if the user IS searching for only s S or ſ!? Well we just fall back to the older somewhat slower method of computing all variants and searching for those first. Problem solved. Albeit without the SIMD from `fzf` and instead the SIMD from the Go team.

I didn't share you the the best part about this though. I didn't write the SIMD code, junegunn did, and half the terminals on earth have stress tested it so it should be fairly safe to yeet into `cs`.

No index. No shards. No cold start. Just a rare character and some stolen SIMD. Oh and some pooled memory reuse, which helped a lot too.

So, would you kindly `go install github.com/boyter/cs@latest` and let me know how it works for you?
