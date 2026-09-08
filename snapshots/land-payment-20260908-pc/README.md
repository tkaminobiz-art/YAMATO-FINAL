# MAPのPC構成・学校距離検索・TOP導線

現行版：`map-home-link-20260908`。PCは地図の下に一覧を表示し、追従しない。学校までの掲載距離による並び順・条件を利用できる。指定の地図下注意書きを削除し、全MAP画面共通の「TOPへ戻る」を追加した。物件原典・画像・金利と計算・相談API契約は保持。

実装commit：`5ce35cb7a2df73be2bcbfcd017fda7de74d53938`。本番deployment：`dpl_8vAJwskQGEUw9dTE1esFVmPr7JVh`。本番反映・公開後確認済み。
本サイト：https://yamato-final.vercel.app/land-payment-study.html#/search
公開記録：`qa/map-footnote-20260908/RELEASE.md`。PC構成・学校検索の初回実装記録は `qa/map-pc-school-20260908/RELEASE.md`。

配布：`node scripts/package-land-payment.mjs 20260908-pc`。manifestの24ファイルを照合して配布する。旧版はGitの履歴に保持。
