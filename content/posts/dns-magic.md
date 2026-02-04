---
title: "Build a SaaS App - DNS Black Magic"
date: 2040-06-12
---

> A part of a series of blog posts I have been working on to turn into a book about building a SaaS application.

DNS can be a complex beast. To distil it down to the simplest thing that can possibly work, you buy a domain from a domain registrar, then configure the name servers to point at your servers public IP address. Where this gets confusing is thatsome domain registrars offer nameservers, and others don't. This can cause issues

`DNS -> Nameserver -> Server IP Address`

The first step with DNS is to buy a domain. You can do this with whatever domain register you want. Keep in mind however that some registers provide their own name servers. This can be useful if you are using a server host that does not provide name servers or you don't want to run your own. As such be sure to check that you can use your own ones.

So for our hosted app we have the DNS in GoDaddy. We are going to change over to Vultrs name servers simply because we can then control them using Vultrs API.

DNS has what's known as records. These are mappings between the domain and various services the domain uses. The main ones you need to worry about are A and MX. The A records are mapping between the domain name and an IPv4 address, so the way you actually connect to your server. MX records are used for email. You may eventually need to use AAAA records which are similar to A but map to an IPv6 record.

To do this we need to find the name servers for Vultr.

STEPS TO DO THE ABOVE HERE

To verify the above you can use the `dig` command. Check that the domain you are digging points to the IP address of your server.

```
bboyter@Conan:~$ dig portfold.com

; <<>> DiG 9.10.3-P4-Ubuntu <<>> portfold.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 8539
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;portfold.com.                  IN      A

;; ANSWER SECTION:
portfold.com.           1799    IN      A       128.199.81.117

;; Query time: 229 msec
;; SERVER: 127.0.0.1#53(127.0.0.1)
;; WHEN: Sat Aug 19 10:33:41 AEST 2017
;; MSG SIZE  rcvd: 57

```

<https://www.digitalocean.com/community/tutorials/how-to-configure-dns-round-robin-load-balancing-for-high-availability>
<https://en.wikipedia.org/wiki/Round-robin_DNS>

One thing that people commonly ask is how to ensure high availability using the above. The way you do this is to known as round robin DNS. You can set two A records to different IP addresses. When your browser makes a request to portfold.com after querying DNS it will get back two IP addresses. It will then try each one by one until it gets a response.

Keep in mind this is not a perfect system. Taken from wikipedia `There is no standard procedure for deciding which address will be used by the requesting application, a few resolvers attempt to re-order the list to give priority to numerically "closer" networks. Some desktop clients do try alternate addresses after a connection timeout of 30–45 seconds.`

So while you may have multiple machines that the application can connect two all your clients might end up on one anyway.

One other thing to do is configure email? This involves setting the MX record for your domain and pointing at at your mail server. This can be hosted by anyone, Google, Outlook, etc..

For our application here is how we configured it to work for Runbox.

STEPS TO DO THE ABOVE HERE

We then verify by logging into our exisiting email provider (gmail) and try sending an email though. Assuming you don't get a bounce back it probably worked and you should get an email within 30 minutes.

What about www?

It's often overlooked that when you went to <www.somesite.com> you were actually visiting the www subdomain of that site. The reason for this is mostly historical these days but at the time the internet was not mostly websites, but a mix of ftp, gopher, telnet and other protocols. To make it obvious it was a website the subdomain www was added. However its not actually required as you can serve a website from any domain, for example ftp.somesite.com if running a webserve is totally valid. That said while its not required it is very common to setup www and redirect it to your root domain, or the reverse where you redirect to the www domain (Google does this).

Getting Secure
-----------------------

Adding a HTTPS cert. How to automate the refresh.

Storing passwords. What is a hash. What is a salt. What hash function should I use. Oauth.

What hashing algorithm should I use?

Given the choice in 2017 go for scrypt. It is designed to not only be CPU intensive but use large amounts of memory making it not practically feasible to build hashing machines to defeat it. Use bcrypt if you cannot use scrypt. If unable to use either then use PBKDF2.

Stretching. It is good practice to run the above hashing algorithms multiple times on the output. In short feed the output of the hash back into the hash function many times. Most wrappers will do this for you already but for bcrypt/scrypt consider doing it at least 16 times. For PBKDF2 do it around 2500 times.

Salt. A salt is just a random value that is prepended or appended to the password before hashing it to defeat databases of pre-hashed common password combinations. It is best practice to use an individual salt per password. You can store this as plain text next to the user record in the database.

Authorisation vs authentication. Keep in mind that just because someone is authenticated IE you know who they are that does not mean they should be able to perform any action. You need to ensure that not only do you know who they are but that they are allowed to do perform whatever action they require.
