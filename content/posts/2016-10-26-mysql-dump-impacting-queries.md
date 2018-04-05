---
title: MySQL Dump Without Impacting Queries
author: Ben E. Boyter
type: post
date: 2016-10-26T01:11:01+00:00
url: /2016/10/mysql-dump-impacting-queries/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Tip

---
Posted more for my personal use (I have to look it up every time) but here is how to run a mysqldump without impacting performance on the box. It sets the ionice and nice values to be as low as possible (but still run) and uses a single transaction and ups the max packet size for MySQL.

<pre>ionice -c2 -n7 nice -n19 mysqldump -u root -p DATABASE --single-transaction --max_allowed_packet=512M &gt; FILENAME
</pre>