---
title: How to start a Go project in 2018
date: 2028-05-08
---

Getting started with a Go project in 2018 is frankly a little more painful then getting anything else started IMHO. With that here is what I have been doing to get started.

The first thing to do is download and install Go. I would suggest always installing from the Go website itself https://golang.org/ and following the instructions for your OS of choice. 

The next step is the one that trips a lot of new players up. You need to either set your $GOPATH or be aware of what it is. Setting it has not been a requirement for a while as it defaults to your home directory like so `~/go/` but it can be quite handy to set it anyway. Reasons you may want to set it yourself include,

 - You can control there it goes beyond it being ~/go/
 - For Windows it allows you to share the directory between the WSL and Windows
 - Also for Windows you can set it to C:\Go\ to avoid the long path name issues
 - You can set it to another drive
 - You can set it to be shared among multiple users

The reason it is needed at all is because of how Go organizes dependencies. From the offical documentation `$GOPATH must be set to get, build and install packages outside the standard Go tree.`. It's easiest to think of the $GOPATH as being a workspace that contains all of your projects and dependancies. So long as all your go code lives inside it you are going to have an easier time working with go. 

If you look in the $GOPATH directory you will see three directories, `bin` `pkg` and `src`. The `bin` directory is where installed binaries that have a `main` package are placed after you run `go install`. If you install a project without a `main` package it is moved into the `pkg` directory. Lastly `src` which is where you should do all your development work.

You can check your go envrionment variables with the command `go env`.

One other thing I do is I update my machines path to point to the `bin` directory of my $GOPATH, `export PATH=$PATH:$(go env GOPATH)/bin` so that I can install anything I am working on quickly and have it available everywhere. For example,

```
$GOPATH
├── bin
│   ├── caire
│   ├── dep
│   ├── gocloc
│   ├── gocode.exe
│   ├── lc
│   ├── lc.exe
│   ├── license-detector
│   ├── scc
│   ├── scc.exe
│   └── waveform

```

The abvoe is what my $GOPATH looks like and with the exported path I can run `scc`, `gocloc` and `lc` anywhere I want. I go a little further than most and have my GOPATH shared between Windows and Linux using the WSL so I can work on the same codebase in either, hence the .exe files in the above. To do that you just need to do a symlink inside the WSL to the Windows directory.

Go dependencies are a little odd the first time you run into them. I suspect this is because Google runs a mono-repo and as such the decisions around it were made with that in mind.

When you use the command `go get github.com/boyter/scc/` what happens is that a copy of the github repository is cloned into your `$GOPATH/src/github/boyter/scc/` directory. Go get works with other source control systems as well so you are not limited to git.

To start a new project there a few options. The first is to create a repository then `go get` it and then hack away in your editor of choice. The second is to create the directory manually then clone into it yourself. So long as the path matches your repository endpoints you are going to have a good time.

For example imagine you are working on a client site who have their own bitbucket instance at `bitbucket.code.company-name.com.au` and you want to clone a repository inside that has a clone URL of `https://username@bitbucket.code.company-name.com.au/scm/code/random-code.git` the code would be checked out if you run `go get` would be, `$GOPATH/src/bitbucket.code.company-name.com.au/scm/code/random-code`

## Building / Installing

For commands which have `package main`

    go build   builds the command and leaves the result in the current working directory.
    go install builds the command in a temporary directory then moves it to $GOPATH/bin.

For packages

    go build   builds your package then discards the results.
    go install builds then installs the package in your $GOPATH/pkg directory.

## Unit Testing

To run all the unit tests for your code (with caching there is no reason to not run them all anymore) you should run the following which will run all the unit tests

	go test ./...


## Dependancies

By default `go get` makes your depenancies global. As such if another project does a `go get` to update the code you may end up being unable to build your own code. This I belive was a deliberate design choice by Google as they work in a mono-repo and with quick build times they can make global refactors like such easy. 

If you are reading this you are most likely not Google and the thought of someone updating something and you not being able to build your code again scares the crap out of you. If you want to manage them locally so you can lock down the version using the `vendor` directory and `dep` https://golang.github.io/dep/

Inside the root of your go project depenancies are checked to exist inside the `vendor` directory before looking at `$GOPATH`. As such if you place your dependancies in there they will 