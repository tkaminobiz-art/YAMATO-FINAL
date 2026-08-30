# デジタルカタログ素材台帳 — 2026-08-30

## 採用原則

- 実邸・設備・図面・仕様は、所有素材とパンフレット0723を正本にする。
- 一枚の写真を白枠へ貼るだけにしない。全景、意味のあるディテールクロップ、図面または短い事実を同じページで編集する。
- Adobe Stockは紙、箔、光、影の補助素材だけに使う。住宅、人物、設備、ロゴの代用には使わない。
- Higgsfieldは表紙モーションの検討POCに使う。生成された燕や文字を商用最終形として残さず、正本素材と決定論的な合成を優先する。

## 13ページ

| 頁 | 内容 | 主素材 | 補助素材／加工 |
|---:|---|---|---|
| 01 | 表紙 | `assets/std/cover_pc_2560.webp` / `cover_sp_1440.webp` | 本の厚み、背、紙端。正本から切り出した二羽を順方向へ動かすPC/SP別5.7秒合成動画を一度だけ再生し、終了後は正本表紙を表示 |
| 02 | メッセージ | `assets/std/living_1920.webp` | 空間の全景＋建具・光のディテールクロップ |
| 03 | 花・京・風 | `assets/lineup/hero/hana_ext.webp` `kyo_det.webp` `kaze_ext.webp` | パンフレットの3色だけを索引として使用 |
| 04 | キッチン | `assets/std/kitchen_1920.avif` | ワークトップと収納のクロップ、短い仕様ラベル |
| 05 | 水まわり | `bath_1920.webp` `vanity_1920.avif` | 浴室全景＋洗面の縦トリミング |
| 06 | 内装 | `living_1920.webp` `walltex_1920.webp` `washitsu_1920.webp` | 建具、床、外壁、畳を小さな図版で編集 |
| 07 | 玄関・外装 | `entrance_1920.webp` `walltex_1920.webp` | 玄関全景＋外壁と軒のディテール |
| 08 | 構造・断熱 | `miraie_1920.webp` `walltex_1920.webp` `houses770_persp.png` | 耐震等級3相当、wallstat、アクアフォームLITE等。MIRAIEの標準範囲は断定しない。低解像度の単体家型アイコンは不採用 |
| 09 | 完全自由設計 | `assets/jiyu/meeting.webp` `wc_plan_1f.webp` `wc_plan_2f.webp` | 打ち合わせから設計士同席、敷地ごとの光と視線 |
| 10 | 土地・設計・施工 | `assets/jiyu/wc_site_sketch.webp` `wc_exterior.webp` | 概念図であることを注記し、自社の流れを短く示す |
| 11 | 保証・アフター | `assets/std/auth_ext_1920.webp` | しろあり10年・上限1000万円、第三者検査2回、保証承継 |
| 12 | 3シリーズの仕様 | `グレード別比較表_パンフp36-37_2026-07.png` | 3列比較の縮小掲示はせず、共通仕様＋各シリーズの特徴を順に読む |
| 13 | 次の案内 | `assets/std/page_beni.webp` `art_swallows_t.webp` | モデルハウス予約、資料請求、サイト本編へ進む |

## Adobe Stock探索枠

2026-08-30時点でAdobe連携は `HTTP 403`。直接検索、プレビュー、ライセンス取得は未実施。

再開時の検索語:

1. `deep red handmade Japanese washi paper gold foil macro copy space`
2. `gold foil texture raking light dark burgundy landscape`
3. `shoji shadow branches Japanese paper soft light minimal`
4. `handmade book edge deckled paper macro dark red`
5. `gold dust cream paper abstract subtle editorial`

採用条件: 人物なし、住宅なし、文字なし、強い粒子なし、暖色、低コントラスト、PC/SPの安全クロップを確保。候補IDの承認後にだけライセンス取得する。

公開検索で確認できた候補ID（連携復旧後にプレビューを再確認するHOLD）:

| ID | 用途候補 | 現時点の判断 |
|---:|---|---|
| `304524269` | 深紅の金属／箔テクスチャ | 色は近いが光沢が強い可能性。表紙ではなくページ端のごく薄い重ねに限定 |
| `272678753` | 金箔マクロ | 箔の局所ハイライト候補。全面使用はしない |
| `510284871` | 明るい和紙繊維 | 生成AI表記なしの公開メタデータを確認。紙面背景候補だが、現行の所有和紙素材を上回る場合だけ採用 |

いずれも公開ページのメタデータ確認まで。Adobe連携の403により、Creative Cloud上のプレビュー取得、購入、ダウンロード、サイト統合は未実施。

## Higgsfield 初回POC（2026-08-30 失効）

- model: `seedance_2_5`
- PC source: `assets/std/cover_pc_2560.webp`
- PC job: `234b78c3-8afa-4f21-be00-7901712654e8`
- SP source: `assets/std/cover_sp_1440.webp`
- SP job: `07adb3a3-803d-4b91-b3d0-d9c150227109`
- each: 5秒 / 1080p / 無音 / high bitrate / 45 credits
- raw archive: `assets/catalog/poc/cover-foil-raking-light-16x9-seedance25.mp4` / `cover-foil-raking-light-9x16-seedance25.mp4`
- web derivatives: `assets/catalog/cover-foil-light-desktop.mp4` / `cover-foil-light-mobile.mp4`（H.264、約1.5MB／1.4MB）
- 判定: 実画面の冒頭で燕が崩れて見えるため不採用。上記web derivativesは履歴保管のみで、サイトからは参照しない

## Higgsfield 逆再生オープニング（2026-08-30 失効）

- model: `seedance_2_5`
- PC job: `ee7a836a-4456-47fb-b4a0-f3d9be74dc53`
- SP job: `3c664ca8-bea3-4645-ae88-998a3c368697`
- each: 5秒 / 1080p / 無音 / high bitrate / 45 credits（合計90 credits）
- method: 正本表紙から燕が飛び去り牡丹が消える逆方向を生成し、FFmpegで逆再生。終端0.45秒を正本表紙へクロスフェード
- raw archive: `assets/catalog/raw/yamato-cover-opening-reverse-pc-seedance25.mp4` / `yamato-cover-opening-reverse-sp-seedance25.mp4`
- web derivatives: `assets/catalog/cover-opening-desktop-v1.mp4` / `cover-opening-mobile-v1.mp4`
- first-frame posters: `assets/catalog/cover-opening-start-desktop.webp` / `cover-opening-start-mobile.webp`
- 判定: 画面端から欠けた燕が現れ、逆再生により嘴と進行方向・羽ばたきが一致しないため不採用。サイトからは参照しない

## Higgsfield 順再生POC（2026-08-30 失効）

- model: `flux_3_video`
- PC job: `f8165aeb-6fab-481a-b4e7-cbf49810b146`
- SP job: `847c5db7-6c99-4e0d-8439-f12d907337ec`
- each: 5秒 / 1080p / 無音 / 45 credits（合計90 credits）
- method: 赤和紙の開始画像と正本表紙の終了画像を直接固定し、逆再生なしで生成
- raw archive: `assets/catalog/raw/yamato-cover-opening-forward-pc-flux3-rejected.mp4` / `yamato-cover-opening-forward-sp-flux3-rejected.mp4`
- 判定: 花の生成は改善したが、燕が画面端で欠け、花と同時に発生して飛行にならないため不採用。サイトからは参照しない

## 表紙オープニング V2（2026-08-30 失効）

- method: 正本表紙から抽出した完全な二羽を、画面内だけで順方向へ動かす決定論的合成。上の燕は左向きに右から左へ、下の燕は右向きに左から右へ移動
- botanical layer: 二羽を除いた中間背景へ金の牡丹をフェードイン。生成編集画像は中間レイヤーだけに使い、4.08秒から正本表紙へクロスフェード
- web derivatives: `assets/catalog/cover-opening-desktop-v2.mp4` / `assets/catalog/cover-opening-mobile-v2.mp4`
- build: `docs/catalog-opening-20260830/build-v2-composite.sh`
- integration: 4.15秒でHTMLタイトルを表示。終了後は動画を透明化して正本表紙を表示。再生失敗・reduced motionでは即座に正本表紙へフォールバック
- detailed plan: `docs/catalog-opening-20260830/IMPLEMENTATION_PLAN.md`

## 表紙オープニング V3（2026-08-30 採用）

- model: `seedance_2_5`（背景モーションのみ）
- PC job: `65d7beee-446e-4b04-8ab8-2cac93e1aa15`
- SP job: `00c1a301-6f33-45ab-83ab-b12f7d871e77`
- method: Higgsfieldで深紅の和紙と金の牡丹線の立ち上がりを生成し、二羽の燕は正本PNGを決定論的に合成。上は右から左、下は左から右へ進み、正本位置へ収束
- web derivatives: `assets/catalog/cover-opening-desktop-v3.mp4` / `cover-opening-mobile-v3.mp4`
- spec: PC 1920×1080、SP 1080×1920、H.264 High、24fps、5.708333秒、無音
- integration: 4.45秒でHTMLタイトルを表示。終了後は動画を透明化して正本表紙を表示。再生失敗・reduced motionでは即座に正本表紙へフォールバック
- exact cover hold: 4.45秒以降は正本表紙を完全静止
- detailed plan: `docs/catalog-opening-20260830/OPENING_V3_PLAN.md`
- QA: `docs/catalog-opening-20260830/v3/QA_REPORT.md`

## QA証跡

- `qa-pc-13pages.jpg`: 1440 × 1000、全13ページ、reduced motionで静止比較
- `qa-sp-13pages.jpg`: 390 × 844、全13ページ、横はみ出し0px
- `qa-higgsfield-pc-10frames.jpg` / `qa-higgsfield-sp-10frames.jpg`: 初回POCの比較（不採用）
- `../catalog-opening-20260830/qa/pc-forward-final-10frames.jpg` / `sp-forward-final-10frames.jpg`: 逆再生V1の比較（不採用）
- `../catalog-opening-20260830/qa-v2/desktop-v2-10frames.jpg` / `mobile-v2-10frames.jpg`: V2の順方向・二羽分離・終端比較
- `../catalog-opening-20260830/qa-v2/browser/opening-v2-capture.json`: 1440 / 1024 / 768 / 390pxの静止終端。横はみ出し、コンソール、ページ、通信エラー0件
- `../catalog-opening-20260830/qa-v2/motion-smoke.json`: PC/SP動画の実ソース選択、終了状態、正本表紙への置換を確認。`aerial_loop.mp4`の中断はページ終了時、768pxのTikTok SVGタイムアウトは表紙動画外の一過性事象
- `../catalog-opening-20260830/v3/qa/pc-v3-10frames.jpg` / `sp-v3-10frames.jpg`: V3のPC/SP各10フレーム比較
- `../catalog-opening-20260830/v3/qa/ffprobe-pc-v3.json` / `ffprobe-sp-v3.json`: V3の解像度、24fps、5.708333秒、無音を確認
- `../catalog-opening-20260830/v3/qa/pc-end-rmse.txt` / `sp-end-rmse.txt`: 4.45秒以降の正本終端一致を確認
- 操作確認: 前へ／次へ、13項目の目次ジャンプ、左右キー、横スワイプ、縦スクロール非拘束
- motion確認: 通常時はPC/SP別H.264を一度再生。reduced motion時は動画非表示・停止、カタログ内アニメーション0件
