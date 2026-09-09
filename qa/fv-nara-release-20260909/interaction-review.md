# 統合後の動作確認

最終の統合HTMLでFV22項目が全通過。PC/SP各18秒と1周、画面外停止/復帰、PC/SP切替の位置保持、低モーション・通信節約・動画エラー・JS無効の静止代替、原稿とメニュー13導線、Tab/Escape、予約/資料請求ダイアログを確認。

連続リサイズ3例とRange未対応serverの互換確認も通過。Range対応環境の8秒付近PC→SP→PCで同位置を保持、transportはdirect、MP4のfetch/Blob全量取得0。待機中の旧metadataが保存時刻を消さない修正を含む。

Naraは6サイズの難波22/28/41と鶴橋16/22/35・18:33、出典クリック/Enter、条件表示が全通過。統合ルートでFV再生→Nara到達停止→トップ復帰再生、メニューから資料/ヘッダーから予約、Naraの2リンクを実クリックしてアクセス#train・土地#list-titleへ到達。ChromiumとWebKit各PC/SPで確認し、8主要ルートHTTP200。integrated/results.jsonは6確認群、errors=[]。

visibilitychangeのイベントfixtureで停止/復帰を確認。Playwrightのタブ切替はvisibilityStateがvisibleのままだったため実OSの非表示判定と実iPhoneは未確認。問い合わせの実送信は行わない。本番CDN・Ready・外部URLの最終確認は公開後の記録とする。
