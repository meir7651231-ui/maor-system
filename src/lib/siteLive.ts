/**
 * 📡 «שידור חי» באתר-הציבורי — הצעת-המספרים מנתוני-המשרד (3.11.2026, בקשת-בעלים «תכין לו בעריכת-אתר ·
 * בפעם הראשונה שליטה מלאה על המספרים»).
 *
 * המערכת **מציעה** ולא מפרסמת: הפונקציה מחזירה תוכן-טיוטה לעורך-האתר; המנהל עורך/מסתיר ולוחץ «שמירה ופרסום».
 * פרטיות: **סכומים כוללים בלבד** — בלי שמות משפחות/ילדים/תורמים (בשונה ממצב-הראווה במשרד, שהטיקר והלוח
 * שלו נושאים שמות). «השבוע בבית» = חגים + מפגשי-חוגים בלבד (בלי אירועי-לוח — הם פרטיים). בלי "גבייה היום".
 * המספרים עצמם = אותו חישוב של קיר-ההשפעה (buildWallData) — מקור-אמת יחיד. טהור (now מוזרק).
 */
import type { Db } from '../types/domain';
import type { LocalizedText, OrgConfig, PublicSiteLive, PublicSiteLiveCard, PublicSiteLiveWeek } from '../types/config';
import { buildWallData } from '../components/wall/wallData';
import { gem, holidayOf } from './hebrew';
import { blockReason, hpOf, isoOf, sessionsOf } from '../components/calendar/calLib';

const nf = new Intl.NumberFormat('he-IL');
const fmtHebMonth = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const L = (he: string, en: string, es: string, fr: string): LocalizedText => ({ he, en, es, fr });
const yearBadge = (n: number): LocalizedText | undefined =>
  n > 0 ? L(`‎+${nf.format(n)} השנה`, `+${nf.format(n)} this year`, `+${nf.format(n)} este año`, `+${nf.format(n)} cette année`) : undefined;

/** 7 הימים הקרובים: חגים + מפגשי-חוגים (שמות-חוגים בלבד — לא אנשים). */
function weekRows(db: Db, now: Date): PublicSiteLiveWeek[] {
  const out: PublicSiteLiveWeek[] = [];
  for (let i = 0; i < 7 && out.length < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const iso = isoOf(d);
    const when = `${gem(hpOf(iso, d).day)} ${fmtHebMonth.format(d)}`;
    const hol = holidayOf(d);
    if (hol) out.push({ when, title: { he: hol }, note: L('חג ומועד', 'Holiday', 'Festividad', 'Fête') });
    if (blockReason(d, 'course')) continue;
    const dow = d.getDay();
    const names = db.courses
      .filter((c) => (!c.start || iso >= c.start) && (!c.end || iso <= c.end) && sessionsOf(c).some((s) => s.day === dow))
      .map((c) => c.name);
    if (names.length) {
      const n = names.length;
      out.push({
        when,
        title: L(n === 1 ? 'חוג אחד בבית' : `${n} חוגים בבית`, n === 1 ? 'One class at the home' : `${n} classes at the home`, n === 1 ? 'Un taller en el hogar' : `${n} talleres en el hogar`, n === 1 ? 'Un atelier au foyer' : `${n} ateliers au foyer`),
        note: { he: names.slice(0, 3).join(' · ') },
      });
    }
  }
  return out.slice(0, 7);
}

/** הצעת תוכן «שידור חי» מנתוני-המשרד. מחזירה טיוטה מלאה (כולם גלויים, enabled לא נוגע — המנהל מחליט). */
export function siteLiveFromDb(db: Db, now: Date, config?: OrgConfig): PublicSiteLive {
  const w = buildWallData(db, now, config);
  const todayIso = isoOf(now);
  const yearKey = todayIso.slice(0, 4);
  const monthKey = todayIso.slice(0, 7);
  const famNew = db.families.filter((f) => (f.createdAt ?? '').startsWith(yearKey)).length;
  const supNew = db.supporters.filter((s) => s.first && s.first.startsWith(yearKey)).length;
  const kidsVal = w.kpisRight[1]?.value ?? '0';
  const cards: PublicSiteLiveCard[] = [
    { src: 'families', icon: '🏠', value: w.kpisRight[0]?.value ?? '0', label: L('משפחות בליווי קבוע', 'Families we accompany', 'Familias que acompañamos', 'Familles accompagnées'), badge: yearBadge(famNew) },
    { src: 'kids', icon: '🎨', value: kidsVal, label: L('ילדים וילדות בחוגים', 'Children in our classes', 'Niños en nuestros talleres', 'Enfants dans nos ateliers') },
    { src: 'sessions', icon: '🤍', value: w.kpisRight[2]?.value ?? '0', label: L('מפגשי חסד שהתקיימו', 'Moments of kindness held', 'Encuentros de bondad realizados', 'Moments de bonté réalisés') },
    { src: 'donors', icon: '🙏', value: nf.format(db.supporters.length), label: L('תורמים שותפים', 'Partner donors', 'Donantes aliados', 'Donateurs partenaires'), badge: yearBadge(supNew) },
  ].map((c) => (c.badge ? c : { src: c.src, icon: c.icon, value: c.value, label: c.label }));
  const today: PublicSiteLiveCard[] = [
    { src: 'kidsToday', value: w.miniKpis[0]?.value ?? '0', label: L('ילדים בחוגי היום', 'Children in class today', 'Niños en talleres hoy', "Enfants en atelier aujourd'hui") },
    { src: 'sessionsToday', value: w.miniKpis[1]?.value ?? '0', label: L('מפגשים היום', 'Sessions today', 'Encuentros hoy', "Séances aujourd'hui") },
    { src: 'bdays', value: w.miniKpis[3]?.value ?? '0', label: L('ימי הולדת היום 🎂', 'Birthdays today 🎂', 'Cumpleaños hoy 🎂', "Anniversaires aujourd'hui 🎂") },
    { src: 'open', value: '24/7', label: L('הבית פתוח', 'Our home is open', 'Nuestro hogar está abierto', 'Notre foyer est ouvert') },
  ];
  // טיקר בלי שמות: ספירות בלבד
  const donMonth = db.supporters.reduce((a, s) => a + s.donations.filter((d) => d.date.startsWith(monthKey)).length, 0);
  const ticker: LocalizedText[] = [];
  if (famNew > 0) ticker.push(L(`♡ ${nf.format(famNew)} משפחות הצטרפו לבית השנה`, `♡ ${nf.format(famNew)} families joined us this year`, `♡ ${nf.format(famNew)} familias se unieron este año`, `♡ ${nf.format(famNew)} familles nous ont rejoints cette année`));
  if (donMonth > 0) ticker.push(L(`♡ ${nf.format(donMonth)} תרומות התקבלו החודש`, `♡ ${nf.format(donMonth)} donations received this month`, `♡ ${nf.format(donMonth)} donaciones recibidas este mes`, `♡ ${nf.format(donMonth)} dons reçus ce mois-ci`));
  if (supNew > 0) ticker.push(L(`♡ ${nf.format(supNew)} תורמים חדשים הצטרפו השנה`, `♡ ${nf.format(supNew)} new donors this year`, `♡ ${nf.format(supNew)} nuevos donantes este año`, `♡ ${nf.format(supNew)} nouveaux donateurs cette année`));
  ticker.push(L('♡ הבית פתוח 24/7', '♡ Our home is open 24/7', '♡ Nuestro hogar está abierto 24/7', '♡ Notre foyer est ouvert 24 h/24'));
  return {
    title: L('מה קורה עכשיו בבית.', "What's happening at home now.", 'Lo que pasa ahora en el hogar.', "Ce qui se passe au foyer en ce moment."),
    cards,
    raised: { value: Math.round(w.raisedThisYear), ...(w.goal > 0 ? { goal: w.goal } : {}) },
    today,
    week: weekRows(db, now),
    ticker,
    asOf: todayIso,
  };
}
