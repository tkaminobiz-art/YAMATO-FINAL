# 統合設計 ─ fv_step.html → index.html

作成: 2026-08-18　状態: **設計のみ（実行はクライアントの図面承認後）**
対象図面: `fv_step.html`（コミット `2ace016` / コピー調整 `ffacdde`）

---

## 0. 実行の前提条件

1. **クライアントが fv_step.html の手触りを承認していること**（このプロジェクトの規約: 図面→承認→統合。v4も fv_cinema.html 承認後に統合した）
2. 幕A導入行・幕B主従の2文言（8/18調整）が承認されていること
3. 確認事項⑬（ミライエの標準表記）の回答が Finale グリッドのチップに反映できること
   ※未回答でも「チップ無し」のまま統合は可能

---

## 1. 何と何を入れ替えるか

### v4（現行）とステップ版のシーン対応

| # | v4のビート（fvSNAPS） | ステップ版 | 出所 |
|---|---|---|---|
| 0 | 開幕: 外観動画 hv＋fvOpen演出＋intro＋CTA＋cue | **scene 0 として温存**（fv_stepに無い。統合時に追加） | v4承認済み |
| 1 | 幕A 宛名 | scene 1 ＋導入行「住宅価格が…」 | 8/18調整 |
| 2 | 幕B/C あきらめた方へ→お役に立てる | scene 2（主従を正しく） | 8/18調整 |
| 3 | 幕D 0円台帳（150万→0のカウントダウン演出） | scene 3 ＋2,000万円例文。**カウントダウン演出は移植する**（fv_stepは静的0円） | v4演出＋8/4指示 |
| 4 | 幕P 価格の祭壇 | scene 4 | v4のまま |
| 5 | 幕E 10年後50年後（wall動画） | scene 5 = **wall_pc.mp4 ループに戻す**（fv_stepはposter静止画で代用中） | v4のまま |
| 6-9 | Kitchen/Bath/Vanity/Living（clip動画） | scene 6-9 = **clip_*.mp4 を継続使用**（fv_stepは検証用にstd静止画。動画が承認済みの本来形） | v4のまま |
| 10 | ─ | scene 10 Tatami（新設・std静止画） | fv_step新設 |
| 11 | ─ | scene 11 Entrance（新設・std静止画） | fv_step新設 |
| 12 | Atrium（gh_atrium.webp） | scene 12 Atrium。**画像は当面 gh_atrium 継続**（golden連続性）。Higgsfield再ライト完了後に高解像度版へ差し替え | 計画書§5 |
| 13 | act/Finale（CTA再掲） | scene 13 標準の台帳グリッド＋CTA | fv_step新設 |

計 **14ステップ**。Vanityの台帳文言は「TOTO オクターブ Lite」に更新（パンフ確定）。

### 入れ替え範囲（index.html 内の正確な境界）

行番号は現時点の値。**実行時はアンカーコメントで再特定すること**（他の編集で行がずれるため）。

| ブロック | 範囲 | アンカー |
|---|---|---|
| マークアップ | `1116`〜`1274` | `<section class="hero" id="top">` 〜 対応する `</section>` |
| CSS | `117`〜約`455` | コメント `FV「あかりの物語・改」v4` 〜 `.st__` 系の最終行（HEADERブロックと authority ブロックの間） |
| JS | 約`3250`〜約`3520` | `fvSRC`/`fvPOSTER` の定義 〜 アイドル・スナップ（`fvIdleT`）ブロック末尾 |

**触らないもの**: ヘッダー（1086-）、authority以降の全セクション、iju節のpin+scrub、pm-プレミアムモーション層、pm-progress、フッター。

---

## 2. 技術統合点（衝突と解決）

### 2-1. Lenis × Observer 🔴最重要

index.html はPCで Lenis（慣性スクロール）が生きている。fv_step の Observer は `preventDefault:true` で wheel を奪うため、**両者が同時に動くと Lenis が滑走を続ける**。

解決: **メニュー開閉と同じ規則**（`index.html:3220-3225` の MutationObserver パターン）に従う。

```
obs有効化時   → lenis.stop()
release()時   → lenis.start()
reenter()時   → lenis.stop()
```

SPは Lenis 不使用（`fine && !mobile` ガード）なので影響なし。

### 2-2. ScrollTrigger の再配置

現行FVの `pin: end:'+=620%'` が消えると**ページ全長が約6画面分短くなり**、後続の全 ScrollTrigger の開始位置が変わる。

- 各トリガーは `invalidateOnRefresh` 済みのものが多く、**スワップ後に `ScrollTrigger.refresh()` を一度呼べば再計算される**
- iju節のpinは独立しており、Observer解放後の通常スクロール領域にあるため干渉しない（fv_stepで実証済みのパターン）
- 検証ゲート: iju節のスナップ・lots節のカウントアップ・信条のink-fillが正常発火すること

### 2-3. ヘッダーの透過→solid

v4は `onLeave/onEnterBack` で `.is-solid` を切替（`3355-3356`）。ステップ版では:

```
release()  → siteHeader.classList.add('is-solid')
reenter()  → remove('is-solid')
```

### 2-4. 動画の遅延ロードと再生管理

v4の `fvPrep()`（poster/src遅延セット）と `fvPlayScene()`（当該のみplay・他pause・hv pause）をそのまま**ステップのenterハンドラに移植**する。ロジックは流用可能（fvSRC/fvPOSTERマップも既存のまま）。追加: **次シーンの動画を1つ先読み**（`fvPrep(next)`）すると遷移時の黒フレームが消える。

### 2-5. 幕Dのカウントダウン演出

v4の `fvCnt` （150万円→0円）はscrub位置駆動。ステップ版では**シーンenter時に時間駆動で再生**（`gsap.to(fvCnt,{n:0,duration:.9})`）に書き替える。数字はDOM同一なので流用。

### 2-6. 開幕（scene 0）

`fvOpen` タイムライン（罫→宛名→章番号→cue）と intro/ctaWrap/cue はscene 0の演出としてそのまま生かす。**scene 0 では Observer の次操作で scene 1 へ**（現行はスクロール開始でpinへ入る）。hv（外観動画）はscene 0でautoplay、離脱でpause（fvPlaySceneが既にやっている）。

### 2-7. 深いリンク・リロード

`window.scrollY>10` なら解放状態で開始（fv_step実装済み）。`#lots` 等のアンカー着地はこのガードで通常スクロールのまま。**追加**: ページ内リンクから `#top` に戻るケースは reenter が発火（scrollY→0）するので追加対応不要。

### 2-8. ドットナビと既存UI

- ドット（PC）は右レール。**pm-progress（上端の読了バー）と干渉しない**
- SPはドット非表示・カウンタ上部右（fv_step実装済み）。ヘッダーの来場予約ボタンと位置が重なるため、**SPカウンタは左上へ変更を検討**（統合時に実機確認）

---

## 3. 実行手順（承認後）

1. `cp index.html index.backup_preStep_$(date +%H%M%S).html`（規約どおり・gitignore対象）
2. CSSスワップ: FV v4ブロック → fv_stepの `.fvs` 系（名前空間が違うので衝突しない。旧 `.st__` は削除）
3. マークアップスワップ: hero節の中身を14シーン構成へ（scene 0 = 既存の hv+intro+CTA を `.fvs__scene` 化）
4. JSスワップ: fvTl/スナップ系を削除 → Observerステップ制御を移植＋§2の統合点（Lenis連携・ヘッダー・動画管理・カウントダウン）
5. `ScrollTrigger.refresh()` をスワップ後に1回
6. 検証（§4）→ コミット

工数目安: 実装0.5日＋検証0.5日。

## 4. 検証ゲート（統合コミットの条件）

1. mobile-verify **9ページ全部**で横スクロール破綻ゼロ維持（FVだけでなく全ページ再走）
2. ステップ全14遷移・解放・復帰・静的フォールバック（fv_stepと同じ手順）
3. 動画4景がenterで再生・leaveで停止、黒フレームなし
4. iju節・lots節・信条・実績カウントアップが正常発火
5. ヘッダー透過→solidの往復
6. Lenis有効環境（PC）での操作感（1ジェスチャー=1シーンが崩れないこと）
7. `#lots` 等の直リンク着地
8. LCP: scene 0 は現行と同一資産のため悪化しない見込み。実測で確認

## 5. ロールバック

- 単一コミットでスワップする（部分適用しない）→ `git revert` 一発で戻る
- 加えて `index.backup_preStep_*.html` をローカル温存（規約どおり）

## 6. 未決事項（統合前に確認）

| # | 内容 | 影響 |
|---|---|---|
| 1 | fv_step図面のクライアント承認 | 実行可否そのもの |
| 2 | scene 0（外観+CTA）を含む**14ステップ**の構成でよいか | 操作回数 |
| 3 | SPカウンタの位置（上部右 vs 左） | ヘッダーCTAとの重なり |
| 4 | ミライエのチップ表記（確認事項⑬） | Finaleグリッド |
| 5 | Atrium高解像度化のタイミング（Higgsfield再認証） | scene 12の画質 |
