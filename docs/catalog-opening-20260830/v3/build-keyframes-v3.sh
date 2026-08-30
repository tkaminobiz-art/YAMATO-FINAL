#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$repo_root"

out="docs/catalog-opening-20260830/v3/keyframes"
mkdir -p "$out"

# Background keyframes used for Higgsfield start/end control.
magick assets/catalog/cover-opening-start-desktop.webp "$out/pc-background-start.png"
magick assets/catalog/cover-opening-start-mobile.webp "$out/sp-background-start.png"
magick assets/catalog/raw/v2-composite/cover-pc-no-birds-final.png "$out/pc-background-end.png"
magick assets/catalog/raw/v2-composite/cover-sp-no-birds-final.png "$out/sp-background-end.png"

# Full editorial keyframes. The birds are canonical transparent crops and are
# never passed to the generation model.
magick "$out/pc-background-start.png" \
  assets/catalog/raw/v3-composite/bird-pc-top-clean.png -geometry +1410+150 -composite \
  assets/catalog/raw/v3-composite/bird-pc-bottom-clean.png -geometry +80+520 -composite \
  "$out/pc-full-start.png"

magick assets/catalog/cover-opening-start-desktop.webp \
  assets/catalog/raw/v2-composite/cover-pc-no-birds-final.png -define compose:args=45 -compose blend -composite \
  assets/catalog/raw/v3-composite/bird-pc-top-clean.png -geometry +1245+100 -composite \
  assets/catalog/raw/v3-composite/bird-pc-bottom-clean.png -geometry +190+540 -composite \
  "$out/pc-full-middle.png"

magick assets/std/cover_pc_1920.webp -resize 1920x1080^ -gravity center -extent 1920x1080 "$out/pc-full-end.png"

magick "$out/sp-background-start.png" \
  assets/catalog/raw/v3-composite/bird-sp-top-clean.png -geometry +760+145 -composite \
  assets/catalog/raw/v3-composite/bird-sp-bottom-clean.png -geometry +45+1495 -composite \
  "$out/sp-full-start.png"

magick assets/catalog/cover-opening-start-mobile.webp \
  assets/catalog/raw/v2-composite/cover-sp-no-birds-final.png -define compose:args=45 -compose blend -composite \
  assets/catalog/raw/v3-composite/bird-sp-top-clean.png -geometry +635+105 -composite \
  assets/catalog/raw/v3-composite/bird-sp-bottom-clean.png -geometry +210+1380 -composite \
  "$out/sp-full-middle.png"

magick assets/std/cover_sp_1080.webp -crop 1080x1920+0+7 +repage "$out/sp-full-end.png"

magick "$out/pc-full-start.png" "$out/pc-full-middle.png" "$out/pc-full-end.png" \
  -thumbnail 640x360 -background '#f2eee8' -gravity center -extent 660x380 +append \
  "$out/pc-keyframes-contact.jpg"

magick "$out/sp-full-start.png" "$out/sp-full-middle.png" "$out/sp-full-end.png" \
  -thumbnail 360x640 -background '#f2eee8' -gravity center -extent 380x660 +append \
  "$out/sp-keyframes-contact.jpg"
