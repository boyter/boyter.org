---
title: Issues with Google’s Bug Prediction Algorithm
author: Ben E. Boyter
type: post
date: 2015-07-08T07:58:57+00:00
url: /2015/07/issues-googles-bug-prediction-algorithm/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Testing

---
December 2011 the Google Engineering team published a blog post about [bug prediction at Google][1]. The topic caused quite a lot of discussion at the time over the internet on forums such as Hacker News and the Reddit programming sub-reddit.

How bug prediction works

In a nutshell the prediction works by ranking files against checking the file commit history and seeing how many changes have been flagged as bug fixes. Of course this means that code which was previously buggy will still appear in the list. This issue was also addressed in the post and the results were weighted over time to deal with this issue.

Issues with bug prediction

Since that time the topic has been reposted a few times and we have since discovered that the system has been discontinued at Google. Thankfully the author of the original post was able to respond and has given one of the [main reasons why it was discontinued][2].

> TL;DR is that developers just didn&#8217;t find it useful. Sometimes they knew the code was a hot spot, sometimes they didn&#8217;t. But knowing that the code was a hot spot didn&#8217;t provide them with any means of effecting change for the better. Imagine a compiler that just said &#8220;Hey, I think this code you just wrote is probably buggy&#8221; but then didn&#8217;t tell you where, and even if you knew and fixed it, would still say it due to the fact it was maybe buggy recently. That&#8217;s what TWR essentially does. That became understandably frustrating, and we have many other signals that developers can act on (e.g. FindBugs), and we risked drowning out those useful signals with this one.
> 
> Some teams did find it useful for getting individual team reports so they could focus on places for refactoring efforts, but from a global perspective, it just seemed to frustrate, so it was turned down.
> 
> From an academic perspective, I consider the paper one of my most impactful contributions, because it highlights to the bug prediction community some harsh realities that need to be overcome for bug prediction to be useful to humans. So I think the whole project was quite successful&#8230; Note that the Rahman algorithm that TWR was based on did pretty well in developer reviews at finding bad code, so it&#8217;s possible it could be used for automated tools effectively, e.g. test case prioritization so you can find failures earlier in the test suite. I think automated uses are probably the most fruitful area for bug prediction efforts to focus on in the near-to-mid future.

Another paper released which analyses the results of the Google bug predictor can be found [Does Bug Prediction Support Human Developers? Findings From a Google Case Study (PDF)][3].

Another interesting thought is that the system requires a reasonably amount of code comment discipline. Some people and teams use bug fix commit&#8217;s to resolve feature requests. The result is that this system would mark actively developed code as being a bug hot spot. In this case being a poorly organised team or individual would not see their code appear. This is especially problematic where performance is being measured against these sort of metrics.

If you are interested in trying this yourself there are some open source implementations of the algorithms presented in the Google Paper. See [bugspots in github][4] as an example of one which will work against any git repository.

 [1]: http://google-engtools.blogspot.com.au/2011/12/bug-prediction-at-google.html
 [2]: http://www.cflewis.com/publications/google.pdf?attredirects=0
 [3]: https://static.googleusercontent.com/media/research.google.com/en/us/pubs/archive/41145.pdf
 [4]: https://github.com/igrigorik/bugspots