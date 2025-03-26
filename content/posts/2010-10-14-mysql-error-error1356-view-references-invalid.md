---
title: 'MySQL Error – Error:1356: View references invalid.'
author: Ben E. Boyter
type: post
date: 2010-10-14T02:50:45+00:00
url: /2010/10/mysql-error-error1356-view-references-invalid/
categories:
  - Uncategorized

---

I managed to get the following error the other day while helping migrate and upgrade some MySQL databases for a client.

```
mysqldump: Got error: 1356: View 'database.table' references
invalid table(s) or column(s) or function(s) or definer/invoker of view
lack rights to use them when using LOCK TABLES
```

The above appeared anytime I tried to dump the database to a SQL file using mysqldump. Its actually one of the better errors I have seen come out of MySQL (which has pretty terrible error reporting most of the time) and tells you exactly what is going wrong. **Essentially there is a old view in the the database that should be removed since its no longer valid and is throwing a compile exception.**

Of course this isn't useful most of the time and the **workaround is to add the force command -f into the mysqldump command.** This forces the database to dump everything anyway which is perfect for automated backups.
