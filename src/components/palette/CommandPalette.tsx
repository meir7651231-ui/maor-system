/**
 * פלטת פקודות (Ctrl+K) — חיפוש מהיר בכל המערכת:
 * מסכים, משפחות, בני משפחה, חוגים, מורים, תורמים, אירועים, מסמכים ופעולות.
 * בנוסף: חיפוש שיבוץ לפי מזהה (e123), רשימת "כרטיסיות מסתיימות" עם ניקוב
 * ישיר כשאין שאילתה, והצעות "אולי התכוונת" כשאין תוצאות.
 *
 * App מרנדר את הרכיב רק כאשר paletteOpen=true; סגירה דרך setPalette(false).
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { allMembers, useApp, type View } from '../../store/useApp';
import { featureOn, moduleOn } from '../../lib/config';
import { levenshtein, smartFilter } from '../../lib/search';
import { normSearch } from '../../lib/validate';

/** פריט בר-הפעלה בפלטה: אייקון + כותרת + שורת משנה + פעולה. */
interface Cmd {
  key: string;
  icon: string;
  title: string;
  sub: string;
  /** מונחי חיפוש מנורמלים (normSearch) — מחרוזות שלמות + מילים בודדות. */
  terms: string[];
  run: () => void;
  /** כותרת קבוצה — מוצגת מעל הפריט הזה (הראשון בקבוצה). */
  section?: string;
  /** כפתור פעולה משני בתוך השורה (עכבר בלבד; Enter מפעיל את run). */
  inline?: { label: string; run: () => void };
}

/** פקודות ניווט — זהות לתפריט הראשי ב-App (משוכפל כאן כי NAV אינו מיוצא). */
const NAV_CMDS: { view: View; icon: string; label: string }[] = [
  { view: 'home', icon: '🏠', label: 'בית' },
  { view: 'families', icon: '👨‍👩‍👧‍👦', label: 'משפחות' },
  { view: 'courses', icon: '🎨', label: 'חוגים' },
  { view: 'calendar', icon: '📅', label: 'לוח שנה' },
  { view: 'diary', icon: '📖', label: 'יומן חדרים' },
  { view: 'supporters', icon: '💛', label: 'תורמים' },
  { view: 'reports', icon: '📊', label: 'דוחות' },
  { view: 'settings', icon: '⚙️', label: 'הגדרות' },
];

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

const MAX_RESULTS = 12;

/** תאריך ISO ‏(YYYY-MM-DD) → תצוגה DD/MM/YYYY. */
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** בונה מונחי חיפוש מנורמלים ממחרוזות גולמיות — המחרוזת השלמה וגם כל מילה. */
function toTerms(raw: (string | undefined)[]): string[] {
  const out = new Set<string>();
  for (const r of raw) {
    if (!r) continue;
    const whole = normSearch(r);
    if (whole) out.add(whole);
    for (const word of r.split(/\s+/)) {
      const n = normSearch(word);
      if (n) out.add(n);
    }
  }
  return [...out];
}

/** ספרות בלבד — לחיפוש טלפונים בלי מקפים/רווחים. */
function digits(s: string): string {
  return s.replace(/\D/g, '');
}

export function CommandPalette() {
  const db = useApp((s) => s.db);
  const go = useApp((s) => s.go);
  const selectFamily = useApp((s) => s.selectFamily);
  const selectCourse = useApp((s) => s.selectCourse);
  const setPalette = useApp((s) => s.setPalette);
  const exportBackup = useApp((s) => s.exportBackup);
  const punch = useApp((s) => s.punch);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);

  // גייטים למודולים ופיצ'רים — פריט של מודול/פיצ'ר כבוי לא מאונדקס בפלטה.
  // featureOn מחזיר false גם כשמודול האב כבוי, לכן אין צורך בבדיקה כפולה.
  const coursesOn = moduleOn(config, 'courses');
  const wheelOn = featureOn(config, 'courses.wheel');
  const punchOn = featureOn(config, 'courses.punch');
  const supportersOn = moduleOn(config, 'supporters');
  const calendarOn = moduleOn(config, 'calendar');
  const teachersOn = featureOn(config, 'settings.teachers');
  const famDocsOn = featureOn(config, 'families.docs');
  const wallOn = featureOn(config, 'home.impactwall');

  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  /** ניווט + פעולות — מוצגים גם כשאין שאילתה. */
  const baseCmds = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = NAV_CMDS.map((n) => ({
      key: 'nav-' + n.view,
      icon: n.icon,
      title: n.label,
      sub: 'מעבר למסך',
      terms: toTerms([n.label, 'מסך', 'ניווט', 'מעבר']),
      run: () => {
        go(n.view);
        setPalette(false);
      },
    }));
    const actions: Cmd[] = [
      {
        key: 'act-new-family',
        icon: '➕',
        title: 'משפחה חדשה',
        sub: 'מעבר למסך המשפחות לרישום',
        terms: toTerms(['משפחה חדשה', 'הוספה', 'רישום', 'קליטה']),
        run: () => {
          selectFamily(null);
          setPalette(false);
        },
      },
      {
        key: 'act-backup',
        icon: '⬇️',
        title: 'הורדת גיבוי מלא',
        sub: 'קובץ גיבוי JSON יורד למחשב',
        terms: toTerms(['הורדת גיבוי מלא', 'גיבוי', 'ייצוא', 'שמירה', 'backup']),
        run: () => {
          exportBackup();
          setPalette(false);
        },
      },
    ];
    // גלגל החוגים — דורש מודול חוגים + פיצ'ר courses.wheel
    if (wheelOn) {
      actions.push({
        key: 'act-wheel',
        icon: '🎡',
        title: 'גלגל החוגים',
        sub: 'סיבוב מזל שבוחר חוג',
        terms: toTerms(['גלגל החוגים', 'גלגל', 'מזל', 'הגרלה', 'מצא חוג', 'wheel']),
        run: () => {
          try {
            sessionStorage.setItem('maor_open_wheel', '1');
          } catch {
            /* sessionStorage חסום */
          }
          go('courses');
          // אם מסך החוגים כבר פתוח — הדגל לא ייקרא ב-mount; האירוע משלים
          window.dispatchEvent(new Event('maor:open-wheel'));
          setPalette(false);
        },
      });
    }
    // קיר ההשפעה — מצב ראווה במסך מלא (feature: home.impactwall)
    if (wallOn) {
      actions.push({
        key: 'act-wall',
        icon: '🖥️',
        title: 'קיר ההשפעה',
        sub: 'מצב ראווה — שידור חי למסך גדול',
        terms: toTerms(['קיר ההשפעה', 'קיר', 'מצב ראווה', 'שידור חי', 'תצוגה', 'מסך גדול', 'wall']),
        run: () => {
          window.location.hash = '#wall';
          setPalette(false);
        },
      });
    }
    return [...nav, ...actions];
  }, [go, selectFamily, exportBackup, setPalette, wheelOn, wallOn]);

  /** כרטיסיות מסתיימות — שיבוצי כרטיסייה פעילים עם ≤2 ניקובים שנותרו. */
  const expiringCmds = useMemo<Cmd[]>(() => {
    // דורש מודול חוגים + פיצ'ר courses.punch
    if (!punchOn) return [];
    const members = allMembers(db);
    const out: Cmd[] = [];
    for (const e of db.enrollments) {
      if (e.plan !== 'punch' || e.status !== 'active') continue;
      const left = e.purchased - e.used;
      if (left > 2 || left < 0) continue;
      const m = members.find((x) => x.id === e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      if (!m || !c) continue;
      out.push({
        key: 'punch-' + e.id,
        icon: '🎟️',
        title: `${m.first} · ${c.name} · נותרו ${left}`,
        sub: left === 0 ? 'הכרטיסייה נגמרה' : 'Enter — מעבר לחוג',
        terms: [],
        run: () => {
          selectCourse(c.id);
          setPalette(false);
        },
        inline:
          left > 0
            ? {
                label: 'נקב ✓',
                run: () => {
                  punch(e.id);
                  toast(`ניקוב נרשם ל${m.first} ✓ — נותרו ${left - 1}`);
                },
              }
            : undefined,
      });
      if (out.length >= 5) break;
    }
    return out;
  }, [db, punch, toast, selectCourse, setPalette, punchOn]);

  /** ישויות מהנתונים — משפחות, בני משפחה, חוגים, מורים, תורמים, מסמכים ואירועים פתוחים. */
  const entityCmds = useMemo<Cmd[]>(() => {
    const out: Cmd[] = [];
    for (const f of db.families) {
      out.push({
        key: 'fam-' + f.id,
        icon: '👨‍👩‍👧‍👦',
        title: 'משפחת ' + f.name,
        sub: [f.city, f.phone].filter(Boolean).join(' · '),
        terms: toTerms([
          f.name,
          'משפחת ' + f.name,
          f.father,
          f.mother,
          f.city,
          f.community,
          digits(f.phone),
          digits(f.phone2),
        ]),
        run: () => {
          selectFamily(f.id);
          setPalette(false);
        },
      });
    }
    for (const m of allMembers(db)) {
      out.push({
        key: 'mem-' + m.famId + '-' + m.id,
        icon: m.isParent ? '🧑' : m.gender === 'f' ? '👧' : '👦',
        title: (m.first + ' ' + m.famName).trim(),
        sub: ['משפחת ' + m.famName, m.phone].filter(Boolean).join(' · '),
        terms: toTerms([m.first, m.famName, m.school, m.grade, digits(m.phone), m.idNum]),
        run: () => {
          selectFamily(m.famId);
          setPalette(false);
        },
      });
    }
    for (const c of coursesOn ? db.courses : []) {
      const teacher = db.teachers.find((t) => t.id === c.teacherId);
      out.push({
        key: 'crs-' + c.id,
        icon: '🎨',
        title: c.name,
        sub: ['יום ' + (DAY_NAMES[c.weekday] ?? ''), c.time, teacher?.name].filter(Boolean).join(' · '),
        terms: toTerms([c.name, c.cat, c.semester, c.audience, teacher?.name, 'חוג', 'קורס']),
        run: () => {
          selectCourse(c.id);
          setPalette(false);
        },
      });
    }
    for (const t of teachersOn ? db.teachers : []) {
      out.push({
        key: 'tch-' + t.id,
        icon: '🧑‍🏫',
        title: t.name,
        sub: [t.specialty, t.phone].filter(Boolean).join(' · '),
        terms: toTerms([
          t.name,
          t.specialty,
          t.email,
          digits(t.phone),
          digits(t.phone2),
          t.idNum,
          'מורה',
          'מדריך',
          'צוות',
        ]),
        run: () => {
          go('settings');
          setPalette(false);
        },
      });
    }
    for (const sp of supportersOn ? db.supporters : []) {
      out.push({
        key: 'sup-' + sp.id,
        icon: '💛',
        title: sp.name,
        sub: [sp.cat, sp.phone].filter(Boolean).join(' · '),
        terms: toTerms([sp.name, sp.cat, sp.forWho, sp.email, digits(sp.phone), sp.idNum, 'תורם', 'תרומה', 'תומכת']),
        run: () => {
          go('supporters');
          setPalette(false);
        },
      });
    }
    for (const f of famDocsOn ? db.families : []) {
      for (const doc of f.docs) {
        out.push({
          key: 'doc-' + f.id + '-' + doc.id,
          icon: '📄',
          title: doc.name,
          sub: ['משפחת ' + f.name, fmtDate(doc.addedAt)].filter(Boolean).join(' · '),
          terms: toTerms([doc.name, f.name, 'משפחת ' + f.name, 'מסמך', 'קובץ']),
          run: () => {
            selectFamily(f.id);
            setPalette(false);
          },
        });
      }
    }
    for (const ev of calendarOn ? db.events : []) {
      if (ev.done) continue;
      out.push({
        key: 'ev-' + ev.id,
        icon: '📅',
        title: ev.title,
        sub: [fmtDate(ev.date), ev.time].filter(Boolean).join(' · '),
        terms: toTerms([ev.title, ev.customType, 'אירוע', 'תזכורת', 'לוח']),
        run: () => {
          go('calendar');
          setPalette(false);
        },
      });
    }
    return out;
  }, [db, go, selectFamily, selectCourse, setPalette, coursesOn, teachersOn, supportersOn, famDocsOn, calendarOn]);

  /** דירוג חכם (smartFilter) על מונחי החיפוש המנורמלים. עד 12 תוצאות.
   * שאילתה ריקה: ניווט + פעולות ואחריהם "כרטיסיות מסתיימות".
   * מזהה שיבוץ (e123): קפיצה ישירה לחוג של השיבוץ, לפני שאר התוצאות. */
  const results = useMemo<Cmd[]>(() => {
    const nq = normSearch(q);
    if (!nq) {
      const exp = expiringCmds.map((c, i) => (i === 0 ? { ...c, section: 'כרטיסיות מסתיימות' } : c));
      return [...baseCmds, ...exp];
    }
    const pre: Cmd[] = [];
    const t = q.trim().toLowerCase();
    // חיפוש שיבוץ לפי מזהה — רק כשמודול החוגים פעיל
    if (coursesOn && /^e\d+$/.test(t)) {
      const e = db.enrollments.find((x) => x.id.toLowerCase() === t);
      const c = e && db.courses.find((x) => x.id === e.courseId);
      if (e && c) {
        const m = allMembers(db).find((x) => x.id === e.memberId);
        pre.push({
          key: 'enr-' + e.id,
          icon: '🎫',
          title: 'שיבוץ ' + e.id + (m ? ' — ' + m.first : ''),
          sub: c.name + ' · מעבר לכרטיס החוג',
          terms: [],
          run: () => {
            selectCourse(c.id);
            setPalette(false);
          },
        });
      }
    }
    return [...pre, ...smartFilter(nq, [...baseCmds, ...entityCmds], (c) => c.terms, MAX_RESULTS)].slice(
      0,
      MAX_RESULTS,
    );
  }, [q, baseCmds, entityCmds, expiringCmds, db, selectCourse, setPalette, coursesOn]);

  /** "אולי התכוונת" — שאילתה ≥3 תווים בלי תוצאות: עד 3 מילים קרובות
   * (levenshtein ≤ 2) מתוך כותרות כל הפריטים המאונדקסים. */
  const suggestions = useMemo<string[]>(() => {
    const nq = normSearch(q);
    if (nq.length < 3 || results.length > 0) return [];
    const scored: { w: string; d: number }[] = [];
    const seen = new Set<string>();
    for (const c of [...baseCmds, ...entityCmds]) {
      for (const w of c.title.split(/\s+/)) {
        if (w.length < 2) continue;
        const nw = normSearch(w);
        if (!nw || nw === nq || seen.has(nw)) continue;
        const d = levenshtein(nq, nw);
        if (d <= 2) {
          seen.add(nw);
          scored.push({ w, d });
        }
      }
    }
    scored.sort((a, b) => a.d - b.d);
    return scored.slice(0, 3).map((x) => x.w);
  }, [q, results, baseCmds, entityCmds]);

  // איפוס הבחירה כשהשאילתה משתנה, והצמדה לטווח כשהתוצאות מתקצרות.
  useEffect(() => {
    setSel(0);
  }, [q]);
  useEffect(() => {
    setSel((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results]);

  // מקלדת: חצים לניווט, Enter להפעלה, Escape לסגירה.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPalette(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const r = results[sel];
        if (r) {
          e.preventDefault();
          r.run();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, sel, setPalette]);

  // גלילת הפריט הנבחר לתוך שדה הראייה.
  useEffect(() => {
    listRef.current?.querySelector('button.sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel, results]);

  return (
    <div
      className="palette-back"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && setPalette(false)}
    >
      <div className="palette" role="dialog" aria-label="חיפוש מהיר">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש: מסך, משפחה, שם, חוג, מורה, תורם, מסמך או פעולה…"
          aria-label="חיפוש מהיר בכל המערכת"
        />
        <div className="results" ref={listRef} role="listbox" aria-label="תוצאות חיפוש">
          {results.map((c, i) => {
            const inline = c.inline;
            return (
              <Fragment key={c.key}>
                {c.section && (
                  <div
                    style={{
                      padding: '10px 16px 4px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--ink-faint)',
                      borderTop: '1px solid var(--line-soft)',
                    }}
                  >
                    {c.section}
                  </div>
                )}
                <button
                  type="button"
                  className={i === sel ? 'sel' : ''}
                  role="option"
                  aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={c.run}
                >
                  <span aria-hidden>{c.icon}</span>
                  <span style={{ fontWeight: 600 }}>{c.title}</span>
                  <span style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {c.sub && <span style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>{c.sub}</span>}
                    {inline && (
                      <span
                        role="button"
                        tabIndex={-1}
                        className="chip"
                        title={inline.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          inline.run();
                        }}
                      >
                        {inline.label}
                      </span>
                    )}
                  </span>
                </button>
              </Fragment>
            );
          })}
          {results.length === 0 && (
            <div className="empty" style={{ padding: '24px 16px' }}>
              <div>לא נמצאו תוצאות עבור "{q}"</div>
              {suggestions.length > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 13 }}>אולי התכוונת:</span>
                  {suggestions.map((w) => (
                    <button key={w} type="button" className="chip" onClick={() => setQ(w)}>
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            padding: '8px 16px',
            borderTop: '1px solid var(--line)',
            color: 'var(--ink-faint)',
            fontSize: 12,
          }}
        >
          <span>↑↓ ניווט</span>
          <span>Enter בחירה</span>
          <span>Esc סגירה</span>
        </div>
      </div>
    </div>
  );
}
