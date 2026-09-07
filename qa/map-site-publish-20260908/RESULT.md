# MAP・物件一覧の本サイト公開

ユーザーの最新版公開指示に基づき、専用MAPの公開版を本サイトland-payment-study.htmlで表示。専用HTML・モジュール・検証APIをVercelの外部rewriteで配信。TOPと他ページの旧一覧・試算リンク、旧lots.htmlを用途に応じて最新版へ307転送する。TOPの未公開実写差分・旧データ原本・Works/Staffは変更しない。

接続検証で発見した一覧→地図の初期視野ずれは、地図が非表示の間の初期化・更新を遅らせて修正。PC1440、WebKit390/320で全40件を画面内に表示できることを確認。最新版snapshotもGit保存し、配布スクリプトのAPI用モジュール複製も修正した。

配布スクリプトもrootのvercel.jsonを共有するようにし、Gitからのビルドと個別配置でルーティングが欠落しないようにした。

現時点の公開元はorigin.json。運用上は専用MAPのproduction alias更新が本サイトにも反映される。共通mortgage.mjsは本サイト側と同一SHAを照合する。以後この共通モジュールを変更する際は両サイトの利用箇所を確認する。

公開状態、HTTP、SHA、旧リンクの着地、PC/SP操作はproduction記録に残す。物件データの取得日・概略位置・販売状況の確認条件・金融条件・相談未送信の表示を維持。LINE・顧客DB・予約の実接続が完了したという公開ではない。

実装根拠：[Vercel rewrites](https://vercel.com/docs/routing/rewrites)と[queryによるredirect](https://examples.vercel.com/kb/guide/how-do-i-perform-vercel-redirects-based-on-query-strings)。設定検証と実配信検証の両方を行う。
