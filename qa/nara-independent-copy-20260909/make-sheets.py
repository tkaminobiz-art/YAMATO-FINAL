from PIL import Image,ImageDraw
from pathlib import Path
import math,shutil
q=Path('qa/nara-independent-copy-20260909');src=q/'release-verified';dst=q/'evidence';dst.mkdir(exist_ok=True)
def sheet(paths,name,cols,cell):
 out=Image.new('RGB',(cols*cell[0],math.ceil(len(paths)/cols)*(cell[1]+24)),'white');d=ImageDraw.Draw(out)
 for i,p in enumerate(paths):
  im=Image.open(p);im.thumbnail(cell);x=(i%cols)*cell[0];y=(i//cols)*(cell[1]+24);out.paste(im,(x,y+24));d.text((x+8,y+5),p.stem,fill='black')
 out.save(dst/name,optimize=True)
for kind,cell,cols in [('sp',(390,900),4),('pc',(720,450),2)]:sheet([src/f'chromium-{kind}-beat-{i}.png' for i in range(1,9)],f'journey-{kind}-8.png',cols,cell)
for kind,file,w,cols in [('sp','webkit-sp-reduced-full.png',390,4),('pc','chromium-pc-reduced-full.png',720,2)]:
 im=Image.open(src/file);scale=w/im.width;im=im.resize((w,round(im.height*scale)));h=900 if kind=='sp' else 450;n=math.ceil(im.height/h);out=Image.new('RGB',(w*cols,(h+24)*math.ceil(n/cols)),'white');draw=ImageDraw.Draw(out)
 for i in range(n):
  x=i%cols*w;y=i//cols*(h+24);draw.text((x+8,y+5),f'{kind} full page / part {i+1}',fill='black');out.paste(im.crop((0,i*h,w,min(im.height,(i+1)*h))),(x,y+24))
 out.save(dst/f'full-page-{kind}-sheet.png',optimize=True)
for file,new in [('chromium-pc-train.png','pc-train.png'),('webkit-sp-train.png','sp-train.png'),('webkit-sp-timetable.png','sp-timetable.png'),('webkit-sp-reduced-last-mile.png','sp-last-mile.png'),('webkit-sp-reduced-drive.png','sp-drive.png'),('webkit-sp-reduced-closing.png','sp-closing.png'),('webkit-landscape-beat-3.png','landscape-after.png'),('chromium-pc-hero.png','pc-hero.png'),('chromium-sp-hero.png','sp-hero.png')]:shutil.copy2(src/file,dst/new)
shutil.copy2(q/'before'/'landscape-844.png',dst/'landscape-before.png')
print('Evidence sheets/captures:',len(list(dst.glob('*.png'))))
