#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
out_dir="$repo_root/assets/catalog/mobile"
mkdir -p "$out_dir"

crop_4x5() {
  local source="$1"
  local name="$2"
  local gravity="${3:-Center}"
  magick "$repo_root/$source" \
    -auto-orient \
    -resize '1080x1350^' \
    -gravity "$gravity" \
    -crop 1080x1350+0+0 +repage \
    -filter Lanczos -unsharp 0x0.55+0.55+0.02 \
    -quality 84 "$out_dir/${name}-sp-1080.webp"
  magick "$out_dir/${name}-sp-1080.webp" -quality 48 "$out_dir/${name}-sp-1080.avif"
}

crop_4x5 "assets/lineup/hero/hana_ext.webp" "series-hana" Center
crop_4x5 "assets/lineup/hero/kyo_det.webp" "series-kyo" Center
crop_4x5 "assets/lineup/hero/kaze_ext.webp" "series-kaze" Center
crop_4x5 "assets/std/living_1920.webp" "message-living" Center
crop_4x5 "assets/std/kitchen_1920.webp" "equipment-kitchen" Center
crop_4x5 "assets/std/bath_1920.webp" "water-bath" Center
crop_4x5 "assets/std/vanity_1920.webp" "water-vanity" Center
crop_4x5 "assets/std/washitsu_1920.webp" "interior-tatami" Center
crop_4x5 "assets/std/entrance_1920.webp" "exterior-entrance" Center
crop_4x5 "assets/std/nokiten_1920.webp" "exterior-eaves" Center
crop_4x5 "assets/std/walltex_1920.webp" "performance-wall" Center
crop_4x5 "assets/std/miraie_1920.webp" "performance-structure" Center
crop_4x5 "assets/jiyu/meeting.webp" "design-meeting" Center
crop_4x5 "assets/jiyu/wc_exterior.webp" "process-exterior" Center
crop_4x5 "assets/jiyu/wc_site_sketch.webp" "process-site" Center
crop_4x5 "assets/std/auth_ext_1920.webp" "warranty-house" Center

magick identify "$out_dir"/*-sp-1080.webp
