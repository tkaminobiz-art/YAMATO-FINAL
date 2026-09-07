# 公開済みMAPのソース保存

2026-09-07に専用Vercelへ直接配置され、Gitに残っていなかった23ファイルの同一バイトの記録。`manifest.json` に元の相対パス、配信先、SHA-256を保存しています。

公開先は https://yamato-land-payment-preview.vercel.app 。サイト本体のビルドには含めず、独立したVercelプロジェクトとして扱います。新しい本番APIやTOPへのリンクを追加する保存作業ではありません。

## 再現

リポジトリ直下で次を実行すると、全ファイルをハッシュ検査して専用の一時ディレクトリに展開します。

```sh
node scripts/package-land-payment.mjs 20260907
node --test snapshots/land-payment-20260907/qa/finance-accuracy-20260907/finance.test.mjs snapshots/land-payment-20260907/qa/land-payment-suumo-20260907/domain.test.mjs snapshots/land-payment-20260907/qa/connections-20260905/mortgage.test.mjs
```

再公開する場合は、出力されたディレクトリで `vercel link --project yamato-land-payment-preview --scope office-ks-projects` により専用プロジェクトへ接続し、`vercel --prod` を実行します。サイト本体の `yamato-final` に接続しないでください。認証情報や `.vercel` はこの記録に含めません。

## 未実装の境界

問い合わせAPIは検証のみで、実際の保存・送信はしません。LINE、顧客DB、営業APP、予約への接続は未実装です。地図は町域の概略位置、物件情報は2026-09-07の記録、金利条件は適用月の検証つきです。実区画の特定や融資承認を示すものではありません。今後更新する際は新しい記録と検証を作り、この公開状態を再現できるよう保持します。
