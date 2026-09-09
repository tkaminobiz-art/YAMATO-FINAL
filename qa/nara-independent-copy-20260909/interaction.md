# 操作・境界確認

最終の公開用 public/ を http://127.0.0.1:8952 で配信して確認。詳細は release-verified/results.json、links.json、full-inventory.json。

- Chromium/WebKit × PC1440×900 / SP390×900通常表示：実スクロールで全8段階に進み、時計/現在駅/タイトル/説明と到着時の5駅一覧を確認。
- Chromium PC低モーション、WebKit SP低モーション、Chromium SP JavaScriptなし、GSAP読み込み遮断、320×640、WebKit844×390横向きを確認。
- 7本のページ内導線：本文スキップはキーボードTab→Enter、旅程スキップ・注記リンク・ナビ3本・駅から家までのリンクは実クリック。既存scroll-padding-top:30pxに沿って到達する。
- 分譲地リンク3本、TOP戻り2本は実クリック。4本の公式リンクは新しいタブへのナビゲーション要求を観測し、既存URLへの発行を確認。外部の内容/交通条件の再検証はfacts.mdの一次情報を根拠とする。
- 電話2本は tel:0742361123 と表示番号を確認。発信は行っていない。Web受付は接続しておらず、フォームも追加していない。
- 時刻表の開閉、全9駅と到着/発車値、18本のhref、12個のtime値を基準版と照合。HTMLの構造/属性は原稿に伴う2箇所のbr増減とラベル/description以外を保持。
- GSAPプログラムはjBeats表示文字列を除いて完全一致。時刻・段階位置・駅インデックス・compact状態は保持。nara-preview.js、画像/source、TOP index.htmlと保護対象8資産/設定をSHAで確認。
- 公開パッケージ700ファイルの原本と出力のSHAが一致。QA、調査資料、元画像などは公開対象へ追加されない。既存homepage/FV/Nara/WORKSのビルド検証も成功。

初回QAのアンカー位置判定は既存の30px scroll-paddingを考慮して修正。JS無効時の待機はページ内RAFでなく、Node側から実座標を読む方法へ修正した。これらはQA側の修正であり、サイト動作の変更ではない。表示文字列の座標と操作結果を確認するための試験で、文章一致だけを自然さの評価にしていない。

最終10ケース成功。JSなしケースではPlaywrightの表スクロール時に一時的な「Element is not attached」が1回発生。同一ソース・同一試験の当該ケースだけを再取得し、開閉/全導線まで成功。初回と確認結果は release-verified/retry-record.json に両方保存。成功のためにサイトソースを変更していない。
