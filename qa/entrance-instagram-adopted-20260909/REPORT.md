# TOP 家づくりのご案内 / Instagram B 採用実装

実装・ブラウザ検証は完了。本番公開許可は現ディレクター経由の採用依頼に基づく。公開結果はこのフォルダの RELEASE.md と production/ に記録する。

家づくりのご案内：B-compact-gothic を実文字と元の4写真で実装。土地→支払い→家づくり→通勤、下段4ショートカット、奈良アクセスの9導線を保持。横スクロールの自動再生/操作はこのセクションだけ廃止。PC 1440×900 / 1366×768のヘッダー下に全体が収まり、SP390/320は本文16pxを維持した2列2段。

Instagram：B構図を実APIの最新10投稿で実装。選択した投稿の画像・日付・種別・抜粋・公式URLが同時に対応。元カバーをcontainで全表示。ほかの3投稿は独立した投稿で、同じ物件の別写真として扱わない。全文・複数枚は既存モーダルで読める。取得中/0件/失敗・再試行/画像失敗/1〜3件を区別。共通メニュー・問い合わせモーダル・別プレビューの旧ギャラリーは保持。

変更は index.html の対象2セクションと必要依存/Instagramモーダルのクラス、新しい専用CSS/JS、top.jsへの分岐、既存案内統合ゲート。共有dirty checkoutには介入していない。既存FVの自動ループ/スイッチ無し/注意書き無し、TOPの他採用箇所、Nara独立改稿、カタログ表紙、API/認証/設定は保持。カタログの中身差し替えは別リリースとして継続する。

検証根拠：evidence/capture.json（6幅/実フォント/表示と寸法）、functional.json（Chromium PC/SP・WebKit SP・JSなし）、exits-motion.json（9URL/FV/非スタブ実API）、preservation.json（他領域/15ファイル）、fv-pixel-regression.json（PC/SP差分0）、receipt.json（prepare/review）。公開パッケージは700 runtime files / 121.99MiBでQA・元資料・署名URLを含まない。

TECHNICAL_PASS: 必要な自動・実表示確認済み。RELEASE_APPROVED: 依頼書の継続公開許可あり。追加採用待ちは不要。実機iPhone/Androidと携帯回線は未確認。作成者による視覚レビューであり、独立審査/実機合格とは区別する。
