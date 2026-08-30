# やまとの家 カタログオープニング V3 制作仕様

## 1. 制作判断

V3はPCとSPを別の編集面として制作する。共通化するのは、深紅、金の牡丹、正本から抽出した二羽の燕、5.7秒の時間軸、終端の正本一致だけとする。

Higgsfieldは深紅の和紙、金線、光の中間背景だけを生成する。燕、文字、ロゴ、住宅、正本の終端は生成させず、決定論的な合成で保証する。

V2よりも明確に改善しない場合、V3は採用せずHOLDとする。

## 2. ブランド演出

- 媒体: Webカタログの初回オープニング
- 人格: 静かな品格、古典意匠、クワイエットラグジュアリー
- 主役: 金の牡丹線と、正しい向きに滑空して表紙へ収まる二羽の燕
- 色: 深紅が画面の85%以上を占め、金は輪郭と光だけに限定
- 禁止: カメラ移動、ズーム、パララックス、粒子、花びら、音声、文字焼き込み

## 3. 時間設計

| 時間 | 背景 | 燕 | 実装 |
|---:|---|---|---|
| 0.00–0.60秒 | 深紅の和紙と中央の空押し | 非表示 | Higgsfield開始フレーム |
| 0.60–2.50秒 | 金の牡丹線が外周から静かに立ち上がる | 0.90秒から全身で出現 | 背景生成＋正本燕合成 |
| 2.50–3.90秒 | 金線が正本に近づき、光だけがわずかに移る | 上は右→左、下は左→右 | 正本燕の順方向移動 |
| 3.90–4.45秒 | 生成背景から正本へ移行 | 二羽が正本位置へ収束 | 正本表紙へクロスフェード |
| 4.45–5.70秒 | 正本表紙を完全静止 | 正本の一部 | exact cover hold |

HTMLタイトルの表示はサイト本体で制御し、映像へ焼き込まない。

## 4. PC 16:9 構図

- 出力: 1920×1080、24fps、5.7秒、H.264、無音
- 上の燕: 右上の完全表示位置から左上の正本位置へ。嘴は常に左向き
- 下の燕: 左下の完全表示位置から右下の正本位置へ。嘴は常に右向き
- 中央タイトル領域を横切らず、上下に分離する
- 背景の金線は左右の花の密度差を保ち、中央を静かに空ける

## 5. SP 9:16 構図

- 出力: 1080×1920、24fps、5.7秒、H.264、無音
- PCを切り抜かず、縦軸を中心に上下の燕を分離
- 上の燕: x=760付近からx=500付近へ、右→左。開始時から全身を表示
- 下の燕: x=45付近からx=385付近へ、左→右。開始時から全身を表示
- タイトルが現れる中央45%の高さには軌道を通さない
- 上下の花は縦方向の密度差をつくり、中央は和紙の静けさを残す

## 6. Higgsfield背景POC

### ライブ選定

- 候補探索: start/end frame、16:9/9:16、1080p、無音を条件に実施
- 採用候補: `seedance_2_5`
- 理由: start/end frameの両ロール、16:9/9:16、4–30秒、1080p、音声無効、高ビットレートをライブスキーマで確認できる
- モード: `omni_reference`
- 回数: PC 1本、SP 1本のみ
- 事前費用: PC 54 credits、SP 54 credits、合計108 credits
- 生成job: PC `65d7beee-446e-4b04-8ab8-2cac93e1aa15`、SP `00c1a301-6f33-45ab-83ab-b12f7d871e77`

### 共通プロンプト

> A locked-off, silent luxury Japanese catalog cover background. Preserve the supplied first and final frames. Deep crimson handmade washi remains completely stationary in composition. Reveal only the existing delicate gold peony linework gradually from the outer edges toward its final positions. Add one restrained warm foil-light glide across the gold lines, with physically coherent light and no glow bloom. No camera movement, no zoom, no parallax, no particles, no petals, no birds, no animals, no text, no letters, no logo, no architecture, no new objects, no morphing, no extra flowers. Keep the central title-safe area quiet. The final frame must settle exactly into the supplied end frame.

## 7. 決定論的な最終合成

1. HiggsfieldのPC/SP背景POCから映像を取得する。
2. 生成映像の前半だけを背景として使い、3.90秒以降は正本表紙へ移行する。
3. 正本から抽出済みの完全な二羽をPNGレイヤーで合成する。
4. 4.45秒以降を正本表紙の完全静止にする。
5. 音声トラックを除去し、`yuv420p`、`faststart`でWeb書き出しする。

## 8. 品質ゲート

- 燕は常に二羽。頭、翼、尾が欠けない
- 上の燕は右→左、下の燕は左→右
- 燕の形、向き、金の質感を生成モデルが変更しない
- 花が文字、別の植物、鳥へ変形しない
- 和紙の地色が赤紫、橙、黒へ大きく転ばない
- 画角と正本の座標が動かない
- 4.45秒以降は正本とピクセル一致する
- PC/SP各10フレームの目視比較とffprobeを保存する
- 既存V2との比較で、構図、静けさ、燕の完全性、終端一致のすべてが同等以上

## 9. 採否

`docs/catalog-opening-20260830/v3/QA_REPORT.md` に PASS / HOLD と根拠を記録する。ひとつでも重大ゲートに不合格があれば、サイト本体へ接続しない。
