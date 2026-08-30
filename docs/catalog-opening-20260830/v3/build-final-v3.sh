#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$repo_root"

pc_bg="docs/catalog-opening-20260830/v3/raw/higgsfield-background-pc-v3.mp4"
sp_bg="docs/catalog-opening-20260830/v3/raw/higgsfield-background-sp-v3.mp4"

test -f "$pc_bg"
test -f "$sp_bg"

ease="0.5-0.5*cos(PI*clip((t-0.9)/3.1,0,1))"

ffmpeg -y \
  -i "$pc_bg" \
  -framerate 24 -loop 1 -i assets/catalog/raw/v3-composite/bird-pc-top-clean.png \
  -framerate 24 -loop 1 -i assets/catalog/raw/v3-composite/bird-pc-bottom-clean.png \
  -framerate 24 -loop 1 -i assets/std/cover_pc_1920.webp \
  -filter_complex "
    [0:v]fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=rgba[bg];
    [1:v]format=rgba,fade=t=in:st=0.90:d=0.25:alpha=1[top];
    [bg][top]overlay=x='1410-330*(${ease})':y='150-135*(${ease})+5*sin(2*PI*(t-0.9)/1.8)*(1-(${ease}))'[bt];
    [2:v]format=rgba,fade=t=in:st=0.90:d=0.25:alpha=1[bottom];
    [bt][bottom]overlay=x='80+235*(${ease})':y='520+5*(${ease})+4*sin(2*PI*(t-0.9)/1.7)*(1-(${ease}))'[birds];
    [3:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=rgba,fade=t=in:st=4.08:d=0.37:alpha=1[exact];
    [birds][exact]overlay=0:0,format=yuv420p[out]
  " \
  -map "[out]" -t 5.708333 -r 24 -an -c:v libx264 -preset slow -crf 17 -movflags +faststart \
  assets/catalog/cover-opening-desktop-v3.mp4

ffmpeg -y \
  -i "$sp_bg" \
  -framerate 24 -loop 1 -i assets/catalog/raw/v3-composite/bird-sp-top-clean.png \
  -framerate 24 -loop 1 -i assets/catalog/raw/v3-composite/bird-sp-bottom-clean.png \
  -framerate 24 -loop 1 -i assets/std/cover_sp_1080.webp \
  -filter_complex "
    [0:v]fps=24,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=rgba[bg];
    [1:v]format=rgba,fade=t=in:st=0.90:d=0.25:alpha=1[top];
    [bg][top]overlay=x='760-260*(${ease})':y='145-82*(${ease})+5*sin(2*PI*(t-0.9)/1.8)*(1-(${ease}))'[bt];
    [2:v]format=rgba,fade=t=in:st=0.90:d=0.25:alpha=1[bottom];
    [bt][bottom]overlay=x='45+340*(${ease})':y='1495-262*(${ease})+4*sin(2*PI*(t-0.9)/1.7)*(1-(${ease}))'[birds];
    [3:v]crop=1080:1920:0:7,format=rgba,fade=t=in:st=4.08:d=0.37:alpha=1[exact];
    [birds][exact]overlay=0:0,format=yuv420p[out]
  " \
  -map "[out]" -t 5.708333 -r 24 -an -c:v libx264 -preset slow -crf 17 -movflags +faststart \
  assets/catalog/cover-opening-mobile-v3.mp4
