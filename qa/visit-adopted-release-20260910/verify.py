from pathlib import Path
import json,hashlib,re,sys
from PIL import Image,ImageChops
q=Path('qa/visit-adopted-release-20260910');folder=q/(sys.argv[1] if len(sys.argv)>1 else 'local');sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
base=json.loads((q/'baseline-sha.json').read_text());changed={'index.html','assets/top-renewal/visit-adopted-20260909/style.css'}
for p,h in base.items():
 if p not in changed:assert sha(p)==h,p
original=(q/'local/index-before.html').read_text();current=Path('index.html').read_text();assert current==original.replace('href="assets/top-renewal/visit-adopted-20260909/style.css"','href="assets/top-renewal/visit-adopted-20260909/style.css?v=20260910-adopted"')
asset='assets/top-renewal/visit-adopted-20260909/washi-texture-20260910.webp';assert sha(asset)=='6be0f78c7b7f581f11f73d646a6210ab28aed0230bc2b073475973993c3c3543'
normalize=lambda s:re.sub(r'https?://[^/]+','',s).replace('/qa/visit-washi-refinement-20260910/assets/washi-texture.webp','/'+asset)
results=[]
for key in ['1366-768','1440-778','1440-900','1920-1080','320-844','390-844']:
 a=json.loads((q/'reference'/f'measure-{key}.json').read_text());b=json.loads((folder/f'measure-{key}.json').read_text());assert a['dom']==b['dom'];assert a['contactDialog']==b['contactDialog'];assert a['section']['height']==b['section']['height'];assert a['header']['height']==b['header']['height'];assert len(a['fullStyles'])==len(b['fullStyles'])
 for i,(x,y) in enumerate(zip(a['fullStyles'],b['fullStyles'])):
  if x['box']['width'] or x['box']['height']:assert x['box']==y['box'],(key,i,'box',x['box'],y['box'])
  for k,v in x['styles'].items():assert normalize(v)==normalize(y['styles'][k]),(key,i,k,v,y['styles'][k])
 assert b['errors']==[] and b['documentOverflow']==0
 im1=Image.open(q/'reference'/f'section-{key}.png').convert('RGB');im2=Image.open(folder/f'section-{key}.png').convert('RGB');assert im1.size==im2.size;diff=ImageChops.difference(im1,im2);n=sum(1 for px in diff.getdata() if px!=(0,0,0));row={'viewport':key,'sectionHeight':b['section']['height'],'header':b['header']['height'],'allVisibleGeometryAndStylesMatch':True,'sectionScreenshotPixelDifference':n,'sectionScreenshotPixelDifferencePercent':round(100*n/im1.width/im1.height,4),'imageSize':im1.size};results.append(row)
package=json.loads(Path('qa/checkpoint-20260906/package.json').read_text());runtime=[f['path'] for f in package['files']];assert asset in runtime;assert not any(p.startswith('qa/') or p in ['visit-washi-preview.html','visit-height-preview.html'] or 'washi-generated-original' in p for p in runtime)
r={'checkedFolder':str(folder),'htmlOnlyStylesheetCacheKeyChanged':True,'unchangedSHA':{p:h for p,h in base.items() if p not in changed},'newTextureSHA':sha(asset),'viewports':results,'package':{'runtimeFiles':len(runtime),'noNewInvestigationOrPNGSource':True}}
(folder/'preservation.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print(json.dumps(results,ensure_ascii=False,indent=2))
