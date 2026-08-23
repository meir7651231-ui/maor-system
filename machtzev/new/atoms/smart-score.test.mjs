import { smartScore } from './smart-score.mjs';
const norm=(t)=>String(t||'').toLowerCase().replace(/[֑-ׇ]/g,'').replace(/[ךםןףץ]/g,(c)=>({ך:'כ',ם:'מ',ן:'נ',ף:'פ',ץ:'צ'})[c]).replace(/['"׳״\-–._]/g,'').trim();
const dist=(a,b)=>{const la=a.length,lb=b.length;if(!la)return lb;if(!lb)return la;const dp=[];for(let j=0;j<=lb;j++)dp[j]=j;for(let i=1;i<=la;i++){let p=dp[0];dp[0]=i;for(let j=1;j<=lb;j++){const t=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t;}}return dp[lb];};
const XL={'כהן':['cohen','kohen','коэн']};
const expand=(q,n)=>{const nq=n(q);const out=[q];if(!nq)return out;for(const [h,al] of Object.entries(XL)){if(n(h)===nq)out.push(...al);else if(al.some(a=>n(a)===nq))out.push(h);}return [...new Set(out)];};
const score=(q,t)=>{const nq=norm(q),nt=norm(t);if(!nq||!nt)return 0;if(nt===nq)return 100;if(nt.startsWith(nq))return 80;if(nq.length>=2&&nt.includes(nq))return 62;const max=nt.length>=6?2:1;if(nq.length>=3){const d=dist(nq,nt);if(d<=max)return 52-d*4;}return 0;};
const C=[['כהן',['כהן'],100],['דוד כהן',['דוד','כהן'],200],['דוד xyz',['דוד','כהן'],0],['cohen',['כהן'],100],['',['כהן'],0]];
let f=0; for(const [q,t,w] of C){const g=smartScore(q,t,norm,expand,score); if(g!==w){console.error(`✗ ("${q}") = ${g} ≠ ${w}`);f=1;}}
if(f)process.exit(1); console.log(`✓ smart-score: ${C.length} דוגמאות-חוזה — ירוק`);
