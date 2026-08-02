/**
 * רישום ווידג'טים של לוח הבית — כל מקטע במסך הבית הוא ווידג'ט רשום:
 * { id, label, icon, render, visible } — הסדר וההצגה נשלטים ע"י db.ui.homeLayout.
 *
 * חוזה:
 * - 'hero' (רצועת הברכה + פעולות מהירות) תמיד ראשון ואינו ניתן להסרה.
 * - visible(cfg) משמר את כל הגייטינג הקיים (featureOn / moduleOn) — ווידג'ט
 *   שאינו visible מדולג ברינדור גם אם הוא מופיע ב-homeLayout, בלי לגעת בנתונים.
 * - ברירת המחדל תלוית-ערכה (THEME_LAYOUTS) — פריסה שמורה תמיד גוברת עליה.
 * - כל הנתונים המוצגים נגזרים מה-Db האמיתי בלבד (homeData / wallData) —
 *   לעולם אין מספרים מומצאים; אין נתונים חודשיים אמיתיים ⇒ אין ספארקליין.
 */
// רישום הווידג'טים (HOME_WIDGETS) מכיל render: (ctx) => <Widget/> — כלומר הנתונים
// מקושרים מעצם טבעם לרכיבי הרינדור, ולכן חייבים לחיות באותו קובץ .tsx. פיצול היה
// פוגע בעיצוב. כיבוי ממוקד של כלל ה-Fast-Refresh (רלוונטי רק ל-HMR בפיתוח, אפס
// השפעה על המוצר) — קו-לוקיישן מכוון ומוצדק.
/* oxlint-disable react/only-export-components */
import { useEffect, useMemo, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { useApp, type View } from '../../store/useApp';
import type { Db, Family, OrgEvent } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { Btn, Chip } from '../ui';
import { hebDateFull } from '../../lib/hebrew';
import { featureOn, moduleOn, termOf } from '../../lib/config';
import { tierOf } from '../families/lib';
import { liveSuggestions } from '../shop8/lib';
import { buildPodium, buildWeek, fmtIls } from '../wall/wallData';
import {
  courseMetrics,
  credHistogram,
  careCounts,
  credNeedsBoost,
  credSummary,
  credTodayTrend,
  DAY_NAMES,
  dueContacts,
  EV_META,
  evLabel,
  fmtD,
  monthDonationSum,
  monthlySeries,
  punchLow,
  ST_META,
  type AttentionItem,
  type AttentionNav,
  type BirthdayHit,
  type CarouselItem,
  type DigestLine,
  type HomeStats,
  type TodaySession,
} from './homeData';

/* ── סגנונות משותפים (הצ'יפים הצבעוניים נשארים data-driven מ-homeData) ── */

const tagStyle = (bg: string, c: string): CSSProperties => ({
  background: bg,
  color: c,
  borderRadius: 999,
  padding: '2px 10px',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

/**
 * צ'יפ ממוגן-ערכה לווידג'טי הבית: בהיכל המוקאפ מונוכרום זהב-קלף —
 * צ'יפ רגיל = רקע חום-זהב כהה עם דיו קלף; צ'יפ קריטי שומר בורדו עמום
 * (כמו "עבר יעד" במוקאפ). שאר הערכות מקבלות את הצבעים המקוריים ללא שינוי.
 */
function chipStyle(ctx: HomeCtx, bg: string, c: string, crit = false): CSSProperties {
  if (themeOf(ctx) !== 'heichal') return tagStyle(bg, c);
  return crit
    ? { ...tagStyle('transparent', '#e58a75'), border: '1px solid rgba(229, 138, 117, 0.4)' }
    : tagStyle('#2a2517', '#d9c289');
}

const softEmpty: CSSProperties = { color: 'var(--ink-faint)', fontSize: 13.5, padding: '6px 6px' };

/**
 * הערכה המוחלת בפועל — העדפת המשתמש (db.ui.theme) גוברת על ערכת הארגון,
 * בדיוק כמו applyTheme ב-init. משמש לענפי-רינדור פר-ערכה בתוך ווידג'טים
 * (הנתונים והגייטינג אינם משתנים — רק צורת ההצגה).
 */
function themeOf(ctx: HomeCtx): string {
  return ctx.db.ui.theme ?? ctx.config.theme;
}

/* ── קונטקסט משותף לכל הווידג'טים — מחושב פעם אחת ב-HomeView ── */

/** כל הנתונים הנגזרים של מסך הבית (useMemo ב-HomeView). */
export interface HomeData {
  stats: HomeStats;
  sessions: TodaySession[];
  events: OrgEvent[];
  bdays: BirthdayHit[];
  attention: AttentionItem[];
  digest: DigestLine[];
  carousel: CarouselItem[];
  recent: Family[];
  holiday: string | null;
}

/** מה שווידג'ט מקבל כדי לצייר את עצמו — נתונים + פעולות ניווט מה-store. */
export interface HomeCtx {
  db: Db;
  config: OrgConfig;
  now: Date;
  todayIso: string;
  data: HomeData;
  /** ניווט ממוגן-מודולים — לעולם לא מנווט למסך של מודול כבוי. */
  navTo: (nav: AttentionNav) => void;
  go: (view: View) => void;
  selectFamily: (id: string | null) => void;
  selectCourse: (id: string | null) => void;
  markAttnDone: (key: string) => void;
  unmarkAttnDone: (key: string) => void;
  toast: (text: string) => void;
  /** הורדת קובץ גיבוי מלא — אותה פעולה כמו בהגדרות ← גיבוי. */
  exportBackup: () => void;
  /** כפתורי כותרת הבית (למשל "עריכת הלוח ✏️") — מוצגים ברצועת ה-hero. */
  headActions?: ReactNode;
}

/* ── רכיבי עזר ── */

/** כרטיס נתון — אייקון בעיגול מגוון, מספר גדול, צ'יפ מגמה וספארקליין (רק מנתונים אמיתיים). */
function StatCard(props: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  onClick: () => void;
  /** צ'יפ מגמה קטן ("+3 החודש") — רק כשנגזר בזול מנתונים אמיתיים. */
  chip?: string;
  /** 6 ערכים חודשיים (ישן→חדש) — מוצג רק אם יש בהם תוכן אמיתי. */
  spark?: number[];
}) {
  const hasSpark = !!props.spark && props.spark.some((v) => v > 0);
  const max = hasSpark ? Math.max(...(props.spark as number[])) : 1;
  return (
    <button type="button" className="card hm-stat" onClick={props.onClick} title={'מעבר: ' + props.label}>
      <span className="hm-stat-head">
        <span className="hm-stat-ico" aria-hidden>{props.icon}</span>
        <span className="hm-stat-meta">
          <span className="hm-stat-value">{props.value}</span>
          <span className="hm-stat-label">{props.label}</span>
        </span>
        {props.chip && <span className="hm-stat-chip">{props.chip}</span>}
      </span>
      <span className="hm-stat-sub">{props.sub}</span>
      {hasSpark && (
        <span className="hm-stat-spark" aria-hidden>
          {(props.spark as number[]).map((v, i) => (
            <i key={i} style={{ height: `${Math.round((v / max) * 100)}%` }} />
          ))}
        </span>
      )}
    </button>
  );
}

/** מסגרת פאנל אחידה — אמוג'י + כותרת מודגשת + קו דק (שפת הכותרות של המוקאפ). */
function Panel(props: { title: string; icon?: string; badge?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="hm-head" style={{ justifyContent: 'space-between' }}>
        <h2>
          {props.icon && <span aria-hidden>{props.icon}</span>}
          {props.title}
          {props.badge && <span className="chip">{props.badge}</span>}
        </h2>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

/**
 * קרוסלת אירועים קרובים — מתחלפת כל 5 שניות, נעצרת בריחוף/פוקוס,
 * ומכבדת prefers-reduced-motion (ללא רוטציה אוטומטית). נקודות + חצים לניווט ידני.
 */
function Carousel(props: { items: CarouselItem[]; navTo: (nav: AttentionNav) => void }) {
  const { items } = props;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (reduced || paused || items.length < 2) return;
    const t = setInterval(() => setIdx((i) => i + 1), 5000);
    return () => clearInterval(t);
  }, [reduced, paused, items.length]);

  const cur = items.length ? items[idx % items.length] : null;
  const step = (dir: 1 | -1) =>
    setIdx((i) => ((i % items.length) + items.length + dir) % items.length);

  return (
    <section
      className="card"
      aria-label="אירועים קרובים"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14 }}
    >
      {cur ? (
        <button
          type="button"
          key={cur.key}
          onClick={() => props.navTo(cur.nav)}
          title={cur.cta}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'right', cursor: 'pointer' }}
        >
          <span aria-hidden style={{ fontSize: 30, flexShrink: 0 }}>{cur.icon}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15.5 }}>{cur.title}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{cur.sub}</span>
          </span>
          <span style={{ marginInlineStart: 'auto', fontSize: 13, color: 'var(--ink-faint)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {cur.cta}
          </span>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden style={{ fontSize: 30 }}>🎂</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 15.5 }}>אין אירועים קרובים</span>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>14 הימים הקרובים שקטים</span>
          </span>
        </div>
      )}
      {items.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" aria-label="הפריט הקודם" onClick={() => step(-1)} style={{ padding: '0 6px', color: 'var(--ink-faint)' }}>
            ‹
          </button>
          <div style={{ display: 'flex', gap: 6 }} role="tablist" aria-label="פריטי הקרוסלה">
            {items.slice(0, 8).map((it, i2) => {
              const active = i2 === (idx % items.length) % 8;
              return (
                <button
                  key={it.key}
                  type="button"
                  aria-label={`פריט ${i2 + 1}`}
                  aria-current={active}
                  onClick={() => setIdx(i2)}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    padding: 0,
                    background: active ? 'var(--accent-deep)' : 'rgba(127, 119, 103, .3)',
                  }}
                />
              );
            })}
          </div>
          <button type="button" aria-label="הפריט הבא" onClick={() => step(1)} style={{ padding: '0 6px', color: 'var(--ink-faint)' }}>
            ›
          </button>
        </div>
      )}
    </section>
  );
}

/* ── רכיבי הווידג'טים עצמם ── */

/**
 * רצועת ה-hero — באנר גרדיאנט ברוחב מלא (משתני --hero-* פר-ערכה):
 * ברכה לפי שעה, שורת משנה (תאריך עברי · מפגשים · ימי הולדת) ופעולות מהירות.
 * תמיד ראשון, לא ניתן להסרה. כפתור של מודול כבוי מוסתר (כמו במקור).
 *
 * ניסוח הברכה ופעולות ה-hero — פר-ערכה, אחד-לאחד מהמוקאפים:
 * היכל/אור ראשון — "בוקר טוב, מאור החסד" בלי אמוג'י ובלי סימן קריאה;
 * צֹהַר — "בוקר טוב 👋" (הפעולות יושבות בשורת הכותרת של השלד, לא ב-hero);
 * קהילה — "בוקר טוב! יום שני שמח 🌞" בלי כפתורים ב-hero;
 * אור ראשון — סט הכפתורים של המוקאפ בדיוק (בלי "תורמים", עם אייקונים).
 */
function HeroWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, now, todayIso, data, go, selectCourse } = ctx;
  const familiesOn = moduleOn(config, 'families');
  const coursesOn = moduleOn(config, 'courses');
  const calendarOn = moduleOn(config, 'calendar');
  const diaryOn = moduleOn(config, 'diary');
  const supportersOn = moduleOn(config, 'supporters');
  const reportsOn = moduleOn(config, 'reports');
  const hour = now.getHours();
  const greet = hour < 12 ? 'בוקר טוב' : hour < 18 ? 'צהריים טובים' : 'ערב טוב';
  const mood = hour < 12 ? '🌞' : hour < 18 ? '🌤️' : '🌙';
  const theme = themeOf(ctx);
  const isOrRishon = theme === 'or-rishon';
  // במוקאפים של היכל/קהילה אין כפתורים ב-hero; בצֹהַר הפעולות בשורת הכותרת
  const actionsOn = theme !== 'heichal' && theme !== 'kehila' && theme !== 'tsohar';

  // שורת המשנה — תאריך עברי · חג · N מפגשים היום · N ימי הולדת היום (רק אמת מה-Db)
  const subParts: string[] = [
    `יום ${DAY_NAMES[now.getDay()]}, ${hebDateFull(todayIso)} · ${fmtD(todayIso)}`,
  ];
  if (data.holiday) subParts.push(data.holiday);
  if (coursesOn) {
    subParts.push(
      data.sessions.length === 0
        ? 'אין מפגשים היום'
        : data.sessions.length === 1
          ? 'מפגש אחד היום'
          : `${data.sessions.length} מפגשים היום`,
    );
  }
  // בלי אמוג'י עוגה — שורת המשנה במוקאפים היא טקסט שקט בלבד
  if (data.bdays.length) {
    subParts.push(
      data.bdays.length === 1 ? 'יום הולדת אחד היום' : `${data.bdays.length} ימי הולדת היום`,
    );
  }

  // כותרת הברכה — נוסח המוקאפ של כל ערכה (ראו הערת הפונקציה)
  const title =
    theme === 'tsohar' ? (
      <>
        {greet} <span aria-hidden>👋</span>
      </>
    ) : theme === 'kehila' ? (
      <>
        {greet}! יום {DAY_NAMES[now.getDay()]} שמח <span aria-hidden>{mood}</span>
      </>
    ) : (
      <>
        {greet}, {config.orgName || db.orgName}
      </>
    );

  return (
    <section className="hm-hero">
      {/* ✏️ עריכת הלוח — קישור-אייקון שקט בפינת העמוד (לא כפתור בולט) */}
      {ctx.headActions}
      <div className="hm-hero-top">
        <div>
          <h1 className="hm-hero-title">{title}</h1>
          <p className="hm-hero-sub">{subParts.join(' · ')}</p>
        </div>
      </div>

      {/* פעולות מהירות — רק בערכות שהמוקאפ שלהן מציג אותן; מודול כבוי מוסתר */}
      {actionsOn && (
        <div className="hm-hero-actions">
          {familiesOn && (
            <Btn kind="primary" onClick={() => go('families')}>
              ➕ הוספת {termOf(config, 'entity.family', 'משפחה')}
            </Btn>
          )}
          {coursesOn && (
            <Btn
              onClick={() => (data.sessions.length ? selectCourse(data.sessions[0].course.id) : go('courses'))}
              title={data.sessions.length ? 'ניקוב מהיר — ' + data.sessions[0].course.name : 'אין מפגשים היום'}
            >
              {isOrRishon ? '✓ ניקוב מהיר' : 'ניקוב מהיר'}
            </Btn>
          )}
          {calendarOn && <Btn onClick={() => go('calendar')}>{isOrRishon ? '🎂 מי חוגג השבוע?' : 'מי חוגג השבוע?'}</Btn>}
          {diaryOn && (
            <Btn onClick={() => go('diary')}>
              {(isOrRishon ? '📖 ' : '') + termOf(config, 'nav.diary', 'יומן חדרים')}
            </Btn>
          )}
          {supportersOn && !isOrRishon && (
            <Btn onClick={() => go('supporters')}>{termOf(config, 'nav.supporters', 'תורמים')}</Btn>
          )}
          {reportsOn && <Btn onClick={() => go('reports')}>{isOrRishon ? '📊 דוחות' : 'דוחות'}</Btn>}
        </div>
      )}
    </section>
  );
}

/**
 * 🎂 ימי הולדת היום — באנר חם מתחת ל-hero (משתני --bday-* פר-ערכה).
 * אין חוגגים היום ⇒ לא מרונדר כלום. שורת המשנה מוסיפה חוג + שעה
 * רק אם החוגג/ת משובצ/ת לחוג שמתקיים היום (דרך data.sessions — כבר ממוגן-מודול).
 * קהילה: כשלחוגג/ת יש מפגש היום מתווסף כפתור "🎉 לברך במפגש" — ניווט לחוג.
 */
function BdaysWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, data, selectFamily, selectCourse } = ctx;
  const isKehila = themeOf(ctx) === 'kehila';
  if (!data.bdays.length) return null;
  return (
    <section className="hm-bday" aria-label="ימי הולדת היום">
      {data.bdays.map((b) => {
        const courseIds = new Set(
          db.enrollments.filter((e) => e.memberId === b.member.id && e.status === 'active').map((e) => e.courseId),
        );
        const ts = data.sessions.find((s) => courseIds.has(s.course.id));
        const verb = b.member.gender === 'f' ? 'חוגגת' : 'חוגג';
        return (
          <div key={b.member.id} className="hm-bday-row">
            <button
              type="button"
              className="hm-bday-main"
              onClick={() => selectFamily(b.member.famId)}
              title="לכרטיס המשפחה"
            >
              <span className="hm-bday-ico" aria-hidden>🎂</span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'right' }}>
                <span className="hm-bday-title">
                  {b.member.first} {verb} היום {b.age}!
                </span>
                <span className="hm-bday-sub">
                  {termOf(config, 'entity.familyOf', 'משפחת') + ' ' + b.member.famName +
                    (ts ? ` · ${ts.course.name}${ts.session.time ? ' · ' + ts.session.time : ''}` : '')}
                </span>
              </span>
            </button>
            {isKehila && ts && (
              <button
                type="button"
                className="hm-bday-cta"
                onClick={() => selectCourse(ts.course.id)}
                title={'לחוג ' + ts.course.name + ' — לברך במפגש של היום'}
              >
                🎉 לברך במפגש
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** תקציר הבוקר — מוצג רק כשהפיצ'ר home.digest פעיל. */
function DigestWidget({ ctx }: { ctx: HomeCtx }) {
  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 14 }}>
      <div className="hm-head" style={{ marginBottom: 4 }}>
        <h2>
          <span aria-hidden>☀️</span> תקציר הבוקר
        </h2>
      </div>
      {ctx.data.digest.map((l: DigestLine) => (
        <button
          key={l.key}
          type="button"
          className="hm-row"
          style={{
            padding: '4px 6px',
            ...(l.urgent ? { color: 'var(--red)', fontWeight: 600 } : null),
          }}
          onClick={() => ctx.navTo(l.nav)}
        >
          {!l.urgent && <span aria-hidden style={{ color: 'var(--ink-faint)' }}>•</span>}
          <span>{l.text}</span>
        </button>
      ))}
    </section>
  );
}

/**
 * כרטיסי נתונים — כרטיס של מודול כבוי מוסתר (כמו במקור).
 * צ'יפ מגמה וספארקליין רק כשהם נגזרים בזול מנתונים אמיתיים:
 * משפחות — לפי createdAt; תרומות — לפי תאריכי התרומות (₪ בלבד).
 */
function StatsWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, now, go } = ctx;
  const s = ctx.data.stats;
  const familiesOn = moduleOn(config, 'families');
  const coursesOn = moduleOn(config, 'courses');
  const calendarOn = moduleOn(config, 'calendar');
  const supportersOn = moduleOn(config, 'supporters');
  // כל המודולים של הכרטיסים כבויים ⇒ אין מה להציג — הגריד כולו נעלם
  if (!familiesOn && !coursesOn && !calendarOn && !supportersOn) return null;

  // משפחות חדשות פר-חודש (6 חודשים) — אמיתי מ-createdAt
  const famSpark = monthlySeries(
    db.families.map((f) => ({ date: f.createdAt || '', value: 1 })),
    now,
  );
  const famNew = famSpark[famSpark.length - 1];

  // תרומות ₪ פר-חודש — אמיתי מתאריכי התרומות
  const donPoints: { date: string; value: number }[] = [];
  for (const sp of db.supporters) {
    for (const dn of sp.donations) if (dn.cur !== '$') donPoints.push({ date: dn.date, value: dn.amount });
  }
  const donSpark = monthlySeries(donPoints, now);
  const donMonth = monthDonationSum(db, now);

  return (
    <div className="hm-stats">
      {familiesOn && (
        <StatCard
          icon="👨‍👩‍👧‍👦"
          label={termOf(config, 'nav.families', 'משפחות')}
          value={String(s.famTotal)}
          sub={`${s.famActive} פעילות · ${s.famPending} ממתינות · ${s.famInactive} לא פעילות`}
          chip={famNew > 0 ? `+${famNew} החודש` : undefined}
          spark={famSpark}
          onClick={() => go('families')}
        />
      )}
      {familiesOn && (
        <StatCard
          icon="🧒"
          label={termOf(config, 'entity.members', 'בני משפחה')}
          value={String(s.membersTotal)}
          sub={`מהם ${s.childrenTotal} ילדים`}
          onClick={() => go('families')}
        />
      )}
      {coursesOn && (
        <StatCard
          icon="🎨"
          label={termOf(config, 'nav.courses', 'חוגים') + ' פעילים'}
          value={String(s.activeCourses)}
          sub={`${s.activeEnrollments} שיבוצים פעילים מתוך ${s.enrollTotal}`}
          onClick={() => go('courses')}
        />
      )}
      {calendarOn && (
        <StatCard
          icon="📅"
          label="אירועים פתוחים"
          value={String(s.eventsToday)}
          sub={`היום · ${s.eventsWeek} השבוע`}
          onClick={() => go('calendar')}
        />
      )}
      {supportersOn && (
        <StatCard
          icon="💛"
          label="תרומות"
          value={'₪' + s.donIls.toLocaleString('he-IL')}
          sub={(s.donUsd ? `+ $${s.donUsd.toLocaleString('he-IL')} · ` : '') + `${s.supportersTotal} תורמים`}
          chip={donMonth > 0 ? `+${fmtIls(donMonth)} החודש` : undefined}
          spark={donSpark}
          onClick={() => go('supporters')}
        />
      )}
    </div>
  );
}

/**
 * גלולת סטטוס מפגש — נגזרת אך ורק מהשעה האמיתית של המפגש מול השעה הנוכחית:
 * הסתיים / מתקיים כעת (±45 דק') / בהמשך היום. אין שעה ⇒ אין גלולה.
 */
function sessionStatus(time: string | undefined, now: Date): { label: string; bg: string; c: string } | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h)) return null;
  const diff = h * 60 + (Number.isFinite(m) ? m : 0) - (now.getHours() * 60 + now.getMinutes());
  if (diff < -45) return { label: 'הסתיים', bg: 'var(--line-soft)', c: 'var(--ink-faint)' };
  if (diff <= 45) return { label: 'מתקיים כעת', bg: 'color-mix(in srgb, var(--green) 14%, var(--panel))', c: 'var(--green)' };
  return { label: 'בהמשך היום', bg: 'var(--stat-tint)', c: 'var(--accent-deep)' };
}

/**
 * פאנל "היום" — המפגשים של היום, אירועים וימי הולדת.
 * צֹהַר (SaaS): המפגשים כטבלה נקייה (שעה · מה · איפה · רשומות · סטטוס · נוכחות)
 * + קישור "ללוח המלא ←"; שאר הערכות: כרטיסי-שורה (גלולת שעה + נוכחות).
 * הנתונים (data.sessions וכו') זהים בשני הענפים — רק צורת ההצגה שונה.
 */
function TodayWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, now, data, go, selectFamily, selectCourse } = ctx;
  const famName = (id: string) => db.families.find((f) => f.id === id)?.name ?? '';
  const theme = themeOf(ctx);
  const isTsohar = theme === 'tsohar';
  // כותרת הפאנל בשפת המוקאפ של הערכה: היכל "סדר היום" · קהילה "☀️ המפגשים של היום"
  const isKehila = theme === 'kehila';
  return (
    <Panel
      icon={isKehila ? '☀️' : '📅'}
      title={
        theme === 'heichal' ? 'סדר היום' : isKehila ? 'המפגשים של היום' : `היום · יום ${DAY_NAMES[now.getDay()]}`
      }
      badge={data.holiday ?? undefined}
      action={
        isTsohar && moduleOn(config, 'calendar') ? (
          <Btn sm onClick={() => go('calendar')} title="ללוח השנה המלא">
            ללוח המלא ←
          </Btn>
        ) : undefined
      }
    >
      {/* בקהילה הכותרת עצמה היא "המפגשים של היום" — בלי תת-כותרת כפולה */}
      {!isKehila && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-faint)' }}>המפגשים של היום</div>
      )}
      {data.sessions.length === 0 && (
        <div style={softEmpty}>אין מפגשי {termOf(config, 'nav.courses', 'חוגים')} היום</div>
      )}
      {isTsohar && data.sessions.length > 0 && (
        /* הטבלה גוללת בתוך עצמה במסך צר — הגוף לעולם לא גולל אופקית */
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>שעה</th>
                <th>מה</th>
                <th>איפה</th>
                <th>רשומות</th>
                <th>סטטוס</th>
                <th>נוכחות</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((ts, i) => {
                const room = db.rooms.find((r) => r.id === ts.course.roomId)?.name ?? '';
                const enrolled = db.enrollments.filter(
                  (e) => e.courseId === ts.course.id && e.status === 'active',
                ).length;
                const st = sessionStatus(ts.session.time, now);
                return (
                  <tr
                    key={ts.course.id + '-' + i}
                    onClick={() => selectCourse(ts.course.id)}
                    style={{ cursor: 'pointer' }}
                    title="לכרטיס החוג"
                  >
                    <td>
                      <span className="hm-time">{ts.session.time || '—'}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {ts.course.name}
                      {ts.session.label ? ' · ' + ts.session.label : ''}
                    </td>
                    <td>{room || '—'}</td>
                    <td>{enrolled}</td>
                    <td>{st ? <span style={tagStyle(st.bg, st.c)}>{st.label}</span> : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="hm-pill-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCourse(ts.course.id);
                        }}
                        title="פתיחת כרטיס החוג לניהול נוכחות"
                      >
                        נוכחות ✓
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!isTsohar &&
        data.sessions.map((ts, i) => {
          const room = db.rooms.find((r) => r.id === ts.course.roomId)?.name ?? '';
          const teacher = db.teachers.find((t) => t.id === ts.course.teacherId)?.name ?? '';
          const enrolled = db.enrollments.filter((e) => e.courseId === ts.course.id && e.status === 'active').length;
          const sub = [room, teacher, `${enrolled} רשומים`].filter(Boolean).join(' · ');
          return (
            <div key={ts.course.id + '-' + i} className="hm-meet">
              <span className="hm-time">{ts.session.time || '—'}</span>
              <button type="button" className="hm-meet-main" onClick={() => selectCourse(ts.course.id)} title="לכרטיס החוג">
                <span className="hm-meet-title">
                  {ts.course.name}
                  {ts.session.label ? ' · ' + ts.session.label : ''}
                </span>
                <span className="hm-meet-sub">{sub}</span>
              </button>
              <button
                type="button"
                className="hm-pill-btn"
                onClick={() => selectCourse(ts.course.id)}
                title="פתיחת כרטיס החוג לניהול נוכחות"
              >
                נוכחות ✓
              </button>
            </div>
          );
        })}

      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-faint)', marginTop: 6 }}>אירועים</div>
      {data.events.length === 0 && data.bdays.length === 0 && <div style={softEmpty}>אין אירועים היום</div>}
      {data.events.map((ev) => (
        <button
          key={ev.id}
          type="button"
          className="hm-row"
          onClick={() => (ev.famId ? selectFamily(ev.famId) : go('calendar'))}
          title={ev.famId ? 'לכרטיס המשפחה' : 'ללוח השנה'}
        >
          <span style={chipStyle(ctx, EV_META[ev.type].bg, EV_META[ev.type].c)}>{evLabel(ev)}</span>
          <span>
            {(ev.time ? ev.time + ' · ' : '') + ev.title}
            {ev.famId ? ' · ' + termOf(config, 'entity.familyOf', 'משפחת') + ' ' + famName(ev.famId) : ''}
          </span>
          {ev.priority !== 'green' && (
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                flexShrink: 0,
                marginInlineStart: 'auto',
                background: ev.priority === 'red' ? '#dc2626' : '#d97706',
              }}
            />
          )}
        </button>
      ))}
      {data.bdays.map((b) => (
        <button
          key={b.member.id}
          type="button"
          className="hm-row"
          onClick={() => selectFamily(b.member.famId)}
          title="לכרטיס המשפחה"
        >
          <span style={chipStyle(ctx, '#fbeef3', '#be185d')}>יום הולדת</span>
          <span>
            {b.member.first} ({b.age}) · {termOf(config, 'entity.familyOf', 'משפחת')} {b.member.famName}
          </span>
        </button>
      ))}
    </Panel>
  );
}

/** "דורש טיפול" — כולל מרכז טיפול (סימון טופל/ביטול) — פיצ'ר home.care. */
function AttentionWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, data, navTo, markAttnDone, unmarkAttnDone, config, todayIso, go } = ctx;
  // מונה העמודות המבודדות (CONNECT חיבור 3) — מונה-עם-קפיצה בלבד, בלי פירוט
  const privacyMode = useApp((s) => s.privacyMode);
  const crossCare = privacyMode ? { tzedaka: 0, shop: 0, shop7: 0 } : careCounts(db, todayIso, config);
  const [showDone, setShowDone] = useState(false);
  // איפוס גורף של סימוני "טופל" (P3 פריט 7, לגאסי careReset) — שתי לחיצות
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);
  const [resetArmed, setResetArmed] = useState(false);
  // סינון לפי תגית (קטגוריית הפריט) — מצב מקומי בלבד, ללא התמדה. ברירת מחדל "הכל".
  const [careFilter, setCareFilter] = useState<string | null>(null);
  // מרכז טיפול: הפרדת פריטים פתוחים מפריטים שסומנו "טופל"
  const attnDone = db.attnDone ?? {};
  const openAttn = data.attention.filter((a) => !attnDone[a.key]);
  const doneAttn = data.attention.filter((a) => attnDone[a.key]);
  // צ'יפ סינון לכל תגית קיימת בפריטים הפתוחים + מונה; "הכל" מנקה את הסינון.
  const tagCounts: Record<string, number> = {};
  for (const a of openAttn) tagCounts[a.tag] = (tagCounts[a.tag] ?? 0) + 1;
  const tags = Object.keys(tagCounts);
  // תגית שסומנה אך נעלמה (כל פריטיה טופלו) — מתאפסת בחן ל"הכל"
  const activeTag = careFilter && tagCounts[careFilter] ? careFilter : null;
  const shownAttn = activeTag ? openAttn.filter((a) => a.tag === activeTag) : openAttn;
  // שפת המוקאפ: היכל "נר תמיד" (עם 🕯️ בכל שורה) · קהילה "שווה לטפל"
  const theme = themeOf(ctx);
  const isHeichal = theme === 'heichal';

  return (
    <Panel
      icon="🔔"
      title={isHeichal ? 'נר תמיד — דורש טיפול' : theme === 'kehila' ? 'שווה לטפל' : 'דורש טיפול'}
      badge={openAttn.length ? String(openAttn.length) : undefined}
    >
      {openAttn.length === 0 && (
        <div style={{ ...softEmpty, color: 'var(--green)', fontWeight: 600 }}>הכל מטופל ✓</div>
      )}
      {(crossCare.tzedaka > 0 || crossCare.shop > 0 || crossCare.shop7 > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
          {crossCare.tzedaka > 0 && (
            <Chip on onClick={() => go('tzedaka')}>
              {'🪙 ' + termOf(config, 'nav.tzedaka', 'קופות צדקה') + ': ' + crossCare.tzedaka}
            </Chip>
          )}
          {crossCare.shop > 0 && (
            <Chip on onClick={() => go('shop')}>
              {'🛍 ' + termOf(config, 'nav.shop', 'חנות') + ': ' + crossCare.shop}
            </Chip>
          )}
          {crossCare.shop7 > 0 && (
            <Chip on onClick={() => go('shop7')}>
              {'🚚 ' + termOf(config, 'nav.shop7', 'חלוקה') + ': ' + crossCare.shop7}
            </Chip>
          )}
        </div>
      )}
      {/* שורת סינון לפי תגית — רק כשיש יותר מתגית אחת (אחרת אין מה לסנן) */}
      {tags.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
          <Chip on={!activeTag} onClick={() => setCareFilter(null)}>
            {'הכל · ' + openAttn.length}
          </Chip>
          {tags.map((t) => (
            <Chip key={t} on={activeTag === t} onClick={() => setCareFilter(t)}>
              {t + ' · ' + tagCounts[t]}
            </Chip>
          ))}
        </div>
      )}
      {shownAttn.slice(0, 8).map((a) => (
        <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className="hm-row"
            style={{ flex: 1, minWidth: 0 }}
            onClick={() => navTo(a.nav)}
          >
            {isHeichal && <span aria-hidden>🕯️</span>}
            <span style={chipStyle(ctx, a.tagBg, a.tagC, a.sev === 'crit')}>{a.tag}</span>
            <span style={{ minWidth: 0 }}>{a.title}</span>
            <span className="hm-arrow" aria-hidden>לטפל ←</span>
          </button>
          <Btn sm onClick={() => markAttnDone(a.key)} title="סימון הפריט כטופל">
            ✓ טופל
          </Btn>
        </div>
      ))}
      {shownAttn.length > 8 && (
        <div style={softEmpty}>+{shownAttn.length - 8} פריטים נוספים</div>
      )}
      {doneAttn.length > 0 && (
        <button
          type="button"
          style={{ ...softEmpty, textAlign: 'right', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setShowDone((v) => !v)}
        >
          {showDone ? 'הסתרת שטופלו' : `הצג שטופלו (${doneAttn.length})`}
        </button>
      )}
      {showDone &&
        doneAttn.map((a) => (
          <div
            key={a.key}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.55, fontSize: 13.5, padding: '4px 6px' }}
          >
            <span style={chipStyle(ctx, a.tagBg, a.tagC, a.sev === 'crit')}>{a.tag}</span>
            <span style={{ textDecoration: 'line-through', minWidth: 0 }}>{a.title}</span>
            <span
              style={{ marginInlineStart: 'auto', fontSize: 12, color: 'var(--ink-faint)', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              טופל {fmtD(attnDone[a.key])}
            </span>
            <Btn sm onClick={() => unmarkAttnDone(a.key)} title="החזרת הפריט לרשימה הפתוחה">
              ביטול
            </Btn>
          </div>
        ))}
      {showDone && doneAttn.length > 0 && (
        <button
          type="button"
          style={{ ...softEmpty, textAlign: 'right', cursor: 'pointer', color: resetArmed ? '#b91c1c' : undefined }}
          onClick={() => {
            if (!resetArmed) {
              setResetArmed(true);
              return;
            }
            setDb(() => ({ attnDone: {} }));
            setResetArmed(false);
            toast('הסימונים אופסו');
          }}
          onBlur={() => setResetArmed(false)}
        >
          {resetArmed ? 'בטוח? לחיצה נוספת מאפסת את כל הסימונים' : 'איפוס סימוני טופל'}
        </button>
      )}
    </Panel>
  );
}

/** משפחות אחרונות — טבלה + מצב ריק. */
function RecentWidget({ ctx }: { ctx: HomeCtx }) {
  const { config, data, go, selectFamily } = ctx;
  const famPlural = termOf(config, 'nav.families', 'משפחות');
  return (
    <Panel
      icon="👨‍👩‍👧‍👦"
      title={famPlural + ' אחרונות'}
      action={<Btn sm onClick={() => go('families')}>{'כל ' + famPlural + ' ←'}</Btn>}
    >
      {data.recent.length === 0 ? (
        <div className="empty">
          אין {famPlural} עדיין — הוסיפו את הראשונ/ה
          <div style={{ marginTop: 12 }}>
            <Btn kind="primary" onClick={() => go('families')}>
              ➕ הוספת {termOf(config, 'entity.family', 'משפחה')}
            </Btn>
          </div>
        </div>
      ) : (
        /* הטבלה רחבה מ-390px — גוללת בתוך עצמה כדי שהגוף לא יגלול אופקית במובייל */
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>משפחה</th>
                <th>טלפון</th>
                <th>עיר</th>
                <th>ילדים</th>
                <th>סטטוס</th>
                <th>הצטרפה</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((f) => (
                <tr key={f.id} onClick={() => selectFamily(f.id)} style={{ cursor: 'pointer' }} title="לכרטיס המשפחה">
                  <td style={{ fontWeight: 600 }}>{termOf(config, 'entity.familyOf', 'משפחת')} {f.name}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{f.phone || '—'}</td>
                  <td>{f.city || '—'}</td>
                  <td>{f.members.filter((m) => !m.isParent).length}</td>
                  <td>
                    <span style={chipStyle(ctx, ST_META[f.status].bg, ST_META[f.status].c)}>
                      {ST_META[f.status].label}
                    </span>
                  </td>
                  <td>{fmtD(f.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/**
 * 🏆 ספר הזהב — התורמים המובילים, אותה נוסחה בדיוק כמו בקיר ההשפעה
 * (buildPodium: החודש ← נפילה לשנה ← סה"כ מצטבר). פס התקדמות יחסי למוביל.
 */
function GoldbookWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, todayIso, go } = ctx;
  const podium = buildPodium(db, todayIso.slice(0, 7), todayIso.slice(0, 4));
  const max = podium.rows[0]?.amount ?? 0;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <Panel
      icon="🏆"
      title={themeOf(ctx) === 'heichal' ? 'ספר הזהב · תורמים' : 'ספר הזהב'}
      badge={podium.rows.length ? podium.scopeLabel : undefined}
      action={<Btn sm onClick={() => go('supporters')}>לתורמים ←</Btn>}
    >
      {podium.rows.length === 0 && <div style={softEmpty}>{'אין ' + termOf(config, 'entity.donations', 'תרומות') + ' עדיין'}</div>}
      {podium.rows.map((r, i) => (
        <div key={r.name + i} className="hm-gold-row">
          <div className="hm-gold-line">
            <span aria-hidden>{medals[i]}</span>
            <b>{r.name}</b>
            <span style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>{r.sub}</span>
            <b style={{ marginInlineStart: 'auto', whiteSpace: 'nowrap' }}>{fmtIls(r.amount)}</b>
          </div>
          <div className="hm-gold-bar" aria-hidden>
            <i style={{ width: `${max > 0 ? Math.max(6, Math.round((r.amount / max) * 100)) : 0}%` }} />
          </div>
        </div>
      ))}
      {podium.othersCount > 0 && (
        <div style={softEmpty}>
          +{podium.othersCount} תורמים נוספים · {fmtIls(podium.othersAmount)}
        </div>
      )}
    </Panel>
  );
}

/**
 * 📜 הלוח העברי — 4 הפריטים הקרובים (חגים, אירועים, מפגשים) עם תאריך עברי,
 * מאותה נגזרת כמו בקיר ההשפעה (buildWeek). שורות מפגשי חוגים ('-crs')
 * מסוננות כשמודול החוגים כבוי — אין דליפת נתוני מודול כבוי.
 */
function HebcalWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, now, go } = ctx;
  const coursesOn = moduleOn(config, 'courses');
  const rows = buildWeek(db, now)
    .filter((r) => coursesOn || !r.key.endsWith('-crs'))
    .slice(0, 4);
  return (
    <Panel icon="📜" title="הלוח העברי" action={<Btn sm onClick={() => go('calendar')}>ללוח השנה ←</Btn>}>
      {rows.length === 0 && <div style={softEmpty}>שבוע שקט — אין אירועים קרובים</div>}
      {rows.map((r) => (
        <div key={r.key} className="hm-row" style={{ cursor: 'default' }}>
          <span className="hm-time" style={{ direction: 'rtl' }}>{r.hd}</span>
          <span aria-hidden>{r.emoji}</span>
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.title}</span>
            {r.sub && <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{r.sub}</span>}
          </span>
        </div>
      ))}
    </Panel>
  );
}

/**
 * 🤝 אמינות קהילתית — ממוצע מדד האמינות (כמו בקיר ההשפעה) + ספירה לכל דרגה.
 * דרגות/צבעים — reuse של tierOf ממודול המשפחות (950/800/500), בלי לשכפל נוסחה.
 */
function CommunityWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, go } = ctx;
  const s = credSummary(db, (score) => tierOf(score).key);
  // מטא של ארבע הדרגות — ציון מייצג לכל טווח מחזיר את התווית/צבע המקוריים
  const meta = [tierOf(960), tierOf(850), tierOf(600), tierOf(100)];
  const isKehila = themeOf(ctx) === 'kehila';
  const famPlural = termOf(config, 'nav.families', 'משפחות');
  return (
    <Panel
      icon={isKehila ? '🏅' : '🤝'}
      title={isKehila ? 'הקהילה שלנו' : 'אמינות קהילתית'}
      badge={s.total > 0 ? `ממוצע ${s.avg}` : undefined}
      action={<Btn sm onClick={() => go('families')}>{'ל' + famPlural + ' ←'}</Btn>}
    >
      {s.total === 0 ? (
        <div style={softEmpty}>{'אין ' + famPlural + ' עדיין'}</div>
      ) : (
        <div className="hm-tier-grid">
          {meta.map((t) => (
            <div key={t.key} className="hm-tier">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: t.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 600 }}>{t.label}</span>
              </span>
              <b style={{ fontSize: 20 }}>{s.counts[t.key]}</b>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/**
 * 📊 תפוסת החוגים (פער 19, לגאסי crsG legacy-main-script.js:2630-2654):
 * ממוצע תפוסה, עמודה לחיצה לכל חוג, הכנסה חודשית משוקללת, צ'יפים ו"הכי מבוקשים".
 */
function CourseMetricsWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, go, selectCourse } = ctx;
  const m = courseMetrics(db);
  const crsPlural = termOf(config, 'nav.courses', 'חוגים');
  const openCourse = (id: string) => { selectCourse(id); go('courses'); };
  const barColor = (pct: number) => (pct >= 100 ? '#dc2626' : pct >= 85 ? '#f3c76b' : pct >= 40 ? '#16a34a' : '#d97706');
  return (
    <Panel
      icon="📊"
      title={'תפוסת ה' + crsPlural}
      badge={m.rows.length > 0 ? `ממוצע ${m.avgOcc}%` : undefined}
      action={<Btn sm onClick={() => go('courses')}>{'ל' + crsPlural + ' ←'}</Btn>}
    >
      {m.rows.length === 0 ? (
        <div style={softEmpty}>{'אין ' + crsPlural + ' עדיין'}</div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
            {m.students} שיבוצים · ₪{Math.round(m.income).toLocaleString('he-IL')} לחודש (מנויים חודשיים בלבד)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64, marginBottom: 8 }} role="img" aria-label="תפוסה לפי חוג">
            {m.rows.map((r) => (
              <button
                key={r.course.id}
                onClick={() => openCourse(r.course.id)}
                title={`${r.course.name} · ${r.n}/${r.max} (${r.pct}%)`}
                style={{
                  flex: 1, minWidth: 6, border: 'none', cursor: 'pointer', borderRadius: '3px 3px 0 0',
                  height: Math.max(6, r.pct) + '%', background: barColor(r.pct),
                  boxShadow: r.pct >= 100 ? '0 0 12px rgba(220,38,38,.45)' : 'none',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: m.top.length ? 8 : 0 }}>
            <span style={tagStyle('#e7edf5', '#3a5a86')}>{m.rows.length} {crsPlural}</span>
            <span style={tagStyle('#fdf1d4', '#9a6414')}>{m.punchCount} כרטיסייה</span>
            <span style={tagStyle('#e4f5ea', '#12803c')}>{m.monthlyCount} מנוי</span>
            <span style={tagStyle('#fdeaea', '#b91c1c')}>{m.fullCount} מלאים</span>
          </div>
          {m.top.map((r) => (
            <button key={r.course.id} className="hm-row" onClick={() => openCourse(r.course.id)} style={{ width: '100%', textAlign: 'start' }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: barColor(r.pct), flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 600 }}>{r.course.name}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{r.n}/{r.max}</span>
            </button>
          ))}
        </>
      )}
    </Panel>
  );
}

/**
 * 🎯 מדד אמינות מורחב (פער 20, לגאסי credV/showCredGraph): מד ממוצע,
 * היסטוגרמת 20 סלים של 50 נק', מגמת היום ו"דורשות חיזוק" לחיצות.
 */
function CredMetricsWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, config, todayIso, go, selectFamily } = ctx;
  const openFamiliesByTier = useApp((s2) => s2.openFamiliesByTier);
  const s = credSummary(db, (score) => tierOf(score).key);
  const bins = credHistogram(db);
  const trend = credTodayTrend(db, todayIso);
  const boost = credNeedsBoost(db);
  const maxBin = Math.max(1, ...bins);
  const famPlural = termOf(config, 'nav.families', 'משפחות');
  const openFam = (id: string) => { selectFamily(id); go('families'); };
  return (
    <Panel
      icon="🎯"
      title="מדד אמינות — תמונה מלאה"
      badge={s.total > 0 ? `ממוצע ${s.avg}/1000` : undefined}
      action={<Btn sm onClick={() => go('families')}>{'ל' + famPlural + ' ←'}</Btn>}
    >
      {s.total === 0 ? (
        <div style={softEmpty}>{'אין ' + famPlural + ' עדיין'}</div>
      ) : (
        <>
          {/* מד ממוצע — פס עם מחט (הפשטת מד-המחוג של הלגאסי, אותם עוגנים 0/500/800/1000) */}
          <div style={{ position: 'relative', height: 10, borderRadius: 99, marginBottom: 4, background: 'linear-gradient(90deg,#dc2626 0%,#d97706 50%,#16a34a 80%,#f3c76b 100%)' }} aria-hidden>
            <span style={{ position: 'absolute', insetInlineStart: `${Math.min(99, s.avg / 10)}%`, top: -3, width: 3, height: 16, background: 'var(--ink, #211d17)', borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }} aria-hidden>
            <span>0</span><span>500</span><span>800</span><span>1000</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 44, marginBottom: 8 }} role="img" aria-label="התפלגות ציוני האמינות">
            {bins.map((b, i) => (
              <span
                key={i}
                title={`${i * 50}-${i * 50 + 49}: ${b}`}
                style={{ flex: 1, borderRadius: '2px 2px 0 0', height: Math.max(4, Math.round((b / maxBin) * 100)) + '%', background: tierOf(i * 50 + 25).dot, opacity: b === 0 ? 0.25 : 1 }}
              />
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
            מגמת היום: <b style={{ color: trend > 0 ? '#12803c' : trend < 0 ? '#b91c1c' : 'inherit' }}>{trend > 0 ? '+' + trend : trend}</b> נק׳
            {' · 👵 ' + db.families.filter((f) => (f.maritalStatus || '').includes('אלמן')).length + ' אלמנות'}
          </div>
          {/* אריחי דרגות לחיצים (P2 פער 20) — מנווטים למשפחות מסוננות לפי הדרגה */}
          <div className="hm-tier-grid" style={{ marginBottom: boost.length ? 8 : 0 }}>
            {([
              ['titan', tierOf(960)],
              ['lion', tierOf(850)],
              ['pale', tierOf(600)],
              ['red', tierOf(100)],
            ] as const).map(([key, t]) => (
              <button
                key={key}
                type="button"
                className="hm-tier"
                onClick={() => openFamiliesByTier(key)}
                title={'ל' + famPlural + ' בדרגת ' + t.label}
                style={{ cursor: 'pointer', textAlign: 'right', background: 'transparent' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: t.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 600 }}>{t.label}</span>
                </span>
                <b style={{ fontSize: 20 }}>{s.counts[key]}</b>
              </button>
            ))}
          </div>
          {boost.map((x) => (
            <button key={x.family.id} className="hm-row" onClick={() => openFam(x.family.id)} style={{ width: '100%', textAlign: 'start' }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: tierOf(x.score).dot, flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 600 }}>{'משפחת ' + x.family.name}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{x.score}</span>
            </button>
          ))}
        </>
      )}
    </Panel>
  );
}

/** 💛 תורמים · יעדי קשר — יעדים שהגיעו/עברו (שם, תאריך, טלפון) + נתרם החודש. */
function ContactsWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, now, go } = ctx;
  const due = dueContacts(db, now);
  const monthSum = monthDonationSum(db, now);
  return (
    <Panel
      icon="💛"
      title="תורמים · יעדי קשר"
      badge={due.length ? String(due.length) : undefined}
      action={<Btn sm onClick={() => go('supporters')}>לתורמים ←</Btn>}
    >
      {monthSum > 0 && (
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          נתרמו החודש: <b>{fmtIls(monthSum)}</b>
        </div>
      )}
      {due.length === 0 && (
        <div style={{ ...softEmpty, color: 'var(--green)', fontWeight: 600 }}>אין יעדי קשר פתוחים ✓</div>
      )}
      {due.slice(0, 6).map((c) => (
        <button key={c.id} type="button" className="hm-row" onClick={() => go('supporters')} title="למסך התורמים">
          <span style={chipStyle(ctx, c.late > 7 ? '#fdeaea' : '#fdf1d4', c.late > 7 ? '#b91c1c' : '#9a6414', c.late > 7)}>
            {fmtD(c.date)}
          </span>
          <span style={{ fontWeight: 600 }}>{c.name}</span>
          {c.phone && (
            <span dir="ltr" style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>{c.phone}</span>
          )}
          <span className="hm-arrow" aria-hidden>לטפל ←</span>
        </button>
      ))}
      {due.length > 6 && <div style={softEmpty}>+{due.length - 6} יעדי קשר נוספים</div>}
    </Panel>
  );
}

/** 🎫 מלאי כרטיסיות — כרטיסיות פעילות עם ≤2 ניקובים שנותרו (בן משפחה, חוג, יתרה). */
function PunchlowWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, navTo } = ctx;
  const items = punchLow(db);
  return (
    <Panel icon="🎫" title="מלאי כרטיסיות" badge={items.length ? String(items.length) : undefined}>
      {items.length === 0 && (
        <div style={{ ...softEmpty, color: 'var(--green)', fontWeight: 600 }}>כל הכרטיסיות במלאי תקין ✓</div>
      )}
      {items.slice(0, 6).map((p) => (
        <button key={p.key} type="button" className="hm-row" onClick={() => navTo(p.nav)} title="לכרטיס המשפחה">
          <span style={chipStyle(ctx, '#efe7f3', '#7c3aed')}>{p.left}/{p.total}</span>
          <span style={{ minWidth: 0 }}>
            {p.member} ({p.famName}) · {p.course}
          </span>
          <span className="hm-arrow" aria-hidden>לחידוש ←</span>
        </button>
      ))}
      {items.length > 6 && <div style={softEmpty}>+{items.length - 6} כרטיסיות נוספות</div>}
    </Panel>
  );
}

/**
 * ⚡ פעולות מהירות — קיצורי הפעולות הנפוצות, מחווטים לאותן זרימות קיימות:
 * + משפחה ← מסך המשפחות · ✓ ניקוב ← החוג הקרוב (כמו "ניקוב מהיר" ב-hero) ·
 * 🧾 קבלה ← תורמים/חוגים (שם מפיקים קבלות) · ⬇ גיבוי ← exportBackup מההגדרות.
 * כפתור של מודול/פיצ'ר כבוי מוסתר.
 */
function QuickWidget({ ctx }: { ctx: HomeCtx }) {
  const { config, data, go, selectCourse, exportBackup } = ctx;
  const familiesOn = moduleOn(config, 'families');
  const coursesOn = moduleOn(config, 'courses');
  const punchOn = coursesOn && featureOn(config, 'courses.punch');
  const supportersOn = moduleOn(config, 'supporters');
  const receiptsOn = featureOn(config, 'core.receipts') && (supportersOn || coursesOn);
  const timerOn = featureOn(config, 'core.timer');
  const cashboxOn = featureOn(config, 'core.cashbox');
  const bodymapOn = featureOn(config, 'core.bodymap');
  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14 }}>
      <div className="hm-head">
        <h2>
          <span aria-hidden>⚡</span> פעולות מהירות
        </h2>
      </div>
      <div className="hm-quick">
        {timerOn && (
          <Btn
            kind="primary"
            onClick={() => {
              window.location.hash = '#timer';
            }}
            title={termOf(config, 'nav.timer', 'טיימר כסף') + ' — חיוב לפי זמן'}
          >
            ⏱️ {termOf(config, 'nav.timer', 'טיימר כסף')}
          </Btn>
        )}
        {cashboxOn && (
          <Btn
            onClick={() => {
              window.location.hash = '#cashbox';
            }}
            title={termOf(config, 'nav.cashbox', 'קופה רושמת') + ' — קבלת מזומן ועודף'}
          >
            💵 {termOf(config, 'nav.cashbox', 'קופה רושמת')}
          </Btn>
        )}
        {bodymapOn && (
          <Btn
            onClick={() => {
              window.location.hash = '#bodymap';
            }}
            title={termOf(config, 'nav.bodymap', 'אזורי טיפול') + ' — מעקב טיפולים'}
          >
            🧍 {termOf(config, 'nav.bodymap', 'אזורי טיפול')}
          </Btn>
        )}
        {familiesOn && (
          <Btn kind="primary" onClick={() => go('families')} title="למסך המשפחות — הוספה">
            👨‍👩‍👧‍👦 {termOf(config, 'entity.family', 'משפחה')}
          </Btn>
        )}
        {punchOn && (
          <Btn
            onClick={() => (data.sessions.length ? selectCourse(data.sessions[0].course.id) : go('courses'))}
            title={data.sessions.length ? 'ניקוב מהיר — ' + data.sessions[0].course.name : 'למסך החוגים'}
          >
            ✓ ניקוב
          </Btn>
        )}
        {receiptsOn && (
          <Btn onClick={() => go(supportersOn ? 'supporters' : 'courses')} title="הפקת קבלה על תרומה או תשלום">
            🧾 קבלה
          </Btn>
        )}
        <Btn
          onClick={() => exportBackup()}
          title="הורדת קובץ גיבוי מלא — כמו בהגדרות ← גיבוי"
        >
          ⬇ גיבוי
        </Btn>
      </div>
    </section>
  );
}

/* ── הרישום עצמו ── */

export type WidgetId =
  | 'hero'
  | 'bdays'
  | 'digest'
  | 'carousel'
  | 'stats'
  | 'today'
  | 'attention'
  | 'recent'
  | 'goldbook'
  | 'hebcal'
  | 'community'
  | 'contacts'
  | 'punchlow'
  | 'quick'
  | 'coursemetrics'
  | 'credmetrics'
  | 'suggest';

export interface HomeWidget {
  id: WidgetId;
  /** שם תצוגה — למסגרת העריכה ולספריית "הוספת ווידג'ט". */
  label: string;
  icon: string;
  /**
   * רוחב במצב תצוגה: 'half' — חצאים סמוכים בפריסה יושבים זה לצד זה
   * בגריד auto-fit (בדיוק כמו "היום" + "דורש טיפול" במקור); 'full' — שורה מלאה.
   */
  slot: 'full' | 'half';
  /** hero אינו ניתן להסרה — תמיד ראשון בלוח. */
  removable: boolean;
  /** גייטינג קיים — ווידג'ט לא-visible מדולג ברינדור גם אם הוא בפריסה. */
  visible: (cfg: OrgConfig) => boolean;
  render: (ctx: HomeCtx) => ReactElement;
}

/**
 * 💡 הצעות מקדימות (SHOP8) — מנוע מקדים-הצורך: חג מתקרב · גיל בית-ספר · תינוק ·
 * כרטיסייה נגמרת. כל הצעה = כרטיס עם "טפל" (קפיצה לעמודה) ו-"התעלם" (attnDone).
 * המנוע טהור (shop8/lib); הווידג'ט רק מציג ומחווט. אפס נגיעה בכסף.
 */
function SuggestWidget({ ctx }: { ctx: HomeCtx }) {
  const { db, todayIso, go, selectFamily, markAttnDone } = ctx;
  const items = liveSuggestions(db, todayIso);
  return (
    <Panel icon="💡" title="הצעות מקדימות" badge={items.length ? String(items.length) : undefined}>
      {items.length === 0 && (
        <div style={{ ...softEmpty, color: 'var(--green)', fontWeight: 600 }}>אין הצעות פתוחות כרגע ✓</div>
      )}
      {items.slice(0, 8).map((s) => (
        <div key={s.key} className="hm-row" style={{ alignItems: 'center' }}>
          <span aria-hidden style={{ fontSize: 18 }}>{s.emoji}</span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <b>{s.title}</b>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-faint)' }}>{s.detail}</span>
          </span>
          <Btn sm kind="primary" onClick={() => { if (s.famId) selectFamily(s.famId); go(s.act); }}>טפל ←</Btn>
          <Btn sm onClick={() => markAttnDone(s.key)} title="התעלם מההצעה">✕</Btn>
        </div>
      ))}
      {items.length > 8 && <div style={softEmpty}>+{items.length - 8} הצעות נוספות</div>}
    </Panel>
  );
}

export const HOME_WIDGETS: Record<WidgetId, HomeWidget> = {
  hero: {
    id: 'hero',
    label: 'ברכה ופעולות מהירות',
    icon: '🏠',
    slot: 'full',
    removable: false,
    visible: () => true,
    render: (ctx) => <HeroWidget ctx={ctx} />,
  },
  bdays: {
    id: 'bdays',
    label: 'ימי הולדת היום',
    icon: '🎂',
    slot: 'full',
    removable: true,
    // ימי ההולדת נגזרים מבני המשפחה — כבוי כשמודול המשפחות כבוי
    visible: (cfg) => moduleOn(cfg, 'families') && featureOn(cfg, 'home.bdays'),
    render: (ctx) => <BdaysWidget ctx={ctx} />,
  },
  digest: {
    id: 'digest',
    label: 'תקציר הבוקר',
    icon: '☀️',
    slot: 'full',
    removable: true,
    // מוסתר כשהפיצ'ר home.digest כבוי (כמו במקור)
    visible: (cfg) => featureOn(cfg, 'home.digest'),
    render: (ctx) => <DigestWidget ctx={ctx} />,
  },
  carousel: {
    id: 'carousel',
    label: 'אירועים קרובים',
    icon: '🎂',
    slot: 'full',
    removable: true,
    // מוסתרת כשהפיצ'ר home.carousel כבוי (כמו במקור)
    visible: (cfg) => featureOn(cfg, 'home.carousel'),
    render: (ctx) => <Carousel items={ctx.data.carousel} navTo={ctx.navTo} />,
  },
  stats: {
    id: 'stats',
    label: 'כרטיסי נתונים',
    icon: '📊',
    slot: 'full',
    removable: true,
    visible: (cfg) => featureOn(cfg, 'home.stats'),
    render: (ctx) => <StatsWidget ctx={ctx} />,
  },
  today: {
    id: 'today',
    label: 'היום',
    icon: '📅',
    slot: 'half',
    removable: true,
    visible: (cfg) => featureOn(cfg, 'home.today'),
    render: (ctx) => <TodayWidget ctx={ctx} />,
  },
  attention: {
    id: 'attention',
    label: 'דורש טיפול',
    icon: '🔔',
    slot: 'half',
    removable: true,
    // מוסתר כולו כשהפיצ'ר home.care כבוי (כמו במקור)
    visible: (cfg) => featureOn(cfg, 'home.care'),
    render: (ctx) => <AttentionWidget ctx={ctx} />,
  },
  recent: {
    id: 'recent',
    label: 'משפחות אחרונות',
    icon: '👨‍👩‍👧‍👦',
    slot: 'full',
    removable: true,
    visible: (cfg) => moduleOn(cfg, 'families') && featureOn(cfg, 'home.recent'),
    render: (ctx) => <RecentWidget ctx={ctx} />,
  },
  goldbook: {
    id: 'goldbook',
    label: 'ספר הזהב',
    icon: '🏆',
    slot: 'half',
    removable: true,
    visible: (cfg) => moduleOn(cfg, 'supporters') && featureOn(cfg, 'home.goldbook'),
    render: (ctx) => <GoldbookWidget ctx={ctx} />,
  },
  hebcal: {
    id: 'hebcal',
    label: 'הלוח העברי',
    icon: '📜',
    slot: 'half',
    removable: true,
    visible: (cfg) => moduleOn(cfg, 'calendar') && featureOn(cfg, 'home.hebcal'),
    render: (ctx) => <HebcalWidget ctx={ctx} />,
  },
  community: {
    id: 'community',
    label: 'אמינות קהילתית',
    icon: '🤝',
    slot: 'half',
    removable: true,
    visible: (cfg) => featureOn(cfg, 'families.cred') && featureOn(cfg, 'home.community'),
    render: (ctx) => <CommunityWidget ctx={ctx} />,
  },
  contacts: {
    id: 'contacts',
    label: 'תורמים · יעדי קשר',
    icon: '💛',
    slot: 'half',
    removable: true,
    visible: (cfg) => featureOn(cfg, 'supporters.nextdate') && featureOn(cfg, 'home.contacts'),
    render: (ctx) => <ContactsWidget ctx={ctx} />,
  },
  punchlow: {
    id: 'punchlow',
    label: 'מלאי כרטיסיות',
    icon: '🎫',
    slot: 'half',
    removable: true,
    visible: (cfg) => featureOn(cfg, 'courses.punch') && featureOn(cfg, 'home.punchlow'),
    render: (ctx) => <PunchlowWidget ctx={ctx} />,
  },
  quick: {
    id: 'quick',
    label: 'פעולות מהירות',
    icon: '⚡',
    slot: 'full',
    removable: true,
    visible: (cfg) => featureOn(cfg, 'home.quick'),
    render: (ctx) => <QuickWidget ctx={ctx} />,
  },
  coursemetrics: {
    id: 'coursemetrics',
    label: 'תפוסת החוגים',
    icon: '📊',
    slot: 'half',
    removable: true,
    visible: (cfg) => moduleOn(cfg, 'courses') && featureOn(cfg, 'home.coursemetrics'),
    render: (ctx) => <CourseMetricsWidget ctx={ctx} />,
  },
  credmetrics: {
    id: 'credmetrics',
    label: 'מדד אמינות מורחב',
    icon: '🎯',
    slot: 'half',
    removable: true,
    visible: (cfg) => featureOn(cfg, 'families.cred') && featureOn(cfg, 'home.credmetrics'),
    render: (ctx) => <CredMetricsWidget ctx={ctx} />,
  },
  suggest: {
    id: 'suggest',
    label: 'הצעות מקדימות 💡',
    icon: '💡',
    slot: 'full',
    removable: true,
    // מנוע מקדים-הצורך (SHOP8) — נגזר מהמשפחות; כבוי כשמודול המשפחות/הדגל כבוי
    visible: (cfg) => moduleOn(cfg, 'families') && featureOn(cfg, 'home.suggest'),
    render: (ctx) => <SuggestWidget ctx={ctx} />,
  },
};

/**
 * פריסות ברירת מחדל פר-ערכה — כשאין פריסה שמורה (db.ui.homeLayout === undefined)
 * החלפת ערכה מחליפה את אופי הלוח כולו, כמו במוקאפים.
 * פריסה שמורה של המשתמש תמיד גוברת; ווידג'ט שהמודול/פיצ'ר שלו כבוי פשוט מדולג.
 */
export const THEME_LAYOUTS: Record<string, readonly WidgetId[]> = {
  /* אור ראשון (mock-desktop) — hero, אריחים, קרוסלה, ואז שתי עמודות.
     מדדי החוגים והאמינות (P2 פערים 19-20) בברירת המחדל — כמו בדשבורד הלגאסי */
  'or-rishon': ['hero', 'stats', 'carousel', 'today', 'recent', 'attention', 'suggest', 'community', 'coursemetrics', 'credmetrics'],
  /* היכל (mock-heichal) — "ערב גאלה": רצועת נתונים ושתי עמודות שקטות */
  heichal: ['hero', 'stats', 'today', 'attention', 'suggest', 'goldbook', 'hebcal'],
  /* צֹהַר (mock-tsohar) — דשבורד תפעולי נקי: נתונים, היום 2:1 מול דורש טיפול */
  tsohar: ['hero', 'stats', 'today', 'attention', 'suggest', 'recent'],
  /* קהילה (mock-kehila) — נתונים "נעוצים" ב-hero, באנר יום הולדת, ואז עמודות */
  kehila: ['hero', 'stats', 'bdays', 'today', 'attention', 'suggest', 'community'],
};

/**
 * תבנית שתי-עמודות פר-ערכה — בדיוק סידור המוקאפ: pre = שורות מלאות אחרי
 * ה-hero, ואז colA (העמודה הימנית, הרחבה) מול colB (השמאלית), ואז post.
 * חלה רק על פריסת ברירת המחדל (אין db.ui.homeLayout שמור) — פריסה מותאמת
 * של המשתמש ממשיכה להתרנדר בגריד הגנרי, ו-BoardEdit עובד כרגיל.
 * הסדר השטוח (pre+colA+colB+post) זהה לסדר ה-preset ב-THEME_LAYOUTS.
 */
export interface ThemeBoardTemplate {
  pre: readonly WidgetId[];
  colA: readonly WidgetId[];
  colB: readonly WidgetId[];
  post: readonly WidgetId[];
}

export const THEME_TEMPLATES: Record<string, ThemeBoardTemplate> = {
  /* mock-desktop: ימין היום+משפחות אחרונות · שמאל דורש טיפול+אמינות (1.25fr/1fr) */
  'or-rishon': { pre: ['stats', 'carousel'], colA: ['today', 'recent'], colB: ['attention', 'community'], post: ['coursemetrics', 'credmetrics'] },
  /* mock-heichal: ימין סדר היום+נר תמיד · שמאל ספר הזהב+הלוח העברי (1.3fr/1fr) */
  heichal: { pre: ['stats'], colA: ['today', 'attention'], colB: ['goldbook', 'hebcal'], post: [] },
  /* mock-tsohar: היום כטבלה רחבה (2fr) מול דורש טיפול (1fr) */
  tsohar: { pre: ['stats'], colA: ['today'], colB: ['attention'], post: ['recent'] },
  /* mock-kehila: ימין המפגשים של היום · שמאל שווה לטפל+הקהילה שלנו (1.3fr/1fr) */
  kehila: { pre: ['stats', 'bdays'], colA: ['today'], colB: ['attention', 'community'], post: [] },
};

/** סדר ברירת המחדל הקלאסי (אור ראשון) — fallback לערכה לא מוכרת. */
export const DEFAULT_LAYOUT: readonly WidgetId[] = THEME_LAYOUTS['or-rishon'];

/** פריסת ברירת המחדל של ערכה — ערכה לא מוכרת מקבלת את הקלאסית. */
export function defaultLayoutFor(theme: string): readonly WidgetId[] {
  return THEME_LAYOUTS[theme] ?? DEFAULT_LAYOUT;
}

/** ספריית הווידג'טים המלאה — הסדר שבו מוצעים אבני הבניין במצב עריכה. */
export const WIDGET_LIBRARY: readonly WidgetId[] = [
  'hero',
  'bdays',
  'digest',
  'carousel',
  'stats',
  'today',
  'attention',
  'recent',
  'goldbook',
  'hebcal',
  'community',
  'contacts',
  'punchlow',
  'quick',
  'coursemetrics',
  'credmetrics',
  'suggest',
];

function isWidgetId(id: string): id is WidgetId {
  return id in HOME_WIDGETS;
}

/**
 * נרמול פריסה שמורה (db.ui.homeLayout) לרשימת מזהים תקפה:
 * undefined/ריק → ברירת המחדל (fallback — פריסת הערכה הנוכחית);
 * מזהים לא מוכרים/כפולים מסוננים; hero תמיד ראשון.
 */
export function sanitizeLayout(
  raw: readonly string[] | undefined,
  fallback: readonly WidgetId[] = DEFAULT_LAYOUT,
): WidgetId[] {
  if (!raw || raw.length === 0) return [...fallback];
  const out: WidgetId[] = [];
  for (const id of raw) {
    if (isWidgetId(id) && !out.includes(id)) out.push(id);
  }
  const i = out.indexOf('hero');
  if (i > 0) out.splice(i, 1);
  if (i !== 0) out.unshift('hero');
  return out;
}
