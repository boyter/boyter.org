---
title: Javascript bookmarklet
author: Ben E. Boyter
type: post
date: 1970-01-01T00:00:00+00:00
draft: true
url: /?p=269

---
Test

<pre>javascript:eval(function(p,a,c,k,e,d){e=function(c){return(c&lt;a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('9 L="U";k l(n){9 h="";o(9 j=7;j>=0;j--)h+=L.S((n>>(j*4))&R);f h}k A(h){9 p=((h.s+8)>>6)+1;9 m=B G(p*16);o(9 i=0;i&lt;p*16;i++)m[i]=0;o(i=0;i&lt;h.s;i++)m[i>>2]|=h.V(i)&lt;&lt;(P-(i%4)*8);m[i>>2]|=Z&lt;&lt;(P-(i%4)*8);m[p*16-1]=h.s*8;f m}k g(x,y){9 v=(x&#038;z)+(y&#038;z);9 H=(x>>16)+(y>>16)+(v>>16);f(H&lt;&lt;16)|(v&#038;z)}k r(n,u){f(n&lt;&lt;u)|(n>>>(T-u))}k O(t,b,c,d){q(t&lt;C)f(b&#038;c)|((~b)&#038;d);q(t&lt;D)f b^c^d;q(t&lt;F)f(b&#038;c)|(b&#038;d)|(c&#038;d);f b^c^d}k Q(t){f(t&lt;C)?X:(t&lt;D)?Y:(t&lt;F)?-10:-W}k 11(h){9 x=A(h);9 w=B G(E);9 a=13;9 b=-19;9 c=-1a;9 d=12;9 e=-18;o(9 i=0;i&lt;x.s;i+=16){9 M=a;9 N=b;9 I=c;9 J=d;9 K=e;o(9 j=0;j&lt;E;j++){q(j&lt;16)w[j]=x[i+j];15 w[j]=r(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);t=g(g(r(a,5),O(j,b,c,d)),g(g(e,w[j]),Q(j)));e=d;d=c;c=r(b,17);b=a;a=t}a=g(a,M);b=g(b,N);c=g(c,I);d=g(d,J);e=g(e,K)}f l(a)+l(b)+l(c)+l(d)+l(e)}',62,73,'|||||||||var||||||return|add|str|||function|hex|blks|num|for|nblk|if|rol|length||cnt|lsw||||0xFFFF|str2blks_SHA1|new|20|40|80|60|Array|msw|oldc|oldd|olde|hex_chr|olda|oldb|ft|24|kt|0x0F|charAt|32|0123456789abcdef|charCodeAt|899497514|1518500249|1859775393|0x80|1894007588|calcSHA1|271733878|1732584193||else||30|1009589776|271733879|1732584194'.split('|'),0,{}));location.href='http://200.35.145.39/test/md5.php?url='+encodeURIComponent(location.href)+'&#038;key='+calcSHA1('test')
</pre>