/**
 * 🌅 מנוע תדרוך-הבוקר (VISION-LIGHT ‏#29, 23.8.2026, חבילת-הבידול · Zero-UI) —
 * "הבוקר שלך" במבט-אחד: במקום לפתוח חמישה מסכים, המערכת מאחדת את כל התורים
 * הקיימים — שיחות/תודות/הו"ק מהקוקפיט · העונה-העברית · חוגי-היום · אירועי-
 * היום — לתדרוך אחד עם קפיצה-למסך ונוסח-הקראה.
 *
 * טהור ודטרמיניסטי: אגרגציה-בלבד מעל מנועים קיימים (אפס-חישוב-חדש, אפס-
 * כתיבה, אפס-סכמה); היום/השעה מוזרקים. ‏opt-in ‏`home.morningbrief === true`.
 */
import type { Db } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { cockpitQueue } from '../supporters/cockpit';
import { hebSeasonOf, hebTimingTasks } from '../supporters/hebTiming';
import { todaySessions } from './homeData';

export interface BriefSection {
  key: 'calls' | 'thanks' | 'hok' | 'season' | 'sessions' | 'events';
  icon: string;
  title: string;
  count: number;
  /** עד 3 שורות-הצצה ("שם — סיבה"). */
  top: string[];
  /** המסך שאליו קופצים ('supporters' / 'courses' / 'calendar'). */
  view: string;
}

export interface MorningBrief {
  /** ‏"יום ראשון, כ״ט באב" נבנה ב-UI; כאן רק המספרים. */
  sections: BriefSection[];
  /** true = בוקר נקי, אין כלום. */
  empty: boolean;
}

const TOP = 3;
const names = (xs: { name: string; reason?: string }[]) =>
  xs.slice(0, TOP).map((t) => t.name + (t.reason ? ' — ' + t.reason : ''));

export function morningBrief(db: Db, config: OrgConfig, todayIso: string, now: Date, usdRate: number): MorningBrief {
  const rate = usdRate || 3.7;
  const sections: BriefSection[] = [];

  // תורי-הקוקפיט — שיחות/תודות/הו"ק (אותו מנוע, אותם ספים)
  const q = cockpitQueue(db.supporters, todayIso, rate, config);
  if (q.calls.length) sections.push({ key: 'calls', icon: '📞', title: 'שיחות להיום', count: q.calls.length, top: names(q.calls), view: 'supporters' });
  if (q.thanks.length) sections.push({ key: 'thanks', icon: '💛', title: 'תודות לומר', count: q.thanks.length, top: names(q.thanks), view: 'supporters' });
  if (q.hok.length) sections.push({ key: 'hok', icon: '🔁', title: 'הו"ק שטרם נרשמו החודש', count: q.hok.length, top: names(q.hok), view: 'supporters' });

  // 🕎 העונה-העברית — רק כשהדגל שלה דלוק (אותו opt-in של הקוקפיט)
  if (config.features?.['supporters.hebtiming'] === true) {
    const heb = hebTimingTasks(db.supporters, todayIso);
    if (heb.length) {
      const season = hebSeasonOf(todayIso);
      sections.push({ key: 'season', icon: '🕎', title: 'העונה שלהם — ' + season.monthHe, count: heb.length, top: names(heb), view: 'supporters' });
    }
  }

  // 🎨 חוגי-היום (מנוע-הבית הקיים)
  const sessions = todaySessions(db, now);
  if (sessions.length) {
    sections.push({
      key: 'sessions', icon: '🎨', title: 'מפגשים היום', count: sessions.length,
      top: sessions.slice(0, TOP).map((s) => s.course.name + (s.session?.time ? ' · ' + s.session.time : '')),
      view: 'courses',
    });
  }

  // 📅 אירועי-היום מהלוח
  const events = db.events.filter((e) => e.date === todayIso);
  if (events.length) {
    sections.push({
      key: 'events', icon: '📅', title: 'אירועים היום', count: events.length,
      top: events.slice(0, TOP).map((e) => e.title + (e.time ? ' · ' + e.time : '')),
      view: 'calendar',
    });
  }

  return { sections, empty: sections.length === 0 };
}

/** נוסח-הקראה עברי (speechSynthesis) — משפט פר-מדור, בלי שמות (צנעה בקול רם). */
export function briefSpeechText(orgName: string, brief: MorningBrief): string {
  if (brief.empty) return 'בוקר טוב! אין משימות פתוחות להיום ב' + orgName + '. יום מצוין.';
  const parts = brief.sections.map((s) => {
    switch (s.key) {
      case 'calls': return s.count + ' שיחות ממתינות';
      case 'thanks': return s.count + ' תודות לומר';
      case 'hok': return s.count + ' הוראות קבע שטרם נרשמו החודש';
      case 'season': return s.count + ' תורמים שזו העונה שלהם';
      case 'sessions': return s.count + ' מפגשים היום';
      case 'events': return s.count + ' אירועים בלוח';
      default: return '';
    }
  }).filter(Boolean);
  return 'בוקר טוב! התדרוך של ' + orgName + ': ' + parts.join(', ') + '. בהצלחה!';
}
