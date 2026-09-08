# MAPのPC構成・学校距離検索・TOP導線

現行版：`map-favicon-20260908`。PCは地図の下に一覧を表示し、追従しない。学校までの掲載距離による並び順・条件を利用できる。指定の地図下注意書きを削除し、全MAP画面共通の「TOPへ戻る」を保持した。既存のやまと不動産ブランドfaviconを同梱し、検索・一覧・試算を含む単一HTML入口から参照する。物件原典・画像・金利と計算・相談API契約は保持。

基準commit：`5ce35cb7a2df73be2bcbfcd017fda7de74d53938`。基準deployment：`dpl_8vAJwskQGEUw9dTE1esFVmPr7JVh`。favicon追加の実装commit・deploymentは `manifest.json` と公開記録に残す。
本サイト：https://yamato-final.vercel.app/land-payment-study.html#/search
公開記録：`qa/map-favicon-20260908/RELEASE.md`。直前のTOP導線・注意書き変更は `qa/map-footnote-20260908/RELEASE.md`、PC構成・学校検索の初回実装記録は `qa/map-pc-school-20260908/RELEASE.md`。

配布：`node scripts/package-land-payment.mjs 20260908-icon`。manifestの25ファイルを照合して配布する。旧snapshotは変更せず保持。
