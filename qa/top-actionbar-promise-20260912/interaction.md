# interaction

実操作（agent-browser / headless Chromium、`verify01.sh`）。幅 320×568 / 375×812 / 390×844 と 768 / 1024 / 1440。

- FV（scrollY 0）：非表示（visibility hidden・is-visible なし）。
- `#homePromise` 先頭（アンカー到達位置、ヒーロー下端 88px）：表示。
- WORKS：表示。`#visit` 先頭：非表示（VISIT 15%以上可視）。`#faq`：表示。フッター最下部：表示、©・SNS・preview-note はバーの上に読める（body padding-bottom 64px + safe-area）。
- メニューを開く（#menuToggle）：非表示（body.menu-lock）。閉じると復帰。
- バーの「来場予約」をクリック：既存 `contactDialog` が開き、タイトルが「来場予約のご案内」。ダイアログ中はバー非表示。閉じると復帰。
- 電話：`href="tel:0742361123"`（発信画面は実機依存。headless では属性で確認）。
- 各ボタン高さ 48px。横スクロールなし（scrollWidth = innerWidth）。
- 768 / 1024 / 1440：`display:none`、body padding 0。
- コントラスト：白 / #176335 = 7.31:1、本文色 / 白 = 15.45:1、小ラベル #646561 / 白 = 5.87:1。
- reduced-motion：`transition:none`。JS無効時はバー非表示のまま（padding も付かない）。
- 約束セクション：`<a>` 0（`verify-day-cycle-hero.mjs` の「Approved Promise has no CTA links」も通過）。表示文言に対応する遷移はない。
- ビルドゲート：`node scripts/verify-homepage.mjs --self-test`、`verify-day-cycle-hero.mjs --self-test` 通過。隔離コピーで `node scripts/build-checkpoint.mjs` 成功（941ファイル、新規3ファイルを配信対象に含む）。
