#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"

pc_ease="0.5-0.5*cos(PI*clip((t-0.9)/3.1,0,1))"
sp_ease="$pc_ease"

ffmpeg -y \
  -framerate 24 -loop 1 -i assets/catalog/cover-opening-start-desktop.webp \
  -framerate 24 -loop 1 -i assets/catalog/raw/v2-composite/cover-pc-no-birds-final.png \
  -framerate 24 -loop 1 -i assets/catalog/raw/v2-composite/bird-pc-top.png \
  -framerate 24 -loop 1 -i assets/catalog/raw/v2-composite/bird-pc-bottom.png \
  -framerate 24 -loop 1 -i assets/std/cover_pc_1920.webp \
  -filter_complex "
    [0:v]format=rgba,setsar=1[start];
    [1:v]format=rgba,fade=t=in:st=0.7:d=2.4:alpha=1[flowers];
    [start][flowers]overlay=0:0[base];
    [2:v]format=rgba,fade=t=in:st=0.9:d=0.28:alpha=1[topbird];
    [base][topbird]overlay=x='1430-350*(${pc_ease})':y='160-145*(${pc_ease})+8*sin(2*PI*(t-0.9)/1.6)*(1-(${pc_ease}))'[withtop];
    [3:v]format=rgba,fade=t=in:st=0.9:d=0.28:alpha=1[bottombird];
    [withtop][bottombird]overlay=x='315*(${pc_ease})':y='600-75*(${pc_ease})+7*sin(2*PI*(t-0.9)/1.5)*(1-(${pc_ease}))'[withbirds];
    [4:v]scale=-1:1080,crop=1920:1080,format=rgba,fade=t=in:st=4.08:d=0.42:alpha=1[exact];
    [withbirds][exact]overlay=0:0,format=yuv420p[out]
  " \
  -map "[out]" -t 5.7 -r 24 -an -c:v libx264 -preset slow -crf 18 -movflags +faststart \
  assets/catalog/cover-opening-desktop-v2.mp4

ffmpeg -y \
  -framerate 24 -loop 1 -i assets/catalog/cover-opening-start-mobile.webp \
  -framerate 24 -loop 1 -i assets/catalog/raw/v2-composite/cover-sp-no-birds-final.png \
  -framerate 24 -loop 1 -i assets/catalog/raw/v2-composite/bird-sp-top.png \
  -framerate 24 -loop 1 -i assets/catalog/raw/v2-composite/bird-sp-bottom.png \
  -framerate 24 -loop 1 -i assets/std/cover_sp_1080.webp \
  -filter_complex "
    [0:v]format=rgba,setsar=1[start];
    [1:v]format=rgba,fade=t=in:st=0.7:d=2.4:alpha=1[flowers];
    [start][flowers]overlay=0:0[base];
    [2:v]format=rgba,fade=t=in:st=0.9:d=0.28:alpha=1[topbird];
    [base][topbird]overlay=x='760-260*(${sp_ease})':y='160-97*(${sp_ease})+8*sin(2*PI*(t-0.9)/1.6)*(1-(${sp_ease}))'[withtop];
    [3:v]format=rgba,fade=t=in:st=0.9:d=0.28:alpha=1[bottombird];
    [withtop][bottombird]overlay=x='385*(${sp_ease})':y='1380-147*(${sp_ease})+7*sin(2*PI*(t-0.9)/1.5)*(1-(${sp_ease}))'[withbirds];
    [4:v]crop=1080:1920:0:7,format=rgba,fade=t=in:st=4.08:d=0.42:alpha=1[exact];
    [withbirds][exact]overlay=0:0,format=yuv420p[out]
  " \
  -map "[out]" -t 5.7 -r 24 -an -c:v libx264 -preset slow -crf 18 -movflags +faststart \
  assets/catalog/cover-opening-mobile-v2.mp4
