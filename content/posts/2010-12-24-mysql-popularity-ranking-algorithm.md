---
title: MySQL Popularity Ranking Algorithm
author: Ben E. Boyter
type: post
date: 2010-12-24T04:11:03+00:00
url: /2010/12/mysql-popularity-ranking-algorithm/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Uncategorized

---
Calculating the popularity of a page or article is something that usually comes up as a list of requirements for any social website. Essentially you want to display the post popular items/articles in some form of list but have them weighted by how old they are. Thankfully its pretty easy to do MySQL.

```
((popularity-1)/power(((unix_timestamp(NOW())-unix_timestamp(datetime))/60)/60,1.8))
```

The above produces a number which you can then sort on. It is based on the [Hacker News algorithm][1] and works well for items which change hourly. By removing one of the /60 you should get something which ranks based on days rather then hours. A full example is listed below,

```
select *,
((table.popularity-1)/power(((unix_timestamp(NOW())-unix_timestamp(table.datetime))/60)/60,1.8)) as rank
 from table order by rank desc
 ```

As a live example I added it to the following website, <a href="http://www.chunews.com/">http://www.chunews.com/</a> which now uses the above ranking to display news items.

NB. This website is now offline as I have moved all my focus over to searchcode.com

 [1]: https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d
