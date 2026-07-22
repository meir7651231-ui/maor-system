/**
 * 🎡 גלגל החוגים — "מצא חוג" מפלצתי: אוברליי מסך-מלא עם גלגל SVG שקטעיו הם
 * החוגים המסוננים, נעילות (מגדר/גיל/יום/קטגוריה), סיבוב rAF עם האטת ease-out,
 * קונפטי זהב וכרטיס תוצאה. הכל דרך משתני ערכת הנושא — נראה טוב בכל ערכה.
 *
 * מכניקה: בוחרים מנצח אקראי מראש (crypto.getRandomValues), מחשבים זווית יעד
 * כך שהקטע ינחת מתחת למחוג העליון (+5–8 סיבובים מלאים + jitter בתוך הקטע),
 * ומאיצים/מאטים לשם ב-requestAnimationFrame לאורך ~4.2 שניות.
 * prefers-reduced-motion או data-noanim: בלי סיבוב — בחירה מיידית עם fade.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Course } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { DAY_LETTERS, DAY_NAMES, enrollCount, sessionsOf } from '../courses/lib';

const CX = 200;
const CY = 200;
const R = 178; // רדיוס הקטעים
const RIM = 190; // רדיוס פס הזהב

interface Locks {
  gender: 'all' | 'm' | 'f';
  age: string; // 'all' או מפתח מ-AGE_BANDS
  day: number; // -1 = הכל, אחרת 0..5
  cat: string; // 'all' או קטגוריה
}

const AGE_BANDS: { key: string; label: string; lo: number; hi: number }[] = [
  { key: '3-6', label: '3–6', lo: 3, hi: 6 },
  { key: '7-10', label: '7–10', lo: 7, hi: 10 },
  { key: '11-14', label: '11–14', lo: 11, hi: 14 },
  { key: '15+', label: '15+', lo: 15, hi: 120 },
];

interface Piece {
  id: number;
  dx: number;
  dy: number;
  rz: number;
  delay: number;
  dur: number;
  shade: number;
  w: number;
  h: number;
}

/** אקראיות "אמיתית" יותר מ-crypto, עם נפילה ל-Math.random בסביבה בלעדיו. */
function rand01(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const u = new Uint32Array(1);
    crypto.getRandomValues(u);
    return u[0] / 2 ** 32;
  }
  return Math.random();
}

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** נתיב "פרוסת עוגה" ממרכז הגלגל בין שתי זוויות (מעלות, 0=ימין, עם כיוון השעון). */
function arcPath(a0: number, a1: number): string {
  const x0 = CX + R * Math.cos(rad(a0));
  const y0 = CY + R * Math.sin(rad(a0));
  const x1 = CX + R * Math.cos(rad(a1));
  const y1 = CY + R * Math.sin(rad(a1));
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function trunc(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

/** ביטול תנועה — העדפת מערכת ההפעלה או מתג הנגישות של האפליקציה. */
function reducedMotion(): boolean {
  if (document.documentElement.hasAttribute('data-noanim')) return true;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** גוון הקטע — 4 גוונים מתחלפים, עם תיקון כשהאחרון היה נופל על גוון הראשון. */
function shadeOf(i: number, n: number): number {
  if (i === n - 1 && n > 1 && n % 4 === 1) return 1;
  return i % 4;
}

export function CourseWheel(props: { onClose: () => void }) {
  const { onClose } = props;
  const db = useApp((s) => s.db);
  const selectCourse = useApp((s) => s.selectCourse);

  const [locks, setLocks] = useState<Locks>({ gender: 'all', age: 'all', day: -1, cat: 'all' });
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Course | null>(null);
  const [confetti, setConfetti] = useState<Piece[]>([]);

  const rotRef = useRef(0);
  const rafRef = useRef(0);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Escape סוגר
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // נעילת גלילת הרקע כל עוד האוברליי פתוח + ניקוי אנימציות ביציאה
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(rafRef.current);
      clearTimeout(confettiTimer.current);
    };
  }, []);

  const cats = useMemo(() => [...new Set(db.courses.map((c) => c.cat || 'העשרה'))], [db.courses]);

  /** החוגים שבגלגל — נבנים מחדש בכל שינוי נעילה. */
  const courses = useMemo(() => {
    const band = AGE_BANDS.find((b) => b.key === locks.age);
    return db.courses.filter((c) => {
      if (locks.gender !== 'all' && (c.gender || 'all') !== 'all' && c.gender !== locks.gender) return false;
      if (band) {
        const lo = c.ageMin || 0;
        const hi = c.ageMax || 120;
        if (hi < band.lo || lo > band.hi) return false;
      }
      if (locks.day >= 0 && !sessionsOf(c).some((s) => s.day === locks.day)) return false;
      if (locks.cat !== 'all' && (c.cat || 'העשרה') !== locks.cat) return false;
      return true;
    });
  }, [db.courses, locks]);

  // מנצח שנפל מהסינון — מתבטל
  useEffect(() => {
    if (winner && !courses.some((c) => c.id === winner.id)) setWinner(null);
  }, [courses, winner]);

  function setLock<K extends keyof Locks>(k: K, v: Locks[K]) {
    if (spinning) return;
    setWinner(null);
    setConfetti([]);
    setLocks((l) => ({ ...l, [k]: v }));
  }

  /** התפרצות קונפטי זהב — 36 חלקיקים, מתנקים אחרי 2.5 שניות. */
  function burst() {
    if (reducedMotion()) return;
    const pieces: Piece[] = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      dx: (rand01() * 2 - 1) * (110 + rand01() * 170),
      dy: -(50 + rand01() * 230),
      rz: (rand01() * 2 - 1) * 560,
      delay: rand01() * 0.22,
      dur: 1.1 + rand01() * 1.1,
      shade: i % 4,
      w: 6 + Math.round(rand01() * 6),
      h: 8 + Math.round(rand01() * 8),
    }));
    setConfetti(pieces);
    clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setConfetti([]), 2500);
  }

  function spin() {
    const list = courses;
    if (spinning || list.length < 2) return;
    setWinner(null);
    setConfetti([]);

    const n = list.length;
    const step = 360 / n;
    const idx = Math.floor(rand01() * n);
    // נחיתה בתוך הקטע (לא על גבול) — jitter של 12%–88% מרוחב הקטע
    const jitter = (0.12 + 0.76 * rand01()) * step;
    const targetMod = ((360 - (idx * step + jitter)) % 360 + 360) % 360;

    if (reducedMotion()) {
      rotRef.current = targetMod;
      setRot(targetMod);
      setWinner(list[idx]);
      return;
    }

    const from = rotRef.current;
    const turns = 5 + Math.floor(rand01() * 4); // 5–8 סיבובים מלאים
    const target = Math.ceil(from / 360) * 360 + turns * 360 + targetMod;
    const delta = target - from;
    const dur = 4200;
    const t0 = performance.now();
    setSpinning(true);

    // האצה קצרה (ריבועית) ואז האטת ease-out קובית ארוכה
    const ease = (t: number) =>
      t < 0.28 ? (t / 0.28) * (t / 0.28) * 0.12 : 0.12 + 0.88 * (1 - Math.pow(1 - (t - 0.28) / 0.72, 3));

    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const r = from + delta * ease(p);
      rotRef.current = r;
      setRot(r);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setSpinning(false);
        setWinner(list[idx]);
        burst();
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }

  const teacherName = (id: string) => db.teachers.find((t) => t.id === id)?.name ?? '—';

  function spotsLabel(c: Course): string {
    const max = c.maxStudents || 0;
    if (!max) return 'מקום פנוי 🟢';
    const left = Math.max(0, max - enrollCount(db, c.id));
    if (left === 0) return 'החוג מלא — כדאי לבדוק רשימת המתנה';
    return `נותרו ${left} מקומות`;
  }

  function priceLabel(c: Course): string {
    const p = '₪' + (c.price || 0);
    return c.model === 'punch' ? `${p} · כרטיסייה ${c.size} ניקובים` : `${p} לחודש`;
  }

  const n = courses.length;
  const step = n > 0 ? 360 / n : 360;
  const only = n === 1 ? courses[0] : null;
  const shown = winner ?? only;
  const fontSize = n <= 6 ? 15 : n <= 10 ? 13 : n <= 16 ? 11.5 : n <= 24 ? 10 : 8.5;
  const maxChars = n <= 8 ? 16 : n <= 16 ? 12 : 9;

  const chip = (on: boolean, label: string, pick: () => void, key?: string) => (
    <button
      key={key ?? label}
      type="button"
      className={'wheel-chip' + (on ? ' on' : '')}
      aria-pressed={on}
      disabled={spinning}
      onClick={pick}
    >
      {label}
    </button>
  );

  return (
    <div
      className="wheel-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="גלגל החוגים"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="wheel-shell">
        <header className="wheel-head">
          <h2 className="wheel-title">🎡 גלגל החוגים</h2>
          <p className="wheel-sub">נעלו מה שחשוב לכם — והגלגל יבחר את השאר</p>
          <button type="button" className="wheel-close" onClick={onClose} aria-label="סגירת הגלגל">
            ✕
          </button>
        </header>

        <div className="wheel-locks" aria-label="נעילות סינון">
          <div className="wheel-lock-row">
            <span className="wheel-lock-label">מגדר</span>
            <div className="wheel-lock-chips">
              {chip(locks.gender === 'all', 'הכל', () => setLock('gender', 'all'), 'g-all')}
              {chip(locks.gender === 'm', 'בנים', () => setLock('gender', 'm'), 'g-m')}
              {chip(locks.gender === 'f', 'בנות', () => setLock('gender', 'f'), 'g-f')}
            </div>
          </div>
          <div className="wheel-lock-row">
            <span className="wheel-lock-label">גיל</span>
            <div className="wheel-lock-chips">
              {chip(locks.age === 'all', 'הכל', () => setLock('age', 'all'), 'a-all')}
              {AGE_BANDS.map((b) => chip(locks.age === b.key, b.label, () => setLock('age', b.key), 'a-' + b.key))}
            </div>
          </div>
          <div className="wheel-lock-row">
            <span className="wheel-lock-label">יום</span>
            <div className="wheel-lock-chips">
              {chip(locks.day === -1, 'הכל', () => setLock('day', -1), 'd-all')}
              {DAY_LETTERS.map((l, i) => chip(locks.day === i, l, () => setLock('day', i), 'd-' + i))}
            </div>
          </div>
          {cats.length > 1 && (
            <div className="wheel-lock-row">
              <span className="wheel-lock-label">קטגוריה</span>
              <div className="wheel-lock-chips">
                {chip(locks.cat === 'all', 'הכל', () => setLock('cat', 'all'), 'c-all')}
                {cats.map((c) => chip(locks.cat === c, c, () => setLock('cat', c), 'c-' + c))}
              </div>
            </div>
          )}
        </div>

        <div className="wheel-stage">
          <svg className="wheel-svg" viewBox="0 0 400 400" role="img" aria-label={n + ' חוגים בגלגל'}>
            <g transform={`rotate(${rot} ${CX} ${CY})`}>
              <circle className="wheel-base" cx={CX} cy={CY} r={R} />
              {n === 1 && courses[0] && (
                <g>
                  <circle className={'wheel-seg shade-0' + (shown ? ' win' : '')} cx={CX} cy={CY} r={R} />
                  <text className="wheel-seg-text" x={CX} y={CY - 90} textAnchor="middle" fontSize={17}>
                    {trunc(courses[0].name, 18)}
                  </text>
                </g>
              )}
              {n >= 2 &&
                courses.map((c, i) => {
                  const a0 = -90 + i * step;
                  const mid = a0 + step / 2;
                  const isWin = winner?.id === c.id && !spinning;
                  return (
                    <g key={c.id}>
                      <path className={`wheel-seg shade-${shadeOf(i, n)}${isWin ? ' win' : ''}`} d={arcPath(a0, a0 + step)} />
                      <text
                        className="wheel-seg-text"
                        transform={`rotate(${mid} ${CX} ${CY})`}
                        x={CX + 116}
                        y={CY + fontSize * 0.35}
                        textAnchor="middle"
                        fontSize={fontSize}
                      >
                        {trunc(c.name, maxChars)}
                      </text>
                    </g>
                  );
                })}
              <circle className="wheel-rim-inner" cx={CX} cy={CY} r={R + 3} />
              <circle className="wheel-rim" cx={CX} cy={CY} r={RIM} />
              {n >= 2 &&
                n <= 24 &&
                courses.map((c, i) => {
                  const a = rad(-90 + i * step);
                  return (
                    <circle
                      key={'b-' + c.id}
                      className={'wheel-bulb' + (i % 2 ? ' alt' : '')}
                      cx={CX + RIM * Math.cos(a)}
                      cy={CY + RIM * Math.sin(a)}
                      r={4.5}
                    />
                  );
                })}
            </g>
            <polygon className="wheel-pointer" points="183,4 217,4 200,44" />
            <circle className="wheel-hub" cx={CX} cy={CY} r={52} />
            <text className="wheel-hub-emoji" x={CX} y={CY + 15} textAnchor="middle" fontSize={42}>
              🎡
            </text>
          </svg>

          {confetti.length > 0 && (
            <div className="wheel-confetti" aria-hidden>
              {confetti.map((p) => (
                <span
                  key={p.id}
                  className={'shade-' + p.shade}
                  style={
                    {
                      '--dx': p.dx + 'px',
                      '--dy': p.dy + 'px',
                      '--rz': p.rz + 'deg',
                      width: p.w,
                      height: p.h,
                      animationDelay: p.delay + 's',
                      animationDuration: p.dur + 's',
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="wheel-count" aria-live="polite">
          {n === 0 ? 'אין חוגים בגלגל' : n === 1 ? 'חוג אחד בגלגל' : n + ' חוגים בגלגל'}
        </div>

        {n === 0 && <div className="wheel-empty">אין חוגים בסינון הזה — שחררו נעילה 🔓</div>}

        {n >= 2 && (
          <button type="button" className="wheel-spin-btn" onClick={spin} disabled={spinning}>
            {spinning ? 'מסתובב… 🎡' : 'סובב! 🎲'}
          </button>
        )}

        {shown && !spinning && (
          <div className="wheel-result" role="status">
            <div className="wheel-result-tag">{winner ? '🎉 הגלגל בחר:' : 'זה הגורל! 😄'}</div>
            <div className="wheel-result-name">{shown.name}</div>
            <div className="wheel-result-meta">
              {'🧑‍🏫 ' + teacherName(shown.teacherId) + ' · 📅 יום ' + DAY_NAMES[shown.weekday] + (shown.time ? ' ' + shown.time : '') + ' · ' + priceLabel(shown)}
            </div>
            <div className="wheel-result-spots">{spotsLabel(shown)}</div>
            <div className="wheel-result-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  selectCourse(shown.id);
                  onClose();
                }}
              >
                לכרטיס החוג ←
              </button>
              {n >= 2 && (
                <button type="button" className="btn" onClick={spin}>
                  סובב שוב 🎲
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
