/**
 * בונה "דו"ח מותאם" — טהור לחלוטין: לפי יעד (חוגים / אירועים / תומכות),
 * טווח תאריכים ורשימת שדות נבחרים → שורות CSV (כותרת + נתונים).
 * אירועים חוזרים (אזכרה/יום נישואין/יום הולדת) מורחבים על פני הטווח.
 * שדות המתייחסים למעקב הטיפול נכללים רק כשהפיצ'ר supporters.ayin דלוק.
 */
import { HEBREW_RECURRING, type Db, type EventType } from '../types/domain';
import type { OrgConfig } from '../types/config';
import type { Cell } from './csvx';
import { featureOn } from './config';
import { featLabel, itemLabel, stageLabel, unitLabel } from './ayin';
import { hebDateFull, hebParts } from './hebrew';

export type ExportTarget = 'courses' | 'events' | 'supporters';

export interface ExportRange {
  from: string;
  to: string;
}

export interface ExpField {
  key: string;
  label: string;
}

/** תוויות סוגי אירועים (עקבי עם EV_META בלוח השנה) — כאן בלי React. */
const EVENT_TYPE_LABEL: Record<EventType, string> = {
  reminder: 'תזכורת',
  call: 'טלפון',
  wedding: 'חתונה',
  memorial: 'אזכרה',
  anniversary: 'יום נישואים',
  bday: 'יום הולדת',
  org: 'אירוע',
  custom: 'אירוע',
};

/** הגדרות השדות ליעד — תוויות מעקב הטיפול עוברות דרך מילון המונחים. */
export function expFieldDefs(cfg: OrgConfig, target: ExportTarget): ExpField[] {
  if (target === 'courses') {
    return [
      { key: 'name', label: 'שם החוג' },
      { key: 'teacher', label: 'מורה + טלפון' },
      { key: 'model', label: 'מסלול ומחיר' },
      { key: 'occ', label: 'תפוסה' },
      { key: 'students', label: 'רשימת תלמידים' },
      { key: 'pays', label: 'תשלומים בטווח' },
      { key: 'abs', label: 'חיסורים בטווח' },
    ];
  }
  if (target === 'events') {
    return [
      { key: 'title', label: 'כותרת' },
      { key: 'type', label: 'סוג אירוע' },
      { key: 'hdate', label: 'תאריך עברי' },
      { key: 'gdate', label: 'תאריך לועזי' },
      { key: 'time', label: 'שעה' },
      { key: 'fam', label: 'משפחה' },
      { key: 'notes', label: 'הערות' },
      { key: 'done', label: 'בוצע' },
    ];
  }
  const defs: ExpField[] = [
    { key: 'name', label: 'שם' },
    { key: 'phone', label: 'טלפון' },
    { key: 'email', label: 'אימייל' },
    { key: 'dons', label: 'תרומות בטווח (מספר + סכום)' },
  ];
  if (featureOn(cfg, 'supporters.ayin')) {
    defs.push(
      { key: 'stage', label: 'שלב ' + featLabel(cfg) },
      { key: 'names', label: itemLabel(cfg) + ' + ' + unitLabel(cfg) },
      { key: 'answers', label: 'תשובות/הערות בטווח' },
      { key: 'next', label: 'תאריך יעד לקשר' },
    );
  }
  return defs;
}

function inR(iso: string, r: ExportRange): boolean {
  if (!iso) return false;
  if (r.from && iso < r.from) return false;
  if (r.to && iso > r.to) return false;
  return true;
}

function isoOf(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

function fmtD(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * בניית שורות הדו"ח — כותרת מהשדות הנבחרים בלבד, ואז שורת נתונים לכל רשומה.
 * selectedKeys קובע גם את הסדר (לפי סדר ה-defs, מסונן להנבחרים).
 */
export function buildCustomExport(
  cfg: OrgConfig,
  db: Db,
  target: ExportTarget,
  range: ExportRange,
  selectedKeys: string[],
): Cell[][] {
  const defs = expFieldDefs(cfg, target).filter((f) => selectedKeys.includes(f.key));
  const rows: Cell[][] = [defs.map((f) => f.label)];
  if (!defs.length) return rows;
  const pick = (obj: Record<string, Cell>) => defs.map((f) => obj[f.key] ?? '');

  if (target === 'courses') {
    // אינדקס בני משפחה לשמות התלמידים (בלי לגעת ב-store)
    const memberFirst = new Map<string, string>();
    for (const fam of db.families) for (const m of fam.members) memberFirst.set(m.id, m.first);
    for (const c of db.courses) {
      const ens = db.enrollments.filter((e) => e.courseId === c.id);
      let payN = 0;
      let paySum = 0;
      let absN = 0;
      for (const e of ens) {
        for (const p of e.payments) if (inR(p.date, range)) { payN++; paySum += p.amount || 0; }
        for (const ab of e.absences) if (inR(ab.date, range)) absN++;
      }
      const t = db.teachers.find((x) => x.id === c.teacherId);
      rows.push(
        pick({
          name: c.name,
          teacher: (t?.name || '') + (t?.phone ? ' ' + t.phone : ''),
          model: (c.model === 'punch' ? 'כרטיסייה' : 'מנוי חודשי') + ' · ₪' + (c.price || 0),
          occ: ens.length + '/' + (c.maxStudents || '—'),
          students: ens.map((e) => memberFirst.get(e.memberId) || '').filter(Boolean).join(' · '),
          pays: payN + ' תשלומים · ₪' + paySum,
          abs: absN + ' חיסורים',
        }),
      );
    }
    return rows;
  }

  if (target === 'events') {
    const bounded = !!range.from && !!range.to;
    const occ: { title: string; type: string; date: string; time: string; fam: string; notes: string; done: boolean }[] = [];
    for (const ev of db.events) {
      if (!ev.date) continue;
      const rec = {
        title: ev.title,
        type: ev.customType || EVENT_TYPE_LABEL[ev.type],
        time: ev.time || '',
        fam: db.families.find((f) => f.id === ev.famId)?.name || '',
        notes: ev.notes || '',
        done: ev.done,
      };
      if (HEBREW_RECURRING.has(ev.type) && bounded) {
        const oh = hebParts(new Date(ev.date + 'T12:00:00'));
        const d0 = new Date(range.from + 'T12:00:00');
        const d1 = new Date(range.to + 'T12:00:00');
        for (let dd = new Date(d0), k = 0; dd <= d1 && k < 366; dd.setDate(dd.getDate() + 1), k++) {
          const hp = hebParts(dd);
          if (hp.day === oh.day && hp.month === oh.month) occ.push({ ...rec, date: isoOf(dd) });
        }
      } else if (inR(ev.date, range) || (!range.from && !range.to)) {
        occ.push({ ...rec, date: ev.date });
      }
    }
    occ.sort((a, b) => a.date.localeCompare(b.date));
    for (const o of occ) {
      rows.push(
        pick({
          title: o.title,
          type: o.type,
          hdate: hebDateFull(o.date),
          gdate: fmtD(o.date),
          time: o.time,
          fam: o.fam,
          notes: o.notes,
          done: o.done ? 'כן' : 'לא',
        }),
      );
    }
    return rows;
  }

  // supporters
  const ayinOn = featureOn(cfg, 'supporters.ayin');
  for (const sp of db.supporters) {
    const dons = sp.donations.filter((d) => inR(d.date, range));
    const a = sp.ayin;
    const answers = a ? a.answers.filter((x) => inR(x.date, range)) : [];
    const touchedInRange =
      ayinOn && !!a && (inR(a.lastTouch, range) || a.log.some((l) => inR(l.date, range)));
    if (!(dons.length || answers.length || touchedInRange)) continue;
    const ils = dons.filter((d) => d.cur !== '$').reduce((x, d) => x + (+d.amount || 0), 0);
    const usd = dons.filter((d) => d.cur === '$').reduce((x, d) => x + (+d.amount || 0), 0);
    const obj: Record<string, Cell> = {
      name: sp.name,
      phone: sp.phone || '',
      email: sp.email || '',
      dons: dons.length + ' תרומות · ₪' + ils + (usd ? ' + $' + usd : ''),
    };
    if (ayinOn && a) {
      obj.stage = stageLabel(cfg, a.stage);
      obj.names = a.names
        .map((n) => n.name + (n.eyes !== '' && n.eyes != null ? ' ·' + n.eyes : '') + (n.done ? ' ✓' : ''))
        .join(' · ');
      obj.answers = answers.map((x) => x.note).join(' | ');
      obj.next = a.nextTalk ? fmtD(a.nextTalk) + (a.nextTalkTime ? ' ' + a.nextTalkTime : '') : '';
    }
    rows.push(pick(obj));
  }
  return rows;
}
