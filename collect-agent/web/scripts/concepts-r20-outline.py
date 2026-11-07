# מתאר יחיד לאותיות (שאפלי): קו → buffer עגול, איחוד, ו"סגירה" (buffer +r −r) = פילט r במפשעות
import json, math, sys
from shapely.geometry import LineString, Point
from shapely.ops import unary_union
W=9; H=W/2; R=7.2
def qbez(p0,p1,p2,n=24):
    return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in [i/n for i in range(n+1)]]
def corner_letter(x0, xs, ytop=11.5, ybot=50):
    return [(x0,ytop),(xs-R,ytop)] + qbez((xs-R,ytop),(xs,ytop),(xs,ytop+R))[1:] + [(xs,ybot)]
def poly_path(g, nd=2):
    f=lambda v: f"{v:.{nd}f}".rstrip('0').rstrip('.')
    def ring(r): 
        c=list(r.coords); return 'M'+' L'.join(f"{f(x)} {f(y)}" for x,y in c[:-1])+' Z'
    geoms = g.geoms if hasattr(g,'geoms') else [g]
    return ' '.join(ring(p.exterior)+''.join(' '+ring(i) for i in p.interiors) for p in geoms)
def buf(coords): return LineString(coords).buffer(H, cap_style='round', join_style='round', quad_segs=16)
cfg=json.loads(sys.argv[1])
g=unary_union([buf(corner_letter(cfg['gx0'],44)), buf([tuple(cfg['legA']),tuple(cfg['legB'])])])
g=g.buffer(cfg['fillet'],join_style='round',quad_segs=16).buffer(-cfg['fillet'],join_style='round',quad_segs=16)
bx=cfg['bx']
bet=unary_union([buf(corner_letter(bx-20,bx)), buf([(bx-20,50),(bx+cfg['tail'],50)])])
yx=cfg['yx']
yod=buf([(yx-9,11.5),(yx-5,11.5)]+qbez((yx-5,11.5),(yx,11.5),(yx,16.5))[1:]+[(yx,25)])
print(json.dumps({'gimel':poly_path(g),'bet':poly_path(bet),'yod':poly_path(yod),'gimelBounds':g.bounds,'betBounds':bet.bounds,'yodBounds':yod.bounds,
  'gaps':{'gimel_bet_top': round(g.bounds[0]-bet.bounds[2],2) if False else None,
          'g_b':round(g.distance(bet),2),'b_y':round(bet.distance(yod),2),
          'dot':{k:round(Point(cfg['dot'][:2]).distance(LineString(v))-H-cfg['dot'][2],2) for k,v in {'head':[(cfg['gx0'],11.5),(44-R,11.5)],'stem':[(44,18.7),(44,50)],'leg':[cfg['legA'],cfg['legB']]}.items()}}}))
