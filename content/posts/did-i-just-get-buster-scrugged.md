---
title: "Did I just get Buster Scrugged?"
date: 2026-09-06
---

I recently had this [incredibly classy github issue](https://github.com/boyter/scc/issues/769) raised against [scc](https://github.com/boyter/scc) related to another [code counter mezura](https://github.com/subamanis/mezura) which has some impressive [performance claims](https://github.com/subamanis/mezura#how-it-compares).

Naturally, I decided to check out it out.

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

As I said on the [stto comparison](https://boyter.org/posts/scc-stto-head-to-head/) some time ago

> This is not because I am hurt if my tool is slower. In fact that would me happy, as I can learn from my mistakes.

I started by running it locally against the linux kernel on my Desktop.

| | wall |
|---|---|
| scc 4.0.0 | 508.6 ms |
| scc 4.0.0 `-c` | 445.7 ms |
| mezura 3.0.0 | 203.9 ms |

Two things of note. I used `-c` to make it a closer comparison since mezura does not do this (as far as I can tell) and secondly, they are not doing an equal amount of work, with `scc` counting an extra 20,000 or so files. However there is still no reason `scc` should be taking 2x the wall clock time for this task.

Now I could go and read the source of mezura to see if there is some trick im missing, or as I decided, to black box it, by looking at strace output instead. This is because it gives a good idea of where to go looking for wins.

So with `strace -f -c` we get the following, for `scc`

```
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 67.01   40.684255         315    128800     16523 futex
 10.68    6.485319          16    383594           fcntl
  7.86    4.771551          16    286428         1 newfstatat
  5.78    3.511946          19    179668           read
  2.98    1.808648          17    101958      6052 openat
  2.65    1.608714          16     95905           close
  2.63    1.594982          16     95898     95897 epoll_ctl
  0.37    0.224998          18     12165           getdents64
...
------ ----------- ----------- --------- --------- ----------------
100.00   60.715727          47   1285082    118473 total
```

and the following for `mezura`

```
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 28.94   40.597028         286    141807           read
 17.49   24.542982         282     86835     17772 statx
 16.11   22.599910         286     79013         2 openat
 15.91   22.324217         282     79011           close
 13.91   19.517885         285     68397           lseek
  2.80    3.931691         265     14802           sched_yield
  2.42    3.401304         280     12110           getdents64
  2.38    3.334206         954      3493      1054 futex
...
------ ----------- ----------- --------- --------- ----------------
100.00  140.301096         288    485612     18828 total
```

The thing that stands out there to me is the total number of calls. I have `scc` doing almost 3x as many kernel calls to count only an extra 20% more files. From the above though there are four main things I think need to be looked at.

- `epoll_ctl`: 95,898 calls, 95,897 errors. Almost every single one failed.
- `fcntl`: 383,594. Approxamately four per file processed.
- `newfstatat`: 286,428. About three stats per file.
- `futex`: 128,800, and 67% of the traced time. A symptom of thread starvation.

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

Walker has a configurable but by default 8 go-routines feeding a queue of potential files to process. Stat file, did more than just stat, it would check the size, check symlinks, check regex exclusions, detect languages. Assuming a file passed all those checks it enqueues to fieListQueue were process where counting actually happens.

The problem was there was only one stat file process. As a result potentialFilesQueue was always 100% full and fileListQueue was 100% empty. How I missed this over the last few days I will never know, but I suspect that process was putting back-pressure on everything else, and once that was resolved the bottleneck shifted.

Simple fix, change it to have multiple go-routines doing that work. The result, was futex calls dropped to ~5500 per run and the resulting program dropped its wall clock runtime by about 160ms. It also exposed some concurrency bugs in newFileJob which have been resolved.

## epoll_ctl

One of the things that scc does is call `os.Open(path)` a lot... once for every file in fact.

However this has a bit of overhead, because on Linux os.Open hands the descriptor to Go's runtime poller, and for a regular file the kernel refuses it. Now what follows is a bit out of my depth. It comes down to how the kernel itself handles things.

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

We can then use strace to get whats actually happening,

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

Six calls before a byte is read. Opens the file, make it non-blocking, offers to epoll, gets told no, and puts the flag back. The kernel is doing the right thing here, epoll answers "would I/O on this block?", and for a socket or pipe makes sense, but for a file on disk... which should always be ready this is redundant.

Note Go is not doing anything wrong here either, `os.File` an abstraction covering sockets, pipes and files, so this is expected.

However on BSDs and macOS there is a switch for runtime.GOOS in os/file_unix.go that spends an fstat to find out it is a regular file and skip the whole thing. Linux is not in that list, and the comment right next to it says why it does not matter:

```
    // An error here indicates a failure to register
    // with the netpoll system. That can happen for
    // a file descriptor that is not supported by
    // epoll/kqueue; for example, disk files on
    // Linux systems.
```

That is the right trade when you are opening five files, but the wrong one when you are opening ninety thousand. Also knowing I am about to open 90,000 files is not something the library should be worrying about.

Switching to `syscall.Open(path, syscall.O_RDONLY|syscall.O_CLOEXEC, 0)` resolves this overhead, gives you the file as before, but with less calls.

Measured on its own, using a single threaded process with warm cache, opening and fully reading all 99,073 files of the kernel tree,
```
Benchmark 1: osopen
    Time (mean ± σ):     346.1 ms ±   2.0 ms    [User: 72.7 ms, System: 280.5 ms]
Benchmark 2: rawopen
    Time (mean ± σ):     276.4 ms ±   4.2 ms    [User: 26.0 ms, System: 255.6 ms]
Summary
    rawopen ran 1.25 ± 0.02 times faster than osopen
```

Nice improvement there, and we see a drop in fcntl from 383,594 down to 25,790 and epoll_ctl from 95,898 to 6,447.

## Results

So with the above fixes in place, where does `scc` land now?

```
boyter@spongehead:/mnt/data/projects/scc$ hyperfine './scc -c ../linux' 'scc -c ../linux' 'mezura ../linux'
Benchmark 1: ./scc -c ../linux
  Time (mean ± σ):     192.4 ms ±   3.0 ms    [User: 3815.7 ms, System: 882.9 ms]
  Range (min … max):   187.5 ms … 197.5 ms    15 runs

Benchmark 2: scc -c ../linux
  Time (mean ± σ):     456.6 ms ±   5.2 ms    [User: 7276.0 ms, System: 983.7 ms]
  Range (min … max):   447.2 ms … 468.5 ms    10 runs

Benchmark 3: mezura ../linux
  Time (mean ± σ):     207.8 ms ±  10.5 ms    [User: 2899.0 ms, System: 639.0 ms]
  Range (min … max):   195.2 ms … 228.0 ms    13 runs

Summary
  ./scc -c ../linux ran
    1.08 ± 0.06 times faster than mezura ../linux
    2.37 ± 0.05 times faster than scc -c ../linux
```

Nice. Note we are still counting more files than mezura here, so the above is not an equal amount of work. However we are now running in half the time we were before.

But.... can we do more?

## Engage Ludicrous Speed

So with `mezura` going into plaid, I need to engage ludicrous speed.

![Gone to Plaid](/static/did-i-just-get-buster-scrugged/plaid.jpg#center)

One idea I had bubbling in the back of my mind for a long time was to write optimised state machines for popular languages. The state machine that `scc` uses is designed to work for all languages. This makes adding a new one trivial. Set the rules of the language and it can now count it. However as we know, a generic solution to a problem is often not the most optimal.

The reason this could work well is you can optimise the state transitions to only whats needed. Less code, less if conditions and less for the CPU to do. You can also start to implement other tricks. Take for example Java. If you find a line that starts with `//`. Assuming you just moved to a comment state, the only thing you need to do now is jump from that location to the first newline you see. The generic state machine has a harder time here because it was designed to read each byte.

But for this example, we can use Go's AVX2 IndexByte once we find that `//` and use it to search multiple bytes in one pass to find that newline. This trick can potentially be applied in other areas too and should in theory provide a massive performance win.

I have never implemented this before now, because of the amount work it involves. However with LLMs I can hand over the task, with the frames of reference, with a huge test suite, and with an implementation that already exists that can be used to confirm the outputs match 100%.

So I did exactly that. I handed over the exact details to `claude` with exactly what I wanted and let it cook.


Results?

At 163 ms on 85,000 files... I think I am running into hardware limitations at this point.