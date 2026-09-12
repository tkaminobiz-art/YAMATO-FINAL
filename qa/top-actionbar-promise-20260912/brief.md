# brief

2026-09-12 ユーザー決定「一番、A。２番進める。三番、差し替えない。」に基づく TOP `index.html` の2変更。指示書は `調査/固定バーと約束統合_20260912/`（01 固定バー案A、02 約束01〜03統合）。作業場所は正式checkout（`現在のサイト作業場所/` = `カタログ帯削除公開/checkout`、main、起点 753bbf0）。

読者：スマホで夜に見る移住検討層。01は「どこからでも来場予約と電話を1タップ」、02は「ヒーロー直後に文字だけが約1画面続く状態をなくし、写真→見出し→本文1行のカード3枚にする」。

経路：局所修正。方向探索・素材調達なし。読んだスキル：copywriter（保持確認）、natural-japanese-web-copy、commercial-japanese-lp-copy、design-critic（独立サブエージェントで冷読）。参照：参考モック（index.diff / mock CSS・JS）、実測JSON、既存 `promise-adopted-20260911/style.css`、`top.js` の data-contact ハンドラ、ビルド時ゲート `scripts/verify-homepage.mjs`。

設計判断：
- 固定バーはヘッダー・フッターの外の独立した固定要素（`</main>` 直後の `nav`、z-index 38）。767px以下のみ表示。予約はヘッダーと同じ `href="#visit" data-contact="reserve"`（既存ダイアログ）、電話は `tel:`。
- 表示判定は「ヒーロー下端がヘッダー線を過ぎたら」。FVのSCROLLリンク到達位置は `scroll-padding-top`（64+24px）ぶん下がるので、判定線はヘッダー高と scroll-padding-top の大きい方にした。VISITは `intersectionRatio>=0.15` で隠す（モックの isIntersecting は1px見えた時点で隠れるため仕様に合わせた）。メニュー・ダイアログ中は `body.menu-lock` で非表示（visibility:hidden）。
- 約束は `.pr26__upper`/`.pr26__jobs` を `.pr26__cards`（article×3）へ置換。h1#heroPromise・#homePromise・装飾は維持。リンク0。03から外した2文は `#lineup .common-spec` へ移設（※注記の margin-top を 6px に）。
- ビルドゲート `verify-homepage.mjs` は旧 `gf-job` 3枚を必須にしていたため、新カード3枚の判定に更新（自己テストも同様）。更新しないと Vercel ビルドが失敗する。

HOLD維持：ヘッダー・フッター全面リデザインは検討中（触っていない）。フォーム実接続は本ドメイン移行前の残作業（準備中ダイアログと電話導線のまま）。約束内の4CTA削除は維持。
