---
title: Running the Numbers
author: Ben E. Boyter
type: post
date: 2012-05-29T23:53:54+00:00
url: /2012/05/running-the-numbers/
categories:
  - searchcode

---
So I have rolled out quite a few performance improvements. searchcode is MUCH MUCH faster then it was before. I also added some various improvements across the board in terms of relevance. This included indexing characters like !@#$%^&*()-= etc&#8230; So now things like the perl regex match [=~][1] is now a valid search term. Of course you can combine terms and normal characters to get really complex search terms such as [$localdate =~ /([0-9]+):([0-9]+):([0-9]+)/;][2] Pretty awesome stuff I think.

I also setup a ripoff of [blekko's 3 card monte][3] which you can view here [searchcode compare to koders][4] which compares searchcode's results to koders (the current leader). I have already started acting on the results in this. For example I have removed html, xml and json results from the main index. You can still search for them using lang or extension syntax EG [lang:html <html>][5] but for standard searches such as [<html>][6] you will get more code results. The next thing on my list is to remove "compressed" results such as minified JavaScript and the like which should really clean the results up.

Finally a few days ago I was watching some show from the UK about brands, and in particular technology brands. One of the bits had Larry Page (of Google fame) talking about how if you printed the information Google has how tall it would be and that they can search it instantly and return the answer you want.

Naturally I had to work this out for myself on my own index. I made a few assumptions and came up with the following.

searchcode has about 2.7 billion lines of code indexed. Assuming the average A4 piece of paper holds about 32 lines you get 86 million pages to hold the printed index. Note im ignoring lines longer then 80 characters, lets assume the paper has infinite width. Assuming a piece of paper is about 0.1mm thick we can work ouy that if we stacked out paper in a pile we would have a pile 8,600 m in height. For comparison Mount Everest is about 8,800 meters in height, and the height of our imaginary pile is almost within a stones throw of the top and certainly well in the [death zone][7]!

 [1]: http://searchco.de/?q=%3D~&cs=on
 [2]: http://searchco.de/?q=%24localdate+%3D~+%2F%28%5B0-9%5D%2B%29%3A%28%5B0-9%5D%2B%29%3A%28%5B0-9%5D%2B%29%2F%3B&cs=on
 [3]: http://blekko.com/ws/+/monte
 [4]: http://searchco.de/compare/
 [5]: http://searchco.de/?q=lang%3Ahtml+%3Chtml%3E&cs=on
 [6]: http://searchco.de/?q=%3Chtml%3E&cs=on
 [7]: http://en.wikipedia.org/wiki/Effects_of_high_altitude_on_humans