# סבב 21: שלד אחד ⇒ כל הגדלים. קו → buffer עגול, איחוד, סגירה (פילט), פיצוי אופטי לאופקי (ראש דק ב-8%)
import json, sys
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union
from shapely import affinity
R=7.2
def qbez(p0,p1,p2,n=24):
    return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in [i/n for i in range(n+1)]]
def path(g, nd=2):
    f=lambda v: f"{v:.{nd}f}".rstrip('0').rstrip('.')
    ring=lambda r: 'M'+' L'.join(f"{f(x)} {f(y)}" for x,y in list(r.coords)[:-1])+' Z'
    gs=g.geoms if hasattr(g,'geoms') else [g]
    return ' '.join(ring(p.exterior)+''.join(' '+ring(i) for i in p.interiors) for p in gs)
B=lambda c,h: LineString(c).buffer(h,cap_style='round',join_style='round',quad_segs=16)
def gimel(W, hx0=28, leg=((44,36),(29,45.5)), fil=1.2, comp=0.92):
    h=W/2
    head=B([(hx0,11.5),(44-R,11.5)], h*comp)
    corner=B(qbez((44-R,11.5),(44,11.5),(44,11.5+R))+[(44,50)], h)
    g=unary_union([head,corner,B(list(leg),h)])
    g=g.buffer(fil,quad_segs=16).buffer(-fil,quad_segs=16)          # פילט במפשעות
    return g.buffer(-0.3,quad_segs=16).buffer(0.3,quad_segs=16)      # החלקת המדרגה ראש↔כתף
def bet(W,bx,tail):
    h=W/2
    return unary_union([B([(bx-20,11.5),(bx-R,11.5)],h*0.92), B(qbez((bx-R,11.5),(bx,11.5),(bx,11.5+R))+[(bx,50)],h), B([(bx-20,50),(bx+tail,50)],h*0.92)]).buffer(-0.3,quad_segs=16).buffer(0.3,quad_segs=16)
def yod(W,yx):
    h=W/2
    return unary_union([B([(yx-5,11.5),(yx-4,11.5)],h*0.92), B(qbez((yx-4,11.5),(yx,11.5),(yx,15.5))+[(yx,25)],h)])
cfg=json.loads(sys.argv[1])
G=gimel(9); Bt=bet(9,cfg['bx'],cfg['tail']); Y=yod(9,cfg['yx'])
dot=cfg['dot']
dist=lambda geom: round(Point(dot[0],dot[1]).distance(geom)-dot[2],2)
headL=B([(28,11.5),(44-R,11.5)],0.01); stemL=B([(44,18.7),(44,50)],0.01); legL=B([(44,36),(29,45.5)],0.01)
# בדיקת מרווחי הדגש מהמתאר עצמו (לא מקווי-האמצע)
parts={'all':round(Point(dot[0],dot[1]).distance(G)-dot[2],2)}
out={'gimel':path(G),'bet':path(Bt),'yod':path(Y),'bounds':{'g':G.bounds,'b':Bt.bounds,'y':Y.bounds},
     'gaps':{'g_b':round(G.distance(Bt),2),'b_y':round(Bt.distance(Y),2),'dot_min':parts['all']},
     'centroid':list(unary_union([G,Point(dot[0],dot[1]).buffer(dot[2])]).centroid.coords[0])}
# גדלים קטנים: אותה צורה בדיוק, מוקטנת + עובי מוגדל לפי גודל (קטן ⇒ כבד יותר), ממוקמת כך שקצות העמוד/הראש על פיקסלים שלמים
for px,W,s,ox,oy in [(32,10,0.5,-2.5,0.75),(48,9.333,0.75,-2.5,1.5)]:
    g=affinity.translate(affinity.scale(gimel(W),s,s,origin=(0,0)),ox,oy)
    d=(dot[0]*s+ox, dot[1]*s+oy, dot[2]*s*(W/9))
    out[f'g{px}']=path(g); out[f'dot{px}']=d; out[f'b{px}']=g.bounds
    out[f'gap{px}']=round(Point(d[0],d[1]).distance(g)-d[2],2)
json.dump(out,open(cfg.get('out','o21.json'),'w'))
print(json.dumps({k:out[k] for k in ['bounds','gaps','centroid','dot32','b32','gap32','dot48','b48','gap48']}))
