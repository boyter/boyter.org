---
title: Code Spelunker a Code Search Command Line Tool
date: 2050-03-10
---

Code Spelunker (cs) or code search is a new command line tool I have been working on and off over the last few months. The idea came about while watching a work colleague continually opening Visual Studio Code in order to search over files recursively in a directory. I asked why he didn't use a tool like ripgrep with the context flag to which he replied that he liked the interactivity the UI gave him. Having wanted to work on a terminal UI application for a while, also being interested in code search and having always wanted to build a real search ranking algorithm it seemed like a overlap of goals to try and build a tool just for him.

Rather than bore you with details of how it works lets start by showing off the party trick. You can read the details about if you like after the download link.

You can get something close to this idea without using `cs` by piping the results of ripgrep into fzf `rg test | fzf` although I think `cs` does offer enough over this technique to justify installing yet another command line tool.

Not just a one trick pony however cs can also serve up a crude but functional HTTP search interface. Yes you can swap out the templates for your own if you like and build whatever custom interface you want.

https://github.com/boyter/cs

I assume if you are still reading beyond this you are interested in how things came about. Otherwise the link above is all you need to get started.

John Harrison https://en.wikipedia.org/wiki/John_Harrison was a clockmaker who solved the problem of calculating longitude while at sea using accurate timekeeping devices. To do so he ended up changing course after 30 years of experimentation using large sea clocks and starting again with a "sea watch" of a much smaller design. In short he threw away what could be considered a lifetime of work for something better when he saw it.

I bring this up because I have spent the last 8 years or so working on searchcode.com and searchcodeserver.com and after rethinking the problem I am about to do something similar, but with far less material impact.

Lets discuss code search. There are a few main methods in practice today to do it. The first is to use regular expressions. Tools such as ripgrep, the silver searcher and ack work like this. You feed them either string literals or regular expressions and they will skip though files looking for matches. In the case of ripgrep it does this insanely quickly due to some very neat optimization tricks.

Another method is to build an index based on index tools like lucene which were originally written for full-text search. The original koders.com worked like this. My website searchcode.com and searchcodeserver.com also used this technique although they both put a lot of work into breaking code tokens apart such that a search for `i++` would match `for(i=0;i<100;i++)` to ensure the search experience works as expected. I believe that the engines behind github search and bitbucket also use this a keyword index, but without the token parsing searchcode.com implements hence a search for `i++` on either of them will produce no results. I never got to use it but I think the YC company metacode.com does something similar. Indecently lucene does support some regular expression searches (I think through literal extraction, but I have not found time to review its code) so it can work similar to the regular expression tools at a larger scale.

There is a hybrid between the regular expression tools and the index ones where you build a trie index. This is how google code search worked back in the day and allows you to bridge the gap and allow your regex search to scale. However unlike lucene this index is optimized for regular expressions, by taking a good guess as to what results would match, and then knowing which files to actually search. 

The last method I can comment on is the one used in sourcegraph. It is a bit smarter than the others by actually trying to understand the source code. This means it knows what a function is, and how it relates to the rest of the codebase allowing links between files. This too relies on an index, but last time I checked under the hood its a custom one. It is also more expensive to calculate and as such more expensive to scale. This is similar to how ctags works, although it operates at a larger scale.

I have heard of some companies using machine learning to understand code but this is really out of my depth of understanding and I cannot thing of a public example available yet. I expect this to change in time however.

Each of the above techniques has pros and cons depending on what you are trying to do.

Regular expressions generally does not scale to very large corpus's (tens of gigabytes), unless you go the hybrid route with an index to maintain and they do not rank results, although in theory they could. They also have difficulty doing boolean style searches. Index based searches scale quite well, rank results and support boolean searches but you have an index to maintain and are a huge overhead for small codebases (although still work). They also don't search code very well without special attention. The sourcegraph approach works well, but you need to learn a special search syntax to get the most from it.

I believe this leaves a small space for a boolean search tool with ranking that "brute forces" its searches similar to the regular expression tools work. I also believe that this technique can work in other situations, such as for research purposes. I also think that given the HTTP interface that `cs` can be a replacement for a lot of the heavier tools such as searchcodeserver.com without the need to stand-up much infrastructure and wait for it to build its index.


### Snippet Extraction


The extraction of snippets from some text is one of those problems I naively assumed would be fairly simple. I did have a reason to assume this however as I had previously written about building one in PHP https://boyter.org/2013/04/building-a-search-result-extract-generator-in-php/ which was based on an even older stackoverflow answer. I mostly copied the techniques used in an even older PHP project called Sphider.

Well blow me down. Turns out this small chunk of code I wrote in anger was picked up by a bunch of PHP projects https://github.com/msaari/relevanssi/blob/master/lib/excerpts-highlights.php https://github.com/bolt/bolt/blob/master/src/Helpers/Excerpt.php and https://github.com/Flowpack/Flowpack.SimpleSearch/blob/master/Classes/Search/MysqlQueryBuilder.php

What's interesting to me about this is that Relevanssi (a wordpress plugin) which improves your search results has over 100,000 installs. Which means it is probably the most successful code I have ever written in terms of use. Also interesting is that it is written in PHP. I have almost never been paid to write PHP. Certainly my professional PHP code days can be counted on both hands. I wonder if thats something I should put on my resume?

So given I had some code that apparently was working all over the place I ported it to Go to see how it would perform. For small snippets it continued to work reasonably well giving reasonable results. For multiple terms, especially those spread out in large files it was not producing the results I wanted.

Annoyingly snippet extraction is a "fuzzy code" problem, with no obvious 100% correct solution you can work towards. What is most relevant to my search might not be what you expected. It also means that coming up with some test cases is problematic, as the moment you solve one you might break another. In any case I decided that my test case for snippet extraction would be based on Jane Austen's Pride and Prejudice which I admit to knowing more about than I probably should. One of the main test cases I wanted to work was a search for `ten thousand a year` with or without quotes to return one of two snippets. Either

> features, noble mien, and the report which was in general circulation within five minutes after his entrance, of his having *ten thousand a year*. The gentlemen pronounced him to be a fine

or

> it. Dear, dear Lizzy. A house in town! Every thing that is charming! Three daughters married! *Ten thousand a year*! Oh, Lord! What will become of me. I shall go distracted.”

For this case either is an acceptable answer for me, and I can live with a word or two being included or excluded on the edge. Although in an ideal world I would prefer it to be case sensitive when ranking them and produce the first result as a slight preference over the second. At this point I started searching around to find out what existing research was out there regarding snippet extraction and see and how this problem had already been solved.

Here is a collection of links I found relevant to this specific problem, and a cached version as PDF's just in case there is some link rot and you cannot get that document you want.

 - https://www.hathitrust.org/blogs/large-scale-search/practical-relevance-ranking-11-million-books-part-3-document-length-normali [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/Practical Relevance Ranking for 11 Million Books, Part 3_ Docum... _ HathiTrust Digital Library.pdf)
 - https://github.com/apache/lucene-solr/blob/master/lucene/highlighter/src/java/org/apache/lucene/search/uhighlight/UnifiedHighlighter.java [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/lucene-solr_UnifiedHighlighter.java at master · apache_lucene-solr.pdf)
 - https://lucene.apache.org/core/7_0_0/highlighter/org/apache/lucene/search/vectorhighlight/package-summary.html [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/org.apache.lucene.search.vectorhighlight Lucene 7.0.0 API.pdf)
 - https://www.compose.com/articles/how-scoring-works-in-elasticsearch/ [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/How scoring works in Elasticsearch - Compose Articles.pdf)
 - https://blog.softwaremill.com/6-not-so-obvious-things-about-elasticsearch-422491494aa4 [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/6 not so obvious things about Elasticsearch - SoftwareMill Tech Blog.pdf)
 - https://github.com/elastic/elasticsearch/blob/master/docs/reference/search/request/highlighting.asciidoc#unified-highlighter [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/elasticsearch_highlighting.asciidoc at master · elastic_elasticsearch)
 - https://www.elastic.co/guide/en/elasticsearch/reference/6.8/search-request-highlighting.html#unified-highlighter [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/Highlighting _ Elasticsearch Reference [6.8] _ Elastic.pdf)
 - http://www.public.asu.edu/~candan/papers/wi07.pdf [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/wi07.pdf)
 - https://faculty.ist.psu.edu/jessieli/Publications/WWW10-ZLi-KeywordExtract.pdf [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/WWW10-ZLi-KeywordExtract.pdf)
 - https://www.researchgate.net/publication/221299008_Fast_generation_of_result_snippets_in_web_search [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/Fast_generation_of_result_snippets_in_web_search.pdf)
 - https://arxiv.org/pdf/1904.03061.pdf [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/1904.03061.pdf)
 - https://web.archive.org/web/20141230232527/http://rcrezende.blogspot.com/2010/08/smallest-relevant-text-snippet-for.html [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/RCRezende Blog_ The smallest relevant text snippet for search results.pdf)
 - https://stackoverflow.com/questions/282002/c-sharp-finding-relevant-document-snippets-for-search-result-display [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/algorithm - C# Finding relevant document snippets for search result display - Stack Overflow.pdf)
 - https://stackoverflow.com/questions/2829303/given-a-document-select-a-relevant-snippet [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/statistics - Given a document, select a relevant snippet - Stack Overflow.pdf)
 - https://www.forrestthewoods.com/blog/reverse_engineering_sublime_texts_fuzzy_match/ [[pdf]](/static/code-spelunker-a-code-search-command-line-tool/snippet/Reverse Engineering Sublime Text’s Fuzzy Match - ForrestTheWoods.pdf)

My constant need to look through the PDF's for portions of text resulted in me adding some PDF support in `cs` which will be covered later.

Of all the above the most promising to turned out to be the information I found on rcrezende.blogspot.com and the source code of Lucene. Given the ideas inside both them I implemented an algorithm based on what they had fused with the scoring techniques of the reverse engineered sublime text fuzzy matching.

The reason for this is that most of the algorithms were dealing with search results for web results, where as these implementations seemed to be the best. As such I ended up writing a new custom snippet extractor. In fact I actually wrote a simple one, and then the one that is in `cs` now hence it has the name version 3 in the source code.

The algorithm is fairly well documented so for those interested please look at the source code https://github.com/boyter/cs/blob/master/processor/snippet.go which is reasonably well documented. In short though it looks though the previously identified locations using a sliding window style algorithm where if finds bounding matches within the same window and then ranks based on term frequency and a few other factors.

### Fast Unicode Literal Matching in Go

There is one obvious way in all programming languages to support a search case-insensitive search across a string. It also happens to be wrong.

The below is a pseudocode example of how most would implement this.

{{<highlight java>}}
locations = haystack.ToLower().IndexLocations(needle.ToLower())
{{</highlight>}}

The problem with the above is firstly it is not unicode aware. Without going into another you should know unicode rant (there are already enough of these on the web) it means that the following needle *ſecret* will not match *secret* which according to case folding rules it should.

Lets assume however that you don't really care about unicode, which might be fine for your use case. An decent search engine should highlight the matching results. So you lower your needle and haystack, find the locations then highlight against those locations...

Except that this does not work. Consider the following characters `Ⱥ` and `Ⱦ`. They have a lower case variant of `ⱥ` and `ⱦ` respectively. However as it turns out the number of bytes for each is different, with the upper case version taking 2 bytes and the lower taking 3. So if you use the locations, your highlight logic can be out by a single byte causing display corruption.

Here is a Go program which illustrates the difference in byte sizes.

{{<highlight go>}}
package main

import (
	"fmt"
	"strings"
)

func main() {
	fmt.Println("Ⱥ", strings.ToLower("Ⱥ"), len("Ⱥ"), len(strings.ToLower("Ⱥ")))
	fmt.Println("Ⱦ", strings.ToLower("Ⱦ"), len("Ⱦ"), len(strings.ToLower("Ⱦ")))
}
{{</highlight>}}


This raises the question how do you match like this? You need to match insensitive so you can highlight correctly. In Go the answer would be to use regular expressions. The regex engine inside Go is unicode aware so problem solved?

Not quite. The Go regular expression engine for case insensitive matching can be quite slow. How slow you say? 

Below I have compared to what I ended up using in `cs`. It is a simple program that accepts two arguments. The first is your search term and the second the file. It then searches using Go's regex FindAllIndex as a case sensitive match. Then by comparison a IndexAll function I wrote which produces the same results but does not touch the regular expression engine. The second test uses the same regex FindAllIndex in a case insensitive search which is unicode aware and my custom method which does the same. Note that both custom methods are for literals only and do not support any regular expression operations.

The corpus being searched against is a collection of public domain books and about 37MB in size.

```
$ csperf Thousand big
File length 38364464

FindAllIndex (regex)
Scan took 7.1598ms 24
Scan took 6.2284ms 24
Scan took 7.1117ms 24

IndexAll (custom)
Scan took 4.2791ms 24
Scan took 3.9843ms 24
Scan took 5.3969ms 24

FindAllIndex (regex ignore case)
Scan took 1.33954s 1844
Scan took 1.3204729s 1844
Scan took 1.3228974s 1844

IndexAllIgnoreCaseUnicode (custom)
Scan took 168.3433ms 1844
Scan took 173.8096ms 1844
Scan took 162.0942ms 1844
```

For the case sensitive match my custom method is generally slightly faster for most searches. Not by a huge amount but for enough checks this can add up. For the insensitive match however the custom method blows the regular expression match out of the water generally taking 10% of the wall clock time to run for the same search while producing the same results.

How does it achieve this? Well it copies a technique used by ripgrep and its regular expression engine. 

What happens is that it takes the first 3 characters at the start of the needle. It then enumerates all unicode aware case possibilities of that string. It then searches for each of those strings inside the haystack. When it finds a partial match it then pulls in more of the haystack and checks if its an actual match. If it is, it records the positions and moves on. As such it spends no time in the regular expression engine, and as a result is acceptable fast, as the simple test case above shows. The result is that for string literal matches which is what `cs` does most of the time it is able to not only do unicode aware searches, but do them quickly.

Note that while it does do unicode aware matches, it only does it based on simple case folding rules. Incidentally I ended up talking to a work colleague about this who is from Denmark. 