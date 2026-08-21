#!/bin/bash
# コピー審査ゲート: 本番10ページの可視コピーを抽出し、機械判定できる規則だけを検査する
# 使い方: bash tools/copy_patrol/run.sh   （リポジトリルート＝index.htmlのある場所で実行）
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${TMPDIR:-/tmp}/copy_patrol"
mkdir -p "$OUT"
PAGES="index.html kodawari.html model.html madori.html works.html voice.html lots.html lot.html company.html contact.html"

python3 "$HERE/extract.py" $PAGES > "$OUT/copy.jsonl" || exit 2
echo "抽出: $(wc -l < "$OUT/copy.jsonl") ページ / $(python3 -c "
import json;print(sum(len(json.loads(l)['rows']) for l in open('$OUT/copy.jsonl',encoding='utf-8')))")件"
echo
echo "############ 事実・禁則・構文ゲート ############"
python3 "$HERE/gate.py" "$OUT"
echo
echo "############ 敬語・言葉遣いゲート ############"
python3 "$HERE/gate_keigo.py" "$OUT"
echo
echo "############ JS内の可視文字列（目視確認用） ############"
python3 "$HERE/jsstrings.py" $PAGES
