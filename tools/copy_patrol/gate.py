#!/usr/bin/env python3
# コピー審査ゲート: copywriter SKILL + contexts/yamato-fudosan.md の「黒白がつく規則」だけを機械判定する
import json,re,sys,collections
S=sys.argv[1] if len(sys.argv)>1 else '.'
ROWS=[]
for line in open(S+'/copy.jsonl',encoding='utf-8'):
    d=json.loads(line)
    for r in d['rows']: r['file']=d['file']; ROWS.append(r)

fails=collections.defaultdict(list)
def flag(code,r,note=''):
    fails[code].append((r['file'],r['line'],r['kind'],r['text'][:90],note))

# ---- G1 事実（一次資料と矛盾したら赤）----
OLD_PRICE=re.compile(r'2[,，]?180|2[,，]?380')
ESTIMATE_ANCHOR=re.compile(r'(お?見積(り|もり|書)?).{0,12}(の金額のまま|から(は)?(増え|変わ)|後(から)?(は)?(増え|変わ))|一度お出しした金額のまま|最初にお見せした金額のまま|見積もり後')
WRONG_HQ=re.compile(r'本社.{0,12}大和郡山|大和郡山市.{0,8}(本社|1丁目)')
OLD_TITLE=re.compile(r'専務')
ABS=re.compile(r'絶対に(ご)?満足|必ずご満足|100%満足')
for r in ROWS:
    t=r['text']
    if OLD_PRICE.search(t): flag('G1-旧価格の疑い',r)
    if ESTIMATE_ANCHOR.search(t): flag('G1-約束の基準点が見積もり',r)
    if WRONG_HQ.search(t): flag('G1-本社所在地の誤記',r)
    if OLD_TITLE.search(t): flag('G1-旧役職(専務)',r)
    if ABS.search(t): flag('G1-結果保証',r)

# ---- G2 やまと固有の禁則語 ----
BAN={'安い/格安':re.compile(r'安い|格安|激安|お安く'),
     '大袈裟':re.compile(r'唯一無二|圧倒的|業界No\.?1|業界一|革命的|至極|究極の|最高峰|日本一'),
     '競合実名':re.compile(r'積水|住友林業|一条工務店|タマホーム|アイフルホーム|ヘーベル|ミサワ|大和ハウス|セキスイ'),
     }
for r in ROWS:
    for k,p in BAN.items():
        if p.search(r['text']): flag('G2-'+k,r)

# ---- G3 壊れた日本語 / 翻訳調（禁止A）----
A={'することができます':re.compile(r'することができ(ます|る)'),
   '冗長な断定':re.compile(r'に他なりません|にほかなりません|と言えるでしょう|という観点から|と言っても過言では'),
   'カタカナ直訳':re.compile(r'ソリューション|ワンストップ|コミットし|イノベーティブ|シナジー'),
   'の3連続':re.compile(r'[^\sのぁ-んァ-ヶ]+の[^\sの]+の[^\sの]+の'),
   '上から目線':re.compile(r'ご存知でしょうか|意外と知られていま|実は.{0,6}なのです|すべきです'),
   }
for r in ROWS:
    for k,p in A.items():
        if p.search(r['text']): flag('G3-'+k,r)

# ---- G4 VP-6 Apple/MUJI 磁場（見出し・リードに限定して判定）----
HEAD=re.compile(r'^(h1|h2|h3|h4)')
def is_head(r):
    p=r['path'].split('>')[-1]
    return bool(HEAD.match(p)) or 'lead' in r['path'] or 'ttl' in r['path'] or 'title' in r['path']
NOMI=re.compile(r'(のは|には|とは)、[^。]{1,20}。?$')
JOSHI_END=re.compile(r'(を|に|へ|と|が|は)$')
NOUN_COMMA=re.compile(r'^[ぁ-んァ-ヶ一-龥ー]{1,8}の、[ぁ-んァ-ヶ一-龥ー]{1,10}。?$')
ADJ2=re.compile(r'(く|やかに)、[ぁ-んァ-ヶ一-龥]{1,6}。$')
for r in ROWS:
    t=r['text'].rstrip()
    if not is_head(r): continue
    if NOMI.search(t): flag('G4-「〜のは、〜」構文',r)
    if JOSHI_END.search(t) and len(t)>=6: flag('G4-助詞止め',r)
    if NOUN_COMMA.match(t): flag('G4-名詞+読点+名詞',r)
    if ADJ2.search(t): flag('G4-形容詞二連',r)

# ---- G5 商用定型の上限（ページ単位）----
LIM={'お気軽に':2,'ぜひ':3,'お待ちしております':1,'こんなお悩み':1}
cnt=collections.defaultdict(lambda: collections.defaultdict(list))
for r in ROWS:
    for k in LIM:
        if k in r['text']: cnt[r['file']][k].append(r)
for f,d in cnt.items():
    for k,rs in d.items():
        if len(rs)>LIM[k]:
            for r in rs: flag(f'G5-定型「{k}」が上限{LIM[k]}超({len(rs)}回)',r)

# ---- G6 可読性の数値 ----
for r in ROWS:
    t=r['text']
    if r['kind']!='text': continue
    for s in re.split(r'(?<=。)',t):
        s=s.strip()
        if not s: continue
        if len(s)>40: flag('G6-1文40字超',{'file':r['file'],'line':r['line'],'kind':r['kind'],'text':s},f'{len(s)}字')
        if s.count('、')>2: flag('G6-読点3個以上',{'file':r['file'],'line':r['line'],'kind':r['kind'],'text':s},f"{s.count('、')}個")

# ---- G9 メタ操作説明の本文混入（5-0-b3）----
META=re.compile(r'スクロール(すると|して|で)|スワイプ(すると|して|で)|ドラッグ(すると|して)|回り込む')
for r in ROWS:
    if r['kind']!='text': continue
    if META.search(r['text']) and len(r['text'])>14: flag('G9-本文にメタ操作説明',r)

# ---- 出力 ----
total=0
for code in sorted(fails):
    rs=fails[code]; total+=len(rs)
    print(f'\n■ {code}  ({len(rs)}件)')
    seen=set()
    for f,ln,kind,t,note in rs:
        key=(f,ln,t)
        if key in seen: continue
        seen.add(key)
        print(f'   {f}:{ln} [{kind}] {note} {t}')
print(f'\n=== 合計 {total} 件 ===')
sys.exit(1 if total else 0)
