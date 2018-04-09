---
title: Python Snippet
author: Ben E. Boyter
type: post
date: 2010-09-29T06:53:24+00:00
url: /2010/09/python-snippet/

---
The below is a quick Python snippet which I use on a day to day basis for weeks, then promptly forget. Essentially its reading from standard input and then doing something with it. Very useful when you are trying to process data on the command line and have forgotten how to use awk/sed properly and grep has run out of steam.

{{<highlight python>}}
import sys
import re

for line in sys.stdin:
  values = line.split(',')
  print "%s\t%s"%(values[0],values[1])
{{</highlight>}}

The above just takes standard input, splits it on commas and prints out out with a tab space between them. A useless example, but shows the concept quite well.