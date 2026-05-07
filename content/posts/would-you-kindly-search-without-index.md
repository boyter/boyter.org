---
title: "Would You Kindly... Search Without an Index?"
date: 2026-03-17
---

I am boyter, and I'm here to ask you a question.

> Is a Dev Not Entitled to the Relevance of His Own Query?

- "No!" says the man in Algorithms, "It belongs to the poor... performance on cold starts."
- "No!" says the man in the Search Engine Temple, "It belongs to the inverted index."
- "No!" says the man in the Trigram Cathedral, "It belongs to the trigram postings list, pre-computed and eternal."

I rejected those answers; instead, I chose something different.

I chose the impossible.

I chose... **codespelunker** (cs).

A tool where the grep-lover would not fear the cold cache,
where the relevance engineer would not be bound by stale shards,
where the great monorepo would not be constrained by the small index folder.

And with a quick install (and a warm filesystem cache), `cs` can become your search as well.

## Updates to `cs` and `scc`

I really wish I had been clever enough to have used that when I released `cs` a while ago. Regardless I do have some interesting news about both with regards to performance. The most recent release of both have a massive uplift in performance that borders on the absurd. Wall clock runtimes for `scc` have dropped by 1/4 to 1/5 and `cs` by 1/2. Numbers below,

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
