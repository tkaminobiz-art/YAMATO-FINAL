# 素材と配置

VOICEは既存living-wide-1200.webp／garden-exterior-2000.webpとCSSクロップ。PCは室内/外観/内観部分の3枚、SPは庭・外構の部分も加え4枚の独立した施工例群。建物・家具を回転/skewせず、事実写真を再生成しない。サイズに応じた既存srcsetを維持。

VISITは実写sakyo-living-1440.webp。輪郭をSVGの曲線クリップでつなぐ。採用画像の右上花をimagegenの参照画像編集でPC/SP別の透過PNGへ抽出し、cwebp品質85・alpha品質90で配信用WebPへ変換（PC864px/392,992bytes、SP420px/102,822bytes）。画像編集はimagegenを使用。PCは左下へ開く内向き、SPは右端へ開く採用の向きを保持。元のpeony-mask.webpだけを回転した初稿では花形と葉の配置が違い、SP本文へ葉が重なったため変更した。

右上花の生成は3リクエスト。PC初回は透過指定に対してRGB/市松背景が焼き込まれていたため不採用。PC修正版とSPはRGBAで透明な背景を確認し、ブラウザで濃赤の紙と合成して細線/向き/文字との非干渉を目視。生成ツールが実際のモデルID/金額を返していないためGPT IMAGE2.5使用や金額を断定しない。Higgsfieldへの生成発注・クレジット使用はこのVOICE/VISIT作業では0。

PC/SPの下の花は既存peony-mask.webpを別配置。紙はcotton-paper-960.webp、主ボタンはgold_washi.webpを再利用。写真と装飾の役割を分け、文字・導線は実HTMLと実フォント。全画面画像貼付けなし。

採用画像は調査/自由構図画像生成_20260909/VOICE/alternatives/B/{pc-final,sp-final}.png、VISIT_CONTACT/flower-inward/pc-final.png、VISIT_CONTACT/sp-final.png。参照SHAはbaseline.json。生成ファイル名/採用結果/配信SHAはgeneration.json。
