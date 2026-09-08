# Move to Nara TOP導線修正 — 本番反映記録

- 実施日: 2026-09-08
- 対象: `move-to-nara-preview.html`
- 実装コミット: `7e25177b94d4039d4bbb8451733fab6cd3674bd6`
- Vercel deployment: `dpl_ES1wBeFRSVYmVncsKLWWLwY7nBVN`
- 本番URL: <https://yamato-final.vercel.app/move-to-nara-preview.html>
- 状態: RELEASE_APPROVED（ユーザー指示に基づく本番反映）

## 変更

ヘッダーのブランドリンクとフッターの「やまと不動産 トップへ戻る」を、旧確認ページ `index-art-preview.html` から会社TOP `/` へ変更した。表示文言、レイアウト、画像、Move to Nara本文、物件ページは変更していない。

## 本番確認

- PC Chromium 1440 × 900: TOP → Move to Nara → ヘッダーからTOP、PASS。
- SP Chromium 390 × 844: Move to Nara → フッターからTOP、PASS。
- SP Chromium 390 × 844: Move to Nara → 「販売中の分譲地を見る」→ `land-payment-study.html?view=list#/search?view=list`、PASS。
- 遷移先で「土地を探す」、40件、地図・一覧切替を確認。
- Move to NaraのヘッダーとフッターのDOM上のリンク先がともに `/` であることを確認。
- 本番PC/SP画像はローカル確認画像とSHA-256が一致し、今回のリンク変更による表示差分がないことを確認。

## 既知事項

Move to Naraで `/favicon.ico` の404が1件ある。変更前から存在し、今回の2リンクには影響しない。物件MAP/一覧への遷移後はコンソールエラー0件。

技術確認は完了。既存ページ全体のコピー、デザイン、交通情報の再承認を意味しない。
