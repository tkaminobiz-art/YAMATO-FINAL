#!/bin/bash
# PC版 B_loop 再ビルド（build_sp.sh の 1920x1080 ミラー）
# シーン: 1=exterior 2=kitchen 3=bath 4=living 5=vanity 6=wall の6構成・15.5s
# （旧7シーン=末尾に外観2周目があり、ループ点で同一被写体の位置ジャンプ=カクつきの原因だった。
#   外壁終わり→外観始まり＝別被写体カットにしてループを自然化）
# オーバーレイ: ../callout_render/scrim.png + t{n}.png（1920x1080）
set -e
cd "$(dirname "$0")"
C=../callout_render
mk(){ local n=$1 clip=$2 ss=$3
  ffmpeg -y -loglevel error -ss $ss -t 3 -i clip_$clip.mp4 -i $C/scrim.png -i $C/t$n.png \
   -filter_complex "[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30[v];[v][1:v]overlay=0:0[a];[a][2:v]overlay=0:0,format=yuv420p[o]" \
   -map "[o]" -an -c:v libx264 -crf 20 pc_scene_$n.mp4
  echo "scene $n ok"; }
mk 1 exterior 0
mk 2 kitchen 0.6
mk 3 bath 0.6
mk 4 living 0.6
mk 5 vanity 0.6
mk 6 wall 0.6
ffmpeg -y -loglevel error \
 -i pc_scene_1.mp4 -i pc_scene_2.mp4 -i pc_scene_3.mp4 -i pc_scene_4.mp4 -i pc_scene_5.mp4 -i pc_scene_6.mp4 -i sp_reframe/bgm.mp3 \
 -filter_complex "[0][1]xfade=transition=fade:duration=0.5:offset=2.5[x1];[x1][2]xfade=transition=fade:duration=0.5:offset=5[x2];[x2][3]xfade=transition=fade:duration=0.5:offset=7.5[x3];[x3][4]xfade=transition=fade:duration=0.5:offset=10[x4];[x4][5]xfade=transition=fade:duration=0.5:offset=12.5[vout];[6:a]atrim=0:15.5,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.2,afade=t=out:st=13.7:d=1.8,volume=0.62[aout]" \
 -map "[vout]" -map "[aout]" -c:v libx264 -pix_fmt yuv420p -crf 21 -c:a aac -b:a 128k -movflags +faststart B_loop.mp4
# poster（ffmpegのwebpエンコーダ無し環境向けにcwebp経由）
ffmpeg -y -loglevel error -ss 1 -i B_loop.mp4 -frames:v 1 _poster_tmp.png
cwebp -q 84 _poster_tmp.png -o B_poster.webp >/dev/null 2>&1
rm -f _poster_tmp.png pc_scene_*.mp4
echo "=== B_loop.mp4 $(stat -f%z B_loop.mp4)b ==="
