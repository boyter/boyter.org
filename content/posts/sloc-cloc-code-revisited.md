---
title: Sloc Cloc and Code Revisited - Going through the 5 stages of software debugging
date: 2018-08-28
---

Two things prompted me to start looking at my code counter `scc`. The first being the release of Go 1.11. New releases of compilers, libarires and toolchains have a wonderful habit of making things go faster without you having to do anything other than recompile. In addition they often provide new methods which assist with this and are worth exploring.

The other was that the author of `tokei` released a new update v8.0.0 and included a comparison to `scc` on the project page https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md

I had been tracking the improvements in `tokei`, `loc` and `polyglot` over the last few weeks. However what really suprised me was the accuracy issues pointed out, particullary the fact that `scc` version 1.7.0 was misreporting the number of lines.

### Denial: Step one of software debugging.

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

### Bargining/Self-Blame: Stage two of software debugging.

Time to go code spelunking. Since I wrote `scc` and its a fairly small codebase I had a feeling it was an issue to do with the skip ahead logic. When `scc` finds a matching condition it keeps the offset around so it can jump ahead. The idea being we skip bytes we have looked at where possible if we know they matched a condition which changed the state. However if there was an error in this logic its possible it would jump over any newlines \n which are used to determine to total count.

The offending code in mind was this one.

{{<highlight go>}}
// If we checked ahead on bytes we are able to jump ahead and save some time reprocessing
// the same values again
index += offsetJump
{{</highlight>}}

Just commenting out this and I got `scc` to report the correct number of lines. Ouch. Turns out I made a booboo. That was rather stupid of me.

I Still issues with the rest of the stats but was happy with progress. I then turned my attention to the tokei test suite and the simpler examples it had to verify correct output. The author of `tokei` suggested just using the test suite from `tokei` https://www.reddit.com/r/rust/comments/99e4tq/reading_files_quickly_in_rust/ so it seemed like a good idea. Also how could I be so stupid as to introduce this bug from day one and not notice it?

### Anger: Stage three of software debugging.

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

Well thats not brilliant. The only thing `scc` got right was the number of files and the number of lines. Maybe if I tweak it a little bit I can resolve this issue and everything else will go away? In any case how in the heck could I never have noticed this. I knew that the edge cases are a bitch to deal with, but still...

### Depression: Stage four of software debugging.

Looking into it the issues still appeared to be related to the end of line comments. When I first implemented `scc` I set a special state at the end of closing multiline comments. This would allow it to fall back into the code state when it hit a newline. However the result of this is that I introduced a bug. When there was a multiline comment the last line of the multiline would be counted as code. I never caught it because when I checked all my projects I don't use multiline comments most of the time.

In reality what should I should have done (which seems obvious in hindsight) is never process whitespace characters, unless they are a `\n` newline which resets the state and counts whatever state the application is is. When I realised this I was rather depressed that it took me so long to work this out.

### Acceptance: Stage five of software debugging.

A quick change to resolve it and all of a sudden everything was working as it should.

```
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Java                         1        23       16         4        3          0
-------------------------------------------------------------------------------
Total                        1        23       16         4        3          0
-------------------------------------------------------------------------------
```

In fact runing over the `tokei` samples everything worked. So I had a look again at the torture test posted.

```
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Rust                         1        38       29         5        4          5
-------------------------------------------------------------------------------
Total                        1        38       29         5        4          5
-------------------------------------------------------------------------------
```

A much better result. However it still is not accurate, nor matching tokei which produces, (BTW I am not a fan of the new full width result tokei now produces and made it hard to get the below close to the above)

```
-------------------------------------------------------------------------------
 Language            Files        Lines         Code     Comments       Blanks
-------------------------------------------------------------------------------
 Rust                    1           38           32            2            4
-------------------------------------------------------------------------------
 Total                   1           38           32            2            4
-------------------------------------------------------------------------------
```

What's the difference? One thing when looking at the source that caught my eye was the following,

{{<highlight rust>}}
let this_does_not = /* a /* nested */ comment " */
{{</highlight>}}

Nested comments? In fact I remember looking into this when I first wrote `scc`. I was wondering about nested multiline comments which turned out to be a compile error in Java, hence while I toyed with getting it working never bothered to finish it off.

So the reason for the difference is that `tokei` has some sort of stack for dealing with nested comments. I didn't even know was a thing.

Playing around with Rust and it turns out that it DOES support nested comments. My first thought was that this implementation is a bad idea. For example if you write the following `/*/**/` that is going to break `tokei` as everything will be a comment. Trying it out happens to be a compiler error... so it is not a case. If however you did happen to half implement a nested comment you get the following (I added it to the first line),

```
-------------------------------------------------------------------------------
 Language            Files        Lines         Code     Comments       Blanks
-------------------------------------------------------------------------------
 Rust                    1           38            0           34            4
-------------------------------------------------------------------------------
 Total                   1           38            0           34            4
-------------------------------------------------------------------------------
```

Clearly the above is wrong, but then again so is the code as it will not compile. I have no idea if other languages will allow the above state though. Also on that if you are reading this and know why you would even want nested comments please let me know. I cannot think of a good reason to implement them other than its a neat trick to put into your language.

Side note, this is why it is a good idea to at least toy around with other languages. If gives you greater perspective. Before I started my Rust journey I would have insisted that no mainstream language supports nested multi-line comments. Always be learning people.

### Acceptance: Stage five of software debugging.

Well knowing what is wrong is the second step to fixing it, with the first being knowing something is wrong. Clearly I underestimated how devious language designers can be.

To fix this isn't a huge issue. Just need to keep a stack of the comment opens, and check when in comments for another one. Sadly during this process I noticed that `scc` was missing quite a few edge cases. Thankfully the `tokei` stress test is pretty brutal and allowed me to identify them all and resolve them.

After much tweaking and fiddling with the logic.

```
$ tokei
--------------------------------------------------------------------------------
 Language             Files        Lines         Code     Comments       Blanks
--------------------------------------------------------------------------------
 Rust                     1           38           32            2            4
--------------------------------------------------------------------------------
 Total                    1           38           32            2            4
--------------------------------------------------------------------------------

$ scc
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Rust                         1        38       32         2        4          5
-------------------------------------------------------------------------------
Total                        1        38       32         2        4          5
-------------------------------------------------------------------------------
```

Excellent. With what appears to be most of the bugs ironed out time to look at performance again. With the changes that were made there are bound to be some wins, and with the new tools in Go I can hopefully spot some other issues.

### Performance

One of the really neat things about Go 1.11 that I quickly discovered is that the web pprof view now supports flame graphs. Flame graphs for those that don't know show a base from which methods rise out of. The wider the base of the flame the more time is spent in that method. Taller flames indicate deeper calls. They give a nice visual overview of where the program is spending its time and how many calls it made.

Candidates for optimisation are wide flames, ideally at the tip. Oddly though Go's flame graphs are inverted but no matter. Here is what I started with.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-start.png)

On the far right you can see the code which walks the file tree. Next to it is the code which pulls files into memory. To the left of that is the code which processes the files. The methods which process the files take up more room. This indicates that the application is CPU bound. 

From my previous benchmarks with `scc` I was aware that the method `complexityCount` was one of the more painful ones. At the time I managed to get it down to being about as optimial as I thought I could. However the brilliance of the flame graph is that I was able to see it was making some addtional calls. 

Clicking into that method produced the following.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-interesting.png)

Interesting. Looks like there is some sort of hash table lookup and if it can be avoided it will shave 6% of the total running time of the application. The offending code is,

{{<highlight go>}}
complexityBytes := LanguageFeatures[fileJob.Language].ComplexityBytes
{{</highlight>}}

For every time the method is called it goes back to the language lookup and looks for the bytes it needs to identify anything. This method is called a lot, almost every single byte in the file in some cases. If we look this information up once and pass it along to the method we can save thousands of lookups.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-after.png)

What does this translate to in the real world?

Before 

```
$ hyperfine 'scc redis'
Benchmark #1: scc redis
  Time (mean ± σ):     239.7 ms ±  43.7 ms    [User: 607.0 ms, System: 822.3 ms]
  Range (min … max):   213.0 ms … 327.5 ms
```

After

```
$ hyperfine 'scc redis'
Benchmark #1: scc redis
  Time (mean ± σ):     199.7 ms ±  26.1 ms    [User: 608.0 ms, System: 716.6 ms]
  Range (min … max):   180.5 ms … 268.8 ms
```

Not a bad saving there.

https://www.reddit.com/r/rust/comments/9aa6t8/tokei_v800_language_filtering_dynamic_term_width/
https://www.reddit.com/r/rust/comments/99e4tq/reading_files_quickly_in_rust/
https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md