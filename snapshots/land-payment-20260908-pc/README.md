# MAPのPC構成と学校距離の検索

2026-09-08。基点は6e4f8d0のland-payment-20260908。元のsnapshotは保持。
PCは追従しない地図と一覧を同じページに表示。小学校・中学校までの掲載距離の並び順、距離条件、一覧と比較の距離表示を追加。指定学区・通学路の安全性を判定するものではない。
物件原典・画像・金利と返済計算・相談APIの契約は保持。

配布：リポジトリルートで `node scripts/package-land-payment.mjs 20260908-pc`。
検証記録：`qa/map-pc-school-20260908/RESULT.md`。
2026-09-08に本番反映・公開後確認まで完了。実装commitは `33d039b721107c978699284336c5bf3f643497ae`、deploymentは `dpl_757Nv4erak8uV9URJBPJ8gYasFz9`。
本サイト：https://yamato-final.vercel.app/land-payment-study.html#/search
公開記録：`qa/map-pc-school-20260908/RELEASE.md`。実装の24ファイルとSHAは公開前から変更していない。
