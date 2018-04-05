---
title: Collection of Letters for Neural Network OCR Training
author: Ben E. Boyter
type: post
date: 2013-09-03T05:59:42+00:00
url: /2013/09/collection-letters-training/
categories:
  - CAPTCHA

---
I was looking for this on Google the other day and unable to find it. Essentially what I needed was a collection of images which are all the same size, but of different fonts so that I use them for training Neural Networks and test other OCR techniques. Since I couldn&#8217;t find any I thought I would upload my own collection.

I used the below images when working on my thesis. From memory over 20 different fonts and sizes were used to create about 200 examples of each letter. The full data set proved to be pretty accurate when it came to recognizing most examples of text I found on the web.

The attached collection of images were generated using a script. It essentially just generated a number of images each which has a letter contained in it. Then another script which finds the location of the letter in the image, and crops to just that image and then resizes it to a specific size and are then saved in an appropriate directory. The full training set can be downloaded below

[Collection of letters for CAPTCHA/OCR/Neural Network training.][1]

The PHP program for generating the images is included below. All you need do is add some fonts into the referenced fonts directory and it should generate images for you.

<pre>set_time_limit(0);
$files1 = scandir("./fonts/");
array_splice($files1,0, 1);
array_splice($files1,0, 1);
$file1totalcount = count($files1);
$file1count = 0;
$letters = "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z";
//$letters = "a b c d e f g h i j k l m n o p q r s t u v w x y z";
$array = explode(" ",$letters);
$number = 200;

foreach($array as $letter) {
 for($i=0;$i&lt;$number;$i++) {
  $im = imagecreatetruecolor(500, 300);
  // Create some colors
  $white = imagecolorallocate($im, 255, 255, 255);
  $grey = imagecolorallocate($im, 128, 128, 128);
  $black = imagecolorallocate($im, 0, 0, 0);
  imagefilledrectangle($im, 0, 0, 800, 800, $black);

  $font = './fonts/'.$files1[rand(0,$file1totalcount-1)];	
  imagettftext($im, rand(15,30), 0, rand(30,200),rand(20,250), $white, $font, $letter);
  if(!is_dir($letter))
   mkdir($letter);
   imagegif($im,"./".$letter."/$i.gif");
   imagedestroy($im);
  }
}</pre>

 [1]: http://www.boyter.org/wp-content/uploads/2013/07/training.zip