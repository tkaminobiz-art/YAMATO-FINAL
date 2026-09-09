# 独立ページ日本語改稿の制作条件
依頼元：現ディレクター 01a08343-e8f5-7512-8f0d-bbb3df964e6a。実装・QA・既存本番公開まで承認済み。
大阪の仕事を続けながら奈良で住まいを探す読者へ、電車の帰宅例、駅から家まで、休日の車移動、土地と総予算を順に伝える。回りくどさ・抽象的誘導・反復した確認指示を整理する。
基準版 origin/main cb37313085098880ceb7300966f61d74de4fc3b8。5つの独立ページ資産は9/9取得の本番とバイト一致。共有dirty checkoutは触らず専用worktreeを使用。
変更対象は move-to-nara-preview.html と nara-journey.js の表示文字列。必要な場合のみ最小限のCSS。構成・画像・データ・アンカー・ルーティング・GSAPロジック・API・TOP・noindex・ドメインは変更しない。
copywriterで生成、natural-japanese-web-copyで自然さ、commercial-japanese-lp-copyで役割と商用表示を確認。PC/SP Chromium/WebKit、通常/低モーション/JSなし、8旅程段階、折りたたみ、全CTAの実際の行先をQA。電話発信や実送信は行わない。

横向き844×390の基準版で時刻(114〜170px付近)と案内ボタン(100〜144px)の重なりを再現。読みやすさを確保する最小修正として、既存の横向き用CSSのボタン位置だけを header-h + 80px に変更する。通常PC/SPやGSAPの設計は維持。before/landscape-844.png とjsonで根拠を保存。
横向きの生成背景注記も列車種別ラベルと近接するため、ブランド行の下（header-h + 40px）へ移す。注記の表示条件は保持。
