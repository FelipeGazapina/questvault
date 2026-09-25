"""Procedural pixel-art scenes (130x80; portao 130x190) -> out/scenes/*.png. Run: python3 render-scenes.py"""
import numpy as np, random, math, os
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'scenes')
os.makedirs(OUT, exist_ok=True)
BAYER = np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]])/16.0+1/32
def hx(h): h=h.lstrip('#'); return np.array([int(h[i:i+2],16) for i in (0,2,4)],dtype=np.uint8)
BG = '#13100d'
class S:
    def __init__(s,w,h,seed): s.w,s.h=w,h; s.a=np.zeros((h,w,3),np.uint8); s.r=random.Random(seed)
    def px(s,x,y,c):
        if 0<=x<s.w and 0<=y<s.h: s.a[y,x]=hx(c) if isinstance(c,str) else c
    def rect(s,x,y,w,h,c):
        for yy in range(y,y+h):
            for xx in range(x,x+w): s.px(xx,yy,c)
    def grad(s,stops,y0=0,y1=None):
        y1 = s.h if y1 is None else y1
        for y in range(y0,y1):
            for i in range(len(stops)-1):
                if stops[i][0]<=y<=stops[i+1][0]: a,b=stops[i],stops[i+1]; break
            else: a=b=stops[-1]
            t = 0 if b[0]==a[0] else (y-a[0])/(b[0]-a[0])
            for x in range(s.w): s.px(x,y, b[1] if t>BAYER[y%4][x%4] else a[1])
    def blend(s,x,y,c,t):
        if 0<=x<s.w and 0<=y<s.h and t>BAYER[y%4][x%4]: s.px(x,y,c)
    def glow(s,cx,cy,r,c,strength=.55):
        for y in range(cy-r,cy+r+1):
            for x in range(cx-r,cx+r+1):
                d=math.hypot(x-cx,y-cy)/r
                if d<1 and 0<=x<s.w and 0<=y<s.h:
                    f=round(((1-d)**2*strength)/0.12)*0.12
                    if f>0: s.a[y,x]=(s.a[y,x]*(1-f)+hx(c)*f).astype(np.uint8)
    def disc(s,cx,cy,r,c):
        for y in range(cy-r,cy+r+1):
            for x in range(cx-r,cx+r+1):
                if (x-cx)**2+(y-cy)**2<=r*r+r*.6: s.px(x,y,c)
    def cloud(s,cx,cy,w,c,hi):
        for i in range(w//3):
            ox=cx+s.r.randint(-w//2,w//2); oy=cy+s.r.randint(-2,2); rr=s.r.randint(2,4)
            s.disc(ox,oy,rr,c)
        for x in range(cx-w//2-3,cx+w//2+4):
            for y in range(cy-7,cy+4):
                if 0<=x<s.w and 0<=y<s.h and (s.a[y,x]==hx(c)).all() and y>0 and not (s.a[y-1,x]==hx(c)).all() and not (s.a[y-1,x]==hx(hi)).all(): s.px(x,y,hi)
    def ground(s,top,grass,soil,ledge=None,tufts=True):
        # ground band from top to bottom dithering to BG
        for y in range(top,s.h):
            t=(y-top)/max(1,(s.h-top-1)); t=min(1,t*1.35)
            for x in range(s.w):
                c = soil
                if ledge and y<top+4:
                    c = ledge[0] if (y-top)==0 else ledge[1]
                    if (y-top)>=1 and (x+(3 if (y-top)%2 else 0))%9==0: c=ledge[2]
                    s.px(x,y,c); continue
                s.px(x,y,c)
                s.blend(x,y,BG,t)
                if s.r.random()<.05 and t<.6: s.px(x,y,'#241b15')
        if grass:
            for x in range(s.w):
                h=s.r.choice([0,1,1,2,3]) if tufts else 1
                for k in range(h): s.px(x,top-1-k,grass[0] if k==h-1 else grass[1])
                s.px(x,top,grass[1])
    def tower(s,x,base,w,h,c,roof=None,sh=None,win=None,batt=True):
        s.rect(x,base-h,w,h,c)
        if sh: s.rect(x+w-max(1,w//4),base-h,max(1,w//4),h,sh)
        if batt and not roof:
            for i in range(0,w,2): s.px(x+i,base-h-1,c)
        if roof:
            for i in range(w//2+2):
                s.rect(x-1+i,base-h-1-i,w+2-2*i,1,roof)
        if win:
            for yy in range(base-h+3,base-3,5):
                s.px(x+w//2,yy,win); s.px(x+w//2,yy+1,win)
    def skyline(s,base,col,minh,maxh,dens=.5,spires=True):
        x=0
        while x<s.w:
            w=s.r.randint(3,9); h=s.r.randint(minh,maxh)
            if s.r.random()<dens:
                s.rect(x,base-h,w,h,col)
                if spires and s.r.random()<.35:
                    for i in range(s.r.randint(3,7)): s.px(x+w//2,base-h-1-i,col)
                elif s.r.random()<.4: s.disc(x+w//2,base-h,w//2,col)
                else:
                    for i in range(0,w,2): s.px(x+i,base-h-1,col)
            x+=w
    def birds(s,n,y0,y1,c):
        for _ in range(n):
            x=s.r.randint(5,s.w-5); y=s.r.randint(y0,y1)
            s.px(x-1,y,c); s.px(x,y+1,c); s.px(x+1,y,c)
    def column(s,x,base,h,c,hi,sh,broken=False):
        s.rect(x,base-h,5,h,c); s.rect(x,base-h,1,h,hi); s.rect(x+4,base-h,1,h,sh); s.rect(x+2,base-h,1,h,sh)
        if not broken:
            s.rect(x-1,base-h-2,7,2,hi); s.rect(x-1,base-h-1,7,1,c)
        else:
            for i in range(5): s.rect(x+i,base-h-s.r.randint(0,3),1,1,c)
        s.rect(x-1,base-2,7,2,sh)
    def banner(s,x,y,w,h,c,sh):
        s.rect(x,y,w,h,c); s.rect(x+w-1,y,1,h,sh)
        for i in range(w//2): s.rect(x+i,y+h+i-w//2+1,1,w//2-i,'#000000') if False else None
        mid=x+w//2
        for i in range(1,3): s.px(mid,y+h-i,BG) if False else None
        s.rect(x-1,y-1,w+2,1,'#3a2a1c')
    def torch(s,x,y):
        s.glow(x,y-2,9,'#e08a3a',.45)
        s.rect(x,y,1,4,'#5a3a22'); s.px(x,y-1,'#ffb23a'); s.px(x,y-2,'#fff3a0'); s.px(x-1,y-1,'#e0622a'); s.px(x+1,y-1,'#e0622a'); s.px(x,y-3,'#ffb23a')
    def brickwall(s,x0,y0,w,h,base,dark,light,var=None):
        for y in range(y0,y0+h):
            for x in range(x0,x0+w):
                row=(y-y0)//3; off=3 if row%2 else 0
                c=base
                if (y-y0)%3==2 or (x+off)%6==5: c=dark
                elif (y-y0)%3==0 and s.r.random()<.25: c=light
                s.px(x,y,c)
    def save(s,name):
        Image.fromarray(s.a).save(os.path.join(OUT, f'{name}.png'))

def castelo(W=130,H=80,seed=3):
    s=S(W,H,seed)
    s.grad([(0,'#221733'),(14,'#3c2240'),(28,'#7a3346'),(40,'#c9573f'),(50,'#f09a50'),(58,'#f7c56e')],0,60)
    s.glow(92,44,16,'#ffd98a',.5); s.disc(92,44,6,'#ffe7b0'); s.disc(92,44,5,'#fff1cc')
    s.cloud(30,16,24,'#5a2c47','#7d3d52'); s.cloud(70,10,18,'#4a2742','#6a3450'); s.cloud(112,24,22,'#9a4148','#c25b4a')
    s.skyline(58,'#6b3346',6,16,.6)
    s.skyline(58,'#4d2638',4,11,.7,spires=False)
    # castle
    s.tower(8,58,9,30,'#5c4a4c',roof='#a8452f',sh='#433638',win='#ffcf70')
    s.tower(22,58,7,20,'#5c4a4c',sh='#433638',win='#ffcf70')
    s.rect(17,42,40,16,'#524244')
    for i in range(17,57,2): s.px(i,41,'#524244')
    s.rect(33,49,8,9,'#1c1414')
    for yy in range(49,58,2): s.rect(33,yy,8,1,'#3a2e2a')
    for xx in range(34,41,2): s.rect(xx,49,1,9,'#3a2e2a')
    s.tower(55,58,8,26,'#5c4a4c',roof='#a8452f',sh='#433638',win='#ffcf70')
    s.rect(58,24,1,6,'#3a2a1c'); s.rect(59,24,4,3,'#b5372f')
    s.tower(112,58,10,34,'#4a3c3e',sh='#352b2d',win='#ffcf70')
    s.rect(116,20,1,5,'#3a2a1c'); s.rect(117,20,5,3,'#b5372f')
    s.birds(7,6,30,'#1c1320')
    s.ground(60,('#6d7a35','#4a5427'),'#2a2019',ledge=None)
    s.save('castelo'); return s

def ruinas(W=130,H=80,seed=11):
    s=S(W,H,seed)
    s.grad([(0,'#1f4a66'),(16,'#2f6f8e'),(34,'#5fa8c4'),(52,'#a8d8e0')],0,60)
    s.cloud(20,14,26,'#dff1f4','#ffffff'); s.cloud(84,20,30,'#cfe8ee','#f4fbfc'); s.cloud(120,8,16,'#bfe0e8','#e8f6f8')
    s.skyline(58,'#6f9fb8',10,28,.55)
    s.skyline(58,'#56849e',5,16,.6)
    # ruins
    s.column(14,58,26,'#9a9185','#bdb4a6','#6f675d',broken=True)
    s.column(40,58,30,'#9a9185','#bdb4a6','#6f675d')
    s.column(58,58,30,'#9a9185','#bdb4a6','#6f675d')
    s.rect(38,26,27,3,'#8a8176'); s.rect(38,26,27,1,'#bdb4a6')
    for i in range(4): s.px(45+i*3,29,'#6f675d')
    s.column(96,58,18,'#8e867b','#b0a898','#655e55',broken=True)
    s.rect(103,50,9,8,'#7c756b'); s.rect(103,50,9,1,'#a39b8d')
    s.rect(62,14,1,12,'#3a2a1c'); s.rect(63,14,5,8,'#b5372f'); s.px(65,22,'#7c2220');s.px(66,22,'#b5372f')
    for x in [30,33,80,85,90,120,124]:
        for k in range(s.r.randint(2,6)): s.px(x,57-k,'#2e4a23')
    s.birds(6,8,24,'#1a2c3a')
    s.ground(60,('#7ea84a','#4f7a32'),'#2a2419')
    s.save('ruinas'); return s

def taverna(W=130,H=80,seed=5):
    s=S(W,H,seed)
    s.brickwall(0,0,W,60,'#4a4452','#35303c','#5a5463')
    # fireplace
    s.rect(18,30,30,30,'#3a3440'); s.rect(16,28,34,3,'#6e6878')
    s.rect(22,38,22,22,'#140e0c')
    s.glow(33,52,24,'#e0762a',.5)
    for x in range(24,42):
        hgt=s.r.randint(4,12)
        for k in range(hgt):
            c='#e0622a' if k<3 else ('#ffb23a' if k<hgt-2 else '#fff3a0')
            if k>hgt-2 and s.r.random()<.5: continue
            s.px(x,59-k,c)
    s.rect(24,58,18,2,'#5a3419')
    # beams
    for x in [0,62,124]: s.rect(x,0,6,60,'#5a3a22'); s.rect(x,0,1,60,'#7a4f2e'); s.rect(x+5,0,1,60,'#3c2211')
    s.rect(0,6,W,4,'#5a3a22'); s.rect(0,6,W,1,'#7a4f2e'); s.rect(0,9,W,1,'#3c2211')
    # banners
    for bx,c in [(70,'#b5372f'),(98,'#2f5f7a')]:
        s.rect(bx,10,10,22,c); s.rect(bx+9,10,1,22,'#00000033' if False else '#7c2220' if c=='#b5372f' else '#1f3f52')
        s.px(bx+4,31,'#35303c'); s.px(bx+5,31,'#35303c'); s.px(bx+4,30,'#35303c'); s.px(bx+5,30,'#35303c')
        s.rect(bx+3,16,4,4,'#e3b341')
    # table & barrels
    s.rect(70,48,40,3,'#8a5a33'); s.rect(70,48,40,1,'#b07a44'); s.rect(72,51,2,9,'#5a3419'); s.rect(106,51,2,9,'#5a3419')
    s.px(80,46,'#fff3a0'); s.rect(80,47,1,1,'#e9dcbc'); s.glow(80,46,7,'#ffcf70',.4)
    s.rect(92,45,3,3,'#9a6a3a'); s.rect(97,45,3,3,'#9a6a3a')
    for bx in [8,114]:
        s.rect(bx,48,9,12,'#8a5a33'); s.rect(bx,50,9,1,'#5d646c'); s.rect(bx,56,9,1,'#5d646c'); s.rect(bx,48,1,12,'#a8743f'); s.rect(bx+8,48,1,12,'#5a3419')
    s.ground(60,None,'#3a2619',ledge=('#7a4f2e','#5a3a22','#3c2211'))
    s.save('taverna'); return s

def biblioteca(W=130,H=80,seed=9):
    s=S(W,H,seed)
    s.brickwall(0,0,W,60,'#2a2630','#1e1b24','#35303c')
    # window with sunset
    s.rect(52,6,26,44,'#3a3440')
    s.grad([(8,'#3c2240'),(24,'#c9573f'),(40,'#f09a50'),(48,'#f7c56e')],8,48)
    # restore wall around window (grad painted full width) -> repaint wall except window
    tmp=s.a.copy()
    s.brickwall(0,8,W,40,'#2a2630','#1e1b24','#35303c')
    s.a[8:48,54:76]=tmp[8:48,54:76]
    for y in range(8,14):
        for x in range(54,76):
            if (x-65)**2+((y-14)*1.6)**2>11**2: s.px(x,y,'#3a3440')
    s.disc(66,38,4,'#ffe7b0')
    for x in range(54,76):
        for k in range(s.r.randint(0,6)): s.px(x,47-k,'#2a1a20')
    s.rect(65,8,1,40,'#3a3440'); s.rect(54,28,22,1,'#3a3440')
    # shelves
    cols=['#8e2a2a','#b5372f','#2a4480','#3f67b8','#35702a','#6a4a2a','#7652b0','#c9962a','#276a62','#5a3419']
    for x0,x1 in [(2,50),(80,128)]:
        s.rect(x0,4,x1-x0,56,'#3c2211')
        for sy in [14,28,42,56]:
            s.rect(x0,sy,x1-x0,2,'#6b3d1f')
            x=x0+2
            while x<x1-2:
                bw=s.r.choice([1,2,2,3]); bh=s.r.randint(6,10); c=s.r.choice(cols)
                if s.r.random()<.08: x+=bw; continue
                s.rect(x,sy-bh,bw,bh,c); s.px(x,sy-bh,'#e9dcbc') if s.r.random()<.3 else None
                x+=bw
        s.rect(x0,4,2,56,'#5a3419'); s.rect(x1-2,4,2,56,'#5a3419')
    for cx,cy in [(52,54),(78,54),(26,12),(104,12)]:
        s.glow(cx,cy-2,10,'#ffcf70',.5); s.rect(cx,cy-2,1,3,'#e9dcbc'); s.px(cx,cy-3,'#fff3a0'); s.px(cx,cy-4,'#ffb23a')
    s.ground(60,None,'#241a14',ledge=('#5a5463','#433e4c','#2c2833'))
    s.save('biblioteca'); return s

def portao(W=130,H=190,seed=21):
    s=S(W,H,seed)
    s.grad([(0,'#070a16'),(40,'#111a33'),(80,'#1d2a4a'),(110,'#2c3a5e')],0,120)
    for _ in range(70):
        x,y=s.r.randint(0,W-1),s.r.randint(0,90); s.px(x,y,'#cfd8f0' if s.r.random()<.3 else '#7f8cb0')
    s.glow(98,26,18,'#9fb0e0',.4); s.disc(98,26,8,'#dfe6f7'); s.disc(95,24,2,'#c3cce4'); s.px(101,29,'#c3cce4')
    s.cloud(30,40,30,'#2a3656','#3a4870'); s.cloud(110,58,26,'#26324f','#34426a')
    s.skyline(120,'#1a2238',10,30,.5)
    # wall
    s.brickwall(0,92,W,52,'#4a4a56','#34343e','#5a5a68')
    for x in range(0,W,6): s.rect(x,88,4,4,'#4a4a56'); s.rect(x,88,4,1,'#5a5a68')
    # towers
    for tx in [6,104]:
        s.brickwall(tx,62,20,82,'#50505e','#383844','#62627a')
        for x in range(tx,tx+20,4): s.rect(x,58,3,4,'#50505e')
        s.rect(tx+8,76,4,6,'#ffcf70'); s.glow(tx+10,79,8,'#ffcf70',.35)
    # gate arch
    gx,gw,gy=43,44,102
    for y in range(gy,144):
        for x in range(gx,gx+gw):
            dy=y-(gy+gw//2)
            if y>=gy+gw//2 or (x-(gx+gw/2))**2+(dy)**2<=(gw/2)**2: s.px(x,y,'#0c0a10')
    for x in range(gx+3,gx+gw-2,5):
        for y in range(gy,144):
            dy=y-(gy+gw//2)
            if y>=gy+gw//2 or (x-(gx+gw/2))**2+dy**2<=(gw/2-1)**2: s.px(x,y,'#5d646c')
    for y in range(gy+6,144,6):
        for x in range(gx,gx+gw):
            dy=y-(gy+gw//2)
            if y>=gy+gw//2 or (x-(gx+gw/2))**2+dy**2<=(gw/2-1)**2: s.px(x,y,'#5d646c')
    # banners
    for bx in [32,90]:
        s.rect(bx,96,8,26,'#8e2a2a'); s.rect(bx+7,96,1,26,'#5e1a1a'); s.rect(bx+2,102,4,4,'#c9a45c'); s.px(bx+3,121,'#34343e'); s.px(bx+4,121,'#34343e')
    s.torch(28,128); s.torch(101,128)
    s.ground(144,('#3d5230','#2a3a22'),'#1e1a18')
    s.save('portao'); return s

for f in [castelo,ruinas,taverna,biblioteca,portao]: f()

# Header band cut from the gate scene, with its ground re-dithered into the app background.
band = np.array(Image.open(os.path.join(OUT, 'portao.png')))[80:160].copy()
for y in range(62, 80):
    t = min(1, (y - 62) / 14)
    for x in range(band.shape[1]):
        if t > BAYER[y % 4][x % 4]: band[y, x] = hx(BG)
Image.fromarray(band).save(os.path.join(OUT, 'portao-faixa.png'))
