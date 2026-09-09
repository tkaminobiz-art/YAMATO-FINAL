# VISIT 採用版の本番統合

更新102「OK！本番公開」により、更新101のPC高さ・朱色・新和紙を採用。本番統合は最新mainとProductionの5945f0bから専用の隔離worktreeで実施した。共有checkoutは古いHEADかつdirtyのため変更していない。

変更は採用VISIT CSSへの75行追記、新WebP360494bytesの追加、indexの当該CSSキャッシュキー1箇所。採用CSS2点を本番CSS位置へ相対URLだけ調整して統合。新WebPは承認SHA 6be0f78c7b7f581f11f73d646a6210ab28aed0230bc2b073475973993c3c3543と一致。旧プレビューHTMLでTOPを置換していない。

主基準1440×778のVISIT高674px、ヘッダー76.75px、余り27.25px。1366×768は664px、1440×900は796px、1920×1080は900px。SP320/390は791.67/872.05px。6画面で採用版との描画矩形・算出スタイル・VISIT/案内DOMが一致。主基準、1920、320、390の全セクションPNGは全画素一致。残る2条件はPNG完全一致ではなく、目視と矩形/スタイル照合で確認した（記録を同梱）。

日本語は実描画Shippori Mincho、英字/電話Times New Roman。写真・上花内向き/採用SP花・曲線・原稿・全導線は維持。Chromium1440通常とWebKit390低モーションで予約/資料の開閉・Tab・Esc/閉じるのフォーカス復帰を確認。電話はhref確認のみ。実フォーム未接続と既存SP写真注記13px/写真下縁への接触は現状維持。実機検証やサイト全体のアクセシビリティ合格ではない。

元indexとの差はCSSキャッシュキーだけであることを機械照合。FV自動18秒ループ/スイッチなし、削除済み説明引用帯、Nara、WORKS、VOICE、案内、Instagram、カタログ32項目/表紙/動画を保持。保護対象ファイル25点は元SHA一致。THE YAMATO WAY、検討中ヘッダー/フッター等は含めない。

既存ビルド検査通過。公開用パッケージ747ファイル、新WebPを含み、新比較HTML・調査QA・生成PNG原本は含まない。採用素材の元PNG/プロンプトは元の比較成果フォルダに保持。今回の生成なし。

ローカル検証：capture.mjs / interaction.mjs / verify.py。QA_BASEとQA_OUTで公開URL/出力先へ切替可能。検証には承認版のローカルreferenceを使用。公開結果・commit・Vercelの状態はRELEASE.mdおよび成果/本番公開へ記録する。ユーザー承認はRELEASE_APPROVED、統合検証はTECHNICAL_PASS。
