/**
 * טיימר כסף — שעון-עצר/טיימר לחיוב לפי זמן. תעריף לשעה × זמן שחלף = ₪ מצטבר
 * חי. תומך בשני מצבים (שעון-עצר סופר-מעלה / טיימר סופר-יורד מיעד), תקרת-זמן
 * ותקרת-סכום עם דיאלוג חריגה ("הסשן הסתיים — להמשיך או לגבות"), ו"גבה תשלום"
 * שרושם גבייה. עצמאי לחלוטין: ההיסטוריה נשמרת ב-localStorage ייעודי (מפתח
 * maor_timer_collections) — לא נוגע בסכמת ה-db ולא ברשומות הכספיות הקיימות.
 *
 * גייט: core.timer. שם המסך ניתן לתיוג-מחדש דרך nav.timer.
 */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { nsLsKey } from '../../store/persist';
import { featureOn, termOf } from '../../lib/config';
import { isoToday, isoLocal } from '../../lib/date-util';
import { Btn, Modal } from '../ui';

const LS_KEY = 'maor_timer_collections';

/** גבייה שנרשמה — עצמאית מסכמת ה-db. */
interface TimerCollection {
  id: string;
  at: string; // ISO
  seconds: number;
  rate: number; // ₪ לשעה
  amount: number; // ₪
  client: string;
}

function loadCollections(): TimerCollection[] {
  try {
    const raw = localStorage.getItem(nsLsKey(LS_KEY));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as TimerCollection[]) : [];
  } catch {
    return [];
  }
}

function saveCollections(list: TimerCollection[]): void {
  try {
    localStorage.setItem(nsLsKey(LS_KEY), JSON.stringify(list));
  } catch {
    /* localStorage חסום — ההיסטוריה תחזיק עד רענון */
  }
}

/** שניות → HH:MM:SS. */
function fmtDur(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (h > 0 ? pad(h) + ':' : '') + pad(m) + ':' + pad(ss);
}

/** ₪ מעוגל לאגורות. */
function money(n: number): string {
  return '₪' + (Math.round(n * 100) / 100).toLocaleString('he-IL');
}

type Mode = 'stopwatch' | 'timer';

export function MoneyTimer({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const rooms = useApp((s) => s.db.rooms);
  const label = termOf(config, 'nav.timer', 'טיימר כסף');

  // תעריף ברירת מחדל — מהחדר הראשון עם תעריף, אחרת 0.
  const defaultRate = rooms.find((r) => r.rate && r.rate > 0)?.rate ?? 0;

  const [mode, setMode] = useState<Mode>('stopwatch');
  const [rate, setRate] = useState(String(defaultRate || ''));
  // שם לקוח מוזן-מראש (מכרטיס הלקוח) — נקרא פעם אחת מ-sessionStorage.
  const [client, setClient] = useState(() => {
    try {
      const v = sessionStorage.getItem(nsLsKey('maor_timer_client'));
      if (v) {
        sessionStorage.removeItem(nsLsKey('maor_timer_client'));
        return v;
      }
    } catch {
      /* חסום */
    }
    return '';
  });
  const [timerMin, setTimerMin] = useState('30'); // יעד לטיימר (דק׳)
  const [timeCapMin, setTimeCapMin] = useState(''); // תקרת זמן (שעון-עצר)
  const [moneyCap, setMoneyCap] = useState(''); // תקרת סכום

  // מצב ריצה: accumSec = שניות שנצברו עד ההשהיה האחרונה; startTs = חותמת ההתחלה
  // של קטע הריצה הנוכחי (null = מושהה/עצור).
  const [accumSec, setAccumSec] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [capHit, setCapHit] = useState(false); // תקרה נפגעה — דיאלוג חריגה פתוח
  const [collections, setCollections] = useState<TimerCollection[]>(() => loadCollections());
  const nextId = useApp((s) => s.nextId);

  const running = startTs !== null;

  // טיק כל 250ms כשרץ — לעדכון חלק של הזמן והסכום.
  const tickRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    tickRef.current = id;
    return () => window.clearInterval(id);
  }, [running]);

  // שניות שחלפו בפועל (נצבר + הקטע הרץ הנוכחי).
  const elapsedSec = accumSec + (startTs !== null ? Math.max(0, (now - startTs) / 1000) : 0);
  const rateNum = Math.max(0, Number(rate) || 0);
  const timerTargetSec = Math.max(0, (Number(timerMin) || 0) * 60);
  // בטיימר — הזמן שנותר; בשעון-עצר — הזמן שחלף.
  const shownSec = mode === 'timer' ? Math.max(0, timerTargetSec - elapsedSec) : elapsedSec;
  // הכסף תמיד לפי הזמן שחלף בפועל × תעריף לשעה.
  const amount = rateNum * (elapsedSec / 3600);

  // תקרות — בדיקה בכל טיק. שעון-עצר: תקרת-זמן/סכום; טיימר: הגעה ל-0.
  useEffect(() => {
    if (!running || capHit) return;
    const timeCapSec = mode === 'stopwatch' ? (Number(timeCapMin) || 0) * 60 : 0;
    const moneyCapNum = Number(moneyCap) || 0;
    const timerDone = mode === 'timer' && elapsedSec >= timerTargetSec && timerTargetSec > 0;
    const timeCapDone = timeCapSec > 0 && elapsedSec >= timeCapSec;
    const moneyCapDone = moneyCapNum > 0 && amount >= moneyCapNum;
    if (timerDone || timeCapDone || moneyCapDone) {
      // עוצרים את הצבירה בנקודת התקרה ופותחים דיאלוג חריגה.
      setAccumSec(elapsedSec);
      setStartTs(null);
      setCapHit(true);
    }
  }, [running, capHit, mode, elapsedSec, amount, timeCapMin, moneyCap, timerTargetSec]);

  function start() {
    setStartTs(Date.now());
    setNow(Date.now());
  }
  function pause() {
    if (startTs === null) return;
    setAccumSec((a) => a + Math.max(0, (Date.now() - startTs) / 1000));
    setStartTs(null);
  }
  function resume() {
    setCapHit(false);
    start();
  }
  function reset() {
    setAccumSec(0);
    setStartTs(null);
    setCapHit(false);
  }

  function collect() {
    if (startTs !== null) pause();
    const secs = accumSec + (startTs !== null ? Math.max(0, (Date.now() - startTs) / 1000) : 0);
    const amt = Math.round(rateNum * (secs / 3600) * 100) / 100;
    if (amt <= 0) {
      toast('אין עדיין סכום לגבייה — התחילו את הטיימר');
      return;
    }
    const rec: TimerCollection = {
      id: nextId('tc'),
      at: new Date().toISOString(),
      seconds: Math.round(secs),
      rate: rateNum,
      amount: amt,
      client: client.trim(),
    };
    const next = [rec, ...collections].slice(0, 100);
    setCollections(next);
    saveCollections(next);
    toast('נגבה ' + money(amt) + (rec.client ? ' · ' + rec.client : ''));
    reset();
    setClient('');
    // אם הקופה הרושמת פעילה — ממשיכים אליה עם הסכום מוכן (עודף + חשבונית).
    if (featureOn(config, 'core.cashbox')) {
      try {
        sessionStorage.setItem(nsLsKey('maor_cashbox_amount'), String(amt));
      } catch {
        /* חסום */
      }
      onClose();
      window.location.hash = '#cashbox';
    }
  }

  // ציד-באגים 3.8.2026 (🟡): "גבייה היום" חושבה לפי חצות-UTC (toISOString) ולא לפי
  // היום המקומי ⇒ בחלון-הלילה (חצות מקומי עד ~02:00) הסכום שויך ליום הלא-נכון.
  // isoToday/isoLocal = תאריך מקומי עקבי (מ-date-util, כמו שאר המערכת).
  const todayIso = isoToday();
  const todayTotal = collections
    .filter((c) => isoLocal(new Date(c.at)) === todayIso)
    .reduce((a, c) => a + c.amount, 0);

  const bigMoney = money(amount);

  return (
    <Modal title={'⏱️ ' + label} onClose={onClose}>
      {/* מתג מצב */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <Btn kind={mode === 'stopwatch' ? 'primary' : 'plain'} sm onClick={() => !running && setMode('stopwatch')}>
          שעון עצר
        </Btn>
        <Btn kind={mode === 'timer' ? 'primary' : 'plain'} sm onClick={() => !running && setMode('timer')}>
          טיימר
        </Btn>
        {running && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', alignSelf: 'center' }}>עצרו כדי להחליף מצב</span>}
      </div>

      {/* תצוגה ראשית — ₪ גדול + זמן */}
      <div
        style={{
          textAlign: 'center',
          padding: '18px 12px',
          borderRadius: 14,
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: 'var(--accent-deep, var(--accent))', direction: 'ltr' }}>
          {bigMoney}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>
          {fmtDur(shownSec)}
          {mode === 'timer' && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}> נותרו</span>}
        </div>
        {rateNum > 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
            {money(rateNum)} לשעה · {fmtDur(elapsedSec)} בפועל
          </div>
        )}
      </div>

      {/* דיאלוג חריגה — התקרה נפגעה */}
      {capHit && (
        <div
          style={{
            background: '#fdeaea',
            color: '#b91c1c',
            border: '1px solid #f5c9c9',
            borderRadius: 10,
            padding: '10px 12px',
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>הסשן הסתיים — להמשיך לספור או לגבות תשלום?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn sm onClick={resume}>▶ ממשיכים · חריגה</Btn>
            <Btn kind="primary" sm onClick={collect}>גבה תשלום</Btn>
          </div>
        </div>
      )}

      {/* פקדים */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {!running && accumSec === 0 && !capHit && (
          <Btn kind="primary" onClick={start}>התחל</Btn>
        )}
        {running && <Btn onClick={pause}>השהה</Btn>}
        {!running && accumSec > 0 && !capHit && <Btn kind="primary" onClick={resume}>המשך ▶</Btn>}
        {(running || accumSec > 0) && (
          <Btn kind="primary" onClick={collect}>גבה תשלום</Btn>
        )}
        {(accumSec > 0 || running) && <Btn onClick={reset}>אפס</Btn>}
      </div>

      {/* הגדרות — תעריף, לקוח, יעד/תקרות */}
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          תעריף לשעה (₪)
          <input type="number" dir="ltr" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" style={{ width: '100%', marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          {termOf(config, 'entity.family', 'לקוח')} (לא חובה)
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="שם" style={{ width: '100%', marginTop: 4 }} />
        </label>
        {mode === 'timer' ? (
          <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            יעד זמן (דק׳)
            <input type="number" dir="ltr" value={timerMin} onChange={(e) => setTimerMin(e.target.value)} placeholder="30" style={{ width: '100%', marginTop: 4 }} />
          </label>
        ) : (
          <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            עצירה אחרי (דק׳) — לא חובה
            <input type="number" dir="ltr" value={timeCapMin} onChange={(e) => setTimeCapMin(e.target.value)} placeholder="—" style={{ width: '100%', marginTop: 4 }} />
          </label>
        )}
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          עצירה ב־ (₪) — לא חובה
          <input type="number" dir="ltr" value={moneyCap} onChange={(e) => setMoneyCap(e.target.value)} placeholder="—" style={{ width: '100%', marginTop: 4 }} />
        </label>
      </div>

      {/* גביות היום */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>גביות היום</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-deep, var(--accent))' }}>{money(todayTotal)}</span>
        </div>
        {collections.filter((c) => c.at.slice(0, 10) === todayIso).length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>עדיין לא נגבו תשלומים היום</div>
        ) : (
          <div style={{ maxHeight: 140, overflowY: 'auto' }}>
            {collections
              .filter((c) => c.at.slice(0, 10) === todayIso)
              .map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '4px 0', borderBottom: '1px solid var(--line-soft, var(--line))', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--ink-faint)', direction: 'ltr' }}>{c.at.slice(11, 16)}</span>
                  <span style={{ flex: 1 }}>{c.client || '—'}</span>
                  <span style={{ color: 'var(--ink-faint)', direction: 'ltr' }}>{fmtDur(c.seconds)}</span>
                  <span style={{ fontWeight: 700, direction: 'ltr' }}>{money(c.amount)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
