---
title: Mutt CLI
author: Ben E. Boyter
type: page
date: 2018-02-14T06:24:43+00:00
draft: true
private: true
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'

---
<section id="post-body"> 

# CLI all the things! {#cli-all-the-things}

I have always wanted to use mutt to connect to my Gmail account. The biggest blocker for me has always been that most tutorials are missing that last 10% that I need to get up and running. Well the other day I got it running finally and I wanted to throw this up in case someone else is running into the same issues that I was having. There may be extra settings in the conf files, I didn’t take time to minimize I’m just posting what I have working.

# Setup {#setup}

## 1.) Setup Application password {#1-setup-application-password}

When it comes to my gmail account I like to enable 2-step authentication. This can create a bit of an issue for command line clients as they usually aren’t built to support 2-step auth natively. Enter application passwords. These work like most authentication tokens so when you generate the password don’t leave it laying around. You should be able to generate your app passwords [HERE][1] but if the url has changed then just google around. You should get a 16 digit password out of this.

## 2.) Install Mutt {#2-install-mutt}

On Ubuntu execute the following command:

<pre><code class="hljs cs">$ sudo apt-&lt;span class="hljs-keyword">get&lt;/span> install mutt
</code></pre>

After installing mutt create the default folders and cert file:

<pre><code class="hljs javascript">mkdir -p ~&lt;span class="hljs-regexp">/.mutt/&lt;/span>cache
touch ~&lt;span class="hljs-regexp">/.mutt/&lt;/span>certificates
</code></pre>

After this you will have to create your muttrc file, located at ~/.muttrc. You will have to paste in your application password into the appropriate places:

<pre><code class="hljs sql">&lt;span class="hljs-keyword">set&lt;/span> imap_user = &lt;span class="hljs-string">'user@gmail.com'&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> imap_pass = &lt;span class="hljs-string">'applicationpassword'&lt;/span>

&lt;span class="hljs-keyword">set&lt;/span> sendmail=&lt;span class="hljs-string">"/usr/sbin/ssmtp"&lt;/span>

&lt;span class="hljs-keyword">set&lt;/span> folder=&lt;span class="hljs-string">"imaps://imap.gmail.com"&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> spoolfile=&lt;span class="hljs-string">"imaps://imap.gmail.com/INBOX"&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> &lt;span class="hljs-built_in">record&lt;/span>=&lt;span class="hljs-string">"imaps://imap.gmail.com/[Gmail]/Sent Mail"&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> postponed=&lt;span class="hljs-string">"imaps://imap.gmail.com/[Gmail]/Drafts"&lt;/span>

&lt;span class="hljs-keyword">set&lt;/span> header_cache = &lt;span class="hljs-string">"~/.mutt/cache/headers"&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> message_cachedir = &lt;span class="hljs-string">"~/.mutt/cache/bodies"&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> certificate_file = &lt;span class="hljs-string">"~/.mutt/certificates"&lt;/span>

&lt;span class="hljs-keyword">set&lt;/span> &lt;span class="hljs-keyword">from&lt;/span> = &lt;span class="hljs-string">'user@gmail.com'&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> realname = &lt;span class="hljs-string">'Your Name'&lt;/span>

&lt;span class="hljs-keyword">set&lt;/span> smtp_url = &lt;span class="hljs-string">'smtp://user@smtp.gmail.com:587/'&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> smtp_pass=&lt;span class="hljs-string">'aplication'&lt;/span>

&lt;span class="hljs-keyword">set&lt;/span> &lt;span class="hljs-keyword">move&lt;/span> = &lt;span class="hljs-keyword">no&lt;/span>
&lt;span class="hljs-keyword">set&lt;/span> imap_keepalive = &lt;span class="hljs-number">900&lt;/span>

# Gmail-&lt;span class="hljs-keyword">style&lt;/span> keyboard shortcuts
macro &lt;span class="hljs-keyword">index&lt;/span>,pager ga &lt;span class="hljs-string">"&lt;change-folder&gt;=[Gmail]/All&lt;tab&gt;&lt;enter&gt;"&lt;/span> &lt;span class="hljs-string">"Go to all mail"&lt;/span>
macro &lt;span class="hljs-keyword">index&lt;/span>,pager gi &lt;span class="hljs-string">"&lt;change-folder&gt;=INBOX&lt;enter&gt;"&lt;/span> &lt;span class="hljs-string">"Go to inbox"&lt;/span>
macro &lt;span class="hljs-keyword">index&lt;/span>,pager gs &lt;span class="hljs-string">"&lt;change-folder&gt;=[Gmail]/Starred&lt;enter&gt;"&lt;/span> &lt;span class="hljs-string">"Go to starred messages"&lt;/span>
macro &lt;span class="hljs-keyword">index&lt;/span>,pager gd &lt;span class="hljs-string">"&lt;change-folder&gt;=[Gmail]/Drafts&lt;enter&gt;"&lt;/span> &lt;span class="hljs-string">"Go to drafts"&lt;/span>
macro &lt;span class="hljs-keyword">index&lt;/span>,pager e &lt;span class="hljs-string">"&lt;enter-command&gt;unset trash\n &lt;delete-message&gt;"&lt;/span> &lt;span class="hljs-string">"Gmail archive message"&lt;/span> # different &lt;span class="hljs-keyword">from&lt;/span> Gmail, but wanted &lt;span class="hljs-keyword">to&lt;/span> &lt;span class="hljs-keyword">keep&lt;/span> &lt;span class="hljs-string">"y"&lt;/span> &lt;span class="hljs-keyword">to&lt;/span> &lt;span class="hljs-keyword">show&lt;/span> folders.
</code></pre>

Replace the fields that say ‘applicationpassword’ with your actual 16 digit password. You will also notice that there are some keybindings to give gmail like shortcuts for navigating around your inboxes like ‘gi’. At this point you should just have to launch Mutt and you should be able to start reading your emails from the command line:

<pre><code class="hljs ruby">$ mutt
</code></pre>

## 3.) Send emails with SSMTP {#3-send-emails-with-ssmtp}

Now you will have to install SSMTP if you want to be able to send emails from Mutt. Start by installing SSMTP:

<pre><code class="hljs cs">$ sudo apt-&lt;span class="hljs-keyword">get&lt;/span> install ssmtp
</code></pre>

setup /etc/ssmtp/ssmtp.conf:

<pre><code class="hljs ini">&lt;span class="hljs-attr">root&lt;/span>=user@gmail.com
&lt;span class="hljs-attr">mailhub&lt;/span>=smtp.gmail.com:&lt;span class="hljs-number">587&lt;/span>

&lt;span class="hljs-attr">AuthUser&lt;/span>=user@gmail.com
&lt;span class="hljs-attr">AuthPass&lt;/span>=applicationpass
&lt;span class="hljs-attr">UseTLS&lt;/span>=&lt;span class="hljs-literal">YES&lt;/span>
&lt;span class="hljs-attr">UseSTARTTLS&lt;/span>=&lt;span class="hljs-literal">YES&lt;/span>

&lt;span class="hljs-attr">hostname&lt;/span>=user@gmail.com
&lt;span class="hljs-attr">rewriteDomain&lt;/span>=gmail.com

&lt;span class="hljs-attr">FromLineOverride&lt;/span>=&lt;span class="hljs-literal">YES&lt;/span>
</code></pre>

Make sure you update the file to reflect your application password. Next edit /etc/ssmtp/revaliasses:

<pre><code class="hljs coffeescript">local_username:codyfh@gmail.com:smtp.gmail.come:&lt;span class="hljs-number">587&lt;/span>
</code></pre>

You should now be able to launch mutt and send a message; type ’m’ and a little ‘to:’ prompt should come up at the bottom. Hope you get some use out of this!</section>

 [1]: https://security.google.com/settings/security/apppasswords