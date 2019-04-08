---
title: Processing Large Files – Java, Go and 'hitting the wall'
date: 2019-04-07
---


https://marcellanz.com/post/file-read-challenge/
https://itnext.io/using-java-to-read-really-really-large-files-a6f8a3f44649

Whenever I see a post

While I don't like solving arbitary company made "programming tests" when doing interviews https://boyter.org/2016/09/companies-recruiting/ whenever I see a post comparing Go to Java where Java is trounced in performance gets my attention. Unless its a very short lived command line application where JVM startup is a problem or some super optimised Go solution in my experience so far Java should generally be faster. 

I had a look through Marcel's solution compared to Paige and it was fairly obvious that the Go solution was going to be faster since it made a good use of Go routines and channels.

Which made me think. While I understand that Go channels are effectivly a BufferedQueue (with size of 1 in the case of unbuffered) with some synatic sugar, I had never actually tried writing Java using that technique. Processing a very large file with one thread reading and other threads processing is pretty much the textbook solution to solve this problem and as such Go's concurrency plays very nicely into this.

Since I didn't have any experience with a direct Go to Java comparison I figured it would be a good thing to play around with.

I took a copy of Marcel's optimal Go solution, pulled down the sample set and tried it out. The sample set linked https://www.fec.gov/files/bulk-downloads/2018/indiv18.zip when unziped needed to be concaternated together into the file `itcont.txt` which when done was about 4 GB in size at time of writing. I then compiled the optimal solution and ran it.

```
$ time ./go-solution itcont.txt > /dev/null
./go-solution itcont.txt > /dev/null  14.14s user 6.52s system 222% cpu 9.296 total
```

Which gives me a time to chase.

The first thing to do is create a simple Java application which reads through the file. This is to give some baseline performance of file reading in Java and I would hope is about the same as the Go code. A very simple way to do this is include below.

{{<highlight java>}}
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class FileRead {
    public static void main(String[] argv) {
        var lineCount = 0;
        try (var b = Files.newBufferedReader(Path.of("itcont.txt"))) {
            var readLine = "";
            while ((readLine = b.readLine()) != null) {
                lineCount++;
            }
        } catch (IOException ignored) {
        }

        System.out.println(lineCount);
    }
}
{{</highlight>}}

Then the result when running.

```
$ time java FileRead > /dev/null
java FileRead > /dev/null  6.11s user 3.69s system 106% cpu 9.221 total
```

The same result as the Go. This indicates that the Go code as mentioned by Marcel is indeed bottlenecked by the disk and not by the CPU. So long as when processing we don't Go below this number we know we have an optimial solution.

So with that done I quickly implemented the requirements which are,

 - Write a program that will print out the total number of lines in the file.
 - Notice that the 8th column contains a person’s name. Write a program that loads in this data and creates an array with all name strings. Print out the 432nd and 43243rd names.
 - Notice that the 5th column contains a form of date. Count how many donations occurred in each month and print out the results.
 - Notice that the 8th column contains a person’s name. Create an array with each first name. Identify the most common first name in the data and how many times it occurs.

The number of lines in the file is fairly easy and I already did it with the `lineCount`. Saving the names is also easy,

{{<highlight java>}}
var names = new ArrayList<String>();

var split = readLine.split("\\|");
names.add(split[7]);
{{</highlight>}}

To get the donations is also fairly simple. Create a HashMap with the date as the key.

{{<highlight java>}}
var donations = new HashMap<String, Integer>();

var ym = split[4].substring(0, 6);
if (!donations.containsKey(ym)) {
    donations.put(ym, 0);
} else {
    donations.put(ym, donations.get(ym) + 1);
}
{{</highlight>}}

Getting first names is a little more work. Looking though the file though it turns out that the names are formatted fairly well. The obvious answer to this problem is use a regular expression... which means now you have two problems. My preference is to avoid regular expressions generally where possible because they can be slow and a pain to debug. Because the names were formatted I decided to iterate the characters till we hit the first space. Then whatever follows is the name till we hit another space.

Not the prettiest code, but it should be fast enough to not have to worry about it being a major bottleneck.

{{<highlight java>}}
var firstNames = new ArrayList<String>();

var inName = false;
var sb = new StringBuilder();

// To get the first name loop to the first space, then keep going till the end or the next space
for (var x : split[7].toCharArray()) {
    if (x == ' ') {
        if (inName) {
            break;
        }
        inName = true;
    } else {
        if (inName) {
            sb.append(x);
        }
    }
}
firstNames.add(sb.toString());
{{</highlight>}}

The last thing to implement is the most common first name. While the other checks can happen inside the core loop itself this one can only be run after processing. In the interests of keeping it simple I elected to use parallel streamps after all the names are collected rather than implement while processing. It still requires a single loop over the aggregations.

{{<highlight java>}}
var count = firstNames.parallelStream().collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

var bestCount = 0L;
var bestName = "";
for (var key : count.keySet()) {
    if (count.get(key) > bestCount) {
        bestCount = count.get(key);
        bestName = key;
    }
}
{{</highlight>}}

With that implemented a quick test to see how much this has impacted the performance.

```
$ time java FileProcess > /dev/null
java FileProcess > /dev/null  99.38s user 15.53s system 245% cpu 46.893 total
```

Ouch. Quite a lot. It makes sense though because we added processing of the lines, rather than just reading them. With the file consisting of 21,627,188 lines it means its taking 0.00000212695 seconds to process each line which is about 2100 nanoseconds. 

Using Go, what would happen is to pump those lines into a channel and process them using some Go routines. As mentioned we can do the same in Java using a Queue and some threads. To begin with though I thought it would be worthwhile to try with one thread processing a queue just to see if we get any gains.

For the queue I picked the obvious ArrayBlockingQueue. The thing about Java when doing this is that you need to have a poison value which you put onto the queue when finished to let the threads know to finish processing. Since I was using strings I just chose the string `quit` to achieve this. I then put the line processing into a runnable task lambda and was ready to try processing.

With the task configured and running the loop becomes like the below,

{{<highlight java>}}
processor.start();
try (BufferedReader b = Files.newBufferedReader(Path.of("itcont.txt"))) {
    var readLine = "";
    while ((readLine = b.readLine()) != null) {
        lineCount++;
        queue.offer(readLine);
    }
    queue.offer(poison);
}
processor.join();
{{</highlight>}}

I than ran the above to see what gain if any was delivered.

```
$ time java FileThreadProcess > /dev/null
java FileThreadProcess > /dev/null  48.36s user 16.91s system 346% cpu 18.862 total
```

A massive improvement over the single threaded process. However its still slower than the time to read from disk without doing any processing.

With the above reading of the file should be only blocked by how quickly the background thread can process the queue. One way to check this is by printing out the queue length every now and then by adding a modulus check of the lineCount and a println.

{{<highlight java>}}
if (lineCount % 100000 == 0) {
    System.out.println(queue.size());
}
{{</highlight>}}

The result of which showed the following,

```
974
987
984
992
960
885
996
```

Suggesting that the single thread was unable to keep up with the reading off disk. A reasonable guess at this point would be to spawn another thread. Doing so is faily trivial with some copy paste, but we also need to make all of the shared data structures thread safe. 

{{<highlight java>}}
var names = Collections.synchronizedList(new ArrayList<String>());
var firstNames = Collections.synchronizedList(new ArrayList<String>());
var donations = Collections.synchronizedMap(new HashMap<String, Integer>());
{{</highlight>}}

With that done I added another thread and ran the process and got the following output.

```
96
0
4
0
11
12
1
```

Which suggests that 2 threads processing the queue is enough to keep up with the disk. Now to try it out,

```
$ time java FileThreadsProcess > /dev/null
java FileThreadsProcess > /dev/null  69.20s user 29.03s system 329% cpu 29.842 total
```

What the? Thats about twice as slow as the version which had a single thread processing the queue! The queue is being emptied faster which shouldn't block the reader but somehow its slower? That does not appear to make sense.

My guess would be that either the Queue we are using is not very efficient or we are asking it to do too much. Lets look at a profile and see where the time is actually being spent before acting on that guess though. Thankfully I have YourKit profiler for Java (which I quite like) and took a profile of the process.

![Profile](/static/file-read-challange/profile.jpg)

Looking at that suggests that the `ArrayBlockingQueue` is actually taking up a huge amount of time. Since we already know that the two threads can keep up with the file read (on this machine) I decided to swap it out for a `LinkedTransferQueue` which is not bounded but should be faster to prove the theory.

```
$ time java FileThreadsProcess > /dev/null
java FileThreadsProcess > /dev/null  66.50s user 23.95s system 419% cpu 21.563 total
```

The runtime dropped by almost 1/3 which proves that indeed the queue is now the bottleneck. At this point we have two options. The first is to find a faster queue implementation, and the second is to be more effective with how we use the queue. Since I wanted to stick to the native libraries I decided to be more effective with the queue.



// INVESTIGATE THREAD SPAWNING COST HERE

Remember how I said I ran the Go soluttion which Marcel claimed to be optimal? What if it was actually at a local optimum? From my investigation with [scc](https://boyter.org/posts/sloc-cloc-code/) I know that for large files memory maps can be a far more efficient way to process files.

```
$ time ./go-solution itcont.txt > /dev/null
./go-solution itcont.txt > /dev/null  14.14s user 6.52s system 222% cpu 9.296 total
```

So given the above runtime is that actually optimal? Lets try using `wc` and `ripgrep` over the file to see how fast they can process the file.

Asking `wc` to just count newlines should allow it to go about as fast as possible, and if we get ripgrep to invert match over everything it will match nothing but read the whole file. I know for a fact that for a single large file ripgrep will flip to memory maps, and I threw `wc` in there because I assume it would do the same.

```
$ hyperfine -i 'rg -v . itcont.txt' 'wc -l itcont.txt'
Benchmark #1: rg -v . itcont.txt
  Time (mean ± σ):      2.592 s ±  0.046 s    [User: 1.375 s, System: 1.216 s]
  Range (min … max):    2.560 s …  2.624 s

Benchmark #2: wc -l itcont.txt
  Time (mean ± σ):      2.679 s ±  0.141 s    [User: 413.8 ms, System: 2262.7 ms]
  Range (min … max):    2.579 s …  2.778 s
```

Looks like its actually possible to process the file in ~2.6 seconds on my laptop and indeed Marcel hit a local optimum.

Time to learn how to memory map a file in Java.

https://howtodoinjava.com/java7/nio/memory-mapped-files-mappedbytebuffer/