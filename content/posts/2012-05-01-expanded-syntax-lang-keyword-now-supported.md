---
title: Expanded Syntax lang Keyword Now Supported
author: Ben E. Boyter
type: post
date: 2012-05-01T05:15:11+00:00
url: /2012/05/expanded-syntax-lang-keyword-now-supported/
categories:
  - Uncategorized

---
Trawling through the logs of search queries I noticed that some people are using the Google Code Search lang syntax. An example that I spotted was the following [&#8220;throw.* runtime_error lang:c++&#8221;][1] Note the lang:c++ portion.

Of couse this ended up spitting back no useful results because the lang:c++ was treated as part of the search. Well no longer is this the case. searchcode now supports the lang keyword in addition to the existing ext one (useful for extensions).

The list of known languages is included below. The only issue at the moment is those with a space in them which isnt picked up by the filter correctly, but I will push a fix for those soonish.

**EDIT** The ones with spaces are no longer an issue. Just write the language minus the spaces, EG

[test lang:BourneShell][2]
  
[NSString lang:ObjectiveC][3]

ActionScript
  
Ada
  
ASP
  
ASP.Net
  
Assembly
  
awk
  
bc
  
Bourne Again Shell
  
Bourne Shell
  
C
  
C Shell
  
C/C++ Header
  
C#
  
C++
  
CMake
  
COBOL
  
ColdFusion
  
CSS
  
Cython
  
D
  
DAL
  
Dart
  
DOS Batch
  
DTD
  
Erlang
  
Expect
  
Fortran 77
  
Fortran 90
  
Fortran 95
  
Go
  
Groovy
  
Haskell
  
HTML
  
IDL
  
Java
  
Javascript
  
JSP
  
Kermit
  
Korn Shell
  
lex
  
Lisp
  
Lua
  
m4
  
make
  
MATLAB
  
Modula3
  
MSBuild scripts
  
MUMPS
  
MXML
  
NAnt scripts
  
Objective C
  
Objective C++
  
Ocaml
  
Octave
  
Oracle Forms
  
Oracle Reports
  
Pascal
  
Patran Command Language
  
Perl
  
PHP
  
Python
  
Rexx
  
Ruby
  
Ruby HTML
  
Scala
  
sed
  
SKILL
  
Smarty
  
Softbridge Basic
  
SQL
  
SQL Data
  
Tcl/Tk
  
Teamcenter def
  
Teamcenter met
  
Teamcenter mth
  
text
  
Unknown
  
VHDL
  
vim script
  
Visual Basic
  
XAML
  
XML
  
XSD
  
XSLT
  
yacc
  
YAML

 [1]: http://searchco.de/?q=throw.*+runtime_error+lang%3Ac%2B%2B&cs=on
 [2]: http://searchco.de/?q=test+lang%3ABourneShell&cs=on
 [3]: http://searchco.de/?q=NSString+lang%3AObjectiveC&cs=on