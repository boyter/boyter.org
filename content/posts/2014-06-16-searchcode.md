---
title: searchcode next
author: Ben E. Boyter
type: post
date: 2014-06-16T23:16:45+00:00
url: /2014/06/searchcode/
categories:
  - searchcode

---
There seems to be a general trend with calling the new release of your search engine next (see [Iconfinder][1] and [DuckDuckGo][2]), and so I am happy to announce and write about [searchcode next][3].

As with many project searchcode has some very humble beginnings. It originally started out as a &#8220;I need to do something&#8221; side project originally just indexing programming documentation. Time passed and the idea eventually evolved into a search engine for all programming documentation, and then with Google Code search being shut down a code search engine as well.

searchcode was running on a basic LAMP stack. Ubuntu Linux as the server, PHP, MySQL and Apache. APC Cache was installed to speed up PHP with some memcached calls to take heat off the database. The CodeIgniter PHP framework was used for the front end design with a lot of back-end processes written in Python.

Never one to agree with the advice that you should never rewrite your code I did exactly that. Searchcode is now a Django application. The reasons for this are varied but essentially it was running on an older server (Ubuntu 10.04) and a now defunct web framework CodeIgniter. I figured since I had to rewrite portions anyway I may as well switch over to a language that I prefer and want to gain more experience in.

As mentioned searchcode is now a [Django][4] application but still backed by by [MySQL][5]. [Sphinx][6] provides the searching index and a healthy mix of [Rabbitmq][7] and [Celery][8] for back-end tasks. Deployments and server config is automated through the use of [Fabric][9] and [Memcached][10] is included for speed. Of course some of the original back-end processes still exist as cron jobs but are slowly being moved over to Celery tasks. It still runs on Ubuntu server since that&#8217;s the Linux distribution I am most comfortable with.

Of particular note, searchcode runs on two servers which could probably be reduced to a single one at its current size but allows for growth. Both are dedicated boxes provided by Hetzner. Both are 4 core i7 boxes with 3 terabytes of disk space each. The only difference between them is the first having 16 gigabytes of ram and the index having 32 gigabytes. The first runs the web-server nginx talking through gunicorn to django, the database and memcache. The second exclusively runs the sphinx index (more details about sphinx to come).

Load averages before the move were rather chaotic. I had seen spikes up to 100 which for a 4 core box is pretty horrible. The new version even under extreme pressure (from a Siege test and GoogleBot) maxes out about 2, with the search spiking to 4 for brief periods if a lot of un-cached searches hit all of a sudden. The other advantage is that searches come back much faster with the new setup. Average page responses have dropped considerably.

Heavily unit tested the application runs through a battery of tests before each deployment including unit, integration and smoke which do a reasonable job of catching issues out before being deployed. Of course the other benefit being that the code-base is testable which is generally a good thing.

There is more to come and I am excited about the future of searchcode.

 [1]: http://blog.iconfinder.com/introducing-iconfinder-next/
 [2]: https://duck.co/forum/thread/5726/duckduckgo-reimagined-and-redesigned
 [3]: https://searchcode.com/
 [4]: https://www.djangoproject.com/
 [5]: https://www.mysql.com/
 [6]: http://sphinxsearch.com/
 [7]: http://www.rabbitmq.com/
 [8]: http://www.celeryproject.org/
 [9]: http://www.fabfile.org/
 [10]: http://www.memcached.org/