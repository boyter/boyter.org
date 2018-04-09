---
title: MySQL Command Line Import UTF-8
author: Ben E. Boyter
type: post
date: 2011-01-27T21:24:36+00:00
url: /2011/01/mysql-command-line-import-utf-8/

---
Ever wanted to command line import some data into MySQL and keep the encoding type? Turns out its not that difficult. Just a simple command line option. That said I have to look it up all the time.

    mysql -u USERNAME  -pPASSWORD --default_character_set utf8  DATABASE > file.sql

That will import things across with the correct encoding type. I think personally that the face that MySQL fails to throw an error or even raise a warning when it encounters these sort of issues is wrong but where you have no choice the above fixes problems.