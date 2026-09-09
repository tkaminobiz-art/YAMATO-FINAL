# FV直下の重複帯の削除
2026-09-09。「770棟を支えた、3つの仕事」の見出し・説明・v12/I様邸の引用と出典を含むaside.gf-evidenceだけをindex.htmlから削除。最新main/本番378f1db0f6a32aeaf67b88b6be96c907872e7fdfを基準に担当worktreeで実装した。

3つのDESIGN/CONSTRUCTION/TEAM & AFTERCARE紹介、施工事例/スタッフ紹介の2CTA、前半01〜03、次の家づくりのご案内は保持。削除後にCTAが次の背景へ接したため、CTAが最後となる#homePromiseに24pxの末尾余白だけ追加した。帯を使う他のプレビューの専用CSSは削除していない。元アンケートデータ、VOICE、カタログ/表紙/動画、他の採用済みTOPは不変更。

既存verify-homepage.mjsの帯を必須とする条件を承認内容へ更新し、帯の不在と残す紹介/CTAを検査。build-checkpoint.mjsによるカタログ、FV、Nara、WORKSの既存ゲートも確認する。

PC1440×1000/WebKit390×844の前後画面、写真ロード、本文保持、施工事例/スタッフ紹介CTAの実遷移と戻るを確認。横はみ出し・ブラウザエラーなし。実機確認ではない。素材生成・購入・問い合わせ送信・他の診断候補の実装はない。

TECHNICAL_PASS / RELEASE_APPROVED。prepare/reviewのreceiptを記録。commit/push、本番Production成功、実配信の不在/保持とSHA、本番PC/SP画面は公開後のRELEASE.mdとproduction/に記録し、現ディレクターへ一度報告する。
