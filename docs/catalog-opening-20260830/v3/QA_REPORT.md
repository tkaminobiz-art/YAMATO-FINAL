# オープニングV3 品質確認

## 判定

**HOLD — 切り抜き修正版をサイト接続済み。ユーザー目視確認までは最終採用にしない。**

初回提出時の燕素材は、透過PNGではなく赤背景を含む矩形クロップだった。SP上の燕には左右の花片、SP下の燕には左上・右側・下側の花線が残っており、初回PASS判定は誤りだったため撤回する。PC素材にも同種の背景混入があった。

修正版では正本クロップから金箔色のソフトマットを作り、燕の胴体を起点に連結する領域だけを保持した。花片を除去した真のRGBA素材へPC/SPとも差し替え、同じSeedance背景からローカル再合成した。追加のHiggsfield生成とcredit消費はない。

サイト本体での初回再生、スキップ、HTMLタイトル、終了後静止画への切替は別担当のブラウザQA対象であり、本レポートは動画素材単体の判定である。

## 2026-08-30 切り抜き是正

- 原因: `assets/catalog/raw/v2-composite/bird-*.png` が全画素不透明の背景付きクロップ
- 是正: `extract-clean-birds-v3.py` で色差ソフトマット＋seeded connected componentを生成
- 新素材: `assets/catalog/raw/v3-composite/bird-*-clean.png`
- 対照検査: シアン／紫背景に4枚を合成し、花片・赤い矩形・背景ハローがないことを確認
- 再構築: PC/SP V3動画を同一尺・同一軌道で再エンコード
- 追加credit: 0

## 生成記録

| 項目 | PC | SP |
|---|---|---|
| model | Seedance 2.5 | Seedance 2.5 |
| job ID | `65d7beee-446e-4b04-8ab8-2cac93e1aa15` | `00c1a301-6f33-45ab-83ab-b12f7d871e77` |
| cost | 54 credits | 54 credits |
| ratio | 16:9 | 9:16 |
| raw | 1920×1080 / HEVC 10-bit / 6.041667秒 | 1080×1920 / HEVC 10-bit / 6.041667秒 |

合計消費は108 credits。各比率1本の制御POCだけを実行した。生成後のcredit transactionで、Seedance 2.5の`-54`が2件記録されたことも確認した。

## 最終Web動画

| 項目 | PC | SP |
|---|---|---|
| file | `assets/catalog/cover-opening-desktop-v3.mp4` | `assets/catalog/cover-opening-mobile-v3.mp4` |
| format | H.264 High / yuv420p / 無音 | H.264 High / yuv420p / 無音 |
| size | 1920×1080 | 1080×1920 |
| fps | 24 | 24 |
| duration | 5.708333秒 | 5.708333秒 |
| bytes | 4,274,765 | 4,505,981 |
| SHA-256 | `6f3aa7d9bde114b8c72c02ab1ce1e302a8b32fb733c8739d8909e9cd95653b16` | `728f817a319b3f604a6fc6741b3247010683de5c9fcbc8d3bd233a0ab52b45ba` |

## 目視確認

- PC/SPとも燕は正本クロップ由来の二羽だけ
- シアン／紫の異色背景で、花片・赤背景の矩形混入なし
- 上の燕は完全な形で右から左へ移動
- 下の燕は完全な形で左から右へ移動
- 頭、翼、二股の尾に欠損、増殖、融合なし
- 花の線は外周から段階的に現れ、文字や別オブジェクトへ変形しない
- カメラ移動、ズーム、パララックス、粒子、花びらなし
- 中央の円とタイトル安全域は保持
- 音声トラックなし
- 4.45秒以降は正本だけを保持

### 光について

PCでは中央の円周、SPでは一部の牡丹線に短い箔光が現れる。白飛びは局所的で、形状の変化や画面全体のグローにはなっていない。花鳥風月の静かな表紙に一度だけ現れる箔押しの反射として許容範囲と判断した。

## 終端確認

5.2秒のフレームと正本を並べて目視し、配置差なし。RMSEはPC `0.0135353`、SP `0.0744834`。差はH.264/YUV変換と色空間変換を含む。幾何学的な位置ずれ、トリミング差、要素差は認められない。

## V2との差

- V2: 花が全体として均一にフェードし、静止画レイヤーの出現感が強い
- V3: 花の線が段階的に立ち上がり、箔光が一度だけ通る
- 共通: 正本燕、順方向、終端正本一致
- 結論: 燕の安全性を落とさず、背景の編集品質と奥行きが明確に改善

## QA証跡

- `keyframes/pc-keyframes-contact.jpg`
- `keyframes/sp-keyframes-contact.jpg`
- `qa/raw-pc-v3-10frames.jpg`
- `qa/raw-sp-v3-10frames.jpg`
- `qa/pc-v3-10frames.jpg`
- `qa/sp-v3-10frames.jpg`
- `qa/cutout-proof-contrast.png`
- `qa/ffprobe-pc-v3.json`
- `qa/ffprobe-sp-v3.json`
- `qa/pc-end-compare.jpg`
- `qa/sp-end-compare.jpg`
