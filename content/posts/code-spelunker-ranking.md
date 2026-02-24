---
title: BM25 Ranking Without an Index - How codespelunker ranks results
date: 2056-01-20
---

**Intro**

- The two camps of code search: index-based (Zoekt, Sourcegraph, Elasticsearch) vs grep-style (ripgrep, ag) — one ranks well but has setup cost, the other is instant but doesn't rank
- codespelunker sits in the middle — no index, but still ranks results using BM25
- Why this matters for interactive code search

**The Problem: You Don't Have Global Stats**

- Traditional BM25 needs corpus-wide document frequencies from a pre-built index
- When you're walking the filesystem in real time, you don't have that
- So what do you actually need to produce *useful* rankings?

**The Approximation: DF Over the Result Set**

- Calculate document frequency only across files that matched, not the whole corpus
- The corpus count (N) comes from the total files walked

```go
func CalculateDocumentFrequency(results []*common.FileJob) map[string]int {
    documentFrequencies := map[string]int{}
    for i := 0; i < len(results); i++ {
        for k := range results[i].MatchLocations {
            documentFrequencies[k] = documentFrequencies[k] + 1
        }
    }
    return documentFrequencies
}
```

- Why this works: you're not answering "how relevant is this document" — you're answering "which of these matches is the *best* match"
- IDF is inflated vs true corpus-wide DF, but relative ordering between results is preserved

**Cheap Document Length: Bytes Instead of Words**

```go
words := float64(maxInt(1, results[i].Bytes/BytesWordDivisor))
```

- Why tokenizing code to count "words" is both slow and poorly defined
- Bytes/2 as a proxy — preserves relative document lengths, which is what BM25's length normalization actually cares about
- The divisor of 2: rough assumption about average token size in code

**The Full BM25 Implementation**

```go
k1 := 1.2
b := 0.75

for i := 0; i < len(results); i++ {
    weight = 0
    words := float64(maxInt(1, results[i].Bytes/BytesWordDivisor))

    for word, wordCount := range results[i].MatchLocations {
        rawCount := float64(len(wordCount))
        idf := math.Log10(1 + float64(corpusCount)/float64(documentFrequencies[word]))

        step1 := idf * rawCount * (k1 + 1)
        step2 := rawCount + k1*(1-b+(b*words/averageDocumentWords))

        weight += step1 / step2
    }

    results[i].Score = weight
}
```

- Standard k1 and b values — no need to tune for this use case
- Walk through what each part is doing in plain English

**The Location Boost: File Path as a Signal**

- After BM25 scoring, boost results where search terms appear in the file path
- Intuition: if you search "ranker" and there's a file called `ranker.go`, that's probably what you want

```go
results[i].Score = results[i].Score * (1.0 +
    (LocationBoostValue * float64(len(l)) * float64(len(key))))
```

- Multiple matching terms in the path compound the boost
- Earlier position in the path scores higher (the `1 / (1 + low*0.02)` decay)

**Why This Works in Practice**

- Interactive code search is a different problem than web search — your result set is small (hundreds, not millions), and everything already matched
- You don't need globally accurate IDF — you need useful relative ordering
- Zero index, zero setup, instant startup — the right tradeoffs for a terminal tool

**Closing**

- Link to scc and the parallel of pragmatic approximation over theoretical purity
- Link to codespelunker repo
- Invitation for feedback / other approaches people have tried

-------------

The codespelunker BM25 (cs/pkg/ranker/ranker.go) is the cleverest by a good margin, and your own blog post about it basically explains why — it's solving a problem it shouldn't be able to solve.
BM25 is supposed to require an index. The whole formula depends on corpus-wide statistics: how many documents contain each term (document frequency), and the average document length across the corpus. Every textbook, every search engine, every implementation assumes you've pre-computed these in an indexing pass. Codespelunker doesn't have an index. It's walking the filesystem in real time. So on paper, it can't do BM25.
The clever insight is that it doesn't need globally accurate statistics — it just needs useful relative ordering. By computing document frequency only across the matched result set, the IDF values are inflated compared to true corpus-wide DF, but the relative ordering between results is preserved. A term that appears in 3 of your 200 matches is still rarer than one appearing in 150 of them. The absolute scores are "wrong" but the ranking is right, which is all that matters.
The Bytes / 2 trick for document length is similarly clever. Counting "words" in code is a genuinely hard problem — is foo.bar.baz one word or three? What about snake_case_name? Instead of trying to solve that, it just divides byte count by 2 as a rough proxy. It works because BM25's length normalization only cares about relative document lengths, not absolute word counts. A 10KB file is still roughly 5x longer than a 2KB file whether you measure in words or bytes÷2.
The 1 +  in the IDF formula (log10(1 + N/df)) is a small but smart touch too — it prevents IDF from going negative for terms that appear in most documents, which the other implementations don't guard against.
The caisson rankers are competent engineering — the FastLog10 bit hack is fun, and approximating term frequencies by document size bucket is a reasonable tradeoff — but they're solving a more conventional problem with conventional techniques. The codespelunker approach is taking an algorithm that has explicit prerequisites and figuring out why those prerequisites aren't actually necessary for the specific problem at hand. That's the kind of cleverness that comes from deeply understanding why a formula works, not just how it works.

-------------

---

**Title: Giving an LLM a Bird's-Eye View of Your Codebase with scc and codespelunker**

**Intro**

- LLMs are increasingly used for code understanding, review, and exploration
- But they're blind without tools — they can only see what you paste into the context window
- Two MCP tools, scc and codespelunker, give an LLM the ability to both understand the shape of a codebase and drill into the details
- This post is about what happens when you wire them up together

**The Problem: LLMs Have No Sense of Scale**

- An LLM can read a file and tell you what it does, but it can't tell you how that file fits into the bigger picture
- "Is this a 500 line hobby project or a 50,000 line monorepo?" — without tooling, it has no idea
- Context windows are big now, but dumping an entire codebase in is wasteful and noisy
- What you actually want is a way to zoom out, orient, then zoom in

**The Bird's-Eye View: scc as an MCP Tool**

- Run scc on a project root and immediately get language breakdown, total lines, complexity
- Use case: "Give me an overview of this project" — answered in one call
- Use case: "Which part of the codebase is most complex?" — sort by complexity, find the hotspots
- Use case: "Compare these two directories" — understand relative size and effort
- COCOMO as a bonus — effort estimates, cost modelling, conversation starter

**The Ground-Level View: codespelunker as an MCP Tool**

- Search across the codebase with ranked results using BM25 (link back to previous blog post)
- Read any file with scc stats baked into the response header

```
Language: Go
Lines: 199 | Code: 132 | Comment: 28 | Blank: 39 | Complexity: 27
---
1  // SPDX-License-Identifier: MIT
2
3  package ranker
...
```

- The per-file stats came from scc's engine — same counters, zero overhead
- Use case: "Find where BM25 ranking is implemented" → search → read → understand, all without leaving the conversation

**Better Together: The Workflow**

- Walk through a real example of how an LLM uses both tools in a single conversation
- Step 1: scc — "What is this project? What languages? Where's the complexity?"
- Step 2: codespelunker search — "Find me the most interesting parts" based on what scc revealed
- Step 3: codespelunker get_file — "Show me that code, with stats so I know what I'm looking at"
- The LLM goes from knowing nothing to having an informed opinion in three tool calls
- Contrast with the alternative: manually copying files into ChatGPT/Claude and losing all context about where they sit

**Why MCP and Why Separate Tools**

- MCP means any LLM client can pick these up, not just one vendor
- Separate tools because separate concerns — not everyone needs both, and scc can point at any directory independently
- Composability: the LLM decides when to use which tool based on the question being asked
- Keeps both tools focused and simple

**What the LLM Actually Gets Out of scc Stats**

- Complexity score helps prioritise which files to read carefully vs skim
- Code-to-comment ratio flags under-documented areas
- Language detection means it knows how to interpret what it's reading before it reads it
- File-level stats on every `get_file` call means it never reads code "blind"

**Developer Tooling is Changing**

- We've gone from "tools for humans" to "tools for humans AND LLMs"
- The same properties that make scc and codespelunker good CLI tools (fast, no setup, structured output) make them good LLM tools
- If your tool already outputs structured data and runs without configuration, wiring it up to MCP is low effort, high payoff
- Invitation: what other CLI tools would benefit from this treatment?

**Closing**

- Links to scc, codespelunker, and the previous blog post on BM25 without an index
- The combination of macro and micro views is what makes code understanding work — for humans and for LLMs
- Link to repos, invite feedback
