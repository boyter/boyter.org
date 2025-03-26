---
title: Profiling searchcode.com's syntax highlighter
date: 2050-07-05
---

I have been running some processes using the searchcode.com database recently, where I was trying to optmised some very CPU bound code. As a result I have been watching the CPU on it very closely. I noticed while doing so that the CPU was 100% loaded by searchcode itself, which is unusual. Since I followed some of my [previous advice](https://boyter.org/posts/how-to-start-go-project-2023/) I had a quick way to grab a profile of what was going on.

After opening the profile I was presented with the following in the flame graph, zoomed to the problem.

For some reason strings.Replace was consuming all of the CPU inside the highlighter logic. The highlighter being the code that takes in code as a string and prints it out with syntax highlighting. You can see an example of this here <https://searchcode.com/file/615537138/core/test/com/google/inject/MethodInterceptionTest.java/>

Previously I was using [Chroma](https://github.com/alecthomas/chroma) for this, however its use of backtracking regular expressions caused by CPU and RAM issues, which was annoying because it did the job admirably. So I swapped it out for a forked version of [Syntaxhighlight](https://github.com/sourcegraph/syntaxhighlight) by Sourcegraph. Since it worked on token parsing it ensures that the CPU and RAM usage were table.

The problem was that when it highlighted it returned code in a list using `<li>` tags. I wanted to enable deep-links to the exact line and so I had to modify the output. I did so through the following piece of code.

{{<highlight go>}}
toCount := strings.Count(highlighted, "<li>") + 1
for i := 1; i < toCount; i++ {
    highlighted = strings.Replace(highlighted, "<li>", fmt.Sprintf(`<li id="l-%d">`, i), 1)
}
highlighted = strings.Replace(highlighted, "<li></li>\n", "", 1)
{{</highlight>}}

Now this worked well enough most of the time, however it was now the cause of the sudden CPU spikes. Most annoyingly I actually added the following prophetic comment.```
// TODO this is probably problematic due to the strings.Replace in a loop producing a lot of false positives, benchmark later

```

Indeed it was a problem. The problem bing that the replace had to loop over the same string multiple times. For larger inputs IE code with lots of lines this could mean hundreds of loops. I never noticed it as an issue because most code does not fall into this group.

The fix of course is quite simple,
