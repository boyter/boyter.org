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

If the relationship is clearly "is-a", I use inheritance. If it is more like "can-be", I use interfaces. Eg, TextBox "is-a" Control, ArrayList "can-be" enumerated (so it implements IEnumerable).