#!/bin/zsh
# 左京モデルハウス写真 → Web用 現像バッチ（確定版v2 2026-08-18）
# 使い方: grade.sh <入力jpg> <出力ベース名> <出力dir> <land|port> [gravity]
#
# 設計判断の記録:
#  - ブルーム(Screen合成)は入れない        … 白飛びした
#  - 冷色マスク(b-r)での選択補正は入れない  … 窓に破綻を出した
#  - シャープは輝度(LAB-L)のみ             … RGBだとハイライトのクロマノイズを増幅
#  - AVIFは書き出さない                    … ImageMagick製AVIFはChromiumが半解像度・黒描画する(2026-08-18実測)
#  - ハイライト保護(v2で追加)              … 近白部(輝度78%〜)には暖色シフトを当てず
#                                            素の色を保つ。窓・照明の色転びを防ぐ。
#                                            トーンカーブは両系統で共通=継ぎ目なし
set -e

SRC="$1"; BASE="$2"; OUT="$3"; MODE="${4:-land}"; GRAV="${5:-center}"
mkdir -p "$OUT"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

if [[ "$MODE" == "port" ]]; then RATIO="9:16"; SIZES=(1440 1080 720); else RATIO="16:9"; SIZES=(2560 1920 1100); fi

# 1) 正規化: EXIF向き補正 → アスペクト切り出し
magick "$SRC" -auto-orient -colorspace sRGB -resize 3200x3200\> \
  -gravity "$GRAV" -crop "$RATIO"^ +repage "$TMP/base.png"

# 2) トーン(共通): 軽いSカーブ。色は触らない
magick "$TMP/base.png" -level 1%,99.5% -sigmoidal-contrast 2.2,52% "$TMP/neutral.png"

# 3) 色(暖色シフト): 同じトーンの上に微暖色+彩度+1
magick "$TMP/base.png" \
  -channel R -evaluate multiply 1.03 +channel \
  -channel B -evaluate multiply 0.975 +channel \
  -modulate 99,101,100 \
  -level 1%,99.5% -sigmoidal-contrast 2.2,52% "$TMP/warm.png"

# 4) ハイライト保護マスク(輝度78%→92%のソフトランプ) → 近白部はneutralを採用
magick "$TMP/base.png" -colorspace Gray -level 78%,92% -blur 0x8 "$TMP/hi.png"
magick "$TMP/warm.png" "$TMP/neutral.png" "$TMP/hi.png" -composite "$TMP/g.png"

# 5) 書き出し（シャープは輝度のみ・サイズごとに掛け直す）
for W in $SIZES; do
  magick "$TMP/g.png" -resize ${W}x \
    -colorspace LAB -channel R -unsharp 0x0.8+0.5+0.02 +channel -colorspace sRGB \
    -quality 78 -define webp:method=6 "$OUT/${BASE}_${W}.webp"
done

# 6) 検証: 残存冷色偏差(窓の色転び) と ファイルサイズ
BIG=$SIZES[1]; SML=$SIZES[3]
COOL=$(magick "$OUT/${BASE}_${BIG}.webp" -fx "max(0,(b-r))" -colorspace Gray -format "%[fx:100*mean]" info:)
DIM=$(magick identify -format '%wx%h' "$OUT/${BASE}_${BIG}.webp")
printf "%-9s %-11s 冷色偏差%5.2f%%  " "$BASE" "$DIM" "$COOL"
for W in $BIG $SML; do for E in webp avif; do
  F="$OUT/${BASE}_${W}.${E}"; [ -f "$F" ] && printf "%s%s:%4dKB " "$W" "${E:0:1}" "$(( $(stat -f%z "$F") / 1024 ))"
done; done
echo
