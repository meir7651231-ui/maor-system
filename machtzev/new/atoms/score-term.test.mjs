import { scoreTerm } from './score-term.mjs';
// שקעים אמיתיים מחווטים ידנית לבדיקת-קצה (לא ייבוא-אטום — העתק-בדיקה מקומי)
const norm=(t)=>String(t||'').toLowerCase().replace(/[֑-ׇ]/g,'').replace(/[ךםןףץ]/g,(c)=>({ך:'כ',ם:'מ',ן:'נ',ף:'פ',ץ:'צ'})[c]).replace(/['"׳״\-–._]/g,'').trim();
const dist=(a,b)=>{const la=a.length,lb=b.length;if(!la)return lb;if(!lb)return la;const dp=[];for(let j=0;j<=lb;j++)dp[j]=j;for(let i=1;i<=la;i++){let p=dp[0];dp[0]=i;for(let j=1;j<=lb;j++){const t=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t;}}return dp[lb];};
const C=[['כהן','כהן',100],['כה','כהן',80],['חוגים','חוג',70],['הן','כהן',62],['דויד','דוד',58],['כוהן','כהן',58],['golstein','goldstein',48],['xyz','כהן',0],['','כהן',0]];
let f=0; for(const [q,t,w] of C){const g=scoreTerm(q,t,norm,dist); if(g!==w){console.error(`✗ ("${q}","${t}") = ${g} ≠ ${w}`);f=1;}}
if(f)process.exit(1); console.log(`✓ score-term: ${C.length} דוגמאות-חוזה — ירוק`);
