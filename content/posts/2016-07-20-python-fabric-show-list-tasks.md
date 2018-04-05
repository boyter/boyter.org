---
title: Python Fabric How to Show or List All Available Tasks
author: Ben E. Boyter
type: post
date: 2016-07-20T22:30:51+00:00
url: /2016/07/python-fabric-show-list-tasks/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Python Fabric

---
Showing or displaying the available tasks inside a fabric fabfile is one of those things that almost everyone wants to do at some point and usually works out you can just request a task you know will not exist (usually found through a typo). However there is a way to list them built into fabric itself.

The below are all methods which can be used to display the currently defined tasks.

    
    fab -l 
    fab -list
    fab taskthatdoesnotexist
    

Try any of the above where a fabfile is located and be presented with a list of all the available tasks.