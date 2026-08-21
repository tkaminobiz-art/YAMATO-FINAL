#!/usr/bin/env python3
# 可視コピー抽出器: HTMLから「読者が読む文字列」だけを行番号つきで取り出す
import sys, re, json, html as htmlmod
from html.parser import HTMLParser

SKIP = {'script','style','noscript','svg','template','head'}
ATTRS = ('alt','title','aria-label','placeholder','value','content','label','data-label','aria-labelledby')

class Ex(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.out=[]; self.skipdepth=0
    def _path(self):
        return '>'.join(self.stack[-3:])
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        ident=tag
        if d.get('id'): ident+='#'+d['id']
        elif d.get('class'): ident+='.'+d['class'].split()[0]
        if self.skipdepth==0:
            ln=self.getpos()[0]
            for a in ('alt','title','aria-label','placeholder'):
                v=d.get(a)
                if v and v.strip():
                    self.out.append({'line':ln,'kind':'@'+a,'path':ident,'text':v.strip()})
            if tag=='meta':
                n=(d.get('name') or d.get('property') or '')
                if n in ('description','og:title','og:description','twitter:title','twitter:description','og:site_name'):
                    if d.get('content'): self.out.append({'line':ln,'kind':'@meta:'+n,'path':'meta','text':d['content'].strip()})
            if tag=='input' and d.get('type') in ('submit','button') and d.get('value'):
                self.out.append({'line':ln,'kind':'@value','path':ident,'text':d['value'].strip()})
        if tag in SKIP: self.skipdepth+=1
        if tag not in ('br','img','input','meta','link','hr','source','path','use','circle','rect'):
            self.stack.append(ident)
    def handle_endtag(self, tag):
        if tag in SKIP and self.skipdepth>0: self.skipdepth-=1
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i].split('#')[0].split('.')[0]==tag:
                del self.stack[i:]; break
    def handle_data(self, data):
        if self.skipdepth: return
        t=data.strip()
        if not t: return
        if not re.search(r'[ぁ-んァ-ヶ一-龥Ａ-Ｚａ-ｚA-Za-z]', t): return
        self.out.append({'line':self.getpos()[0],'kind':'text','path':self._path(),'text':re.sub(r'\s+',' ',t)})

def fix_lines(src, rows):
    # HTMLParser.getpos() は convert_charrefs のバッファでずれる。
    # 文書順に原文を走査し直して、実ファイルの行番号に直す。
    cur=0
    for r in rows:
        needle=r['text'][:40]
        i=src.find(needle, cur)
        if i<0: i=src.find(needle)
        if i>=0:
            r['line']=src.count('\n',0,i)+1
            cur=i+1
    return rows

for f in sys.argv[1:]:
    src=open(f,encoding='utf-8').read()
    p=Ex(); p.feed(src)
    rows=fix_lines(src, p.out)
    print(json.dumps({'file':f,'rows':rows}, ensure_ascii=False))
