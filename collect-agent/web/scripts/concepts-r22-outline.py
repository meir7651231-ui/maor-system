# סבב 22: מתאר אנליטי נקי — קווים, קשתות (A) וקוביות (C) בלבד; משיק-רציף; ~15 צמתים לאות
import json, math, sys
def f(v): return f"{v:.3f}".rstrip('0').rstrip('.')
def P(p): return f"{f(p[0])} {f(p[1])}"
def fillet(V, d1, d2, r):
    # V=קודקוד, d1=כיוון (יחידה) של הצלע הנכנסת *מהקודקוד החוצה* לאורך הקטע הראשון, d2 כנ"ל לקטע השני
    cos=d1[0]*d2[0]+d1[1]*d2[1]; ang=math.acos(max(-1,min(1,cos))); d=r/math.tan(ang/2)
    T1=(V[0]+d1[0]*d,V[1]+d1[1]*d); T2=(V[0]+d2[0]*d,V[1]+d2[1]*d)
    bx,by=d1[0]+d2[0],d1[1]+d2[1]; bl=math.hypot(bx,by); k=r/math.sin(ang/2)
    Cn=(V[0]+bx/bl*k,V[1]+by/bl*k)
    return T1,T2,Cn
def arcto(a,b,c,r):
    cr=(a[0]-c[0])*(b[1]-c[1])-(a[1]-c[1])*(b[0]-c[0])
    return f"A{f(r)} {f(r)} 0 0 {1 if cr>0 else 0} {P(b)}"
def line_x(p,u,x): t=(x-p[0])/u[0]; return (x,p[1]+t*u[1])
def gimel(x0=28, xs=44, W=9, comp=0.92, A=(44,36), Bp=(29,45.5), legW=None, rf=1.6, R=7.2, ytop=11.5, ybot=50):
    h=W/2; hh=h*comp; lh=(legW or W)/2
    ro, ri = R+h, R-h                         # רדיוסי הכתף החיצונית/הפנימית סביב (xs-R, ytop+R)
    cx, cy = xs-R, ytop+R
    tx0 = x0+3                                 # תחילת המעבר החלק מעובי-ראש לעובי-עמוד
    dx,dy=Bp[0]-A[0],Bp[1]-A[1]; L=math.hypot(dx,dy); u=(dx/L,dy/L); n=(-u[1],u[0])
    if n[1]<0: n=(-n[0],-n[1])                 # נורמל כלפי מטה
    lo0=(A[0]+n[0]*lh,A[1]+n[1]*lh); up0=(A[0]-n[0]*lh,A[1]-n[1]*lh)
    Vlo=line_x(lo0,u,xs-h); Vup=line_x(up0,u,xs-h)
    # פילט תחתון: בין העמוד (כלפי מטה) לרגל (כלפי B)
    T1,T2,C1=fillet(Vlo,(0,1),u,rf)
    # פילט עליון: בין העמוד (כלפי מעלה) לרגל (כלפי B)
    T3,T4,C2=fillet(Vup,u,(0,-1),rf)
    BL=(Bp[0]+n[0]*lh,Bp[1]+n[1]*lh); BU=(Bp[0]-n[0]*lh,Bp[1]-n[1]*lh)
    d=[f"M{P((x0,ytop-hh))}",
       f"L{P((tx0,ytop-hh))}",
       f"C{P((tx0+3,ytop-hh))} {P((cx-3,ytop-h))} {P((cx,ytop-h))}",
       f"A{f(ro)} {f(ro)} 0 0 1 {P((xs+h,cy))}",
       f"L{P((xs+h,ybot))}",
       f"A{f(h)} {f(h)} 0 0 1 {P((xs-h,ybot))}",
       f"L{P(T1)}",
       arcto(T1,T2,C1,rf),
       f"L{P(BL)}",
       f"A{f(lh)} {f(lh)} 0 0 1 {P(BU)}",
       f"L{P(T3)}",
       arcto(T3,T4,C2,rf),
       f"L{P((xs-h,cy))}",
       f"A{f(ri)} {f(ri)} 0 0 0 {P((cx,ytop+h))}",
       f"C{P((cx-3,ytop+h))} {P((tx0+3,ytop+hh))} {P((tx0,ytop+hh))}",
       f"L{P((x0,ytop+hh))}",
       f"A{f(hh)} {f(hh)} 0 0 1 {P((x0,ytop-hh))}","Z"]
    return ' '.join(d)
def bet(bx, tail, W=9, comp=0.92, R=7.2, ytop=11.5, ybot=50):
    h=W/2; hh=h*comp; x0=bx-20; cx,cy=bx-R,ytop+R; ro,ri=R+h,R-h; tx0=x0+3
    tc=(bx+tail,ybot)                          # מרכז כיפת הזנב
    # נקודת המפגש של קצה העמוד הימני עם עיגול הזנב
    yj=ybot-math.sqrt(max(0,h*h-(bx+h-tc[0])**2)) if abs(bx+h-tc[0])<h else ybot-h
    d=[f"M{P((x0,ytop-hh))}", f"L{P((tx0,ytop-hh))}",
       f"C{P((tx0+3,ytop-hh))} {P((cx-3,ytop-h))} {P((cx,ytop-h))}",
       f"A{f(ro)} {f(ro)} 0 0 1 {P((bx+h,cy))}",
       f"L{P((bx+h,yj))}",
       f"A{f(h)} {f(h)} 0 0 1 {P((tc[0],ybot+h))}",
       f"L{P((x0,ybot+h))}",
       f"A{f(h)} {f(h)} 0 0 1 {P((x0,ybot-h))}",
       f"L{P((bx-h,ybot-h))}",
       f"L{P((bx-h,cy))}",
       f"A{f(ri)} {f(ri)} 0 0 0 {P((cx,ytop+h))}",
       f"C{P((cx-3,ytop+h))} {P((tx0+3,ytop+hh))} {P((tx0,ytop+hh))}",
       f"L{P((x0,ytop+hh))}", f"A{f(hh)} {f(hh)} 0 0 1 {P((x0,ytop-hh))}","Z"]
    return ' '.join(d)
def yod(yx, W=9, comp=1.0, ytop=11.5, ybot=25, r=4):
    h=W/2; hh=h*comp; x0=yx-5; cx,cy=yx-r,ytop+r
    d=[f"M{P((x0,ytop-hh))}", f"C{P((x0+1.2,ytop-hh))} {P((cx-1,ytop-h))} {P((cx,ytop-h))}",
       f"A{f(r+h)} {f(r+h)} 0 0 1 {P((yx+h,cy))}", f"L{P((yx+h,ybot))}",
       f"A{f(h)} {f(h)} 0 0 1 {P((yx-h,ybot))}", f"L{P((yx-h,ytop+hh))}",
       f"L{P((x0,ytop+hh))}", f"A{f(hh)} {f(hh)} 0 0 1 {P((x0,ytop-hh))}","Z"]
    return ' '.join(d)
cfg=json.loads(sys.argv[1])
out={'gimel':gimel(), 'bet':bet(cfg['bx'],cfg['tail']), 'yod':yod(cfg['yx']),
     # גדלים קטנים: אותו שלד; ריפוי-דיו (ink-trap) — רגל דקה ב-15% ומחוברת 2 יח׳ גבוה יותר כדי שהמפשעה תישאר פתוחה
     'gimelSmall':gimel(A=(44,34),legW=7.6,rf=1.2),
     'g32':gimel(W=10,A=(44,34),legW=8.5,rf=1.2),
     'g48':gimel(W=9.33,A=(44,34.5),legW=8,rf=1.2)}
json.dump(out,open(cfg['out'],'w')); print({k:len(v) for k,v in out.items()})
