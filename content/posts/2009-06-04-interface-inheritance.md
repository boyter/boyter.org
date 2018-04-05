---
title: Interface Vs Inheritance
author: Ben E. Boyter
type: post
date: 2009-06-04T00:06:03+00:00
url: /2009/06/interface-inheritance/
categories:
  - Tip

---
Just found this while testing http://www.bing.com/ and thought I should preserve it here to be dammed sure I can find if when I want it.

If the relationship is clearly &#8220;is-a&#8221;, I use inheritance. If it is more like &#8220;can-be&#8221;, I use interfaces. Eg, TextBox &#8220;is-a&#8221; Control, ArrayList &#8220;can-be&#8221; enumerated (so it implements IEnumerable).