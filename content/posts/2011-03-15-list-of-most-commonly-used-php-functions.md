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

One of the things about ranking in Search is that you need to consider all sorts of methods of working out what is relevent. Google broke new ground (although the idea had already existed) with its PageRank algorithm which supplied better search results then all the other search engines. For what I am doing however I need to consider what programmers are looking for. One thing that I considered some time ago was working out which are the most common functions in a language and adding this as an additional signal to ranking.

I couldn't find anywhere else on the web with this question answered so I took my own approch. The method was to take a collection of large PHP projects, including, WordPress, Mambo, Sphider, Smarty, Drupal, CodeIgniter, dump all their source code into a single file stripped of comments, and then run some simple regex over this file counting the occurance of each function.

Of course the problem with that is for languages like Python with namespaces you need to build the first parts of a compiler/interpreter to work out the most commonly used functions and objects. PHP however traditionally has not had namespaces which makes it rather easy to pull apart and work out the most common functions.

The results of this can be found below.

| % of calls      | Function Name                                      |
|-----------------|----------------------------------------------------|
| 22.67533433%    | [array](https://searchcode.com/?q=php%20array)     |
| 4.518332773%    | [isset](https://searchcode.com/?q=php%20isset)     |
| 3.313605839%    | [define](https://searchcode.com/?q=php%20define)   |
| 3.308496193%    | [empty](https://searchcode.com/?q=php%20empty)     |
| 2.607069452%    | [assert](https://searchcode.com/?q=php%20assert)   |
| 2.191271957%    | [file](https://searchcode.com/?q=php%20file)       |
| 2.119353681%    | [end](https://searchcode.com/?q=php%20end)         |
| 1.893251817%    | [count](https://searchcode.com/?q=php%20count)     |
| 1.665872542%    | [date](https://searchcode.com/?q=php%20date)       |
| 1.593571043%    | [ord](https://searchcode.com/?q=php%20ord)         |
| 1.553204834%    | [print](https://searchcode.com/?q=php%20print)     |
| 1.436193926%    | [substr](https://searchcode.com/?q=php%20substr)   |
| 1.419970798%    | [dir](https://searchcode.com/?q=php%20dir)         |
| 1.32148236%     | [pos](https://searchcode.com/?q=php%20pos)         |
| 1.229764203%    | [time](https://searchcode.com/?q=php%20time)       |
| 1.199234064%    | [exp](https://searchcode.com/?q=php%20exp)         |
| 1.098063061%    | [key](https://searchcode.com/?q=php%20key)         |
| 1.081456709%    | [list](https://searchcode.com/?q=php%20list)       |
| 1.047477559%    | [log](https://searchcode.com/?q=php%20log)         |
| 1.0454337%      | [com](https://searchcode.com/?q=php%20com)         |
| 0.997275281%    | [each](https://searchcode.com/?q=php%20each)       |
| 0.972110271%    | [header](https://searchcode.com/?q=php%20header)   |
| 0.959719378%    | [is_a](https://searchcode.com/?q=php%20is_a)       |
| 0.959080672%    | [chr](https://searchcode.com/?q=php%20chr)         |
| 0.935704039%    | [defined](https://searchcode.com/?q=php%20defined) |
| 0.904918418%    | [unset](https://searchcode.com/?q=php%20unset)     |
| 0.869406374%    | [dl](https://searchcode.com/?q=php%20dl)           |
| 0.845263294%    | [is_array](https://searchcode.com/?q=php%20is_array) |
| 0.845135553%    | [strlen](https://searchcode.com/?q=php%20strlen)   |
| 0.844113623%    | [tan](https://searchcode.com/?q=php%20tan)         |
| 0.838109788%    | [link](https://searchcode.com/?q=php%20link)       |
| 0.822269884%    | [str_replace](https://searchcode.com/?q=php%20str_replace) |
| 0.787396546%    | [printf](https://searchcode.com/?q=php%20printf)   |
| 0.769768265%    | [in_array](https://searchcode.com/?q=php%20in_array) |
| 0.749074196%    | [trim](https://searchcode.com/?q=php%20trim)       |
| 0.74626389%     | [die](https://searchcode.com/?q=php%20die)         |
| 0.725697563%    | [sprintf](https://searchcode.com/?q=php%20sprintf) |
| 0.68264879%     | [strpos](https://searchcode.com/?q=php%20strpos)   |
| 0.660421827%    | [preg_match](https://searchcode.com/?q=php%20preg_match) |
| 0.622610442%    | [pi](https://searchcode.com/?q=php%20pi)           |
| 0.606259573%    | [delete](https://searchcode.com/?q=php%20delete)   |
| 0.60268282%     | [explode](https://searchcode.com/?q=php%20explode) |
| 0.554268918%    | [min](https://searchcode.com/?q=php%20min)         |
| 0.534596779%    | [implode](https://searchcode.com/?q=php%20implode) |
| 0.529359391%    | [strtolower](https://searchcode.com/?q=php%20strtolower) |
| 0.498956993%    | [preg_replace](https://searchcode.com/?q=php%20preg_replace) |
| 0.458846267%    | [exec](https://searchcode.com/?q=php%20exec)       |
| 0.450159868%    | [intval](https://searchcode.com/?q=php%20intval)   |
| 0.440707022%    | [file_exists](https://searchcode.com/?q=php%20file_exists) |
| 0.418480059%    | [dirname](https://searchcode.com/?q=php%20dirname) |
| 0.397275025%    | [htmlspecialchars](https://searchcode.com/?q=php%20htmlspecialchars) |
| 0.384884132%    | [stat](https://searchcode.com/?q=php%20stat)       |
| 0.373004204%    | [sin](https://searchcode.com/?q=php%20sin)         |
| 0.354737217%    | [current](https://searchcode.com/?q=php%20current) |
| 0.349244347%    | [mail](https://searchcode.com/?q=php%20mail)       |
| 0.3484779%      | [is_null](https://searchcode.com/?q=php%20is_null) |
| 0.329572208%    | [array_merge](https://searchcode.com/?q=php%20array_merge) |
| 0.284351835%    | [trigger_error](https://searchcode.com/?q=php%20trigger_error) |
| 0.281286047%    | [pack](https://searchcode.com/?q=php%20pack)       |
| 0.281158306%    | [eval](https://searchcode.com/?q=php%20eval)       |
| 0.280008635%    | [function_exists](https://searchcode.com/?q=php%20function_exists) |
| 0.276942847%    | [strtoupper](https://searchcode.com/?q=php%20strtoupper) |
| 0.275793177%    | [sizeof](https://searchcode.com/?q=php%20sizeof)   |
| 0.257781672%    | [array_keys](https://searchcode.com/?q=php%20array_keys) |
| 0.251522355%    | [is_object](https://searchcode.com/?q=php%20is_object) |
| 0.251139132%    | [idate](https://searchcode.com/?q=php%20idate)     |
| 0.24321918%     | [serialize](https://searchcode.com/?q=php%20serialize) |
| 0.237854051%    | [sort](https://searchcode.com/?q=php%20sort)       |
| 0.237343086%    | [reset](https://searchcode.com/?q=php%20reset)     |
| 0.235682451%    | [array_key_exists](https://searchcode.com/?q=php%20array_key_exists) |
| 0.212178076%    | [is_numeric](https://searchcode.com/?q=php%20is_numeric) |
| 0.202342007%    | [abs](https://searchcode.com/?q=php%20abs)         |
| 0.201064595%    | [exit](https://searchcode.com/?q=php%20exit)       |
| 0.200298148%    | [extract](https://searchcode.com/?q=php%20extract) |
| 0.190206596%    | [is_string](https://searchcode.com/?q=php%20is_string) |
| 0.185607914%    | [next](https://searchcode.com/?q=php%20next)       |
| 0.180370526%    | [max](https://searchcode.com/?q=php%20max)         |
| 0.179987303%    | [rand](https://searchcode.com/?q=php%20rand)       |
| 0.173983468%    | [main](https://searchcode.com/?q=php%20main)       |
| 0.159804198%    | [settype](https://searchcode.com/?q=php%20settype) |
| 0.159548716%    | [fclose](https://searchcode.com/?q=php%20fclose)   |
| 0.159037751%    | [round](https://searchcode.com/?q=php%20round)     |
| 0.151756505%    | [fopen](https://searchcode.com/?q=php%20fopen)     |
| 0.142303659%    | [is_dir](https://searchcode.com/?q=php%20is_dir)   |
| 0.142048176%    | [getopt](https://searchcode.com/?q=php%20getopt)   |
| 0.141537212%    | [addslashes](https://searchcode.com/?q=php%20addslashes) |
| 0.140643023%    | [urlencode](https://searchcode.com/?q=php%20urlencode) |
| 0.140515282%    | [fread](https://searchcode.com/?q=php%20fread)     |
| 0.138982388%    | [md5](https://searchcode.com/?q=php%20md5)         |
| 0.138982388%    | [unlink](https://searchcode.com/?q=php%20unlink)   |
| 0.130551471%    | [fwrite](https://searchcode.com/?q=php%20fwrite)   |
| 0.129785024%    | [copy](https://searchcode.com/?q=php%20copy)       |
| 0.129657283%    | [get_class](https://searchcode.com/?q=php%20get_class) |
| 0.122503778%    | [hash](https://searchcode.com/?q=php%20hash)       |
| 0.121992813%    | [split](https://searchcode.com/?q=php%20split)     |
| 0.121481849%    | [array_shift](https://searchcode.com/?q=php%20array_shift) |
| 0.118288319%    | [class_exists](https://searchcode.com/?q=php%20class_exists) |
| 0.116244461%    | [call_user_func](https://searchcode.com/?q=php%20call_user_func) |
| 0.115988978%    | [basename](https://searchcode.com/?q=php%20basename) |
| 0.111134814%    | [array_push](https://searchcode.com/?q=php%20array_push) |
| 0.110240626%    | [prev](https://searchcode.com/?q=php%20prev)       |
| 0.107813544%    | [glob](https://searchcode.com/?q=php%20glob)       |
| 0.106791615%    | [array_pop](https://searchcode.com/?q=php%20array_pop) |
| 0.104747756%    | [strstr](https://searchcode.com/?q=php%20strstr)   |
| 0.102065191%    | [gettext](https://searchcode.com/?q=php%20gettext) |
| 0.099127145%    | [gettype](https://searchcode.com/?q=php%20gettype) |
| 0.093634274%    | [is_file](https://searchcode.com/?q=php%20is_file) |
| 0.093378792%    | [mktime](https://searchcode.com/?q=php%20mktime)   |
| 0.091718157%    | [join](https://searchcode.com/?q=php%20join)       |
| 0.089674298%    | [stripslashes](https://searchcode.com/?q=php%20stripslashes) |
| 0.087374957%    | [floor](https://searchcode.com/?q=php%20floor)     |
| 0.085714322%    | [ini_get](https://searchcode.com/?q=php%20ini_get) |
| 0.084820134%    | [ob_start](https://searchcode.com/?q=php%20ob_start) |
| 0.084564652%    | [flush](https://searchcode.com/?q=php%20flush)     |
| 0.083925946%    | [unserialize](https://searchcode.com/?q=php%20unserialize) |
| 0.083159499%    | [array_values](https://searchcode.com/?q=php%20array_values) |
| 0.081626605%    | [file_get_contents](https://searchcode.com/?q=php%20file_get_contents) |
| 0.080476934%    | [preg_match_all](https://searchcode.com/?q=php%20preg_match_all) |
| 0.079327264%    | [constant](https://searchcode.com/?q=php%20constant) |
| 0.079071782%    | [gmdate](https://searchcode.com/?q=php%20gmdate)   |
| 0.075878252%    | [chmod](https://searchcode.com/?q=php%20chmod)     |
| 0.073578911%    | [array_map](https://searchcode.com/?q=php%20array_map) |
| 0.072684723%    | [strrpos](https://searchcode.com/?q=php%20strrpos) |
| 0.072556982%    | [print_r](https://searchcode.com/?q=php%20print_r) |
| 0.072556982%    | [strtotime](https://searchcode.com/?q=php%20strtotime) |
| 0.071535053%    | [method_exists](https://searchcode.com/?q=php%20method_exists) |
| 0.070257641%    | [is_readable](https://searchcode.com/?q=php%20is_readable) |
| 0.068852488%    | [filesize](https://searchcode.com/?q=php%20filesize) |
| 0.068724747%    | [microtime](https://searchcode.com/?q=php%20microtime) |
| 0.067447336%    | [array_unique](https://searchcode.com/?q=php%20array_unique) |
| 0.067447336%    | [system](https://searchcode.com/?q=php%20system)   |
| 0.066680889%    | [is_int](https://searchcode.com/?q=php%20is_int)   |
| 0.066042183%    | [mysql_query](https://searchcode.com/?q=php%20mysql_query) |
| 0.065914442%    | [str_repeat](https://searchcode.com/?q=php%20str_repeat) |
| 0.065020253%    | [func_get_arg](https://searchcode.com/?q=php%20func_get_arg) |
| 0.062337689%    | [strip_tags](https://searchcode.com/?q=php%20strip_tags) |
| 0.062082207%    | [call_user_func_array](https://searchcode.com/?q=php%20call_user_func_array) |
| 0.061826724%    | [ini_set](https://searchcode.com/?q=php%20ini_set) |
| 0.06131576%     | [array_slice](https://searchcode.com/?q=php%20array_slice) |
| 0.06131576%     | [range](https://searchcode.com/?q=php%20range)     |
| 0.060804795%    | [fputs](https://searchcode.com/?q=php%20fputs)     |
| 0.060166089%    | [preg_quote](https://searchcode.com/?q=php%20preg_quote) |
| 0.059655124%    | [getdate](https://searchcode.com/?q=php%20getdate) |
| 0.058633195%    | [mkdir](https://searchcode.com/?q=php%20mkdir)     |
| 0.057611266%    | [func_get_args](https://searchcode.com/?q=php%20func_get_args) |
| 0.056333854%    | [ucfirst](https://searchcode.com/?q=php%20ucfirst) |
| 0.055311925%    | [xml_parse](https://searchcode.com/?q=php%20xml_parse) |
| 0.053523548%    | [rename](https://searchcode.com/?q=php%20rename)   |
| 0.053012584%    | [strtr](https://searchcode.com/?q=php%20strtr)     |
| 0.052373878%    | [preg_split](https://searchcode.com/?q=php%20preg_split) |
| 0.051351949%    | [mt_rand](https://searchcode.com/?q=php%20mt_rand) |
| 0.050968725%    | [ceil](https://searchcode.com/?q=php%20ceil)       |
| 0.048924866%    | [version_compare](https://searchcode.com/?q=php%20version_compare) |
| 0.048286161%    | [array_diff](https://searchcode.com/?q=php%20array_diff) |
| 0.047902937%    | [rtrim](https://searchcode.com/?q=php%20rtrim)     |
| 0.047775196%    | [curl_setopt](https://searchcode.com/?q=php%20curl_setopt) |
| 0.047519714%    | [ob_end_clean](https://searchcode.com/?q=php%20ob_end_clean) |
| 0.047519714%    | [strftime](https://searchcode.com/?q=php%20strftime) |
| 0.045859079%    | [is_writable](https://searchcode.com/?q=php%20is_writable) |
| 0.045603596%    | [base64_encode](https://searchcode.com/?q=php%20base64_encode) |
| 0.045603596%    | [urldecode](https://searchcode.com/?q=php%20urldecode) |
| 0.044837149%    | [extension_loaded](https://searchcode.com/?q=php%20extension_loaded) |
| 0.044709408%    | [ksort](https://searchcode.com/?q=php%20ksort)     |
| 0.044453926%    | [stristr](https://searchcode.com/?q=php%20stristr) |
| 0.043942961%    | [error_log](https://searchcode.com/?q=php%20error_log) |
| 0.04381522%     | [realpath](https://searchcode.com/?q=php%20realpath) |
| 0.043559738%    | [array_search](https://searchcode.com/?q=php%20array_search) |
| 0.043048773%    | [crypt](https://searchcode.com/?q=php%20crypt)     |
| 0.043048773%    | [substr_count](https://searchcode.com/?q=php%20substr_count) |
| 0.042665549%    | [is_bool](https://searchcode.com/?q=php%20is_bool) |
| 0.041771361%    | [configuration](https://searchcode.com/?q=php%20configuration) |
| 0.04164362%     | [ftell](https://searchcode.com/?q=php%20ftell)     |
| 0.04164362%     | [readdir](https://searchcode.com/?q=php%20readdir) |
| 0.041515879%    | [var_export](https://searchcode.com/?q=php%20var_export) |
| 0.041388138%    | [cos](https://searchcode.com/?q=php%20cos)         |
| 0.041260397%    | [usage](https://searchcode.com/?q=php%20usage)     |
| 0.040621691%    | [htmlentities](https://searchcode.com/?q=php%20htmlentities) |
| 0.040621691%    | [preg_replace_callback](https://searchcode.com/?q=php%20preg_replace_callback) |
| 0.04049395%     | [feof](https://searchcode.com/?q=php%20feof)       |
| 0.040238467%    | [error_reporting](https://searchcode.com/?q=php%20error_reporting) |
| 0.038961056%    | [pow](https://searchcode.com/?q=php%20pow)         |
| 0.038961056%    | [setcookie](https://searchcode.com/?q=php%20setcookie) |
| 0.037811385%    | [array_reverse](https://searchcode.com/?q=php%20array_reverse) |
| 0.037811385%    | [ob_get_contents](https://searchcode.com/?q=php%20ob_get_contents) |
| 0.037555903%    | [get_object_vars](https://searchcode.com/?q=php%20get_object_vars) |
| 0.037172679%    | [opendir](https://searchcode.com/?q=php%20opendir) |
| 0.036661715%    | [number_format](https://searchcode.com/?q=php%20number_format) |
| 0.036661715%    | [stripos](https://searchcode.com/?q=php%20stripos) |
| 0.035512044%    | [fgets](https://searchcode.com/?q=php%20fgets)     |
| 0.035128821%    | [hexdec](https://searchcode.com/?q=php%20hexdec)   |
| 0.034745597%    | [getenv](https://searchcode.com/?q=php%20getenv)   |
| 0.034490115%    | [parse_url](https://searchcode.com/?q=php%20parse_url) |
| 0.033851409%    | [is_resource](https://searchcode.com/?q=php%20is_resource) |
| 0.033468185%    | [compact](https://searchcode.com/?q=php%20compact) |
| 0.033468185%    | [strcmp](https://searchcode.com/?q=php%20strcmp)   |
| 0.033084962%    | [filemtime](https://searchcode.com/?q=php%20filemtime) |
| 0.033084962%    | [sha1](https://searchcode.com/?q=php%20sha1)       |
| 0.032573997%    | [array_unshift](https://searchcode.com/?q=php%20array_unshift) |
| 0.032446256%    | [get_current_user](https://searchcode.com/?q=php%20get_current_user) |
| 0.031935291%    | [strrchr](https://searchcode.com/?q=php%20strrchr) |
| 96.22% total    | 200 total                                          |
