---
title: Sloc Cloc and Code Revisited - A focus on accuracy
date: 2018-08-28
---

Two things prompted me to start looking at my code counter `scc` again. The first being the release of Go 1.11. New releases of compilers, libarires and toolchains have a wonderful habit of making things go faster without you having to do anything other than recompile. In addition they often provide new methods which assist with this and are worth exploring.

The other was that the author of `tokei` released a new update v8.0.0 and included a comparison to `scc` on the project page https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md

I had been tracking the improvements in `tokei`, `loc` and `polyglot` over the last few weeks. However what really suprised me was the accuracy issues pointed out, particullary the fact that `scc` version 1.7.0 was misreporting the number of lines.

#### Denial: Step one of software debugging.

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

#### Bargining/Self-Blame: Stage two of software debugging.

Time to go code spelunking. Since I wrote `scc` and its a fairly small codebase I had a feeling it was an issue to do with the skip ahead logic. When `scc` finds a matching condition it keeps the offset around so it can jump ahead. The idea being we skip bytes we have looked at where possible if we know they matched a condition which changed the state. However if there was an error in this logic its possible it would jump over any newlines \n which are used to determine to total count.

The offending code in mind was this one.

{{<highlight go>}}
// If we checked ahead on bytes we are able to jump ahead and save some time reprocessing
// the same values again
index += offsetJump
{{</highlight>}}

Just commenting out this and I got `scc` to report the correct number of lines. Ouch. Turns out I made a booboo. That was rather stupid of me.

I Still issues with the rest of the stats but was happy with progress. I then turned my attention to the tokei test suite and the simpler examples it had to verify correct output. The author of `tokei` suggested just using the test suite from `tokei` https://www.reddit.com/r/rust/comments/99e4tq/reading_files_quickly_in_rust/ so it seemed like a good idea. Also how could I be so stupid as to introduce this bug from day one and not notice it?

#### Anger: Stage three of software debugging.

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

#### Depression: Stage four of software debugging.

Looking into it the issues still appeared to be related to the end of line comments. When I first implemented `scc` I set a special state at the end of closing multiline comments. This would allow it to fall back into the code state when it hit a newline. However the result of this is that I introduced a bug. When there was a multiline comment the last line of the multiline would be counted as code. I never caught it because when I checked all my projects I don't use multiline comments most of the time.

In reality what should I should have done (which seems obvious in hindsight) is never process whitespace characters, unless they are a `\n` newline which resets the state and counts whatever state the application is is. When I realised this I was rather depressed that it took me so long to work this out.

#### Acceptance: Stage five of software debugging.

A quick change to resolve the above, never process whitespace characters and all of a sudden everything was working as it should.

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
$ scc
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Rust                         1        38       29         5        4          5
-------------------------------------------------------------------------------
Total                        1        38       29         5        4          5
-------------------------------------------------------------------------------
```

A much better result. However it still is not accurate, nor matching tokei which produces, (BTW I am not a fan of the new full width result tokei now produces and made it hard to get the below close to the above in terms of matching width).

```
$ tokei
--------------------------------------------------------------------------------
 Language             Files        Lines         Code     Comments       Blanks
--------------------------------------------------------------------------------
 Rust                     1           38           32            2            4
--------------------------------------------------------------------------------
 Total                    1           38           32            2            4
--------------------------------------------------------------------------------
```

What's the difference? One thing when looking at the source that caught my eye was the following,

{{<highlight rust>}}
let this_does_not = /* a /* nested */ comment " */
{{</highlight>}}

Nested comments? In fact I remember looking into this when I first wrote `scc`. I was wondering about nested multiline comments which turned out to be a compile error in Java, hence while I toyed with getting it working figured that was not a brilliant idea and explicitly made it work without them.

So the reason for the difference is that `tokei` has some sort of stack for dealing with nested comments so it know when to finish with them. I didn't even know was a thing.

Playing around with Rust and it turns out that it DOES support nested comments. My first thought was that this implementation is a bad idea. For example if you write the following `/*/**/` that is going to break `tokei` as everything will be a comment. Trying it out happens to be a compiler error... so it is not a case worth worrying about. If however you did happen to half implement a nested comment you get the following (I added it to the first line),

```
-------------------------------------------------------------------------------
 Language            Files        Lines         Code     Comments       Blanks
-------------------------------------------------------------------------------
 Rust                    1           38            0           34            4
-------------------------------------------------------------------------------
 Total                   1           38            0           34            4
-------------------------------------------------------------------------------
```

Clearly the above is wrong, but then again so is the code as it will not compile. I have no idea if other languages will allow the above state. Also if you are reading this and know why you would even want nested comments please let me know. I cannot think of a good reason to implement them other than its a neat trick to put into your language.

Side note, this is why it is a good idea to at least toy around with other languages. If gives you greater perspective. Before I started my Rust journey I would have insisted that no mainstream language supports nested multi-line comments. Always be learning.

### Acceptance: Stage five of software debugging.

Well knowing what is wrong is the second step to fixing it, with the first being knowing something is wrong. Clearly I underestimated how devious language designers can be.

To fix this isn't a huge issue. Just need to keep a stack of the multi-line comment opens, and check when in comments for another one. Sadly during this process I noticed that `scc` was missing quite a few edge cases. Thankfully the `tokei` stress test is pretty brutal and allowed me to identify them all and resolve them.

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

Excellent.

However what price has tokei paid for this logic. Is it for example intelligent enough to know that Java does not support nested multiline comments? Turns out it is. Also turns out that nested multiline comments are more common across languages than I expected, Lisp, Rust, Lean, Jai, Idris, Scheme, Swift, Julia and Kotlin all suppot them. As such I added in the same checks to ensure that `scc` is as accurate as `tokei`, unless of course there are differences in the languages.json file that both use.

With what appears to be most of the bugs ironed out time to look at performance again. With the changes that were made there are bound to be some wins, and with the new tools in Go I can hopefully spot some other issues.

### Performance

I figured that since I was already making changes I would have a poke through the source and see if there were any wins to made on the performance front.

One of the really neat things about Go 1.11 that I discovered is that the web pprof view now supports flame graphs. Flame graphs for those that don't know show a base from which methods rise (or fall as the Go one is inverted) out of. The wider the base of the flame the more time is spent in that method. Taller flames indicate more method calls, where one method calls another. They give a nice visual overview of where the program is spending its time and how many calls are made.

Candidates for optimisation are wide flames, ideally at the tip. As mentioned oddly enough Go's flame graphs are inverted. Here is what I started with.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-start.png)

On the far right you can see the code which walks the file tree. Next to it is the code which pulls files into memory. To the left of that is the code which processes the files. The methods which process the files take up more room. This indicates that the application is CPU bound, as that method is only invoked when the far right methods are finished.

One big issue with flame graphs is that if you arent calling out to methods it looks rather flat like the above. This can be solved by breaking large methods down into smaller ones, which will produce more tips in the flame graph.

From my previous benchmarks with `scc` I was aware that the method `complexityCount` was one of the more painful ones. At the time I managed to get it down to being about as optimial as I thought. However the brilliance of the flame graph is that it makes it easy to see where addtional calls are being made and how long it spends in them.

Clicking into that method produced the following.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-interesting.png)

Interesting. Looks like there is some sort of hash table lookup and if it can be avoided it will shave 6% of the total running time of the application. The offending code is,

{{<highlight go>}}
complexityBytes := LanguageFeatures[fileJob.Language].ComplexityBytes
{{</highlight>}}

Every time the method is called it goes back to the language lookup and looks for the bytes it needs to identify complexity. This method is called a lot, almost every single byte in the file in some cases. If we look this information up once and pass it along to the method we can save porentially thousands of lookups and a lot of CPU burn time. A simple change to implement and the result looks like the below.

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

Not a bad saving there. Following this easy win I started poking around the codebase and identified some additional lookups and method calls that could be removed. These changes were largly a result of changing the logic to skip whitespace characters which improve accuracy.

The result of the above tweaks was that the complexity calculation inside `scc` is now calculated almost for free. Trying it out on the redis codebase on a more powerful machine.

```
$ hyperfine 'scc redis' && hyperfine 'scc -c redis'
Benchmark #1: scc redis
  Time (mean ± σ):      96.5 ms ±   3.5 ms    [User: 271.4 ms, System: 321.2 ms]
  Range (min … max):    92.4 ms … 105.7 ms

Benchmark #1: scc -c redis
  Time (mean ± σ):      91.1 ms ±   2.7 ms    [User: 193.5 ms, System: 362.1 ms]
  Range (min … max):    87.4 ms …  96.6 ms
```

Only 5ms difference between the run with complexity vs the one without when running against the redis source code. Oddly for some reason the complexity calcuation is faster but this is a very synthetic benchmark. It does give an idea of just how inefficient that lookup was, and how much those addtional savings helped.


### Benchmarks

All GNU/Linux tests were run on Digital Ocean 16 vCPU Compute optimized droplet with 32 GB of RAM and a 200 GB SSD. The machine used was doing nothing else at the time and was created with the sole purpose of running the tests to ensure no interference from other processes. The OS used is Ubuntu 18.04 and the rust programs were installed using cargo install.

The Windows tests were run on a Surface Book 2 with the i7-8650U CPU. This is problematic as there is the possibility that CPU throttling will kick in influencing the benchmark, and as it is not a freshly formatted machine that there may be something else running on it during the benchmark. Take these tests with a massive grain of salt and treat them as more an indication of performance than a perfect benchmark. I did my best to stop all background services and ran benchmarks several times only taking the best result for each to try and keep it as fair as possible. I ran the tests inside the Ubuntu WSL which means I was running Linux binaries in Windows which probably causes odd results as well.

With that out of the way time for the usual benchmarks. Similar to the comparison by `tokei` https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md I have included a few tools, `tokei`, `cloc`, `scc`, `loc` and `polyglot`.

Tools under test

 - scc 1.9.0
 - tokei 8.0.1
 - loc 0.4.1
 - polyglot 0.5.10

I compiled `tokei` and `loc` on the machine used for testing using the latest version of Rust 1.28.

I am not going to include any commentary about the benchmarks. 

To start lets try the accuracy test using the `tokei` torture test file.

```
root@ubuntu-c-16-sgp1-01:~# ./scc tokeitest/
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Rust                         1        39       32         2        5          5
-------------------------------------------------------------------------------
Total                        1        39       32         2        5          5
-------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# tokei tokeitest/
--------------------------------------------------------------------------------
 Language             Files        Lines         Code     Comments       Blanks
--------------------------------------------------------------------------------
 Rust                     1           38           32            2            4
--------------------------------------------------------------------------------
 Total                    1           38           32            2            4
--------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# loc tokeitest/
--------------------------------------------------------------------------------
 Language             Files        Lines        Blank      Comment         Code
--------------------------------------------------------------------------------
 Rust                     1           39            5           34            0
--------------------------------------------------------------------------------
 Total                    1           39            5           34            0
--------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# cloc tokeitest/
github.com/AlDanial/cloc v 1.74  T=0.01 s (127.5 files/s, 4974.4 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Rust                             1              5             10             24
-------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# ./polyglot tokeitest/
-------------------------------------------------------------------------------
 Language             Files       Lines         Code     Comments       Blanks
-------------------------------------------------------------------------------
 Rust                     1          39           34            0            5
-------------------------------------------------------------------------------
 Total                    1          39           34            0            5
-------------------------------------------------------------------------------
```

As you can see both `tokei` and `scc` get the numbers correct. The other tools have varying degrees of success.

#### Cython f3267144269b873bcb87a9fcafe94b37be1bcfdc


root@ubuntu-c-16-sgp1-01:~# hyperfine './scc cpython' && hyperfine 'GOGC=-1 ./scc -c cpython' && hyperfine 'tokei cpython' && hyperfine 'loc cpython' && hyperfine './polyglot cpython'
Benchmark #1: ./scc cpython

  Time (mean ± σ):     170.1 ms ±   5.1 ms    [User: 1.925 s, System: 0.093 s]

  Range (min … max):   163.9 ms … 182.8 ms

Benchmark #1: GOGC=-1 ./scc -c cpython

  Time (mean ± σ):     136.5 ms ±   3.3 ms    [User: 1.529 s, System: 0.099 s]

  Range (min … max):   130.5 ms … 142.5 ms

Benchmark #1: tokei cpython

  Time (mean ± σ):      82.6 ms ±   5.0 ms    [User: 710.1 ms, System: 80.0 ms]

  Range (min … max):    75.0 ms …  91.9 ms

Benchmark #1: loc cpython

  Time (mean ± σ):      62.0 ms ±  12.7 ms    [User: 695.6 ms, System: 72.1 ms]

  Range (min … max):    48.2 ms …  97.7 ms

Benchmark #1: ./polyglot cpython

  Time (mean ± σ):      76.6 ms ±   5.1 ms    [User: 117.7 ms, System: 83.3 ms]

  Range (min … max):    63.3 ms …  86.5 ms



root@ubuntu-c-16-sgp1-01:~# hyperfine './scc redis' && hyperfine 'GOGC=-1 ./scc -c redis' && hyperfine 'tokei redis' && hyperfine 'loc redis' && hyperfine './polyglot redis'
Benchmark #1: ./scc redis

  Time (mean ± σ):      25.3 ms ±   2.1 ms    [User: 198.4 ms, System: 16.7 ms]

  Range (min … max):    22.9 ms …  33.5 ms

Benchmark #1: GOGC=-1 ./scc -c redis

  Time (mean ± σ):      23.0 ms ±   2.3 ms    [User: 159.0 ms, System: 18.1 ms]

  Range (min … max):    20.1 ms …  31.2 ms

Benchmark #1: tokei redis

  Time (mean ± σ):      20.4 ms ±   2.4 ms    [User: 91.9 ms, System: 21.6 ms]

  Range (min … max):    17.0 ms …  29.9 ms

Benchmark #1: loc redis

  Time (mean ± σ):      19.6 ms ±   8.7 ms    [User: 138.1 ms, System: 13.6 ms]

  Range (min … max):    13.2 ms …  70.8 ms

  Warning: Statistical outliers were detected. Consider re-running this benchmark on a quiet PC without any interferences from other programs. It might help to use the '--warmup' or '--prepare' options.

Benchmark #1: ./polyglot redis

  Time (mean ± σ):      16.0 ms ±   0.9 ms    [User: 16.4 ms, System: 18.0 ms]

  Range (min … max):    14.0 ms …  22.1 ms



root@ubuntu-c-16-sgp1-01:~# hyperfine './scc rust' && hyperfine 'GOGC=-1 ./scc -c rust' && hyperfine 'tokei rust' && hyperfine 'loc rust' && hyperfine './polyglot rust'
Benchmark #1: ./scc rust

  Time (mean ± σ):     129.9 ms ±   2.5 ms    [User: 977.2 ms, System: 161.8 ms]

  Range (min … max):   127.2 ms … 137.0 ms

Benchmark #1: GOGC=-1 ./scc -c rust

  Time (mean ± σ):     118.9 ms ±   2.2 ms    [User: 807.1 ms, System: 163.4 ms]

  Range (min … max):   115.4 ms … 124.5 ms

Benchmark #1: tokei rust

  Time (mean ± σ):     112.2 ms ±   5.6 ms    [User: 609.6 ms, System: 146.8 ms]

  Range (min … max):   105.6 ms … 124.8 ms

Benchmark #1: loc rust

  Time (mean ± σ):     141.0 ms ±  34.1 ms    [User: 1.964 s, System: 0.123 s]

  Range (min … max):   116.1 ms … 215.5 ms

Benchmark #1: ./polyglot rust

  Time (mean ± σ):     122.6 ms ±   4.0 ms    [User: 214.3 ms, System: 152.5 ms]

  Range (min … max):   115.5 ms … 130.9 ms


root@ubuntu-c-16-sgp1-01:~# hyperfine './scc linux' && hyperfine 'GOGC=-1 ./scc -c linux' && hyperfine 'tokei linux' && hyperfine 'loc linux' && hyperfine './polyglot linux'
Benchmark #1: ./scc linux

  Time (mean ± σ):      2.312 s ±  0.131 s    [User: 28.127 s, System: 0.900 s]

  Range (min … max):    2.134 s …  2.547 s

Benchmark #1: GOGC=-1 ./scc -c linux

  Time (mean ± σ):      1.538 s ±  0.013 s    [User: 21.671 s, System: 1.180 s]

  Range (min … max):    1.523 s …  1.561 s

Benchmark #1: tokei linux

  Time (mean ± σ):     884.6 ms ±  33.5 ms    [User: 9.506 s, System: 0.850 s]

  Range (min … max):   845.4 ms … 936.9 ms

Benchmark #1: loc linux

  Time (mean ± σ):     654.8 ms ±   6.8 ms    [User: 9.085 s, System: 0.813 s]

  Range (min … max):   646.6 ms … 664.9 ms

Benchmark #1: ./polyglot linux

  Time (mean ± σ):     999.5 ms ±  35.0 ms    [User: 2.378 s, System: 0.816 s]

  Range (min … max):   943.9 ms … 1041.8 ms


https://www.reddit.com/r/rust/comments/9aa6t8/tokei_v800_language_filtering_dynamic_term_width/
https://www.reddit.com/r/rust/comments/99e4tq/reading_files_quickly_in_rust/
https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md