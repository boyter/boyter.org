---
title: 'Rants & Raves'
author: Ben E. Boyter
type: page
date: 2013-08-28T01:35:23+00:00
draft: true
private: true

---
<span style="font-size: small;"><b>Rants & Raves</b></span>
  
_by [Matt Wells][1]_

<a name="seobots"></a> <span style="font-size: xx-small;"><b>Random Notes</b></span>
  
_Feb 16, 2004_

Alright you SEO people. Get your bots off my search results. There are way too many of you blatantly disregarding my robots.txt and sucking my resources dry. In response I had to implement some barring measures. I would really, rather not waste my time programming ways to stop your bots. Please stop now. If I find out who you are I may ban your sites and the sites you represent.

Secondly, after reading a couple of complaints, I&#8217;ve added a search box at the bottom of the search results. This should improve the search experience.

Also, I&#8217;ve rolled stage one of the default AND code. Default AND searches now require about a quarter of the CPU time default OR searches do. But, currently, when you search on Gigablast.com it is still default OR, so you will not see this speed up. Right now it is mainly for my search feed clients. There are still a great deal many resource-saving tweaks that will be done to improve the default AND search time.

Finally, in between other projects and setting up a 4 billion page index, I am going to be working on what I consider the next step in the evolution of internet search. It is very complicated but my brain is telling me it is possible, so I&#8217;ll be heading in that direction and will hopefully give the internet community something truly original (as far as I know). Wish me luck!

<a name="gigabits"></a> <span style="font-size: xx-small;"><b>Giga Bits Introduced</b></span>
  
_Jan 31, 2004_

Gigablast now generates related concepts for your query. I call them Giga Bits. I believe it is the best concept generator in the industry, but if you don&#8217;t think so please [drop me a note][2] explaining why not, so I can improve it.

You can also ask Gigablast a simple question like [&#8220;Who is President of Russia?&#8221;][3] and it often comes up with the correct answer in the Giga Bits section. How do you think it does that?

In other news, the spider speed ups I rolled a few weeks ago are tremendously successful. I can easily burn all my bandwidth quota with insignificant load on my servers. I could not be happier with this.

Now I&#8217;m planning on turning Gigablast into a default AND engine. Why? Because it will decrease query latency by several times, believe or not. That should put Gigablast on par with the fastest engines in the world, even though it only runs on 8 desktop machines. But Don&#8217;t worry, I will still leave the default OR functionality intact.

<a name="update"></a> <span style="font-size: xx-small;"><b>January Update Rolled</b></span>
  
_Jan 8, 2004_

Gigablast now has a more professional, but still recognizable, logo, and a new catch phrase, &#8220;Information Acceleration&#8221;. Lots of changes on the back end. You should notice significantly higher quality searches. The spider algorithm was sped up several times. Gigablast should be able to index several million documents per day, but that still remains to be tested. <knock on wood>. Site clustering was sped up. I added the ability to force all query terms to be required by using the &rat=1 cgi parm. Now Gigablast will automatically regenerate some of its databases when they are missing. And I think I wasted two weeks working like a dog on code that I&#8217;m not going to end up using! I hate when that happens&#8230;

<a name="traffic"></a> <span style="font-size: xx-small;"><b>An Easy way to Slash Motor Vehicle Emissions</b></span>
  
_Dec 11, 2003_

Blanket the whole city with wi-fi access. (like [Cerritos, California][4]) When you want to travel from point A to point B, tell the central traffic computer. It will then give you a time window in which to begin your voyage and, most importantly, it will ensure that as long as you stay within the window you will always hit green lights.

If you stray from your path, you&#8217;ll be able to get a new window via the wi-fi network. If everyone&#8217;s car has gps and is connected to the wi-fi network, the central computer will also be able to monitor the flow of traffic and make adjustments to your itinerary in real-time. Essentially, the traffic computer will be solving a large system of linear, and possibly non-linear, constraints in real-time. Lots of fun&#8230; and think of how much more efficient travel will be!! If someone wants to secure funding, count me in.

<a name="spellchecker"></a> <span style="font-size: xx-small;"><b>Spellchecker Finally Finished</b></span>
  
_Nov 18, 2003_

After a large, countable number of interruptions, I&#8217;ve finally completed the spellchecker. I tested the word &#8216;**dooty**&#8216; on several search engines to see how they handled that misspelling. Here&#8217;s what I got:

<table>
  <tr>
    <td>
      <b>Source</b>
    </td>
    
    <td>
      <b>Result</b>
    </td>
  </tr>
  
  <tr>
    <td>
      Alltheweb
    </td>
    
    <td>
      <a href="http://www.alltheweb.com/search?query=dooty">booty</a>
    </td>
    
    <td>
    </td>
  </tr>
  
  <tr>
    <td>
      Altavista
    </td>
    
    <td>
      <a href="http://search01.altavista.com/web/results?q=dooty">dhooti</a>
    </td>
  </tr>
  
  <tr>
    <td>
      Gigablast
    </td>
    
    <td>
      <a href="http://www.gigablast.com/search?q=dooty">door</a>
    </td>
  </tr>
  
  <tr>
    <td>
      Google
    </td>
    
    <td>
      <a href="http://www.google.com/search?q=dooty">doody</a>
    </td>
  </tr>
  
  <tr>
    <td>
      Microsoft Word
    </td>
    
    <td>
      Doty
    </td>
  </tr>
  
  <tr>
    <td>
      Teoma
    </td>
    
    <td>
      <a href="http://s.teoma.com/search?q=dooty">doty</a>
    </td>
  </tr>
  
  <tr>
    <td>
      Wisenut
    </td>
    
    <td>
      N/A (no spellchecker)
    </td>
  </tr>
</table>

So there is no one way to code a spellchecker. It&#8217;s a guessing game. And, hey Wisenut, want to license a good spellchecker for cheap? [Let me know][2].

Gigablast uses its cached web pages to generate its dictionary instead of the query logs. When a word or phrase is not found in the the dictionary, Gigablast replaces it with the closest match in the dictionary. If multiple words or phrases are equally close, then Gigablast resorts to a popularity ranking.

One interesting thing I noticed is that in Google&#8217;s spellchecker you must at least get the first letter of the word correct, otherwise, Google will not be able to recommend the correct spelling. I made Gigablast this way too, because it really cuts down on the number of words it has to search to come up with a recommendation. This also allows you to have an extremely large dictionary distributed amongst several machines, where each machine is responsible for a letter.

Also of note: I am planning on purchasing the hardware required for achieving a 5 billion document index capable of serving hundreds of queries per second within the next 12 months. Wish me luck&#8230; and thanks for using Gigablast.

<a name="onagain"></a> <span style="font-size: xx-small;"><b>Spiders On Again</b></span>
  
_Nov 10, 2003_

After updating the spider code I&#8217;ve reactivated the spiders. Gigablast should be able to spider at a faster rate with even less impact on query response time than before. So add your urls now while the addings good.

<a name="speed"></a> <span style="font-size: xx-small;"><b>Going For Speed</b></span>
  
_Nov 3, 2003_

I&#8217;ve finally got around to working on Gigablast&#8217;s distributed caches. It was not doing a lot of caching before. The new cache class I rigged up has no memory fragmentation and minimal record overhead. It is vurhy nice.

I&#8217;ve stopped spidering just for a bit so I can dedicate all Gigablast&#8217;s RAM to the multi-level cache system I have in place now and see how much I can reduce query latency. Disks are still my main point of contention by far so the caching helps out a lot. But I could still use more memory.

Take Gigablast for a [spin][5]. See how fast it is.

<a name="metas"></a> <span style="font-size: xx-small;"><b>Bring Me Your Meta Tags</b></span>
  
_Oct 11, 2003_

As of now Gigablast supports the indexing, searching and displaying of generic meta tags. You name them I fame them. For instance, if you have a tag like _<meta name=&#8221;foo&#8221; content=&#8221;bar baz&#8221;>_ in your document, then you will be able to do a search like _[foo:bar][6]_ or _[foo:&#8221;bar baz&#8221;][7]_ and Gigablast will find your document.

You can tell Gigablast to display the contents of arbitrary meta tags in the search results, like [this][8]. Note that you must assign the _dt_ cgi parameter to a space-separated list of the names of the meta tags you want to display. You can limit the number of returned characters of each tag to X characters by appending a _:X_ to the name of the meta tag supplied to the _dt_ parameter. In the link above, I limited the displayed keywords to 32 characters.

Why use generic metas? Because it is very powerful. It allows you to embed custom data in your documents, search for it and retrieve it. Originally I wanted to do something like this in XML, but now my gut instincts are that XML is not catching on because it is ugly and bloated. Meta tags are pretty and slick.

<a name="verisignstopped"></a> <span style="font-size: xx-small;"><b>Verisign Stops Destroying the Internet</b></span>
  
_Oct 11, 2003_

Ok, they actually stopped about a week ago, but I didn&#8217;t get around to posting it until now. They really ought to lose their privileged position so this does not happen again. Please do not stop your boycott. They have not learned from their mistakes.

<a name="moreverisign"></a> <span style="font-size: xx-small;"><b>Verisign Continues to Damage Gigablast&#8217;s Index</b></span>
  
_September 30, 2003_

When the Gigablast spider tries to download a page from a domain it first gets the associated robots.txt file for that domain. When the domain does not exist it ends up downloading a robots.txt file from verisign. There are two major problems with this. The first is that verisign&#8217;s servers may be slow which will slow down Gigablast&#8217;s indexing. Secondly, and this has been happening for a while now, Gigablast will still index any incoming link text for that domain, thinking that the domain still exists, but just that spider permission was denied by the robots.txt file.

So, hats off to you verisign, thanks for enhancing my index with your fantastic &#8220;service&#8221;. I hope your company is around for many years so you can continue providing me with your great &#8220;services&#8221;.

If you have been hurt because of verisign&#8217;s greed you might want to consider joining the [class-action lawsuit][9] announced Friday, September 26th, by the [Ira Rothken law firm][10].

Want to learn more about how the internet is run? Check out [the ICANN movie page][11]. Movie #1 portrays verisign&#8217;s CEO, Stratton Sclavos, quite well in my opinion.

**(10/01/03) Update #5:** verisign [comes under further scrutiny][12].

<a name="verisign"></a> <span style="font-size: xx-small;"><b>Verisign Redesigns the Internet for their Own Profit</b></span>
  
_September 24, 2003_

My spiders expect to get &#8220;not found&#8221; messages when they look up a domain that does not have an IP. When verisign uses their privledged position to change the underlying fundamentals of the internet just to line their own greedy pockets it really, really perturbs me. Now, rather than get the &#8220;not found&#8221; message, my spiders get back a valid IP, the IP of verisign&#8217;s commercial servers. That causes my spiders to then proceed to download the robots.txt from that domain. This can take forever if their servers are slow. What a pain. Now I have to fix my freakin&#8217; code. And that&#8217;s just one of many problems this company has caused.

Please join me in boycott. I&#8217;m going to discourage everyone I know from supporting this abusive, monopolistic entity.

**(9/22/03) Update #1:** verisign [responded][13] to ICANN&#8217;s request that they stop. [See what the slashdot community has to say about this response.][14]

**(9/22/03) Update #2:** ICANN has now posted some complaints in this [forum][15].

**(9/24/03) Update #3:** Slashdot has more [coverage][16].

**(9/24/03) Update #4:** Please sign the [petition][17] to stop verisign.

<a name="geotags"></a> <span style="font-size: xx-small;"><b>Geo-Sensitive Search</b></span>
  
_September 18, 2003_

Gigablast now supports some special new meta tags that allow for constraining a search to a particular zipcode, city, state or country. Support was also added for the standard author, language and classification meta tags. This [page][18] explains more. These meta tags should be standard, everyone should use them (but not abuse them!) and things will be easier for everybody.

Secondly, I have declared jihad against stale indexes. I am planning a significantly faster update cycle, not to mention growing the index to about 400 million pages, all hopefully in the next few months.

<a name="turing"></a> <span style="font-size: xx-small;"><b>Foiling the Addurl Scripts</b></span>
  
_September 6, 2003_

The new pseudo-Turing test on the [addurl page][19] should prevent most automated scripts from submitting boatloads of URLs. If someone actually takes the time to code a way around it then I&#8217;ll just have to take it a step further. I would rather work on other things, though, so please quit abusing my free service and discontinue your scripts. Thanks.

<a name="boolean"></a> <span style="font-size: xx-small;"><b>Boolean is Here</b></span>
  
_September 1, 2003_

I just rolled out the new boolean logic code. You should be able to do nested boolean queries using the traditional AND, OR and NOT boolean operators. See the updated [help page][20] for more detail.

I have declared jihad against swapping and am now running the 2.4.21-rc6-rmap15j Linux kernel with swap tuned to zero using the /proc/sys/vm/pagecache knobs. So far no machines have swapped, which is great, but I&#8217;m unsure of this kernel&#8217;s stability.

<a name="swap"></a> <span style="font-size: xx-small;"><b>All Swapped Out</b></span>
  
_August 29, 2003_

I no longer recommend turning the swap off, at least not on linux 2.4.22. A kernel panicked on me and froze a server. Not good. If anyone has any ideas for how I can prevent my app from being swapped out, please let me know. I&#8217;ve tried mlockall() within my app but that makes its memory usage explode for some reason. I&#8217;ve also tried Rik van Riel&#8217;s 2.4.21-rc6-rmap15j.txt patch on the 2.4.21 kernel, but it still does unnecessary swapping (although, strangely, only when spidering). If you know how to fix this problem, please help!!! [Here][21] is the output from the vmstat command on one of my production machines running 2.4.22. And [here][22] is the output from my test machine running 2.4.21-rc6-rmap15j.txt.

<a name="kernel"></a> <span style="font-size: xx-small;"><b>Kernel Update</b></span>
  
_August 28, 2003_

I updated the Linux kernel to 2.4.22, which was just released a few days ago on [kernel.org][23]. Now my gigabit cards are working, yay! I finally had to turn off swap using the swapoff command. When an application runs out of memory the swapper is supposed to write unfrequently used memory to disk so it can give that memory to the application that needs it. Unfortunately, the Linux virtual memory manager enjoys swapping out an application&#8217;s memory for no good reason. This can often make an application disastrously slow, especially when the application ends up blocking on code that it doesn&#8217;t expect too! And, furthermore, when the application uses the disk intensely it has to wait even longer for memory to get swapped back in from disk. I recommend that anyone who needs high performance turn off the swap and just make sure their program does not use more physical memory than is available.

<a name="gang"></a> <span style="font-size: xx-small;"><b>The Gang&#8217;s All Here</b></span>
  
_August 17, 2003_

I decided to add PostScript ([.ps][24]) , PowerPoint ([.ppt][25]), Excel SpreadSheet ([.xls][26]) and Microsoft Word ([.doc][27]) support in addition to the PDF support. Woo-hoo.

<a name="pdf"></a> <span style="font-size: xx-small;"><b>PDF Support</b></span>
  
_August 14, 2003_

Gigablast now indexes PDF documents. Try the search [_type:pdf_][28] to see some PDF results. _type_ is a new search field. It also support the text type, [_type:text_][29], and will support other file types in the future.

<a name="codeupdate3"></a> <span style="font-size: xx-small;"><b>Minor Code Updates</b></span>
  
_July 17, 2003_

I&#8217;ve cleaned up the keyword highlight routines so they don&#8217;t highlight isolated stop words. Gigablast now displays a [blue bar][30] above returned search results that do not have **all** of your query terms. When returning a page of search results Gigablast lets you know how long ago that page was cached by displaying a small message at the bottom of that page. NOTE: This small message is at the bottom of the page containing the search results, not at the bottom of any pages from the web page cache, that is a different cache entirely. Numerous updates to less user-visible things on the back end. Many bugs fixed, but still more to go. Thanks a bunch to Bruce Perens for writing the [Electric Fence][31] debug utility.

<a name="codeupdate2"></a> <span style="font-size: xx-small;"><b>Gigablast 2.0</b></span>
  
_June 20, 2003_

I&#8217;ve recently released Gigablast 2.0. Right now Gigablast can do about twice as many queries per second as before. When I take care of a few more things that rate should double again.

The ranking algorithm now treats phrase weights much better. If you search for something like _[boots in the uk][32]_ you won&#8217;t get a bunch of results that have that exact phrase in them, but rather you will get UK sites about boots (theoretically). And when you do a search like _[all the king&#8217;s men][33]_ you will get results that have that exact phrase. If you find any queries for which Gigablast is especially bad, but a competing search engine is good, please [let me know][2], I&#8217;m am very interested.

2.0 also introduced a new index format. The new index is half the size of the old one. This allows my current setup to index over 400 million pages with dual redundancy. Before it was only able to index about 300 million pages. The decreased index size also speeds up the query process since only half as much data needs to be read from disk to satisfy a query.

I&#8217;ve also started a full index refresh, starting with top level pages that haven&#8217;t been spidered in a while. This is especially nice because a lot of pages that were indexed before all my anti-spam algorithms were 100% in place are just now getting filtered appropriately. I&#8217;ve manually removed over 100,000 spam pages so far, too.

<a name="grub"></a> <span style="font-size: xx-small;"><b>My Take on Looksmart&#8217;s Grub</b></span>
  
_Apr 19, 2003_

There&#8217;s been some press about Grub, a program from Looksmart which you install on your machine to help Looksmart spider the web. Looksmart is only using Grub to save on their bandwidth. Essentially Grub just compresses web pages before sending them to Looksmart&#8217;s indexer thus reducing the bandwidth they have to pay for by a factor of 5 or so. The same thing could be accomplished through a proxy which compresses web pages. Eventually, once the HTTP mime standard for requesting compressed web pages is better supported by web servers, Grub will not be necessary.

<a name="codeupdate"></a> <span style="font-size: xx-small;"><b>Code Update</b></span>
  
_Mar 25, 2003_

I just rolled some significant updates to Gigablast&#8217;s back-end. Gigablast now has a uniformly-distributed, unreplicated search results cache. This means that if someone has done your search within the last several hours then you will get results back very fast. This also means that Gigablast can handle a lot more queries per second.

I also added lots of debug and timing messages that can be turned on and off via the Gigablast admin page. This allows me to quickly isolate problems and identify bottlenecks.

Gigablast now synchronizes the clocks on all machines on the network so the instant add-url should be more &#8220;instant&#8221;. Before I made this change, one machine would tell another to spider a new url &#8220;now&#8221;, where &#8220;now&#8221; was actually a few minutes into the future on the spider machine. But since everyone&#8217;s currently synchronized, this will not be a problem anymore.

There were about 100 other changes and bug fixes, minor and major, that I made, too, that should result in significant performance gains. My next big set of changes should make searches at least 5 times faster, but it will probably take several months until completed. I will keep you posted.

<a name="downtime"></a> <span style="font-size: xx-small;"><b>Downtime</b></span>
  
_Feb 20, 2003_

To combat downtime I wrote a monitoring program. It will send me a text message on my cellphone if gigablast ever stops responding to queries. This should prevent extended periods of downtime by alerting me to the problem so I can promptly fix it.

<a name="uunet"></a> <span style="font-size: xx-small;"><b>Connectivity Problems. Bah!</b></span>
  
_Feb 14, 2003_

I had to turn off the main refresh spiders a few weeks ago because of internet connectivity problems. Lots of pages were inaccessible or were timing out to the point that spider performance was suffering too much.

After running tcpdump in combination with wget I noticed that the FIN packets of some web page transfers were being lost or delayed for over a minute. The TCP FIN packet is typically the last TCP packet sent to your browser when it retrieves a web page. It tells your browser to close the connection. Once it is received the little spinning logo in the upper right corner of your browser window should stop spinning.

The most significant problem was, however, that the initial incoming data packet for some URLs was being lost or excessively delayed. You can get by without receiving FIN packets but you absoultely need these TCP &#8220;P&#8221; packets. I&#8217;ve tested my equipment and my ISP has tested their equipment and we have both concluded that the problem is upstream. Yesterday my ISP submitted a ticket to Worldcom/UUNet. Worldcom&#8217;s techs have verified the problem and thought it was&#8230; &#8220;interesting&#8221;.

I personally think it is a bug in some filtering or monitoring software installed at one of Worldcom&#8217;s NAPs (Network Access Points). NAPs are where the big internet providers interface with each other. The most popular NAPs are in big cities, the Tier-1 cities, as they&#8217;re called. There are also companies that host NAP sites where the big carriers like Worldcom can install their equipment. The big carriers then set up Peering Agreements with each other. Peering Agreements state the conditions under which two or more carriers will exchange internet traffic.

Once you have a peering agreement in place with another carrier then you must pay them based on how much data you transfer from your network to their network across a NAP. This means that downloading a file is much cheaper than uploading a file. When you send a request to retrieve some information, that request is small compared to the amount of data it retrieves. Therefore, the carrier that hosted the server from which you got the data will end up paying more. Doh! I got off the topic. I hope they fix the problem soon!

<a name="ads"></a> <span style="font-size: xx-small;"><b>Considering Advertisements</b></span>
  
_Jan 10, 2003_

I&#8217;m now looking into serving text advertisements on top of the search results page so I can continue to fund my information retrieval research. I am also exploring the possibility of injecting ads into some of my xml-based search feeds. If you&#8217;re interested in a search feed I should be able to give you an even better deal provided you can display the ads I feed you, in addition to any other ads you might want to add. If anyone has any good advice concerning what ad company I should use, I&#8217;d love to here it.

<a name="codeupdate"></a> <span style="font-size: xx-small;"><b>Code Update</b></span>
  
_Dec 27, 2002_

After a brief hiatus I&#8217;ve restarted the Gigablast spiders. The problem was they were having a negative impact on the query engine&#8217;s performance, but now, all spider processing yields computer resources much better to the query traffic. The result is that the spidering process only runs in the space between queries. This actually involved a lot of work. I had to insert code to suspend spider-related, network transactions and cancel disk-read and disk-write threads.

I&#8217;ve also launched my [Gigaboost][34] campaign. This rewards pages that link to gigablast.com with a boost in the search results rankings. The boost is only utilized to resolve ties in ranking scores so it does not taint the quality of the index.

Gigablast.nu, in Scandinavia, now has a news index built from news sources in the Scandinavian region. It is not publically available just yet because there&#8217;s still a few details we are working out. I&#8217;ve also added better duplicate detection and removal. It won&#8217;t be very noticable until the index refresh cycle completes. In addition Gigablast now removes session ids from urls, but, this only applies to new links and will be back pedaled to fix urls already in the index at a later date. There is also a new summary generator installed. It&#8217;s over ten times faster than the old one. If you notice any problems with it please contact me. As always, I appreciate any constructive input you have to give.

<a name="corruption"></a> <span style="font-size: xx-small;"><b>Data Corruption Mysteries</b></span>
  
_Dec 20, 2002_

I&#8217;ve been having problems with my hard drives. I have a bunch of Maxtor 160GB drives (Model # = 4G160J8) running on Linux 2.4.17 with the [48-bit LBA patch][35]. Each machine has 4 of these drives on them, 2 on each IDE slot. I&#8217;ve had about 160 gigabytes of data on one before so I know the patch seems to do the job. But every now and then a drive will mess up a write. I do a lot of writing and it usually takes tens of gigabytes of writing before a drive does this. It writes out about 8 bytes that don&#8217;t match what should have been written. This causes index corruption and I&#8217;ve had to install work-arounds in my code to detect and patch it.

I&#8217;m not sure if the problem is with the hard drive itself or with Linux. I&#8217;ve made sure that the problem wasn&#8217;t in my code by doing a read after each write to verify. I thought it might be my motherboard or CPU. I use AMDs and Giga-byte motherboards. But gigablast.nu in Sweden has the same problem and it uses a Pentium 3. Furthermore, gigablast.nu uses a RAID of 160GB Maxtors, whereas gigablast.com does not. Gigablast.nu uses version 2.4.19 of Linux with the 48-bit LBA patch. So the problem seems to be with Linux, the LBA patch or the hard drive itself.

On top of all this mess, about 1 Maxtor, out of the 32 I have, completely fails on me every 4 months. The drive just gives I/O errors to the kernel and brings the whole system down. Luckily, gigablast.com implements a redundant architecture so the failing server will be replaced by his backup. So far Maxtor has replaced the drives I had fail. If you give them your credit card number they&#8217;ll even send the replacements out in advance. But I believe the failure problem is an indicator that the data corruption problem is hard drive related, not Linux related. If anyone has any insight into this problem please let me know, you could quite easily be my hero.

If you&#8217;re still reading this you&#8217;re pretty hard core so [here&#8217;s][36] what /var/log/messages says when the 4G160J8 completely fails.

<a name="pvr"></a> <span style="font-size: xx-small;"><b>Personal Video Recorders (PVRs)</b></span>
  
_Dec 20, 2002_

Boy, these things are great. I bought a Tivo last year for my wife and she loved it. At first though she wasn&#8217;t that enthusiastic because she wasn&#8217;t very familiar with it. But now we rarely rent any more video tapes from Blockbuster or Hollywood video because there&#8217;s always something interesting to watch on the Tivo. You just let it know what shows you like and it will record them anytime they come on. We always have an overflow of Simpsons and Seinfeld epsidoes on there.

In the future though I don&#8217;t think Tivo is going to make it. The reason? Home networking. Because I&#8217;m a professional computer person, we already have a home network installed. If the TV had an ethernet jack it would be in our network. 100Mbps is fast enough to send it a high-quality video stream from the computers already on the network. I have a cable modem which, in the future, should allow the computer using it to rip signals from the cable station, as well. For now though, you could split your cable and plug the new end into a tuner card on your PC. So once someone comes out with a small device for the television that converts an ethernet-based mpeg stream to a video signal we can use our home PC to act as the TIVO. This device should be pretty cheap, I&#8217;d imagine around $30 or so. The only thing you&#8217;d need then is a way to allow the remote control to talk to your PC.

Now I read about the EFF suing &#8220;Hollywood&#8221; in order to clarify consumer rights of fair use. Specifically, the EFF was said to be representing Replay TV. Hey! Isn&#8217;t Replay TV owned in part by Disney (aka Hollywood)&#8230; hmmmm&#8230; Seems like Disney might have pretty good control over the outcome of this case. I think it&#8217;s a conflict of interest when such an important trial, which would set precedence for many cases to come, has the same plantiff as defendant.

This makes me wonder about when Disney&#8217;s Go.com division got sued by Overture (then known as Goto.com) for logo infringement. Disney had to pay around 20 million to Overture. I wonder what kind of ties Disney had to Overture. Ok, maybe I&#8217;m being a conspiracy theorist, so I&#8217;ll stop now.

<a name="ecs"></a> <span style="font-size: xx-small;"><b>ECS K7S5A Motherboard Mayhem</b></span>
  
_Dec 20, 2002_

I pinch pennies. When I bought my 8 servers I got the cheapest motherboards I could get for my AMD 1.4GHz Athlon T-Birds. At the time, in late January 2002, they turned out to be the K7S5A&#8217;s. While running my search engine on them I experienced lots of segmentation faults. I spent a couple of days pouring over the code wondering if I was tripping out. It wasn&#8217;t until I ran memtest86 at boot time (ran by lilo) that I found memory was being corrupted. I even tried new memory sticks to no avail. Fortunately I found some pages on the web that addressed the problem. It was the motherboard. It took me many hours to replace them on all 8 servers. I don&#8217;t recommend ECS. I&#8217;ve been very happy with the Giga-byte motherboards I have now.

 [1]: http://www.gigablast.com/bio.html
 [2]: http://www.gigablast.com/contact.html
 [3]: http://www.gigablast.com/search?q=Who+is+President+of+Russia%3F
 [4]: http://www.gigablast.com/?redir=http://story.news.yahoo.com/news?tmpl=story&ncid=1293&e=2&u=/ap/20031211/ap_on_hi_te/wi_fi_city&sid=95573418
 [5]: http://www.gigablast.com/
 [6]: http://www.gigablast.com/search?q=foo%3Abar&dt=foo
 [7]: http://www.gigablast.com/search?q=foo%3A%22bar+baz%22&dt=foo
 [8]: http://www.gigablast.com/search?q=gigablast&s=10&dt=author+keywords%3A32
 [9]: http://www.gigablast.com/?redir=http://www.geek.com/news/geeknews/2003Sep/gee20030929021965.htm
 [10]: http://www.gigablast.com/?redir=http://www.techfirm.com/
 [11]: http://www.gigablast.com/?redir=http://www.paradigm.nu/icann/
 [12]: http://www.gigablast.com/?redir=http://www.pcworld.com/news/article/0,aid,112712,00.asp
 [13]: http://www.gigablast.com/?redir=http://www.icann.org/correspondence/lewis-to-twomey-21sep03.htm
 [14]: http://www.gigablast.com/?redir=http://slashdot.org/articles/03/09/22/2255202.shtml?tid=126&tid=95&tid=99
 [15]: http://www.gigablast.com/?redir=http://forum.icann.org/alac-forum/redirect/
 [16]: http://www.gigablast.com/?redir=http://yro.slashdot.org/yro/03/09/24/0134256.shtml?tid=126&tid=95&tid=98&tid=99
 [17]: http://www.gigablast.com/?redir=http://www.whois.sc/verisign-dns/
 [18]: http://www.gigablast.com/tagsdemo.html
 [19]: http://www.gigablast.com/addurl
 [20]: http://www.gigablast.com/help.html#boolean
 [21]: http://www.gigablast.com/vmstat.html
 [22]: http://www.gigablast.com/vmstatrik.html
 [23]: http://www.gigablast.com/?redir=http://www.kernel.org/
 [24]: http://www.gigablast.com/search?q=type:ps
 [25]: http://www.gigablast.com/search?q=type:ppt
 [26]: http://www.gigablast.com/search?q=type:xls
 [27]: http://www.gigablast.com/search?q=type:doc
 [28]: http://www.gigablast.com/search?q=type:pdf
 [29]: http://www.gigablast.com/search?q=type:text
 [30]: http://www.gigablast.com/superRecall.html
 [31]: http://www.gigablast.com/?redir=http://www.perens.com/FreeSoftware/
 [32]: http://www.gigablast.com/search?q=boots+in+the+uk
 [33]: http://www.gigablast.com/search?q=all+the+king%27s+men
 [34]: http://www.gigablast.com/gigaboost.html
 [35]: http://www.gigablast.com/ide.2.4.17.02152002.patch.bz2
 [36]: http://www.gigablast.com/output.html