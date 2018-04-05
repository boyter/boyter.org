---
title: MySQL Export to CSV
author: Ben E. Boyter
type: post
date: 2011-02-14T23:33:51+00:00
url: /2011/02/mysql-export-csv/

---
Ever needed to export data from MySQL into a CSV file? Its actually fairly simple,

`SELECT * INTO OUTFILE '/tmp/name.csv'<br />
FIELDS TERMINATED BY ','<br />
OPTIONALLY ENCLOSED BY '"'<br />
ESCAPED BY '\\'<br />
LINES TERMINATED BY '\n'<br />
FROM [tablename]<br />
` 

Certainly easier then writing a quick Python/Perl/PHP script to do the job.