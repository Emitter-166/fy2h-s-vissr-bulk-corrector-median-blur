# About

This is just a simple, personal script that helps me bulk correct lines + add median blur to all fengyun images and get them at 1 place. It also supports making the images smaller in size, cropping the images out by 57%, etc.

This is NOT user friendly. you have to manually comment uncomment functions to ruin it lol.


# System dependencies required:
    1. ImageMagik version 6
    2. Python3
    3. Satdump, with custom vissr generation pipeline
    4. Nodejs

# Pre setup
    1. Make sure you are recording the data with the provided pipeline FengYun-2_corrector.json

# Guide

    1. Put all your satdump s-vissr live processing folders into 1 folder.
    2. In index.ts, edit dir_in and dir_out variables to your respective folders
    3. Run `npm i` to install all nodejs dependencies required
    4. Run `npx tsc` to compile typescript into javascript
    5. Run `node .` to run the program
