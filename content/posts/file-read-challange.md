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