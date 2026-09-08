# Move to Nara TOP導線修正

- 対象読者：本サイトTOPから「奈良からの通勤」を読み、会社サイトや物件一覧へ戻る利用者。
- 問題：ヘッダーロゴとフッターの「トップへ戻る」が、公開中の正式TOPではなく `index-art-preview.html` を指している。
- 判断：既存の表示、レイアウト、電話導線、ページ内ナビを保持し、2つのリンク先だけを正式TOP `/` に変更する。
- 確認経路：TOP → Move to Nara → TOP、Move to Nara → 物件一覧。PC 1440×900とSP 390×844で確認する。
- 適用：project AGENTS、`docs/quality/PRODUCTION_CONTRACT.md`、`premium-b2c-web`、`copywriter` BtoC契約、`commercial-japanese-lp-copy`、`design-critic-codex`、`playwright`、`vercel-deploy`。
- 対象外：タイトル、制作確認用表記、noindex、交通・統計コピー、デザイン変更、MAP実装、LINE受付、お客様の声。
- 公開許可：ユーザーがcommit、push、本番反映まで明示承認済み。

