# Voice Proof QA — 2026-09-06

## Scope

- Page: `index.html#voice`
- CSS: `assets/top-renewal/voice-proof.css`
- Untouched source data: `data/voices.json`
- State: `TECHNICAL_PASS` / `HUMAN_APPROVAL_REQUIRED`

## Source fingerprints

- `index.html`: `767dc7967e83dfb393c1d875772e9cdc6c67564e150ec0279452597b380c94b7`
- `assets/top-renewal/voice-proof.css`: `a356682d2c65c8b563c0639ae9e64134f04eef528de878d64d65b0334f14c820`
- `data/voices.json`: `7f843493e8cff274e6737a629dfdb96b7081e08deea6871152b9bd07927f9870`

## Reference evidence

- `reference-banner-library-typography.jpg` — 1440×1000, BANNER LIBRARYの文字組み一覧。
- `reference-landbook-case-study.jpg` — 1440×1000, Land-book Case Study一覧。
- `reference-landbook-customer-stories.jpg` — 1440×1000, Customer Stories詳細。
- URLs and observation notes: `docs/quality/VOICE_SECTION_REDESIGN_20260906.md`。

## Viewport evidence

- `voice-pc-1440.jpg` — 1440×1131。見出し、主引用、補足2件、全件導線を同一画面で確認。
- `voice-sp-390.jpg` — 390×1131。見出しから主引用、標準仕様の声まで確認。
- `voice-sp-390-bottom.jpg` — 390×1131。補足2件、全件導線、次セクションとの接続を確認。

## Browser measurements

### PC 1440px

- document scroll width: 1440px
- section height: 1043px
- section title: 40.32px / 59.6736px
- main quote: 36.72px / 59.4864px
- supporting quotes: 16px
- computed font stack: `Zen Kaku Gothic New`, `Noto Sans JP`, sans-serif

### SP 390px

- document scroll width: 390px
- section height: 1320px
- section title: 27px / 41.85px
- main quote: 20px / 37px
- supporting quotes: 15px
- computed font stack: `Zen Kaku Gothic New`, `Noto Sans JP`, sans-serif

### SP 320px

- document scroll width: 320px
- section width: 320px
- section height: 1410px
- horizontal overflow: none
- section title: 27px / 41.85px
- main quote: 20px
- supporting quotes: 15px

## Interaction and route checks

- Main and supporting links are native anchors with global `:focus-visible` plus section-specific gold outline.
- No automatic motion or disclosure control remains in this section.
- `prefers-reduced-motion` removes the remaining hover transition.
- `voice.html#v33` opened the detail dialog and displayed the matching source text.
- `v01`, `v08`, `v33` are present in `data/voices.json`.
- TOP and detail page console errors: 0.
- Local static server only: `/api/instagram` returns the existing expected 404 because the serverless endpoint is not mounted. The page handles the fallback, and this is outside the Voice change.

## Commercial Japanese review

| String | Type | Result |
|---|---|---|
| お客様の声 | information label | セクションの標準名をそのまま使用。Pass. |
| お引き渡し後のアンケートから… | body | Source and three decision topics are explicit. Pass. |
| 掲載中の声 / 標準仕様 / 完成後の対応 | labels | Plain information labels. Pass. |
| 全文を読む | CTA | Matches the detail dialog destination. Pass. |
| お客様の声をすべて見る | CTA | Matches the 50-item archive destination. Pass. |
| Three blockquotes | customer quotations | Kept verbatim. No mechanical correction. |

TOP全体の情報セクション見出しは `docs/quality/TOP_SECTION_TITLE_AUDIT_20260906.md` に記録した。1440px、390px、320pxで9見出しの表示文字列と横幅を再確認し、不一致と横方向のはみ出しは0件だった。

補足: headless Chromiumでは指定フォントスタックは確認できたが、Google Fontsの個別フェイス確認は `false` だった。ローカル環境で外部フォントが読み込めない場合も、`Noto Sans JP` とシステムゴシックへフォールバックする。

## Creator self-review

Visual Artifact Score: 89 / 100
Review status: creator self-review

- Beauty and composition: 18/20
- Hierarchy and clarity: 19/20
- Distinctiveness and memorability: 18/20
- Craft and detail: 18/20
- Fitness to audience and category: 16/20

Verdict: 現行の均等な白カード3枚より、読む順序、ブランドの記憶点、証拠の意味が明確に上がった。BANNER LIBRARY由来の強い一画面とLand-book由来の事例階層が、引用原文を主役にしている。

Strongest point: 赤い「50」と主引用が同じ視覚軸にあり、件数だけで終わらず、費用の見通しという選定理由まで3秒で読める。

Main design loss: 人物・住まいの写真を使わないため、生活感と家族の温度は前案より少ない。現状の素材では、誤認を避けるための意図的な損失と判断した。

Observed gains against the prior 1440/390 viewport:

1. 同型カードの反復から、主引用1件と補足2件の階層へ変わった。
2. 明朝20–21pxの一律表示から、Zen Kaku Gothic Newの36.72/16px（PC）、20/15px（SP）へ役割を分けた。
3. ほぼ見えなかった紙テクスチャをやめ、黒・生成り・赤の色面でセクション境界を明確にした。
4. 家の好みだけでなく、費用、標準仕様、完成後の対応という判断材料を原文から選んだ。

Unresolved optional direction: 各ご家庭と一致する許諾済み写真が揃った場合のみ、主引用に小さな本人邸写真を追加する余地がある。現在は追加しない。

## Release boundary

- 2026-09-06時点: commit未作成、push未実施、本番未反映、`HUMAN_APPROVAL_REQUIRED`。
- 2026-09-07: ユーザーが本案の差し替えと本番公開を明示指示。本スコープは `RELEASE_APPROVED`。
