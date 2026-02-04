build:
	hugo

push: build
	rsync -avzh ./public/ root@boyter.org:/var/www/boyter.org/

run:
	hugo server -D