#!/bin/bash
set -e
cd "$(dirname "$0")"
R=sp_reframe; C=sp_callout
# scene: name clip ss callout_n
mk(){ local n=$1 clip=$2 ss=$3
  ffmpeg -y -loglevel error -ss $ss -t 3 -i $R/$clip.mp4 -i $C/scrim_sp.png -i $C/callout_sp_$n.png \
   -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[v];[v][1:v]overlay=0:0[a];[a][2:v]overlay=0:0,format=yuv420p[o]" \
   -map "[o]" -an -c:v libx264 -crf 20 sp_scene_$n.mp4
  echo "scene $n ok"; }
mk 1 exterior 0
mk 2 kitchen 0.6
mk 3 bath 0.6
mk 4 living 0.6
mk 5 vanity 0.6
mk 6 wall 0.6
# xfade 6 scenes (3s each, 0.5 xfade, offset step 2.5 -> 15.5s) + BGM
# （末尾の外観2周目を廃止＝ループ点は外壁→外観の別被写体カットで自然）
ffmpeg -y -loglevel error \
 -i sp_scene_1.mp4 -i sp_scene_2.mp4 -i sp_scene_3.mp4 -i sp_scene_4.mp4 -i sp_scene_5.mp4 -i sp_scene_6.mp4 -i $R/bgm.mp3 \
 -filter_complex "[0][1]xfade=transition=fade:duration=0.5:offset=2.5[x1];[x1][2]xfade=transition=fade:duration=0.5:offset=5[x2];[x2][3]xfade=transition=fade:duration=0.5:offset=7.5[x3];[x3][4]xfade=transition=fade:duration=0.5:offset=10[x4];[x4][5]xfade=transition=fade:duration=0.5:offset=12.5[vout];[6:a]atrim=0:15.5,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.2,afade=t=out:st=13.7:d=1.8,volume=0.62[aout]" \
 -map "[vout]" -map "[aout]" -c:v libx264 -pix_fmt yuv420p -crf 25 -preset slow -c:a aac -b:a 128k -movflags +faststart B_loop_sp.mp4
# poster（このffmpegはwebpエンコーダ無し→cwebp経由）
ffmpeg -y -loglevel error -ss 1 -i B_loop_sp.mp4 -frames:v 1 _sp_poster_tmp.png
cwebp -q 84 _sp_poster_tmp.png -o B_poster_sp.webp >/dev/null 2>&1
rm -f _sp_poster_tmp.png
rm -f sp_scene_*.mp4
echo "=== B_loop_sp.mp4 $(stat -f%z B_loop_sp.mp4)b  $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of csv=p=0:s=x B_loop_sp.mp4 2>/dev/null) ==="
