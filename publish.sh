#!/bin/bash

hugo && rsync -avzh --chmod=D755,F644 ./public/ root@boyter.org:/var/www/boyter.org/
