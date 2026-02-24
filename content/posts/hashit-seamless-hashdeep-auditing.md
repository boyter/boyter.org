---
title: Hashit! Now with seamless hashdeep audit support
date: 2055-12-17
---

With the shutdown of a few of my other projects, searchcode, bonzamate, mastinator and others I have had a little more free time to work on some of the other things I had been neglecting.

One that I had been wanting to get back to was [hashit](https://github.com/boyter/hashit) which I created as a replacement for [hashdeep](https://github.com/jessek/hashdeep). One of the glaring issues it had was missing audit support, which was something I had been meaning to add for a while now.

One reason it took so long is that I wanted it to be compatible with hashdeep's current format and I wanted to push audit capability as far as possible.

The reason for wanting to support hashdeep was to allow hashit to be almost a drop in replacement with all the benefits it brings. It also give me a nice verification tool, since I can use hashdeep to confirm anything I had done was correct. Lastly it means for the very paranoid they can have two independent tools for their audit needs.

The reason for wanting to push the capability is because the hashdeep format has an issue, where it needs more RAM as your audit files become larger. This is because it reads the audit into memory and uses that to confirm what files are missing, modified or added.

For very large audits, over millions of files this can potentially be problematic. Its also annoying if you want to verify things yourself, you either write your own logic to parse the hashdeep output format and deal with the memory issue.

Perhaps there is a better way? One option would be to take on the logic to parse the hashdeep output into a format that can be more easily processed on disk, either by sorting the contents or converting it to something else. I started investigating this logic, and rapidly landed on using SQLite as the target format. However it seemed better to just make it so you could write the audit as SQLite and check against that!

So thats what has been implemented. You can now specify the output format as SQLite and then verify against that file.

Here is an example of hashit verifying its own vendor directory using this technique.

```bash
$ hashit --format sqlite --output audit.db --hash all vendor
results written to audit.db

$ hashit -c all -a audit.db vendor
hashit: SQLite Audit passed
       Files examined: 2006
Known files expecting: 2006
        Files matched: 2006
       Files modified: 0
      New files found: 0
        Files missing: 0
```

Of course for smaller file lists you are still better off using the hashdeep format if performance is your goal (memory lookups are fast!). However if you want or need one of the following,

- paranoid verification using all hashes
- dealing with very large audits, millions to trillions of files
