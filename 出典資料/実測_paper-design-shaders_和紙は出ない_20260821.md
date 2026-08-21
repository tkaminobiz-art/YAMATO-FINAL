# 実測：`@paper-design/shaders` の paperTexture では、和紙は出ない

計測 2026-08-21 ／ 対象 `@paper-design/shaders@0.0.80` ／ 比較対象 `assets/std/page_kinari_letter_1800.webp`

## 結論

`web-design-creation` J-4 の用途表は **「和・クラフト・食品 → PaperTexture」** としているが、
**和紙については成り立たない。** paperTexture の `u_fiber` は**方向を持たないランダムノイズ**で、
和紙の縦の簀目（すのめ）を再現できない。出るのは**洋紙（水彩紙・コットンペーパー）**。

| | 粒の性質 | stdev（gray・同一枠） |
|---|---|---|
| **実際の和紙 webp（参照）** | **縦に走る繊維** | 5.66 |
| shader `fiber1 / fiberSize.25 / rough.5` | 等方のランダム粒 | 4.28 |
| shader `fiber1 / fiberSize.06 / rough.3` | 等方の細粒 | 4.15 |
| shader `fiber.8 / rough.9 / crumples.3` | 粗いコットン地 | 4.63 |

証跡画像: `_実測_和紙vsシェーダ.png`

## 到達までに踏んだ罠（次回のため）

1. **`u_noiseTexture` が必須。** 渡さないと canvas が黒のまま。`getShaderNoiseTexture()` を await して渡す
2. **色は文字列不可。** `u_colorBack:'#F4EEE0'` は `Unsupported uniform type: string` で無視される。
   `getShaderColorFromString('#F4EEE0')` で配列にする
3. **`defaultPatternSizing` を混ぜると警告の山。** paperTexture は fit/scale/rotation 系の uniform を持たない（無害だが紛らわしい）
4. 実在する uniform（実測）: `u_colorFront` `u_colorBack` `u_contrast` `u_roughness` `u_fiber` `u_fiberSize`
   `u_crumples` `u_crumpleSize` `u_folds` `u_foldCount` `u_drops` `u_seed` `u_fade` `u_noiseTexture` `u_image` `u_imageAspectRatio`

## ビルド無しで載るか → 載る

`package.json` の無い静的サイト（やまとは83ページ）でも、`esm.sh` から動的 import で動く。
ゼロ依存・201KB（非gzip）・`ShaderMount` に DOM要素を渡すだけ。第4引数 `0` で静止（J-4「静止版を第1選択」）。

```js
const { ShaderMount, paperTextureFragmentShader, getShaderNoiseTexture, getShaderColorFromString }
  = await import('https://esm.sh/@paper-design/shaders@0.0.80');
new ShaderMount(hostEl, paperTextureFragmentShader, {
  u_colorBack: getShaderColorFromString('#F4EEE0'),
  u_colorFront: getShaderColorFromString('#C4B79C'),
  u_noiseTexture: await getShaderNoiseTexture(),
  u_fiber:1, u_fiberSize:.25, u_roughness:.5, u_contrast:.6, u_seed:7
}, undefined, 0);
```

## やまとで採らない理由（実測にもとづく）

1. **和紙が出ない**（上表）。紅×生成りは縦の簀目が効いているので、洋紙にするとブランドの芯がズレる
2. **既に信条で Canvas 粒子が動いている。** その直上に2つ目の WebGL コンテキストを置く割に合わない（#iju のクラッシュ史）
3. 置き換え候補だった平紙3枚は計434KB だが、**台紙466KB と金箔和紙335KB は"質感"ではなく"図版"**でシェーダの守備範囲外。
   つまり総量1,235KB のうち置き換えうるのは1/3で、それも品質が落ちる

**採るとしたら**: 和紙の文脈ではない別案件、または `HalftoneCmyk` / `Dithering`（印刷風）のように
和洋を問わない表現。`GrainGradient` は未検証。
