#!/usr/bin/env python3
# 敬語・言葉遣いゲート: ハウスメーカー→施主の register を機械判定できる範囲で検査
import json,re,sys,collections
S=sys.argv[1]
ROWS=[]
for line in open(S+'/copy.jsonl',encoding='utf-8'):
    d=json.loads(line)
    for r in d['rows']: r['file']=d['file']; ROWS.append(r)
out=collections.defaultdict(list)
def flag(code,r,note=''): out[code].append((r['file'],r['line'],r['text'],note))

RULES=[
 # コード, 正規表現, 補足
 ('K1-二重敬語', r'お[ぁ-ん一-龥]{1,4}になられ|ご[ぁ-ん一-龥]{1,4}になられ|お伺いさせていただ|ご覧になられ|おっしゃられ|お見えになられ',''),
 ('K2-させていただく多用', r'させていただ',''),
 ('K3-バイト敬語', r'になります(?![。、])|よろしかったでしょうか|の方(?:へ|で|に)(?:なり|お)|お会計|大丈夫です',''),
 ('K4-お客様の動作が非尊敬', r'(?<!と)言われても|見られます|来られます|使えます(?!ん)|決められます|選べます|確かめられます|読めます|できます(?=。)',''),
 ('K5-常体の混入', r'(?:^|[。、」])[^。「」]{4,}(?:だ|である|しない|ない|する|なる|いる|くる|できる|わかる)。', ''),
 ('K6-命令形/上から', r'(?<![おご])(?:見て|読んで|来て|使って)ください。|してください。|しなさい|すべき',''),
 ('K7-砕けたCTA語', r'どうぞ。|どうぞ$|聞く$|見る$|やってみ|しましょう$',''),
 ('K8-謙譲語の相手違い', r'お客様が.{0,6}(いたし|申し|拝見|伺い)|ご記入していただ|ご覧してください',''),
 ('K9-ら抜き/さ入れ', r'見れ(る|ます)|食べれ(る|ます)|来れ(る|ます)|出れ(る|ます)|読ませて',''),
 ('K10-助詞の破損', r'を.{0,12}を(?:保有|掲載|ご用意|ご案内)し|に.{0,8}に(?:ご連絡|ご案内)し|内容に、.{0,10}ご連絡',''),
 ('K11-業界用語', r'ふかし|小運搬|ケイカル|軒天|ふかし請求|EIDAI|ES(?![A-Za-z])|KT(?![A-Za-z])|LIXIL統一|在来比',''),
 ('K12-断定的な保証', r'必ず(?!しも)|絶対|きっと|間違いなく|安心です。|変わりません。',''),
]
for r in ROWS:
    t=r['text']
    for code,pat,note in RULES:
        if re.search(pat,t): flag(code,r,note)

tot=0
for c in sorted(out):
    rs=out[c]; tot+=len(rs)
    print(f'\n■ {c} ({len(rs)}件)')
    seen=set()
    for f,ln,t,n in rs:
        k=(f,ln,t[:40])
        if k in seen: continue
        seen.add(k)
        print(f'   {f}:{ln} {t[:100]}')
print(f'\n=== 合計 {tot} ===')
