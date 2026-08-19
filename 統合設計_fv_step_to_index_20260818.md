# 統合設計 ─ fv_step.html → index.html

作成: 2026-08-18　**全面改訂: 2026-08-19（v5.4「上質なカタログ」構成に対応）**
状態: **図面はユーザー採用済み。実行はクライアント承認後**
対象図面: `fv_step.html`（コミット `3ea9ada`）

> 旧版（8/18）は「理想→約束→0円→装備」の13幕構成を前提に書かれていた。
> 現行 v5.4 は構成・機構・書体のすべてが変わっているため、本書は**全面差し替え**。

---

## 0. 実行の前提条件

1. **クライアントが fv_step.html の手触りを承認していること**（規約: 図面→承認→統合。v4も fv_cinema.html 承認後に統合した）
2. `index.html` を**同時編集している別エージェントがいないこと**（過去に競合の実績あり。着手前に `git status` と最終更新時刻を確認）
3. 未確定でも統合は可能な項目: ミライエ標準表記（確認事項⑬）／毛筆ロゴ（パンフ入稿待ち＝当面 Yuji Syuku）／吹き抜けの高解像度再ライト

---

## 1. v5.4 の構成（14シーン）

| # | id | 章（柱） | 内容 | 地色 | 備考 |
|---|---|---|---|---|---|
| 1 | s00 | ─ | 表紙「花鳥風月」 | 紅 | Higgsfield生成の箔押し原画＋HTML文字重畳 |
| 2 | s01 | ─ | 見返し「ずっと、愛せる家。」 | 深紅 | コピーはパンフ0723 p2 実文 |
| 3 | s06 | 標準装備 | Kitchen クリナップ ステディア | 生成り | |
| 4 | s07 | 標準装備 | Bath TOTO サザナ | 紅 | is-right |
| 5 | s08 | 標準装備 | Vanity TOTO オクターブ Lite | 生成り | |
| 6 | s09 | 標準装備 | Living 天井高2.4m・ハイドア2.3m | 紅 | is-right |
| 7 | s05 | 標準装備 | Wall 旭化成 ヘーベルパワーボード | 生成り | 単一img（poster_wall.webp） |
| 8 | s10 | 標準装備 | Tatami DAIKEN 和紙畳 | 紅 | is-quiet |
| 9 | s11 | 標準装備 | Entrance LIXIL ジエスタ2 | 生成り | is-right |
| 10 | s03 | 費用のこと | 0円の証書（地盤改良費/つなぎ融資/仲介手数料） | 紅 | 箔金の数字。到達時に150万→0円 |
| 11 | s20 | こだわり | Atrium 吹き抜け・天井を上げる | 生成り | 章リード「浮いた費用は…」を保持 |
| 12 | s21 | こだわり | Counter 造作カウンター・間接照明 | 紅 | is-right |
| 13 | s22 | こだわり | Storage 玄関の造作収納・足元灯 | 生成り | is-quiet |
| 14 | s13 | ご案内 | 招待＋CTA（生成りの返信カード） | 紅 | |

**設計の骨子**
- 論理は「標準がこれだけ高品質 → その費用が0円 → 浮いた分をこだわりに回せる → だから大手で諦めた家が叶う」。証拠→理由→結果の順。
- **紅⇄生成りが完全に交互**。頁をめくる感触を色で表す。s00/s01 は「表紙＋見返し」で1組（ともに紅系）。
- コピーが必要なのは **s01・s03・s13 の3箇所のみ**。すべてクライアント実文または承認済み文言で、新規コピーは書いていない。
- 章の柱（標準装備／費用のこと／こだわり／ご案内）が左端に常時出る＝書籍のランニングヘッド。

---

## 2. 何と何を入れ替えるか

**行番号は 2026-08-19 時点の実測値。実行時はアンカーで再特定すること**（他の編集でずれる）。

| ブロック | index.html の範囲 | アンカー |
|---|---|---|
| CSS | `117`〜`460` | コメント `FV「あかりの物語・改」v4` 〜 `.st__f .st__ledger{...}`（次は「実績」ブロック `463`） |
| マークアップ | `1116`〜`1276` | `<section class="hero" id="top">` 〜 直後の `<section class="authority" id="auth">`(`1277`) の手前 |
| JS | `3237`〜`3502`頃 | コメント `4) FV「あかりの物語・改」v4` 〜 `fvIdleT` ブロック末尾 |

**触らないもの**: ヘッダー（1086-）、authority以降の全セクション、iju節のpin+scrub、pm-プレミアムモーション層、pm-progress、フッター。

**注意: `--mx` の衝突**
index.html の `:root` は `--mx:clamp(22px,6vw,96px)`、fv_step は `clamp(22px,5vw,72px)`。
fv_step の値は `.fvs` スコープに閉じて宣言すること（`:root` を書き換えると全ページに波及する）。

---

## 3. 技術統合点

### 3-1. Lenis × Observer 🔴最重要

index.html はPCで Lenis（慣性スクロール、`3209-`）が生きている。fv_step の Observer は `preventDefault:true` で wheel を奪うため、**同時に動くと Lenis が滑走を続ける**。

メニュー開閉と同じ規則（`index.html:3220-3225` の MutationObserver パターン）に従う:

```
obs有効化時   → lenis.stop()
release()時   → lenis.start()
reenter()時   → lenis.stop()
```

SPは Lenis 不使用（`fine && !mobile` ガード）なので影響なし。

### 3-2. ページスタック遷移と z-index

v5.4 の遷移は**クロスフェードではなく重ね（次の紙が下から乗る）**。統合時に必要なこと:

- `.fvs__scene` の `z-index` は遷移中に 0/1/2 を行き来する。**index.html の他のfixed要素（ヘッダー z-index、pm-progress、メニュー）より低い値に収まっているか確認**。fv_step 単体では最大2。
- 紙の縁の影 `box-shadow:0 -26px 64px` は `.fvs` の `overflow:hidden` に切られる前提。**index.html の hero に overflow:visible が付いていないこと**を確認。
- `html.fvs-app .fvs{height:100vh/100svh;overflow:hidden}` を hero に適用する。既存の `.hero` の高さ指定（pin前提）は削除する。

### 3-3. ScrollTrigger の再配置

現行FVの `pin: end:'+=620%'` が消えると**ページ全長が約6画面分短くなり**、後続の全 ScrollTrigger の開始位置が変わる。

- 多くは `invalidateOnRefresh` 済みなので、**スワップ後に `ScrollTrigger.refresh()` を一度呼べば再計算される**
- iju節のpinは独立しており、Observer解放後の通常スクロール領域にあるため干渉しない
- 検証ゲート: iju節のスナップ・lots節のカウントアップ・信条のink-fillが正常発火すること

### 3-4. ヘッダーの透過→solid

v4は `onLeave/onEnterBack` で `.is-solid` を切替（`3355-3356`）。ステップ版では:

```
release()  → siteHeader.classList.add('is-solid')
reenter()  → remove('is-solid')
```

**加えて**: 紅の頁と生成りの頁でヘッダーの文字色が変わる必要がある。`root.setAttribute('data-fvstheme', …)` は既に実装済みなので、ヘッダー側に `html[data-fvstheme="paper"]` の分岐を足す。

### 3-5. 動画への差し替え（統合時のTODO）

fv_step は検証用に静止画（`assets/std/*.webp`）を使っている。index.html には承認済みの clip 動画がある:

- Kitchen/Bath/Vanity/Living → `clip_*.mp4`
- Wall → `wall_pc.mp4`

v4の `fvPrep()`（poster/src遅延セット）と `fvPlayScenep()`（当該のみplay・他pause）を**ステップのenterハンドラへ移植**する。`fvSRC`/`fvPOSTER` マップは既存のまま流用可。
**追加**: 次シーンの動画を1つ先読み（`fvPrep(next)`）すると遷移時の黒フレームが消える。

⚠️ ただし v5.4 は**図版プレート方式**（写真が画面全面ではなく金枠の中）。動画も同じ枠内に収まるので、`object-fit:cover` のまま `.fvs__media` 内に入れれば成立する。**フルブリード前提のクロップとは見え方が変わる**ので、差し替え後に必ず目視すること。

### 3-6. 0円のカウントダウン

`countdown()` は実装済み（`s03` 到達時に150万→0円を時間駆動で再生、`cdDone` で1回限り）。そのまま移植。

### 3-7. 深いリンク・リロード

`window.scrollY>10` なら解放状態で開始（実装済み）。`#lots` 等のアンカー着地はこのガードで通常スクロールのまま。`#top` へ戻ると reenter が発火。

### 3-8. ドットナビと既存UI

- ドット（PC）は右レール。pm-progress（上端の読了バー）と干渉しない
- SPはドット非表示・カウンタ上部右。**ヘッダーの来場予約ボタンと重なる可能性**があるため、統合時に実機確認（左上への変更を検討）

### 3-9. 書体の追加

fv_step は以下を新規に読み込んでいる。index.html 側の `<head>` に統合が必要:

```
Shippori Mincho B1 (400,500)   … 情緒コピー
YakuHanMP (jsdelivr CDN)        … 約物半角
```

既存の Zen Kaku Gothic New / Inter / Yuji Syuku は共通。**Typekit kit `ftb5hqp` とは無関係**（Shippori/YakuHan はドメインロック無し）。

---

## 4. 実行手順（承認後）

1. `cp index.html index.backup_preStep_$(date +%H%M%S).html`（規約どおり・gitignore対象）
2. `<head>`: Shippori Mincho B1 と YakuHanMP を追加
3. CSSスワップ: FV v4ブロック（117-460）→ fv_step の `.fvs` 系。旧 `.st__`/`.fv-cine` は削除。`--mx` は `.fvs` スコープへ
4. マークアップスワップ: hero節の中身（1116-1276）を14シーン構成へ
5. アセット確認: `assets/std/` の cover_*/page_*/opt_* が index.html から同じ相対パスで引けること
6. JSスワップ: fvTl/スナップ系を削除 → Observerステップ制御を移植＋§3の統合点（Lenis連携・ヘッダー・動画管理・カウントダウン）
7. `ScrollTrigger.refresh()` をスワップ後に1回
8. 検証（§5）→ 単一コミット

工数目安: 実装0.5日＋検証0.5日。

---

## 5. 検証ゲート（統合コミットの条件）

1. `mobile-verify` を **9ページ全部**で FAIL 0（FVだけでなく全ページ再走）
2. ステップ全14遷移・解放・復帰・静的フォールバック（`?static=1`）
3. **ページスタック遷移が index.html でも成立**（遷移中に2枚共存・z-indexが他UIを侵さない・紙の縁の影が出る）
4. 動画に差し替えた場合: 4景がenterで再生・leaveで停止、黒フレームなし、枠内のクロップが破綻していない
5. iju節・lots節・信条・実績カウントアップが正常発火
6. ヘッダー透過→solidの往復＋紅/生成りでの文字色分岐
7. Lenis有効環境（PC）で1ジェスチャー=1シーンが崩れない
8. `#lots` 等の直リンク着地
9. LCP: 表紙画像（cover_pc_1920.webp 249KB）が LCP 要素になる。現行と比較して悪化していないこと

---

## 6. ロールバック

- **単一コミットでスワップする**（部分適用しない）→ `git revert` 一発で戻る
- 加えて `index.backup_preStep_*.html` をローカル温存（規約どおり）

---

## 7. 未決事項

| # | 内容 | 影響 |
|---|---|---|
| 1 | fv_step図面のクライアント承認 | 実行可否そのもの |
| 2 | 標準装備を静止画のままにするか動画へ戻すか | §3-5。図版プレート方式では静止画の方が破綻しない可能性 |
| 3 | SPカウンタの位置（上部右 vs 左） | ヘッダーCTAとの重なり |
| 4 | ミライエのチップ表記（確認事項⑬） | 標準装備の表記 |
| 5 | 毛筆ロゴ（パンフ入稿データ） | 表紙の「花鳥風月」。当面 Yuji Syuku で代替中 |
| 6 | 吹き抜けの高解像度再ライト（Higgsfield） | s20 の画質 |
