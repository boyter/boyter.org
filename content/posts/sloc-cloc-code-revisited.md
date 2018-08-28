---
title: Sloc Cloc and Code Revisited - Making a fast Go program faster and throughts on code counter accuracy
date: 2018-08-28
---

Two things prompted me to start looking at my code counter `scc`. The first being the release of Go 1.11. New releases of compilers, libarires and toolchains have a wonderful habit of making things go faster without you having to do anything other than recompile. In addition they often provide new methods which assist with this and are worth exploring.

The other was that the author of `tokei` released a new update v8.0.0 and included a comparison to `scc` on the project page https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md

I had been tracking the improvements in `tokei`, `loc` and `polyglot` over the last few weeks. However what really suprised me was the accuracy issues pointed out, particullary the fact that `scc` version 1.7.0 was misreporting the number of lines.

I tried testing it out on the example provided by `tokei` in the comparison page https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md

```
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Rust                         1        33       28         1        4          5
-------------------------------------------------------------------------------
Total                        1        33       28         1        4          5
-------------------------------------------------------------------------------
```

Wow. It really does misreport the number of lines. There should be 39 there.

This disturbted me quite a lot. In fact I had even written tests in `scc` to ensure I got the number of lines correct. For example this one,

{{<highlight go>}}
content := ""
for i := 0; i < 5000; i++ {
	content += "a\n"
	fileJob.Lines = 0
	fileJob.Content = []byte(content)
	CountStats(&fileJob)
	if fileJob.Lines != int64(i+1) {
		t.Errorf("Expected %d got %d", i+1, fileJob.Lines)
	}
}
{{</highlight>}}

That should never happen. 

*Denial: Step one of software debugging.*

Time to go code spelunking. Since I wrote `scc` and its a fairly small codebase I had a feeling it was an issue to do with the skip ahead logic. When `scc` finds a matching condition it keeps the offset around so it can jump ahead. However if there was an error its possible it would jump over any newlines \n which are used to determine to total count.

The offending code in mind was this one.

{{<highlight go>}}
// If we checked ahead on bytes we are able to jump ahead and save some time reprocessing
// the same values again
index += offsetJump
{{</highlight>}}

Just commenting out this and I got `scc` to report the correct number of lines. 

Still issues with the rest of the stats but I turned my attention to the tokei test suite and the simpler examples it had. The author of `tokei` suggested just using the test suite from `tokei` https://www.reddit.com/r/rust/comments/99e4tq/reading_files_quickly_in_rust/ so it seemed like a good idea. Also how could I be so stupid as to introduce this bug from day one and not notice it?

*Bargining/Self-Blame: Stage two of software debugging.*

I turned my attention to this example from the tokei codebase written in Java.

{{<highlight java>}}
/* 23 lines 16 code 4 comments 3 blanks */

/*
 * Simple test class
 */
public class Test
{
    int j = 0; // Not counted
    public static void main(String[] args)
    {
        Foo f = new Foo();
        f.bar();
        
    }
}

class Foo
{
    public void bar()
    {
      System.out.println("FooBar"); //Not counted
    }
}

{{</highlight>}}

Getting the stats from our now correct `scc` (for lines counts anyway).

```
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Java                         1        23       18         2        3          0
-------------------------------------------------------------------------------
Total                        1        23       18         2        3          0
-------------------------------------------------------------------------------
```

Well thats not brilliant. The only thing `scc` got right was the number of files and the number of lines. Maybe if I tweak it a little bit I can resolve this issue and everything else will go away? In any case how in the heck could I never have noticed this. I knew that the edge cases are a bitch to deal with.

*Anger: Stage three of software debugging.*


However



So the reason /`* /**/ */` works in tokei is because `/* /* */` does not.

In fact I remember looking into this when I first wrote `scc`. I was wondering about nested multiline comments which turned out to be a compile error in Java, hence while I toyed with getting it working never bothered to finish it off.


*Depression: Stage four of software debugging.*


*Acceptance: Stage five of software debugging.*