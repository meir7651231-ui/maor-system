/**
 * קיר ההשפעה — מצב ראווה במסך מלא ("שידור חי" למסך גדול / גיוס תרומות).
 *
 * תצוגה כהה-זהובה קבועה (dark-luxe) שאינה תלויה בערכת הנושא של האפליקציה —
 * כל העיצוב ב-<style> פנימי בהיקף .impact-wall, כי זהו "מסך טלוויזיה".
 * אפס אינטראקציה נדרשת: שעון חי (30 שנ׳), הסתרת סמן אחרי 3 שנ׳,
 * יציאה ב-Escape או ✕. נפתח דרך ‎#wall‎ (ראו App.tsx), בכפוף ל-feature
 * ‎home.impactwall‎. כל המספרים אמיתיים — ראו wallData.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { hebDateFull } from '../../lib/hebrew';
import { isoOf } from '../calendar/calLib';
import { buildWallData, fmtIls } from './wallData';

const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

const fmtWeekday = new Intl.DateTimeFormat('he', { weekday: 'long' });

/** DD/MM/YYYY. */
function fmtGreg(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const MEDALS = ['🥇', '🥈', '🥉'] as const;

export function ImpactWall(props: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const orgName = config.orgName || db.orgName;

  // שעון חי — עדכון כל 30 שניות
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // יציאה ב-Escape
  const { onClose } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // הסתרת סמן העכבר אחרי 3 שניות ללא תנועה
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const arm = () => {
      setIdle(false);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), 3000);
    };
    arm();
    window.addEventListener('mousemove', arm);
    return () => {
      clearTimeout(idleTimer.current);
      window.removeEventListener('mousemove', arm);
    };
  }, []);

  const data = useMemo(() => buildWallData(db, now), [db, now]);

  // טבעת ההתקדמות — יעד מוגדר: קשת לפי האחוז; אין יעד: טבעת מלאה עם הסכום
  const ringP = data.pct ?? 1;
  const dash = `${(RING_C * ringP).toFixed(1)} ${RING_C.toFixed(1)}`;

  // גרף הפעימה — 12 חודשים, 0..600×190
  const chart = useMemo(() => {
    const vals = data.pulse.values;
    const W = 600;
    const H = 190;
    const top = 18;
    const bottom = 14;
    const max = Math.max(1, ...vals);
    const step = vals.length > 1 ? W / (vals.length - 1) : W;
    const pts = vals.map(
      (v, i) => [i * step, H - bottom - (v / max) * (H - top - bottom)] as const,
    );
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${line} L${W} ${H} L0 ${H} Z`;
    const end = pts[pts.length - 1] ?? ([W, H - bottom] as const);
    return { line, area, endX: end[0], endY: end[1] };
  }, [data.pulse.values]);

  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className={'impact-wall' + (idle ? ' idle' : '')} dir="rtl" role="presentation">
      <style>{WALL_CSS}</style>

      <button type="button" className="iw-exit" onClick={onClose} aria-label="יציאה ממצב ראווה" title="יציאה (Esc)">
        ✕
      </button>

      <div className="iw-wall">
        {/* כותרת: מיתוג + שעון ותאריך כפול */}
        <div className="iw-top">
          <div className="iw-brand">
            {config.logoDataUri ? (
              <img src={config.logoDataUri} alt="" />
            ) : (
              <svg viewBox="0 0 100 100" aria-hidden>
                <path
                  d="M50 14 C60 30 67 38 67 50 C67 62.5 59.5 70 50 70 C40.5 70 33 62.5 33 50 C33 38 40 30 50 14 Z"
                  fill="#f3c76b"
                />
                <path
                  d="M50 34 C55 41 58 45.5 58 51.5 C58 58.5 54.4 62.5 50 62.5 C45.6 62.5 42 58.5 42 51.5 C42 45.5 45 41 50 34 Z"
                  fill="#fff7e2"
                />
                <rect x="28" y="78" width="44" height="6" rx="3" fill="#f3c76b" />
              </svg>
            )}
            <div>
              <h1>{orgName}</h1>
              <small title="המספרים נשאבים מהנתונים החיים — כל תרומה או רישום מתעדכנים כאן מיד">
                קיר ההשפעה · שידור חי <span className="iw-live" aria-hidden />
              </small>
            </div>
          </div>
          <div className="iw-clock">
            <div className="t iw-num">{timeStr}</div>
            <div className="d">
              {fmtWeekday.format(now)} · <b>{hebDateFull(isoOf(now))}</b> · {fmtGreg(now)}
            </div>
          </div>
        </div>

        {/* גיבור: 3 KPI מימין · טבעת זוהרת · 3 KPI משמאל */}
        <div className="iw-hero">
          <div className="iw-side">
            {data.kpisRight.map((k) => (
              <div className="iw-ss" key={k.label}>
                <div className="e" aria-hidden>{k.icon}</div>
                <div>
                  <div className="v iw-num">{k.value}</div>
                  <div className="l">{k.label}</div>
                </div>
                {k.badge && <div className="up">{k.badge}</div>}
              </div>
            ))}
          </div>

          <div className="iw-ring">
            <svg viewBox="0 0 200 200" aria-hidden>
              <defs>
                <linearGradient id="iw-rg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffe9b8" />
                  <stop offset="55%" stopColor="#f3c76b" />
                  <stop offset="100%" stopColor="#c98a2e" />
                </linearGradient>
                <filter id="iw-glow">
                  <feGaussianBlur stdDeviation="3.2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="100" cy="100" r={RING_R} fill="none" stroke="rgba(243,199,107,.14)" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r={RING_R}
                fill="none"
                stroke="url(#iw-rg)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={dash}
                filter="url(#iw-glow)"
              />
            </svg>
            <div className="in">
              <div className="b iw-num">{fmtIls(data.raisedThisYear)}</div>
              <div className="l">גויסו השנה למען המשפחות</div>
              {data.goalLine && <div className="y iw-num">{data.goalLine}</div>}
            </div>
          </div>

          <div className="iw-side">
            {data.kpisLeft.map((k) => (
              <div className="iw-ss" key={k.label}>
                <div className="e" aria-hidden>{k.icon}</div>
                <div>
                  <div className="v iw-num">{k.value}</div>
                  <div className="l">{k.label}</div>
                </div>
                {k.badge && <div className="up">{k.badge}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* שורה תחתונה: פודיום · פעימת הקהילה · השבוע בלוח העברי */}
        <div className="iw-row">
          <div className="iw-panel iw-podium">
            <h2>🏆 ספר הזהב · תורמי {data.podium.scopeLabel}</h2>
            {data.podium.rows.length === 0 && <div className="iw-empty">עדיין לא נרשמו תרומות</div>}
            {data.podium.rows.map((r, i) => (
              <div className={'p p' + (i + 1)} key={r.name + i}>
                <div className="m" aria-hidden>{MEDALS[i]}</div>
                <div>
                  <b>{r.name}</b>
                  <span>{r.sub}</span>
                </div>
                <div className="amt iw-num">{fmtIls(r.amount)}</div>
              </div>
            ))}
            {data.podium.othersCount > 0 && (
              <div className="p">
                <div className="m rest" aria-hidden>🤍</div>
                <div>
                  <b>עוד {data.podium.othersCount} תורמים</b>
                  <span>שותפים לעשייה</span>
                </div>
                <div className="amt iw-num">{fmtIls(data.podium.othersAmount)}</div>
              </div>
            )}
          </div>

          <div className="iw-panel iw-pulse">
            <h2>💓 פעימת הקהילה · 12 חודשים</h2>
            <svg viewBox="0 0 600 190" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="iw-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(243,199,107,.45)" />
                  <stop offset="100%" stopColor="rgba(243,199,107,0)" />
                </linearGradient>
                <filter id="iw-lg">
                  <feGaussianBlur stdDeviation="2.4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g stroke="rgba(243,199,107,.09)" strokeWidth="1">
                <line x1="0" y1="48" x2="600" y2="48" />
                <line x1="0" y1="96" x2="600" y2="96" />
                <line x1="0" y1="144" x2="600" y2="144" />
              </g>
              <path d={chart.area} fill="url(#iw-area)" />
              <path
                d={chart.line}
                fill="none"
                stroke="#f3c76b"
                strokeWidth="3.5"
                strokeLinejoin="round"
                filter="url(#iw-lg)"
              />
              <circle cx={chart.endX} cy={chart.endY} r="7" fill="#fff7e2" filter="url(#iw-lg)" />
            </svg>
            <div className="cap">
              <span>{data.pulse.startLabel}</span>
              <span>שיבוצים, תשלומים ותרומות — מדד משוקלל</span>
              <span>{data.pulse.endLabel}</span>
            </div>
            <div className="kpis">
              {data.miniKpis.map((k) => (
                <div className="kpi" key={k.label}>
                  <b className="iw-num">{k.value}</b>
                  <span>{k.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="iw-panel iw-week">
            <h2>📜 השבוע בלוח העברי</h2>
            {data.week.length === 0 && <div className="iw-empty">שבוע שקט — אין אירועים בלוח</div>}
            {data.week.map((r) => (
              <div className="d" key={r.key}>
                <div className="hd">{r.hd}</div>
                <div>
                  <b>{r.title}</b>
                  {r.sub && <span>{r.sub}</span>}
                </div>
                <div className="fl" aria-hidden>{r.emoji}</div>
              </div>
            ))}
          </div>
        </div>

        {/* טיקר בשורות — CSS marquee; במצב reduced-motion מוצג סטטי */}
        <div className="iw-ticker" aria-label="עדכונים אחרונים">
          <div className="in">
            {(data.ticker.length ? data.ticker : [`✨ ${orgName} — כאן קורה החסד, בשידור חי`]).map(
              (t, i, arr) => (
                <span key={i}>
                  <b>{t}</b>
                  {i < arr.length - 1 && <span className="sep">◆</span>}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * העיצוב — פורט נאמן של המוקאפ (dark-luxe זהב זוהר), בהיקף .impact-wall בלבד.
 * אין תלות בערכת הנושא; פונט: המחסנית הקיימת של האפליקציה במשקל 900 לתצוגה.
 */
const WALL_CSS = `
.impact-wall{
  position:fixed;inset:0;z-index:200;overflow:hidden auto;
  --iw-gold:#f3c76b;--iw-gold-hi:#ffe9b8;--iw-gold-deep:#c98a2e;
  --iw-bg:#0d0b07;--iw-ink:#f5eeda;--iw-soft:#bfb190;--iw-faint:#7d7157;
  background:
    radial-gradient(900px 460px at 50% -12%, rgba(243,199,107,.16), transparent 60%),
    radial-gradient(500px 400px at 6% 100%, rgba(201,138,46,.1), transparent 60%),
    radial-gradient(500px 400px at 94% 100%, rgba(201,138,46,.1), transparent 60%),
    var(--iw-bg);
  color:var(--iw-ink);font-size:16px;line-height:1.5;
}
.impact-wall.idle{cursor:none}
.impact-wall .iw-num{font-variant-numeric:tabular-nums}
.impact-wall *{margin:0;padding:0;box-sizing:border-box}

.impact-wall .iw-exit{
  position:absolute;top:18px;left:18px;z-index:5;width:44px;height:44px;border-radius:50%;
  border:1px solid rgba(243,199,107,.3);background:rgba(13,11,7,.6);color:var(--iw-soft);
  font-size:18px;cursor:pointer;transition:opacity .3s, color .15s;
}
.impact-wall .iw-exit:hover{color:var(--iw-gold-hi)}
.impact-wall.idle .iw-exit{opacity:0}

.impact-wall .iw-wall{max-width:1560px;margin:0 auto;padding:34px 48px 0;display:flex;flex-direction:column;min-height:100vh}

/* כותרת */
.impact-wall .iw-top{display:flex;align-items:center;gap:24px}
.impact-wall .iw-brand{display:flex;align-items:center;gap:16px}
.impact-wall .iw-brand svg,.impact-wall .iw-brand img{width:54px;height:54px;object-fit:contain;border-radius:10px;filter:drop-shadow(0 0 18px rgba(243,199,107,.6))}
.impact-wall .iw-brand h1{font-weight:900;font-size:30px;line-height:1.15;color:var(--iw-gold-hi)}
.impact-wall .iw-brand small{display:block;font-weight:400;font-size:12.5px;color:var(--iw-soft);letter-spacing:3px}
.impact-wall .iw-live{display:inline-block;width:8px;height:8px;border-radius:99px;background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,.9);animation:iwLive 1.6s ease-in-out infinite;vertical-align:middle}
@keyframes iwLive{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.75)}}
.impact-wall .iw-clock{margin-inline-start:auto;text-align:left}
.impact-wall .iw-clock .t{font-weight:900;font-size:34px;line-height:1.1;color:var(--iw-gold-hi)}
.impact-wall .iw-clock .d{color:var(--iw-soft);font-size:14px}
.impact-wall .iw-clock .d b{color:var(--iw-gold);font-weight:500}

/* גיבור */
.impact-wall .iw-hero{display:grid;grid-template-columns:1fr auto 1fr;gap:30px;align-items:center;margin:26px 0 22px}
.impact-wall .iw-ring{position:relative;width:330px;height:330px;justify-self:center}
.impact-wall .iw-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.impact-wall .iw-ring .in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.impact-wall .iw-ring .in .b{font-weight:900;font-size:54px;line-height:1;color:var(--iw-gold-hi);text-shadow:0 0 42px rgba(243,199,107,.45)}
.impact-wall .iw-ring .in .l{color:var(--iw-soft);font-size:15px;margin-top:8px}
.impact-wall .iw-ring .in .y{margin-top:10px;font-size:12.5px;color:var(--iw-gold);border:1px solid rgba(243,199,107,.35);border-radius:99px;padding:3px 14px}

.impact-wall .iw-side{display:flex;flex-direction:column;gap:18px}
.impact-wall .iw-ss{background:linear-gradient(180deg,rgba(243,199,107,.08),rgba(243,199,107,.02));border:1px solid rgba(243,199,107,.18);border-radius:20px;padding:16px 22px;display:flex;align-items:center;gap:16px;backdrop-filter:blur(6px)}
.impact-wall .iw-ss .e{font-size:30px;filter:drop-shadow(0 2px 10px rgba(243,199,107,.35))}
.impact-wall .iw-ss .v{font-weight:900;font-size:31px;line-height:1.1;color:var(--iw-gold-hi)}
.impact-wall .iw-ss .l{font-size:13px;color:var(--iw-soft)}
.impact-wall .iw-ss .up{margin-inline-start:auto;font-weight:700;font-size:13px;color:#9dc472;background:rgba(157,196,114,.12);border-radius:99px;padding:3px 11px;white-space:nowrap}

/* שורה תחתונה */
.impact-wall .iw-row{display:grid;grid-template-columns:1.05fr 1.5fr 1.05fr;gap:22px;flex:1;min-height:0}
.impact-wall .iw-panel{background:linear-gradient(180deg,rgba(34,28,18,.85),rgba(20,17,11,.9));border:1px solid rgba(243,199,107,.15);border-radius:22px;padding:18px 22px;backdrop-filter:blur(8px)}
.impact-wall .iw-panel h2{font-weight:700;font-size:15px;color:var(--iw-gold);letter-spacing:.6px;display:flex;gap:8px;align-items:center;margin-bottom:13px}
.impact-wall .iw-panel h2::after{content:'';flex:1;height:1px;background:linear-gradient(270deg,rgba(243,199,107,.3),transparent)}
.impact-wall .iw-empty{color:var(--iw-faint);font-size:14px;padding:14px 0;text-align:center}

/* פודיום */
.impact-wall .iw-podium .p{display:flex;align-items:center;gap:13px;padding:8px 0}
.impact-wall .iw-podium .m{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
.impact-wall .iw-podium .p1 .m{background:radial-gradient(circle at 35% 30%,#ffe9b8,#c98a2e);box-shadow:0 0 20px rgba(243,199,107,.5)}
.impact-wall .iw-podium .p2 .m{background:radial-gradient(circle at 35% 30%,#e8e8e8,#9a9a9a)}
.impact-wall .iw-podium .p3 .m{background:radial-gradient(circle at 35% 30%,#e8b98b,#9c6b3c)}
.impact-wall .iw-podium .m.rest{background:rgba(243,199,107,.12)}
.impact-wall .iw-podium b{font-size:15.5px}
.impact-wall .iw-podium .p>div span{display:block;font-size:12px;color:var(--iw-faint)}
.impact-wall .iw-podium .amt{margin-inline-start:auto;font-weight:900;font-size:20px;color:var(--iw-gold-hi)}
.impact-wall .iw-podium .p1 .amt{font-size:24px;text-shadow:0 0 18px rgba(243,199,107,.4)}

/* פעימה */
.impact-wall .iw-pulse svg{width:100%;height:190px;display:block}
.impact-wall .iw-pulse .cap{display:flex;justify-content:space-between;color:var(--iw-faint);font-size:11.5px;margin-top:2px;direction:ltr}
.impact-wall .iw-pulse .kpis{display:flex;gap:12px;margin-top:12px}
.impact-wall .iw-pulse .kpi{flex:1;text-align:center;background:rgba(243,199,107,.07);border:1px solid rgba(243,199,107,.14);border-radius:15px;padding:9px 6px}
.impact-wall .iw-pulse .kpi b{font-weight:900;font-size:22px;color:var(--iw-gold-hi);display:block}
.impact-wall .iw-pulse .kpi span{font-size:11px;color:var(--iw-soft)}

/* השבוע */
.impact-wall .iw-week .d{display:flex;align-items:center;gap:12px;padding:7.5px 0;border-bottom:1px solid rgba(243,199,107,.08)}
.impact-wall .iw-week .d:last-child{border-bottom:none}
.impact-wall .iw-week .hd{font-weight:700;font-size:15px;color:var(--iw-gold);min-width:64px;flex:none}
.impact-wall .iw-week b{font-size:14px;font-weight:600}
.impact-wall .iw-week .d>div span{display:block;font-size:11.5px;color:var(--iw-faint)}
.impact-wall .iw-week .fl{margin-inline-start:auto;font-size:16px}

/* טיקר */
.impact-wall .iw-ticker{margin:20px -48px 0;background:linear-gradient(90deg,transparent,rgba(243,199,107,.1) 12%,rgba(243,199,107,.1) 88%,transparent);border-top:1px solid rgba(243,199,107,.25);padding:13px 0;overflow:hidden;white-space:nowrap}
.impact-wall .iw-ticker .in{display:inline-block;animation:iw-roll 30s linear infinite;padding-inline-start:100%}
@keyframes iw-roll{to{transform:translateX(100%)}}
.impact-wall .iw-ticker b{color:var(--iw-gold-hi);font-weight:600}
.impact-wall .iw-ticker .sep{color:var(--iw-gold-deep);margin:0 18px}

/* מסכים צרים — הקיר נועד לטלוויזיה, אבל לא נשבר בחלון קטן */
@media (max-width:1100px){
  .impact-wall .iw-hero{grid-template-columns:1fr}
  .impact-wall .iw-row{grid-template-columns:1fr}
  .impact-wall .iw-wall{padding:24px 24px 0;min-height:0}
  .impact-wall .iw-ticker{margin-inline:-24px}
}

/* נגישות — בלי תנועה: הטיקר מוצג כרשימה סטטית */
@media (prefers-reduced-motion: reduce){
  .impact-wall .iw-ticker{white-space:normal}
  .impact-wall .iw-ticker .in{animation:none;padding-inline-start:0;display:block;padding:0 24px}
}
`;
