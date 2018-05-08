---
title: How to start a Go project in 2018
date: 2028-05-08
---


Getting started with a Go project in 2018 is frankly a little more painful then getting anything else started IMHO. With that here is what I have been doing to get started.

The first thing to do is download and install Go. Then you need to set your GOPATH. Strictly speaking this has not been a requirement since I think Go 1.7 but it can be quite handy to set it anyway. The reasons being

 - You can control there it goes beyond it being ~/go/
 - For Windows it allows you to share the directory between the WSL and Windows
 - Also for Windows you can set it to C:\Go\ to avoid the long path name issues

The reason its needed at all is because of how Go organizes dependencies. Go dependencies are a little odd the first time you run into them. I suspect its because Google runs a monorepo and as such the decisions around it were made with that in mind.

When you use the command `go get github.com/boyter/scc/` what happens is that a copy of the github repository is cloned into the `GOPATH/src/github/boyter/scc/` directory. Imports work in a similar way, where you can import 