# MAP SUUMO物件情報更新 公開記録

- 公開確認：2026-09-08 22:33 JST
- データ版：`suumo-20260908-v1`
- 実装commit：`e4197212b65c1ee9d7b951a79438603ff1fb0f31`
- Vercel project：`yamato-land-payment-preview`
- Production deployment：`dpl_5B8RuVuFdo8X2ouRePS5i1EMtjHi`
- Deployment URL：`https://yamato-land-payment-preview-f25rcahjz-office-ks-projects.vercel.app`
- Public alias：`https://yamato-land-payment-preview.vercel.app`
- Company entry：`https://yamato-final.vercel.app/land-payment-study.html`

## 公開内容

- SUUMOで再確認した40件を維持し、情報提供日だけを更新した。2026年9月8日が23件、9月7日が17件。
- 物件ID・掲載URL・価格・面積・販売区画数・総区画数・座標・位置精度は直前公開版と同一。
- `catalogRevision` を `suumo-20260908-v1`、取得確認日を2026年9月8日に更新した。
- 新しい順の説明を `情報提供日が新しい順です。` に変更し、物件詳細と物件資料の日付も各物件の値から表示するようにした。
- 保存済み物件は継続して表示する。旧版の計算結果は入力内容を残し、再計算を案内する。

## 公開確認

- 専用URLと会社サイト経由URLで、HTMLと23アセットの計24ファイルがmanifestのSHA-256と一致。
- 両URLのAPIへ検証専用リクエストを送り、HTTP 200、`valid:true`、`stored:false`、`sent:false` を確認。実問い合わせは送信していない。
- 両URLでPC 1440px・SP 390pxを各28項目確認。検索40件、新しい順、保存復元、物件詳細、試算、金融商品3種の切替、旧版の回復、TOP導線、PC地図の非追従がPASS。コンソール・ページエラー0件。
- 公開検証：`production-http.json`、`production-dedicated-browser.json`、`production-company-browser.json`。

## 営業APP連携

- 契約：`yamato.sales.inquiry.v1`、payload schema 2を維持。
- 旧版：`suumo-20260907-v1`。新版：`suumo-20260908-v1`。
- 影響ID：40件すべて。変更項目は `sourceUpdatedAt` のみ。
- 過去の相談・試算に保存された旧 `dataRevision` は置換しない。新しい相談を受ける際は新版を使用する。
- 物件数、ID、価格、面積、座標、販売区画数は変わらないため、社員画面の主工程を止める変更はない。

State: `RELEASE_APPROVED` for the 2026-09-08 SUUMO data refresh.
