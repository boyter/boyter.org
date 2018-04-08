---
title: Impressed
author: Ben E. Boyter
type: post
date: 2009-08-19T00:04:10+00:00
url: /2009/08/impressed/
categories:
  - Uncategorized

---
Was playing around with Python for a second there. I learnt about one of the new "multiprocessing" features. Its pretty standard stuff, but thankfully does what I actually wanted Python to always do. Allow me to multiprocess any Map function. Below is the sample code (2.6 and above only sorry).

<pre>from multiprocessing import Pool
import time

def f(x):
  return x*x

if __name__ == '__main__':
  p = Pool(processes=2)
  r = range(1,10000000)
  t = time.time()
  p.map(f,r)
  print time.time()-t</pre>