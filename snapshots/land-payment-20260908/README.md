# 本サイト接続時のMAP最新版

2026-09-08の日本語改稿版 dpl_3eSDQiSBfm4A9LgXpFaaAWjBH98D を基点とし、一覧から地図へ切り替えたときの初期表示位置だけを修正したソース。地図が非表示の間は初期化・表示範囲更新を遅らせる。40件の物件、写真、コピー、計算式とAPI契約は同じ。

再配布はリポジトリ直下で `node scripts/package-land-payment.mjs`。日付を指定すれば旧版も展開できる（例：`node scripts/package-land-payment.mjs 20260907`）。publicの静的モジュールとAPIが参照するassets配下の同一モジュールを両方展開する。出力先を専用Vercelプロジェクトyamato-land-payment-previewへ接続して配布する。本サイトyamato-finalは外部rewriteで専用MAPの公開内容を配信する。

配布・操作・公開元の確認はqa/map-site-publish-20260908/を参照。受付の保存・送信・LINE・予約は未接続。
