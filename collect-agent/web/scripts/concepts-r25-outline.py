# סבב 24: מתאר אנליטי. פיצוי אופטי רק בקצה הפנימי ובשיפוע ארוך (הקצה העליון ישר לגמרי); אותם רדיוסים ל-ג/ב/י
import json, math, sys
def f(v): return f"{v:.3f}".rstrip('0').rstrip('.')
def P(p): return f"{f(p[0])} {f(p[1])}"
def fillet(V, d1, d2, r):
    cos=d1[0]*d2[0]+d1[1]*d2[1]; ang=math.acos(max(-1,min(1,cos))); d=r/math.tan(ang/2)
    T1=(V[0]+d1[0]*d,V[1]+d1[1]*d); T2=(V[0]+d2[0]*d,V[1]+d2[1]*d)
    bx,by=d1[0]+d2[0],d1[1]+d2[1]; bl=math.hypot(bx,by); k=r/math.sin(ang/2)
    return T1,T2,(V[0]+bx/bl*k,V[1]+by/bl*k)
def arcto(a,b,c,r):
    cr=(a[0]-c[0])*(b[1]-c[1])-(a[1]-c[1])*(b[0]-c[0])
    return f"A{f(r)} {f(r)} 0 0 {1 if cr>0 else 0} {P(b)}"
def line_x(p,u,x): t=(x-p[0])/u[0]; return (x,p[1]+t*u[1])
R=7.2
def head(x0, cx, ytop, h, hh):
    # ראש: קצה עליון ישר (ytop-h); קצה תחתון יורד בשיפוע ארוך מ-ytop+h (ליד הכתף) ל-ytop-h+2hh (בהתחלה); כיפה בקוטר 2hh
    yb0=ytop-h+2*hh; capc=(x0, ytop-h+hh)
    top=[f"M{P((x0,ytop-h))}", f"L{P((cx,ytop-h))}"]
    L=cx-x0
    bottom_back=[f"C{P((cx-L/3,ytop+h))} {P((x0+L/3,yb0))} {P((x0,yb0))}", f"A{f(hh)} {f(hh)} 0 0 1 {P((x0,ytop-h))}"]
    return top,bottom_back
def gimel(x0=28, xs=44, W=9, comp=0.92, A=(44,36), Bp=(30,43.5), legW=8.1, rf_lo=2.5, rf_up=1.6, ytop=11.5, ybot=50.7):
    h=W/2; hh=h*comp; lh=(legW or W)/2; cx,cy=xs-R,ytop+R; ro,ri=R+h,R-h
    dx,dy=Bp[0]-A[0],Bp[1]-A[1]; L=math.hypot(dx,dy); u=(dx/L,dy/L); n=(-u[1],u[0])
    if n[1]<0: n=(-n[0],-n[1])
    lo0=(A[0]+n[0]*lh,A[1]+n[1]*lh); up0=(A[0]-n[0]*lh,A[1]-n[1]*lh)
    Vlo=line_x(lo0,u,xs-h); Vup=line_x(up0,u,xs-h)
    T1,T2,C1=fillet(Vlo,(0,1),u,rf_lo); T3,T4,C2=fillet(Vup,u,(0,-1),rf_up)
    BL=(Bp[0]+n[0]*lh,Bp[1]+n[1]*lh); BU=(Bp[0]-n[0]*lh,Bp[1]-n[1]*lh)
    top,back=head(x0,cx,ytop,h,hh)
    d=top+[f"A{f(ro)} {f(ro)} 0 0 1 {P((xs+h,cy))}", f"L{P((xs+h,ybot))}", f"A{f(h)} {f(h)} 0 0 1 {P((xs-h,ybot))}",
       f"L{P(T1)}", arcto(T1,T2,C1,rf_lo), f"L{P(BL)}", f"A{f(lh)} {f(lh)} 0 0 1 {P(BU)}", f"L{P(T3)}", arcto(T3,T4,C2,rf_up),
       f"L{P((xs-h,cy))}", f"A{f(ri)} {f(ri)} 0 0 0 {P((cx,ytop+h))}"]+back+["Z"]
    return ' '.join(d)
def bet(bx, W=9, comp=0.92, ytop=11.5, ybot=50, tail=2.0, rf=1.6):
    # ב: ראש כמו ג; בסיס אופקי דק ב-8% (קצה תחתון ישר על קו-הבסיס, דילול מלמעלה); זנב = הארכה ישרה 3 יח׳ מעבר לעמוד + כיפה; פילטים r=1.6
    h=W/2; hh=h*comp; x0=bx-20; cx,cy=bx-R,ytop+R; ro,ri=R+h,R-h
    bb=ybot+h; bt=bb-2*hh                      # בסיס: תחתית ישרה, עובי 2hh
    ex=bx+h; tcx=ex+tail                        # מרכז כיפת הזנב
    top,back=head(x0,cx,ytop,h,hh)
    d=top+[f"A{f(ro)} {f(ro)} 0 0 1 {P((ex,cy))}",
       f"L{P((ex,bt-rf))}", f"A{f(rf)} {f(rf)} 0 0 0 {P((ex+rf,bt))}",
       (f"L{P((tcx,bt))}" if tail>rf else ""), f"A{f(hh)} {f(hh)} 0 0 1 {P((tcx,bb))}",
       f"L{P((x0,bb))}", f"A{f(hh)} {f(hh)} 0 0 1 {P((x0,bt))}",
       f"L{P((bx-h-rf,bt))}", f"A{f(rf)} {f(rf)} 0 0 0 {P((bx-h,bt-rf))}",
       f"L{P((bx-h,cy))}", f"A{f(ri)} {f(ri)} 0 0 0 {P((cx,ytop+h))}"]+back+["Z"]
    return ' '.join(d)
def yod(yx, W=9, comp=0.92, ytop=11.5, ybot=27):
    # י: אותו ראש ואותה כתף (רדיוסים 11.7/2.7) כמו ג/ב, ראש קצר
    h=W/2; hh=h*comp; cx,cy=yx-R,ytop+R; x0=cx-3; ro,ri=R+h,R-h
    top,back=head(x0,cx,ytop,h,hh)
    d=top+[f"A{f(ro)} {f(ro)} 0 0 1 {P((yx+h,cy))}", f"L{P((yx+h,ybot))}", f"A{f(h)} {f(h)} 0 0 1 {P((yx-h,ybot))}",
       f"L{P((yx-h,cy))}", f"A{f(ri)} {f(ri)} 0 0 0 {P((cx,ytop+h))}"]+back+["Z"]
    return ' '.join(d)
cfg=json.loads(sys.argv[1])
out={'gimel':gimel(),'bet':bet(cfg['bx']),'yod':yod(cfg['yx']),
     'g32':gimel(W=10,comp=1,A=(44,36),Bp=(30,43.5),legW=8.4,rf_lo=1.6,rf_up=1.2,ybot=50.5),
     'g48':gimel(W=9.33,comp=1,A=(44,36),Bp=(30,43.5),legW=8.2,rf_lo=1.8,rf_up=1.2,ybot=50.5)}
json.dump(out,open(cfg['out'],'w')); print({k:len(v.split()) for k,v in out.items()})
