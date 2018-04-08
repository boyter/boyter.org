---
title: Python pep8 git commit check
author: Ben E. Boyter
type: post
date: 2014-02-13T05:34:17+00:00
url: /2014/02/python-pep8-git-commit-check/
categories:
  - searchcode
  - Tip

---
Without adding a git commit hook I wanted to be able to check if my Python code conformed to pep8 standards before committing anything. Since I found the command reasonably useful I thought I would post it here.

`git status -s -u | grep '\.py$' | awk '{split($0,a," "); print a[2]}' | xargs pep8`

Just run the above in your projects directory. It's fairly simple but quite effective at ensuring your Python code becomes cleaner ever time you commit to the repository. The nice thing about it is that it only checks files you have modified, allowing you to slowly clean up existing code bases.