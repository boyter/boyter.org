---
title: MySQL Exporting All Databases
author: Ben E. Boyter
type: post
date: 2010-08-04T10:51:13+00:00
url: /2010/08/mysql-exporting-all-databases/

---
One of the things that I always have to look up (when doing it manually that is) is how to export specific databases or all of them from MySQL using mysqldump. To avoid having to Google around every time I need the commands I thought I would preserve it here.

Export a database from MySQL in one line NB password must follow -p without a space

```
mysqldump -u user -pPASSWORD mydatabase > mydatabase.sql
```

Export all databases from MySQL
  
```
mysqldump -u root -pPASSWORD --all-databases > alldatabases.sql
```

Export all databases from MySQL and compress
  
```
mysqldump -u root -pPASSWORD --all-databases | gzip > alldatabases.sql.gz
```

Hopefully that will save myself or someone else some time when it comes to creating database backups.
