# MAP物件情報 2026年9月8日更新版

現行版：`suumo-20260908-v1`。2026年9月8日のSUUMO再確認結果に合わせ、40件の情報提供日を更新した。内訳は2026年9月8日が23件、9月7日が17件。物件ID・掲載URL・価格・面積・区画数・座標・画像・金利と計算・相談API契約は保持した。

基準commit：`b7afea999355d4fd43ec1fd5c3ac8adba4204c10`。基準deployment：`dpl_FMUf6hTT1tfzUP5V7qPKrNb4Joz9`。今回の実装commit・deploymentは公開記録に残す。
本サイト：https://yamato-final.vercel.app/land-payment-study.html#/search
公開記録：`qa/map-suumo-refresh-20260908/RELEASE.md`。manifestの `releaseStatus`、`deployment`、`sourceCommit`、`productionVerifiedAt` は配布準備時点の値を保持し、現在の公開状態・実装commit・deploymentは公開記録を正本とする。直前版は `snapshots/land-payment-20260908-icon` と `qa/map-favicon-20260908/RELEASE.md` に保持する。

配布：`node scripts/package-land-payment.mjs 20260908-suumo`。manifestの25ファイルを照合して配布する。旧snapshotは変更せず保持。
