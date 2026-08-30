#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$repo_root"

qa="docs/catalog-opening-20260830/v3/qa"
mkdir -p "$qa/pc-frames" "$qa/sp-frames"

magick -size 485x520 xc:'#29d3c2' assets/catalog/raw/v3-composite/bird-pc-top-clean.png -composite "$qa/cutout-pc-top-cyan.png"
magick -size 545x547 xc:'#7a3cff' assets/catalog/raw/v3-composite/bird-pc-bottom-clean.png -composite "$qa/cutout-pc-bottom-violet.png"
magick -size 310x415 xc:'#29d3c2' assets/catalog/raw/v3-composite/bird-sp-top-clean.png -composite "$qa/cutout-sp-top-cyan.png"
magick -size 420x405 xc:'#7a3cff' assets/catalog/raw/v3-composite/bird-sp-bottom-clean.png -composite "$qa/cutout-sp-bottom-violet.png"
magick montage "$qa/cutout-pc-top-cyan.png" "$qa/cutout-pc-bottom-violet.png" "$qa/cutout-sp-top-cyan.png" "$qa/cutout-sp-bottom-violet.png" \
  -background '#171717' -gravity center -tile 4x1 -geometry 560x580+8+8 "$qa/cutout-proof-contrast.png"

ffprobe -v error -show_streams -show_format -of json assets/catalog/cover-opening-desktop-v3.mp4 > "$qa/ffprobe-pc-v3.json"
ffprobe -v error -show_streams -show_format -of json assets/catalog/cover-opening-mobile-v3.mp4 > "$qa/ffprobe-sp-v3.json"

ffmpeg -y -loglevel error -i assets/catalog/cover-opening-desktop-v3.mp4 \
  -vf "fps=10/5.708333,scale=640:-1" "$qa/pc-frames/frame-%02d.jpg"
ffmpeg -y -loglevel error -i assets/catalog/cover-opening-mobile-v3.mp4 \
  -vf "fps=10/5.708333,scale=360:-1" "$qa/sp-frames/frame-%02d.jpg"

magick montage "$qa"/pc-frames/frame-*.jpg -background '#f2eee8' -gravity center -tile 5x2 -geometry 660x380+0+0 "$qa/pc-v3-10frames.jpg"
magick montage "$qa"/sp-frames/frame-*.jpg -background '#f2eee8' -gravity center -tile 5x2 -geometry 380x660+0+0 "$qa/sp-v3-10frames.jpg"

ffmpeg -y -loglevel error -ss 5.2 -i assets/catalog/cover-opening-desktop-v3.mp4 -frames:v 1 -update 1 "$qa/pc-v3-end.png"
ffmpeg -y -loglevel error -ss 5.2 -i assets/catalog/cover-opening-mobile-v3.mp4 -frames:v 1 -update 1 "$qa/sp-v3-end.png"

magick assets/std/cover_pc_1920.webp -resize 1920x1080^ -gravity center -extent 1920x1080 "$qa/pc-reference.png"
magick assets/std/cover_sp_1080.webp -crop 1080x1920+0+7 +repage "$qa/sp-reference.png"

magick compare -metric RMSE "$qa/pc-reference.png" "$qa/pc-v3-end.png" null: 2> "$qa/pc-end-rmse.txt" || true
magick compare -metric RMSE "$qa/sp-reference.png" "$qa/sp-v3-end.png" null: 2> "$qa/sp-end-rmse.txt" || true

shasum -a 256 assets/catalog/cover-opening-desktop-v3.mp4 assets/catalog/cover-opening-mobile-v3.mp4 > "$qa/sha256.txt"
