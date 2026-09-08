# MAP PC構成・学校距離検索：本番公開記録

2026-09-08。ユーザーの公開承認と「ディレクター（新）」の事前確認に基づき、MAP構築担当がcommit・push・本番反映・公開確認まで完了した。

- 本サイト：[土地を探す](https://yamato-final.vercel.app/land-payment-study.html#/search)
- 一覧入口：[物件一覧](https://yamato-final.vercel.app/land-payment-study.html#/search?view=list)
- 専用配布先：[MAP専用URL](https://yamato-land-payment-preview.vercel.app/)
- 実装commit：`33d039b721107c978699284336c5bf3f643497ae`。`origin/main`へpush済み。
- 配布版：`snapshots/land-payment-20260908-pc/`、`map-pc-school-20260908`。
- 本番deployment：`dpl_757Nv4erak8uV9URJBPJ8gYasFz9`、Ready、production。
- プロジェクト：`office-ks-projects / yamato-land-payment-preview / prj_QtoSX8anRttecURruvIJcXwn3P74`。
- 配布URL：[今回のdeployment](https://yamato-land-payment-preview-5705ppe7c-office-ks-projects.vercel.app/)。専用production aliasから本サイトのMAPへrewriteされる。

## 公開した内容

PCは地図を最初の画面に収め、その下に物件一覧を表示。地図はスクロールに沿って画面外へ流れる。一覧から入ってもPCでは地図を表示し、SPは地図と一覧を切り替える。

既存5つの並び順に「小学校が近い順」「中学校が近い順」を追加。学校までの800／1,200／1,600mで絞り込み、カード・比較にも掲載距離を表示する。小学校40件・中学校39件の出典付き情報を使い、欠損は並び順の最後、距離条件では対象外とする。指定学区や通学路の安全性は未確認。

## 公開後の確認

- HTTP・配信・API・他ページ・転送：61項目成功。
- ブラウザー操作：70項目成功、8画面、JavaScript例外0、横あふれ0。本サイトと専用URLそれぞれでChromium 1280×720、WebKit 390×844を使用。
- 全40件の座標が初期地図内に収まり、PCの地図が最初の画面内に表示されること、スクロールで地図が追従しないことを確認。
- 学校2項目の並び順・欠損・複合条件・再読込・一覧から地図・詳細から戻る・旧4入口を確認。学校800m／1,200mのAND条件は8件。
- 24配布ファイルは実装・snapshot・配布パッケージでSHA一致。うち公開静的23ファイルは両配布元でHTTP取得した内容も一致。APIは非公開のサーバーコードなのでHTTPによるソース一致の対象には含めず、配布SHAと挙動を確認した。
- 相談APIは合成データでdryRun 200・無効な版400・本受付未接続503を確認。保存・送信なし。個人情報は送っていない。
- 本サイトのTOP・施工事例・スタッフ・お客様の声のHTMLは公開直前のSHAから変化なし。
- 旧URLの転送は元のクエリも保持する。試算入口は新しい下書きIDを作る。QAの期待値をこの既存仕様に合わせ、到達先と画面を確認した。公開ソースの追加修正はない。
- 公開前のNode 66件・ブラウザー294項目・38画面の検証を維持。公開後は配信と主要操作を追加確認した。

## 保全・残る事項

親mainを同期し、親の実行ファイル10件だけを旧版バックアップ後に更新した。TOPの作業中HTMLとスマホ確認ファイルはSHA不変。画像・物件原典・金融条件と計算・相談API契約は変更していない。旧snapshotも保持した。

iPhone実機の確認は未実施。今回のSP確認はWebKitでの画面・操作検証。町域の座標は位置の目安であり、区画や通学経路の確定には使わない。相談本受付・営業APP・LINE・予約の実接続は今回の対象外で、未接続を維持している。

証跡：`release.json`、`release-http.json`、`release-browser.json`、`deployment-response.json`、`release-parent-sync.json`。本公開記録のcommitは実装commitとは別に保存する。

TECHNICAL_PASS：公開後の配信・操作確認まで完了。RELEASE_APPROVED：ユーザーの既存の明示承認に基づき実行済み。公開状態：本番反映済み。
