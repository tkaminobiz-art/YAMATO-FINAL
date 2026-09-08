# MAP注意書き削除・TOP導線：公開完了

2026-09-08。ユーザーの明示承認に基づき、MAP担当がcommit・push・本番反映・公開後確認まで完了。

## 変更

指定されたmap-footnoteの一文、専用CSS3か所、拡大処理の背景inert対象から該当参照を削除した。代替文は追加していない。地図内の「位置は目安」、学校距離補足、内部の出典情報は保持した。

全画面共通の既存上部バー右側に、下線付きの「TOPへ戻る」を追加。ロゴや検索ボタンと競合せず、地図上へ重ねずに見つけられる配置を選んだ。タップ領域は44px高。会社TOPの絶対URLへ同じタブで移動し、専用MAPのルートへ循環しない。

実行変更はHTML・style.css・map-controller.mjsの3ファイル。配布24ファイルのうち他21ファイルは不変。その他ページ、物件データ、写真、金融計算、API契約は変更していない。

## 公開

- 実装commit：`5ce35cb7a2df73be2bcbfcd017fda7de74d53938`、origin/mainへpush済み。
- 本番deployment：`dpl_8vAJwskQGEUw9dTE1esFVmPr7JVh`、Ready、production。
- 本サイト：https://yamato-final.vercel.app/land-payment-study.html#/search
- 専用MAP：https://yamato-land-payment-preview.vercel.app/
- TOPリンク先：https://yamato-final.vercel.app/ （公開タイトル「奈良の注文住宅｜株式会社やまと不動産」確認済み）。
- 配布版：`snapshots/land-payment-20260908-pc`、revision `map-home-link-20260908`。

## 確認

ローカルは対象45操作と追加の320pxヘッダー・PCスクロール確認。公開後は本サイト・専用MAPそれぞれでChromium1280×720とWebKit390×844を操作し、計90項目成功、例外0、横あふれ0。地図・一覧・詳細・保存・比較・見積もり入力・計算結果でTOPリンクを確認し、実際に会社TOPへ移動。戻った際の検索条件・計算値の保持も確認した。

指定文言なし、40件、学校補足保持、PC地図全体の初期表示・非追従、地図と一覧、拡大とEscape、背景操作の復元を確認。実際の本番PC/SP画面も自己レビューした。

24配布ファイルの実装・snapshot・packageがSHA一致。両公開入口の静的23ファイルずつと、他の本サイト4ページの計50 HTTP取得が一致した。TOP・施工事例・スタッフ・お客様の声は公開前から不変。親の実行3ファイルはバックアップ後に同期し、作業中のindex.htmlと_mobile-verify計12ファイルはSHA不変。

prepare・reviewの品質記録ゲート成功。新規の個別テストや全件テストの再実行は行わず、対象のブラウザー操作を確認した。iPhone実機は未確認。相談APIの本受付・営業APP・LINE・予約の実接続は今回の対象外。

証跡：release.json、public-integrity.json、main-browser.json、dedicated-browser.json、parent-sync.json、PC/SP画像。公開証跡commitは実装commitと分けて保存する。

TECHNICAL_PASS：公開後確認まで完了。RELEASE_APPROVED：ユーザー承認に基づき公開済み。
