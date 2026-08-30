# デジタルカタログ素材台帳 — 2026-08-30

## 採用原則

- 実邸・設備・図面・仕様は、所有素材とパンフレット0723を正本にする。
- 一枚の写真を白枠へ貼るだけにしない。全景、意味のあるディテールクロップ、図面または短い事実を同じページで編集する。
- Adobe Stockは紙、箔、光、影の補助素材だけに使う。住宅、人物、設備、ロゴの代用には使わない。
- Higgsfieldは表紙金箔の斜光だけに使う。文字、ロゴ、花、燕、住宅は動かさない。

## 13ページ

| 頁 | 内容 | 主素材 | 補助素材／加工 |
|---:|---|---|---|
| 01 | 表紙 | `assets/std/cover_pc_2560.webp` / `cover_sp_1440.webp` | 本の厚み、背、紙端。HiggsfieldのPC/SP別5秒斜光を一度だけ再生し、終了フレームで静止 |
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

## Higgsfield POC／採用結果

- model: `seedance_2_5`
- PC source: `assets/std/cover_pc_2560.webp`
- PC job: `234b78c3-8afa-4f21-be00-7901712654e8`
- SP source: `assets/std/cover_sp_1440.webp`
- SP job: `07adb3a3-803d-4b91-b3d0-d9c150227109`
- each: 5秒 / 1080p / 無音 / high bitrate / 45 credits
- raw archive: `assets/catalog/poc/cover-foil-raking-light-16x9-seedance25.mp4` / `cover-foil-raking-light-9x16-seedance25.mp4`
- web derivatives: `assets/catalog/cover-foil-light-desktop.mp4` / `cover-foil-light-mobile.mp4`（H.264、約1.5MB／1.4MB）
- visual QA: PC/SP各10フレームを比較し、牡丹・燕・円形の型押し・金箔線の形状保持を確認。動きは斜光のみ。終端の明暗差があるためループは不採用
- integration: PC/SPとも、表紙表示時に一度だけ再生して終端フレームで静止。表紙へ戻った場合は先頭から再生。`prefers-reduced-motion: reduce` では動画を非表示・停止し、静止画を表示

## QA証跡

- `qa-pc-13pages.jpg`: 1440 × 1000、全13ページ、reduced motionで静止比較
- `qa-sp-13pages.jpg`: 390 × 844、全13ページ、横はみ出し0px
- `qa-higgsfield-pc-10frames.jpg` / `qa-higgsfield-sp-10frames.jpg`: 各2fpsで5秒を追った形状保持比較
- 操作確認: 前へ／次へ、13項目の目次ジャンプ、左右キー、横スワイプ、縦スクロール非拘束
- motion確認: 通常時はPC/SP別H.264を一度再生。reduced motion時は動画非表示・停止、カタログ内アニメーション0件
