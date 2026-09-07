---
title: "Did I just get Buster Scrugged?"
date: 2026-09-06
---

I recently had this [gracious github issue](https://github.com/boyter/scc/issues/769) raised against [scc](https://github.com/boyter/scc) related to another [code counter mezura](https://github.com/subamanis/mezura) which has some impressive [performance claims](https://github.com/subamanis/mezura#how-it-compares).

Naturally, I decided to check it out.

```
boyter@spongehead:/mnt/data/projects/scc$ hyperfine 'scc ./linux' 'mezura ./linux'
Benchmark 1: scc ./linux
  Time (mean ± σ):     512.2 ms ±   4.6 ms    [User: 10362.5 ms, System: 985.7 ms]
  Range (min … max):   506.6 ms … 519.5 ms    10 runs

Benchmark 2: mezura ./linux
  Time (mean ± σ):     200.3 ms ±   9.6 ms    [User: 2898.5 ms, System: 643.5 ms]
  Range (min … max):   186.8 ms … 213.0 ms    14 runs

Summary
  mezura ./linux ran
    2.56 ± 0.13 times faster than scc ./linux
```

Damn. Did I just get Buster Scrugged?

![Buster Scruggs](/static/did-i-just-get-buster-scrugged/buster-scruggs.jpg#center)

At the time I was enjoying a splash of whisky to celebrate the wind down of a stressful project and keep my singing voice in fettle. I was astonished at the result. However, before trading my spurs for wings, I decided to sleep on it, and have a look around at what I could do.

As I said on the [stto comparison](https://boyter.org/posts/scc-stto-head-to-head/) some time ago,

> This is not because I am hurt if my tool is slower. In fact that would make me happy, as I can learn from my mistakes.

So looking at the times, we have this on my Desktop, a 9950x3d and Go 1.27, rerun the next morning.

| | wall |
|---|---|
| scc 4.0.0 | 508.6 ms |
| scc 4.0.0 `-c` | 445.7 ms |
| mezura 3.0.0 | 203.9 ms |

Two things of note. I used `-c` which turns off complexity calculations to make it a closer comparison since mezura does not do this (as far as I can tell) and secondly, they are not doing an equal amount of work. `scc` is counting ~86,000 files compared to mezura counting ~67,000. However there is still no reason `scc` should be taking 2x the wall clock time for this task.

Now I could go and read the source of mezura to see if there is some trick I'm missing, or as I decided, to black box it, by looking at strace output instead. This is because it gives a good idea of where to go looking for wins, and I have never really used it that much.

So with `strace -f -c` we get the following trimmed output, for `scc`

```
$ strace -f -c scc ./linux
...
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ------------------
 64.35   53.910948         401    134199     17220 futex
  8.81    7.376690          19    383594           fcntl
  8.13    6.811101         137     49644         3 nanosleep
  6.51    5.454290          19    286428         1 newfstatat
  4.73    3.964218          22    179668           read
  2.47    2.069497          20    101958      6052 openat
  2.22    1.860438          19     95905           close
  2.20    1.844428          19     95898     95897 epoll_ctl
  0.29    0.244940          20     12165           getdents64
...
------ ----------- ----------- --------- --------- ------------------
100.00   83.774760          62   1344953    119189 total
```

and for `mezura`

```
$ strace -f -c mezura ./linux/
...
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ------------------
 23.26   37.838034         266    141799           read
 16.81   27.351788        1447     18896           clock_nanosleep
 14.14   23.009323         264     86831     17772 statx
 13.01   21.164892         267     79009         2 openat
 12.72   20.698234         261     79007           close
 11.09   18.040855         263     68393           lseek
  3.16    5.138156        1394      3685      1139 futex
  2.15    3.495083         263     13242           sched_yield
  1.96    3.194394         263     12110           getdents64
...
------ ----------- ----------- --------- --------- ------------------
100.00  162.676907         316    514499     18915 total
```

Ignore the seconds column, it's overhead from strace, call counts are what matters here.

The thing that stands out there to me is the total number of calls. I have `scc` doing almost 2.6x as many kernel calls to count only an extra 28% more files. From the above though there are four main things I think need to be looked at.

- `epoll_ctl`: 95,898 calls, 95,897 errors. Almost every single one failed.
- `fcntl`: 383,594. Approximately four per file processed.
- `newfstatat`: 286,428. About three stats per file.
- `futex`: ~134,000, and 64% of the traced time. A symptom of thread starvation.

As predicted a lot of file processing, although the `futex` is a bit of a surprise considering how much effort I have put into `scc`.

So with the above in place I now know where to start looking. Looks like there is room for improvement.

## futex

The futex line is a good place to start. It does not indicate a bug, but instead that a thread is being parked or woken up. This suggests that the fan out/in pipeline it has is not as optimal as I would have thought.

The pipeline in question looks a bit like this,

```
                                                                                                           
 ┌─────────────┐                                ┌────────────┐                                ┌───────────┐
 │             │    ┌──────────────────────┐    │            │    ┌──────────────────────┐    │           │
 │   Walker    │───▶│ potentialFilesQueue  │───▶│ stat file  │───▶│    fileListQueue     │───▶│  process  │
 │             │    └──────────────────────┘    │            │    └──────────────────────┘    │           │
 └─────────────┘                                └────────────┘                                └───────────┘
 ```

Walker has a configurable but by default 8 goroutines feeding a queue of potential files to process. Stat file does more than just stat, it would check the size, check symlinks, check regex exclusions, detect languages. Assuming a file passed all those checks it is enqueued to `fileListQueue` where counting actually happens.

The problem was there was only one stat file process. As a result `potentialFilesQueue` was always 100% full and `fileListQueue` was 100% empty. How I missed this over the last few days I will never know, but I suspect that process was putting back-pressure on everything else, and once that was resolved the bottleneck shifted.

Simple fix, change it to have multiple goroutines doing that work. The result was futex calls dropped to ~5500 per run and the resulting program dropped its wall clock runtime by about 160ms. It also exposed some concurrency bugs in newFileJob which have been resolved.

## epoll_ctl / newfstatat / fcntl

One of the things that scc does is call `os.Open(path)` a lot... once for every file in fact.

However this has a bit of overhead, because on Linux os.Open hands the descriptor to Go's runtime poller, and for a regular file the kernel refuses it. It comes down to how the kernel itself handles things.

Replicating this is not hard,

```Go
package main

  import (
        "os"
        "syscall"
  )

  func main() {
        path := os.Args[2]
        buf := make([]byte, 65536)

        syscall.Write(1, []byte("--- START ---\n"))
        if os.Args[1] == "osopen" {
                f, _ := os.Open(path)
                f.Read(buf)
                f.Close()
        } else {
                fd, _ := syscall.Open(path, syscall.O_RDONLY|syscall.O_CLOEXEC, 0)
                syscall.Read(fd, buf)
                syscall.Close(fd)
        }
        syscall.Write(1, []byte("--- END ---\n"))
  }
```

We can then use strace to get what's actually happening,

```
$ go build -o openone main.go
$
$ strace -f -e trace=openat,fcntl,epoll_ctl,read,close,write ./openone osopen ./main.go 2>&1 >/dev/null | awk '/START/{p=1;next} /END/{p=0} p'
[pid 3320210] openat(AT_FDCWD, "./main.go", O_RDONLY|O_CLOEXEC) = 4
[pid 3320210] fcntl(4, F_GETFL)         = 0x8000 (flags O_RDONLY|O_LARGEFILE)
[pid 3320210] fcntl(4, F_SETFL, O_RDONLY|O_NONBLOCK|O_LARGEFILE) = 0
[pid 3320210] epoll_ctl(5, EPOLL_CTL_ADD, 6, {events=EPOLLIN, data=0x57a1e8}) = 0
[pid 3320210] epoll_ctl(5, EPOLL_CTL_ADD, 4, {events=EPOLLIN|EPOLLOUT|EPOLLRDHUP|EPOLLET, data=0x3f874a620c000001}) = -1 EPERM (Operation not permitted)
[pid 3320210] fcntl(4, F_GETFL)         = 0x8800 (flags O_RDONLY|O_NONBLOCK|O_LARGEFILE)
[pid 3320210] fcntl(4, F_SETFL, O_RDONLY|O_LARGEFILE) = 0
[pid 3320210] read(4, "package main\n\n  import (\n       "..., 65536) = 556
[pid 3320210] close(4)                  = 0
$
$ strace -f -e trace=openat,fcntl,epoll_ctl,read,close,write ./openone rawopen ./main.go 2>&1 >/dev/null | awk '/START/{p=1;next} /END/{p=0} p'
[pid 3320746] openat(AT_FDCWD, "./main.go", O_RDONLY|O_CLOEXEC) = 4
[pid 3320746] read(4, "package main\n\n  import (\n       "..., 65536) = 556
[pid 3320746] close(4)                  = 0
```

Five calls before a byte is read. Opens the file, makes it non-blocking, offers to epoll, gets told no, and puts the flag back. The kernel is doing the right thing here, epoll answers "would I/O on this block?", and for a socket or pipe makes sense, but for a file on disk... which should always be ready this is redundant.

Note Go is not doing anything wrong here either, `os.File` is an abstraction covering sockets, pipes and files, so this is expected.

However on BSDs and macOS there is a switch for runtime.GOOS in os/file_unix.go that spends an fstat to find out it is a regular file and skip the whole thing. Linux is not in that list, and the comment right next to it says why it does not matter:

```
    // An error here indicates a failure to register
    // with the netpoll system. That can happen for
    // a file descriptor that is not supported by
    // epoll/kqueue; for example, disk files on
    // Linux systems.
```

That is the right trade when you are opening five files, but the wrong one when you are opening ninety thousand. Also knowing I am about to open 90,000 files is not something the library should be worrying about.

Switching to `syscall.Open()` resolves this overhead, gives you the file as before, but with fewer calls.

Measured on its own, using a single threaded process with warm cache, opening and reading 99,073 files of the kernel tree,
```
Benchmark 1: osopen
    Time (mean ± σ):     346.1 ms ±   2.0 ms    [User: 72.7 ms, System: 280.5 ms]
Benchmark 2: rawopen
    Time (mean ± σ):     276.4 ms ±   4.2 ms    [User: 26.0 ms, System: 255.6 ms]
Summary
    rawopen ran 1.25 ± 0.02 times faster than osopen
```

Nice improvement there. Applying this fix to `scc` and we see a drop in fcntl from 383,594 down to 25,790 and epoll_ctl from 95,898 to 6,447.

One thing I should add before moving on though is that I am giving up what `os.File` does on Linux. I am now responsible for ensuring a `syscall.Close` is called or I will quickly hit the rlimit. Closing twice is a problem too because nothing is stopping it and if another goroutine grabs the same descriptor number I could close their file on them. `EINTR` handling is probably an issue on FUSE filesystems or network mounts too. None of this should affect `scc` because the descriptor only lives for a short time. But don't do this on a long lived server.

## Other

There were a heap of other tweaks that went into this, including some fixes in [gocodewalker](https://github.com/boyter/gocodewalker/) to help. Normally I would go into detail here, but i'll be honest I forgot to keep my usual notes. Suffice to say while some bug fixes made it based on that bug report many were performance orientated.

## Results

So with the above fixes in place, where does `scc` land now? A quick comparison between the new build, the old one and mezura.

```
boyter@spongehead:/mnt/data/projects/scc$ hyperfine './scc -c ./linux' 'scc -c ./linux' 'mezura ./linux'
Benchmark 1: ./scc -c ./linux
  Time (mean ± σ):     192.4 ms ±   3.0 ms    [User: 3815.7 ms, System: 882.9 ms]
  Range (min … max):   187.5 ms … 197.5 ms    15 runs

Benchmark 2: scc -c ./linux
  Time (mean ± σ):     456.6 ms ±   5.2 ms    [User: 7276.0 ms, System: 983.7 ms]
  Range (min … max):   447.2 ms … 468.5 ms    10 runs

Benchmark 3: mezura ./linux
  Time (mean ± σ):     207.8 ms ±  10.5 ms    [User: 2899.0 ms, System: 639.0 ms]
  Range (min … max):   195.2 ms … 228.0 ms    13 runs

Summary
  ./scc -c ./linux ran
    1.08 ± 0.06 times faster than mezura ./linux
    2.37 ± 0.05 times faster than scc -c ./linux
```

Nice. Note we are still counting more files than mezura here (~86,000 to ~67,000), so the above is not an equal amount of work. However we are now running in half the time we were before.

But.... can we do better?

## Engage Ludicrous Speed

So with `mezura` going into plaid, I need to engage ludicrous speed.

![Gone to Plaid](/static/did-i-just-get-buster-scrugged/plaid.jpg#center)

One idea I had bubbling in the back of my mind for a long time was to write optimised state machines for popular languages. The state machine that `scc` uses is designed to work for all languages. This makes adding a new one trivial. Set the rules of the language and it can now count it. However as we know, a generic solution to a problem is often not the most optimal.

The reason this could work well is you can optimise the state transitions to only what's needed. Less code, fewer `if` conditions and less for the CPU to do. You can also start to implement other tricks. Take for example Java. If you find a line that starts with `//`. Assuming you just moved to a comment state, the only thing you need to do now is jump from that location to the first newline you see. The generic state machine has a harder time here because it was designed to read each byte.

But for this example, we can use Go's AVX2 IndexByte once we find that `//` and use it to search multiple bytes in one pass to find that newline. This trick can potentially be applied in other areas too and should in theory provide a massive performance win.

I have never implemented this before now, because of the amount of work it involves. However with LLMs I can hand over the task, with the frames of reference, with a huge test suite, and with an implementation that already exists that can be used to confirm the outputs match 100%.

So I did exactly that. I handed over the exact details to `Claude` with exactly what I wanted and let it cook implementing this for C and Java. Results?

```
boyter@spongehead:/mnt/data/projects/scc$ hyperfine './scc -c --exp-per-language-counters ./linux' 'mezura ./linux'
Benchmark 1: ./scc -c --exp-per-language-counters ./linux
  Time (mean ± σ):     166.7 ms ±   2.9 ms    [User: 2867.3 ms, System: 944.7 ms]
  Range (min … max):   159.5 ms … 171.3 ms    17 runs

Benchmark 2: mezura ./linux
  Time (mean ± σ):     203.4 ms ±  10.0 ms    [User: 2871.4 ms, System: 655.7 ms]
  Range (min … max):   189.7 ms … 218.7 ms    14 runs

Summary
  ./scc -c --exp-per-language-counters ./linux ran
    1.22 ± 0.06 times faster than mezura ./linux
```

The `exp-per-language-counters` is just a flag I set to turn this functionality on. For now it is shipped off by default, until I am happy with its implementation. Probably in another version or two.

So... that's processing 1,516,845,281 bytes in ~86,000 files... 1.9 µs per file (in wall clock time). I suspect we're getting close to the limits of the hardware at this point? At least in terms of counting every byte in those files.

That's about 9 GB/s of throughput, which I know is lower than the theoretical maximum a CPU can do, but still fairly impressive for non-contiguous file reads. Each file takes about 44 µs of CPU time to process, with the kernel itself spending about 10 µs of that just opening, reading, and closing the files. The machine has 16 physical cores and 32 threads, which with SMT scaling works out to roughly 23–24 effective cores. Dividing that 44 µs of work across those cores gives us that 1.9 µs wall-clock time per file. For this machine, that's essentially 100% saturation.

With the above done I have cut a [new v4.1.0 release](https://github.com/boyter/scc) of `scc` with the above in it. Go get it. BTW, If you are running `scc` at scale, deploy this and see a nice change in your metrics please contact me as I'd love to see it.

That issue ended with this line,

> Thanks for scc, it pushes the rest of us to do better!

To which I say: no, thank you! You pushed me to do better!
