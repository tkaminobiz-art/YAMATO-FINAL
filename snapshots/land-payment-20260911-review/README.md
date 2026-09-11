# 久米町の周辺施設情報を確認中とする版

版: suumo-20260911-review-v1。基準snapshot land-payment-20260908-suumoは変更せず保持。
s20080819の原掲載に所在地と周辺施設の矛盾を確認したため、施設11件をdata.mjsの共通変換で保留。raw suumo-properties.mjsはそのまま。物件・価格・面積・写真・主交通・保存候補・計算条件は変更しない。他39件の施設も変更しない。
学校距離を0とせずnull扱い。検索・並び順・一覧・詳細・比較は同じ保留データと内容確認中表示を使う。元施設のGoogle Maps検索リンクも表示しない。
配布: node scripts/package-land-payment.mjs 20260911-review → 既存yamato-land-payment-preview。通常本体buildとは別。本体rewriteを保持。
manifestの公開状態は準備時点。公開commit/deployment/確認証拠は調査/久米町周辺施設_確認中対応_20260911/REPORT.mdを正本とする。
