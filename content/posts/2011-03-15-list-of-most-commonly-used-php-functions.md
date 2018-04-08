---
title: List of Most Commonly Used PHP Functions
author: Ben E. Boyter
type: post
date: 2011-03-15T23:13:43+00:00
url: /2011/03/list-of-most-commonly-used-php-functions/
categories:
  - Search Engine
  - searchcode

---
*** Just realised a slight bug in the parser I wrote when I modified it for this article. Will update with the correct counts ASAP**

**** Correct counts updated. Should be alright now.**

One of the things about ranking in Search is that you need to consider all sorts of methods of working out what is relevent. Google broke new ground (although the idea had already existed) with its PageRank algorithm which supplied better search results then all the other search engines. For what I am doing however I need to consider what programmers are looking for. One thing that I considered some time ago was working out which are the most common functions in a language and adding this as an additional signal to ranking.

I couldn't find anywhere else on the web with this question answered so I took my own approch. The method was to take a collection of large PHP projects, including, WordPress, Mambo, Sphider, Smarty, Drupal, CodeIgniter, dump all their source code into a single file stripped of comments, and then run some simple regex over this file counting the occurance of each function.

Of course the problem with that is for languages like Python with namespaces you need to build the first parts of a compiler/interpreter to work out the most commonly used functions and objects. PHP however traditionally has not had namespaces which makes it rather easy to pull apart and work out the most common functions.

The results of this can be found below.

<table id="mytable">
  <tr>
    <th>
      % of calls
    </th>
    
    <th>
      Function Name
    </th>
  </tr>
  
  <tr>
    <td>
      22.67533433%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array">array</a>
    </td>
  </tr>
  
  <tr>
    <td>
      4.518332773%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20isset">isset</a>
    </td>
  </tr>
  
  <tr>
    <td>
      3.313605839%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20define">define</a>
    </td>
  </tr>
  
  <tr>
    <td>
      3.308496193%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20empty">empty</a>
    </td>
  </tr>
  
  <tr>
    <td>
      2.607069452%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20assert">assert</a>
    </td>
  </tr>
  
  <tr>
    <td>
      2.191271957%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20file">file</a>
    </td>
  </tr>
  
  <tr>
    <td>
      2.119353681%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20end">end</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.893251817%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20count">count</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.665872542%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20date">date</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.593571043%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ord">ord</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.553204834%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20print">print</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.436193926%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20substr">substr</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.419970798%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20dir">dir</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.32148236%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20pos">pos</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.229764203%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20time">time</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.199234064%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20exp">exp</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.098063061%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20key">key</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.081456709%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20list">list</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.047477559%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20log">log</a>
    </td>
  </tr>
  
  <tr>
    <td>
      1.0454337%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20com">com</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.997275281%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20each">each</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.972110271%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20header">header</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.959719378%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_a">is_a</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.959080672%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20chr">chr</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.935704039%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20defined">defined</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.904918418%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20unset">unset</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.869406374%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20dl">dl</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.845263294%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_array">is_array</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.845135553%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strlen">strlen</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.844113623%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20tan">tan</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.838109788%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20link">link</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.822269884%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20str_replace">str_replace</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.787396546%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20printf">printf</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.769768265%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20in_array">in_array</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.749074196%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20trim">trim</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.74626389%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20die">die</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.725697563%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20sprintf">sprintf</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.68264879%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strpos">strpos</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.660421827%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20preg_match">preg_match</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.622610442%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20pi">pi</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.606259573%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20delete">delete</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.60268282%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20explode">explode</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.554268918%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20min">min</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.534596779%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20implode">implode</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.529359391%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strtolower">strtolower</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.498956993%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20preg_replace">preg_replace</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.458846267%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20exec">exec</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.450159868%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20intval">intval</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.440707022%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20file_exists">file_exists</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.418480059%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20dirname">dirname</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.397275025%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20htmlspecialchars">htmlspecialchars</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.384884132%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20stat">stat</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.373004204%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20sin">sin</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.354737217%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20current">current</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.349244347%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20mail">mail</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.3484779%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_null">is_null</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.329572208%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_merge">array_merge</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.284351835%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20trigger_error">trigger_error</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.281286047%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20pack">pack</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.281158306%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20eval">eval</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.280008635%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20function_exists">function_exists</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.276942847%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strtoupper">strtoupper</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.275793177%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20sizeof">sizeof</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.257781672%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_keys">array_keys</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.251522355%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_object">is_object</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.251139132%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20idate">idate</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.24321918%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20serialize">serialize</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.237854051%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20sort">sort</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.237343086%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20reset">reset</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.235682451%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_key_exists">array_key_exists</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.212178076%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_numeric">is_numeric</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.202342007%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20abs">abs</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.201064595%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20exit">exit</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.200298148%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20extract">extract</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.190206596%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_string">is_string</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.185607914%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20next">next</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.180370526%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20max">max</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.179987303%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20rand">rand</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.173983468%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20main">main</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.159804198%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20settype">settype</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.159548716%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20fclose">fclose</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.159037751%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20round">round</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.151756505%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20fopen">fopen</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.142303659%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_dir">is_dir</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.142048176%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20getopt">getopt</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.141537212%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20addslashes">addslashes</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.140643023%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20urlencode">urlencode</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.140515282%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20fread">fread</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.138982388%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20md5">md5</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.138982388%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20unlink">unlink</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.130551471%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20fwrite">fwrite</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.129785024%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20copy">copy</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.129657283%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20get_class">get_class</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.122503778%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20hash">hash</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.121992813%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20split">split</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.121481849%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_shift">array_shift</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.118288319%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20class_exists">class_exists</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.116244461%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20call_user_func">call_user_func</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.115988978%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20basename">basename</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.111134814%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_push">array_push</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.110240626%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20prev">prev</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.107813544%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20glob">glob</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.106791615%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_pop">array_pop</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.104747756%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strstr">strstr</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.102065191%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20gettext">gettext</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.099127145%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20gettype">gettype</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.093634274%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_file">is_file</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.093378792%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20mktime">mktime</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.091718157%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20join">join</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.089674298%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20stripslashes">stripslashes</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.087374957%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20floor">floor</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.085714322%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ini_get">ini_get</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.084820134%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ob_start">ob_start</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.084564652%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20flush">flush</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.083925946%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20unserialize">unserialize</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.083159499%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_values">array_values</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.081626605%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20file_get_contents">file_get_contents</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.080476934%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20preg_match_all">preg_match_all</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.079327264%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20constant">constant</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.079071782%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20gmdate">gmdate</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.075878252%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20chmod">chmod</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.073578911%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_map">array_map</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.072684723%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strrpos">strrpos</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.072556982%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20print_r">print_r</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.072556982%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strtotime">strtotime</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.071535053%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20method_exists">method_exists</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.070257641%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_readable">is_readable</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.068852488%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20filesize">filesize</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.068724747%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20microtime">microtime</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.067447336%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_unique">array_unique</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.067447336%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20system">system</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.066680889%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_int">is_int</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.066042183%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20mysql_query">mysql_query</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.065914442%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20str_repeat">str_repeat</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.065020253%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20func_get_arg">func_get_arg</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.062337689%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strip_tags">strip_tags</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.062082207%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20call_user_func_array">call_user_func_array</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.061826724%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ini_set">ini_set</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.06131576%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_slice">array_slice</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.06131576%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20range">range</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.060804795%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20fputs">fputs</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.060166089%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20preg_quote">preg_quote</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.059655124%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20getdate">getdate</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.058633195%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20mkdir">mkdir</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.057611266%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20func_get_args">func_get_args</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.056333854%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ucfirst">ucfirst</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.055311925%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20xml_parse">xml_parse</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.053523548%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20rename">rename</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.053012584%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strtr">strtr</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.052373878%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20preg_split">preg_split</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.051351949%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20mt_rand">mt_rand</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.050968725%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ceil">ceil</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.048924866%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20version_compare">version_compare</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.048286161%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_diff">array_diff</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.047902937%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20rtrim">rtrim</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.047775196%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20curl_setopt">curl_setopt</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.047519714%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ob_end_clean">ob_end_clean</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.047519714%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strftime">strftime</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.045859079%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_writable">is_writable</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.045603596%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20base64_encode">base64_encode</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.045603596%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20urldecode">urldecode</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.044837149%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20extension_loaded">extension_loaded</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.044709408%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ksort">ksort</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.044453926%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20stristr">stristr</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.043942961%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20error_log">error_log</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.04381522%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20realpath">realpath</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.043559738%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_search">array_search</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.043048773%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20crypt">crypt</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.043048773%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20substr_count">substr_count</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.042665549%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_bool">is_bool</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.041771361%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20configuration">configuration</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.04164362%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ftell">ftell</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.04164362%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20readdir">readdir</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.041515879%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20var_export">var_export</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.041388138%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20cos">cos</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.041260397%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20usage">usage</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.040621691%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20htmlentities">htmlentities</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.040621691%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20preg_replace_callback">preg_replace_callback</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.04049395%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20feof">feof</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.040238467%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20error_reporting">error_reporting</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.038961056%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20pow">pow</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.038961056%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20setcookie">setcookie</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.037811385%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_reverse">array_reverse</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.037811385%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20ob_get_contents">ob_get_contents</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.037555903%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20get_object_vars">get_object_vars</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.037172679%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20opendir">opendir</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.036661715%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20number_format">number_format</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.036661715%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20stripos">stripos</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.035512044%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20fgets">fgets</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.035128821%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20hexdec">hexdec</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.034745597%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20getenv">getenv</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.034490115%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20parse_url">parse_url</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.033851409%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20is_resource">is_resource</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.033468185%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20compact">compact</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.033468185%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strcmp">strcmp</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.033084962%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20filemtime">filemtime</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.033084962%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20sha1">sha1</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.032573997%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20array_unshift">array_unshift</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.032446256%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20get_current_user">get_current_user</a>
    </td>
  </tr>
  
  <tr>
    <td>
      0.031935291%
    </td>
    
    <td>
      <a href="http://searchco.de/?q=php%20strrchr">strrchr</a>
    </td>
  </tr>
  
  <tr>
    <td>
      96.22% total
    </td>
    
    <td>
      200 total
    </td>
  </tr>
</table>

&nbsp;