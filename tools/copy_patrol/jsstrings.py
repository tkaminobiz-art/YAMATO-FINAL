import sys,re,json
JP=re.compile(r'[ぁ-んァ-ヶ一-龥]')
def strip_comments(s):
    s=re.sub(r'/\*.*?\*/','',s,flags=re.S)
    s=re.sub(r'(^|[^:\'"])//[^\n]*','\\1',s)
    return s
for f in sys.argv[1:]:
    src=open(f,encoding='utf-8').read()
    found=[]
    for m in re.finditer(r'<script[^>]*>(.*?)</script>', src, re.S|re.I):
        base=src[:m.start(1)].count('\n')+1
        body=m.group(1)
        clean=strip_comments(body)
        for sm in re.finditer(r"'([^'\n]*)'|\"([^\"\n]*)\"", clean):
            t=(sm.group(1) or sm.group(2) or '')
            if JP.search(t):
                found.append(t.strip())
    if found:
        seen=[];[seen.append(x) for x in found if x not in seen]
        print(f'=== {f} ({len(seen)} strings)')
        for t in seen: print('   ', t)
