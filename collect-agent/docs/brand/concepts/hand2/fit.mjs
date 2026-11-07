import {readFileSync,writeFileSync} from 'fs'; import {createRequire} from 'module';
const src=readFileSync('h22.mjs','utf8');
const palm=src.match(/const palm=`([^`]*)`/)[1], thumb=src.match(/const thumb=`([^`]*)`/)[1];
const D=55,TH=15;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="640" height="640"><g id="h" transform="rotate(${D} 32 32) translate(0 82) scale(1 -1)"><path id="p" d="${palm}"/><path id="t" d="${thumb}" transform="rotate(${TH} 39.4 31)"/></g></svg>`;
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright');const b=await chromium.launch();const p=await b.newPage();
await p.setContent(svg);
const pts=await p.evaluate(()=>{const out=[];for(const id of ['p','t']){const el=document.getElementById(id);const m=el.getCTM();const svg=el.ownerSVGElement;const L=el.getTotalLength();
 for(let i=0;i<600;i++){const q=el.getPointAtLength(L*i/600);const pt=svg.createSVGPoint();pt.x=q.x;pt.y=q.y;const r=pt.matrixTransform(m);out.push([r.x/10,r.y/10]);}}return out;});
// ממירים חזרה ליחידות viewBox (getCTM כולל קנה 10)
const inside=await p.evaluate(()=>1);
await b.close();
const H=pts; // נקודות מתאר היד
const dHand=(x,y)=>Math.min(...H.map(([a,c])=>Math.hypot(a-x,c-y)));
// ארנק: מלבן מעוגל w×h בפינה (wx,wy); מרחק מנקודה למלבן
const W=27,Hh=17,R=6;
const rectD=(px,py,wx,wy)=>{const dx=Math.max(wx-px,0,px-(wx+W)),dy=Math.max(wy-py,0,py-(wy+Hh));return Math.hypot(dx,dy);};
const walletHandD=(wx,wy)=>Math.min(...H.map(([a,c])=>rectD(a,c,wx,wy)));
const G=3.6; let best=null;
const rot=(x,y,d,cx=32,cy=32)=>{const r=d*Math.PI/180,dx=x-cx,dy=y-cy;return [cx+dx*Math.cos(r)-dy*Math.sin(r),cy+dx*Math.sin(r)+dy*Math.cos(r)];};
const [fx,fy]=rot(11.2,53.6,D);console.log('fingertip',fx,fy);
for(let cx=fx-8;cx<=fx+10;cx+=0.4)for(let cy=fy;cy<=fy+20;cy+=0.4){const dh=dHand(cx,cy)-R;if(Math.abs(dh-G)>0.5)continue;
 for(let wx=cx-26;wx<=cx;wx+=0.5)for(let wy=cy+R;wy<=cy+R+8;wy+=0.4){const dw=rectD(cx,cy,wx,wy)-R; if(dw<G-0.5)continue; const dwh=walletHandD(wx,wy);
  const e=(dh-G)**2+(dw-G)**2+(dwh-G)**2+0.05*Math.abs((wx+W/2)-cx);
  if(!best||e<best.e)best={e,cx,cy,wx,wy,dh,dw,dwh};}}
console.log(JSON.stringify(best));
writeFileSync('fit.json',JSON.stringify(best));
