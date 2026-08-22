/**
 * משפחות תומכות (תורמים) — חיפוש מנורמל, סינון קטגוריה ודרגות RFM,
 * טבלה עם מיון תלת-מצבי (עולה/יורד/כבוי), טופס תומכ/ת וכרטיס מפורט.
 */
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting, isAdminUser, safeHttpsUrl, telephonyOn, termOf } from '../../lib/config';
import { DialerModal } from '../dialer/DialerModal';
import { WaBtn } from '../WaBtn';
import { IncomingPaymentsModal } from './IncomingPayments';
import { NedarimSyncModal } from './NedarimSyncModal';
import { annualAllLines, downloadAnnualReport } from '../../lib/annualReport';
import { normSearch } from '../../lib/validate';
import { hebDateFull } from '../../lib/hebrew';
import { ayinAllRows, ayinDailyRows, ayinActive, eyesTotal, featLabel, itemLabel, stageIndex, stageLabel, unitLabel } from '../../lib/ayin';
import { downloadCsv } from '../../lib/csvx';
import { ActionsMenu, Btn, Chip, Empty, Modal, PageHead, Select, TextInput } from '../ui';
import { chipStyle, fmtDate, hokDue, hokEffectivelyActive, hokRecordedThisMonth, isoToday, sup12m, supAvgDon, supCount, supIls, supLast, supScore, supScoreBins, supTier, supTotalIls, supUsd, supporterVisibleForDesignations, visibleSupportersForDesignations, TIER_ORDER, totalLabel } from './lib';
import { numMatch } from '../families/lib';
import { SupporterForm } from './SupporterForm';
import { SupporterDetail } from './SupporterDetail';
import { SupporterCard } from './SupporterCard';
import { SupportersCockpit } from './SupportersCockpit';
import { atRiskIdSet, matchSegment, SEGMENTS, takeSupportersSegment, type SegmentKey } from './segments';

/** שנת-הגיוס (המתנה-הראשונה) — לדריל-אין מקוהורטת-הגיוס. null כשאין נתינה. */
function supAcqYear(sp: { donations: { date: string }[]; hist?: { d: string }[] }): number | null {
  let min = '';
  for (const d of sp.donations) if (d.date && (!min || d.date < min)) min = d.date;
  if (sp.hist) for (const h of sp.hist) if (h.d && (!min || h.d < min)) min = h.d;
  return min ? +min.slice(0, 4) : null;
}
/** האם התורם נתן בתקופה — שנה (yyyy) ו/או חודש (1–12). null=כל. חיפוש-מפורש. */
function supGaveInPeriod(
  sp: { donations: { date: string }[]; hist?: { d: string }[] },
  year: number | null,
  month: number | null,
): boolean {
  if (year == null && month == null) return true;
  const hit = (iso: string): boolean => {
    if (!iso) return false;
    if (year != null && +iso.slice(0, 4) !== year) return false;
    if (month != null && +iso.slice(5, 7) !== month) return false;
    return true;
  };
  if (sp.donations.some((d) => hit(String(d.date)))) return true;
  return !!sp.hist?.some((h) => hit(String(h.d)));
}
/** כל שנות-הנתינה שקיימות במאגר — לבורר-השנה, מהחדשה לישנה. */
function donationYears(sups: { donations: { date: string }[]; hist?: { d: string }[] }[]): number[] {
  const set = new Set<number>();
  for (const sp of sups) {
    for (const d of sp.donations) if (d.date) set.add(+String(d.date).slice(0, 4));
    if (sp.hist) for (const h of sp.hist) if (h.d) set.add(+String(h.d).slice(0, 4));
  }
  return [...set].filter((y) => y > 1900 && y < 3000).sort((a, b) => b - a);
}
import { SupportersIntel } from './SupportersIntel';
import { SupportersGalaxy } from './SupportersGalaxy';
import { SupportersUniverse3D } from './SupportersUniverse3D';
import { WarehouseBoard } from './WarehouseBoard';
import { SupportersKpiStrip } from './SupportersKpiStrip';
import { SupportersViewSwitcher } from './SupportersViewSwitcher';
import { CommandPalette } from './CommandPalette';
import type { Command } from './commands';
import { AyinBoard } from './AyinBoard';
import { AyinNamesBoard } from './AyinNamesBoard';
import { OrgDonationCalendar } from './DonationCalendar';
import { SupporterImport } from './SupporterImport';
import { SupDedupModal } from './SupDedupModal';
import { HokBulkModal } from './HokBulkModal';
import { findSupporterDupGroups } from '../../lib/dedup';
import { CustomExport } from '../reports/CustomExport';

type SortKey =
  | 'name'
  | 'cat'
  | 'phone'
  | 'email'
  | 'count'
  | 'ils'
  | 'usd'
  | 'last'
  | 'nextDate'
  | 'score'
  | 'stage'
  | 'eyes'
  | 'paid';

const HEAD: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'תומכ/ת' },
  { key: 'cat', label: 'קטגוריה' },
  { key: 'phone', label: 'טלפון' },
  { key: 'email', label: 'אימייל' },
  { key: 'count', label: 'תרומות' },
  { key: 'ils', label: 'סה"כ ₪' },
  { key: 'usd', label: 'סה"כ $' },
  { key: 'last', label: 'תרומה אחרונה' },
  { key: 'nextDate', label: 'קשר הבא' },
  { key: 'score', label: 'ציון RFM' },
  { key: 'stage', label: 'שלב טיפול' },
  { key: 'eyes', label: 'כמות' },
  // "שולם" ברמת התיק (P3 פריט 14; paid במודל מ-P0.4)
  { key: 'paid', label: 'שולם' },
];

function sortVal(sp: Supporter, key: SortKey, rate = 3.7): string | number {
  switch (key) {
    case 'name':
      return sp.name;
    case 'cat':
      return sp.cat || '';
    case 'phone':
      return sp.phone || '';
    case 'email':
      return sp.email || '';
    // הכרעת 9.8 "לכולל": מיון/סינון/תצוגה על הצבירה כולל-ההיסטוריה
    case 'count':
      return supCount(sp);
    case 'ils':
      return supIls(sp);
    case 'usd':
      return supUsd(sp);
    case 'last':
      return supLast(sp);
    case 'nextDate':
      return sp.nextDate || '';
    case 'score':
      return supScore(sp, rate);
    case 'stage':
      return sp.ayin ? stageIndex(sp.ayin.stage) : -1;
    case 'eyes':
      return sp.ayin ? eyesTotal(sp.ayin) : -1;
    case 'paid':
      return sp.ayin?.paid ? 1 : 0;
  }
}

/** צ'יפ דרגת RFM (זהב/כסף/ארד/רדומה) עם הציון בכלי-עזר. */
function TierChip(props: { sp: Supporter; rate?: number }) {
  const score = supScore(props.sp, props.rate);
  const tier = supTier(score);
  return (
    <span style={chipStyle(tier.bg, tier.c)} title={'ציון משוקלל (R·F·M): ' + score + '/1000'}>
      {tier.label}
    </span>
  );
}

export function SupportersView() {
  const db = useApp((s) => s.db);
  const rate = db.usdRate; // שער-דולר עריך — משוקלל בכל חישובי ה-₪-שקול והציון
  const config = useApp((s) => s.config);
  // תוויות-עמודה מונחיות — בורטיקל מסחרי "תורם/תרומות" הופכים למונח-הענף (termOf).
  const headLabel = (h: { key: SortKey; label: string }): string => {
    switch (h.key) {
      case 'name':
        return termOf(config, 'entity.supporter', 'תומכ/ת');
      case 'count':
        return termOf(config, 'entity.donations', 'תרומות');
      case 'last':
        return termOf(config, 'entity.donation', 'תרומה') + ' אחרונה';
      // עמודת "כמות" (eyes) = יחידת-המעקב; היה קשיח 'כמות' ⇒ עקף termOf ולא עקב
      // אחרי שינוי-שם בורטיקל. עכשיו דרך unitLabel (ברירת-מחדל 'כמות' — ביט-זהה).
      case 'eyes':
        return unitLabel(config);
      default:
        return h.label;
    }
  };
  const rfmOn = featureOn(config, 'supporters.rfm');
  const nextOn = featureOn(config, 'supporters.nextdate');
  const ayinOn = featureOn(config, 'supporters.ayin');
  const customReportOn = featureOn(config, 'supporters.customreport');
  // גל ג׳ (campaign): קישור-הקמפיין מהקונפיג — https בלבד (חיטוי-ענן)
  const campaignHref = integrationOn(config, 'campaign')
    ? safeHttpsUrl(integrationSetting(config, 'campaign', 'url'))
    : null;
  // גל ד׳ (payments): מסך תשלומים-נכנסים — רק לארגון-ענן מחובר
  const cloudOn = useApp((s) => s.cloud.enabled && !!s.cloud.user);
  const nedPending = useApp((s) => s.nedPending); // מונה-ממתינים חי (תג על הכפתור)
  // ג' (13.8) — ייעוד כהרשאת-תצוגה: העובד/ת רואה רק תורמים של הייעודים שהוקצו לו/ה.
  // null = בלי הגבלה (מנהל/בעלים/לקוח-מקומי). מסתיר ברמת-הממשק (כמו shell.privacy).
  const purposeOn = featureOn(config, 'supporters.purpose');
  const allowedDesignations = useApp((s) => s.cloud.allowedDesignations ?? null);
  const cloudEmail = useApp((s) => s.cloud.user?.email);
  const desigLimit = purposeOn ? allowedDesignations : null;
  const [incomingOpen, setIncomingOpen] = useState(false);
  const [nedSyncOpen, setNedSyncOpen] = useState(false);
  const dailyReportOn = featureOn(config, 'supporters.ayin.dailyreport');
  const importOn = featureOn(config, 'settings.import');
  // גידור-דגלים (FLAGMAX): מיון-כותרות / סינון-עמודות / פאנל-מתקדם / מסך-השמות —
  // חסר-דגל = פעיל (עטיפה = אפס-שינוי-ברירת-מחדל); false מסתיר, לא מנטרל.
  const sortOn = featureOn(config, 'supporters.sort');
  const colFilterOn = featureOn(config, 'supporters.colfilter');
  const advFilterOn = featureOn(config, 'supporters.advfilter');
  const ayinNamesOn = featureOn(config, 'supporters.ayin.names');
  const toast = useApp((s) => s.toast);
  // תצוגת גריד (5.8, בקשת-בעלים) — נשמרת ב-db.ui.supView, אותו דפוס כמו famView
  const setDb = useApp((s) => s.setDb);
  // UX סבב-ד׳: ברירת-מחדל חכמה — מסך-צר בלי העדפה-שמורה ⇒ גריד (טבלת 14
  // עמודות במגע = גלילה-צידית עיוורת); בחירה מפורשת של המשתמש תמיד גוברת.
  const supView = db.ui.supView ?? (typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches ? 'grid' : 'list');
  const toggleSupView = () =>
    setDb((d) => ({ ui: { ...d.ui, supView: (d.ui.supView ?? 'list') === 'grid' ? 'list' : 'grid' } }));

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  // בקשת-בעלים 15.8 ("פר תורם") — סינון לפי ייעוד-שעל-הכרטיס (forWho), מגודר supporters.purpose
  const [purposeF, setPurposeF] = useState('all');
  const [tierF, setTierF] = useState<string | null>(null);
  // פילטרים פר-עמודה בתחביר numMatch — 'N' / 'N+' / 'N-M' (P3 פריט 13, לגאסי scf:2809-2811)
  const [colF, setColF] = useState({ count: '', total: '', score: '' });
  // סינון מעקב הטיפול (P3 פריט 14, לגאסי): עם מונה / בלי מונה / עודכן היום
  const [ayinF, setAyinF] = useState<null | 'eyes' | 'noeyes' | 'today'>(null);
  // 📞 קוהרנטיות ווידג'ט↔יעד (20.8): סינון יעדי-קשר שהגיעו — הרשימה המלאה של ווידג'ט-הבית
  const [nextF, setNextF] = useState(false);
  // 📋 מסך-השמות המלא (20.8, "מה עם המסך טיפול") — הרשימה פר-שם שהייתה CSV-בלבד
  const [ayinNamesOpen, setAyinNamesOpen] = useState(false);
  // 🔁 סינון הו"ק (ROADMAP-100 ‏#2): פעילות / טרם-נרשמו-החודש
  const hokOn = featureOn(config, 'supporters.hok');
  // opt-in מפורש (=== true, לא featureOn) — יוצר קבלות-מס, חייב הפעלה מכוונת.
  const hokBulkOn = config.features?.['supporters.hokbulk'] === true;
  const [hokBulkOpen, setHokBulkOpen] = useState(false);
  const [hokF, setHokF] = useState<null | 'active' | 'due'>(null);
  // סינון-סגמנט מהקוקפיט/הבנדים — קליק על סגמנט מסנן את הטבלה (לא רק פותח מסך ריק).
  // אתחול-עצל: אם הבית ביקש נחיתה-על-סגמנט (התראת-סיכון) — נכנסים כבר מסונן.
  const [segF, setSegF] = useState<SegmentKey | null>(() => takeSupportersSegment());
  // סינון-חודש (מפת-עונתיות) + שנת-גיוס (קוהורטה) — דריל-אין מהבנדים האנליטיים.
  const [monthF, setMonthF] = useState<number | null>(null);
  const [acqYearF, setAcqYearF] = useState<number | null>(null);
  // חיפוש-מפורש לפי תקופת-נתינה (בקשת-בעלים "חיפוש לפי שנה לפי חודש בקטגוריה"):
  // שנת-נתינה נבחרת (מובחנת משנת-הגיוס acqYearF); החודש חולק את monthF כדי
  // שדריל-אין מהעונתיות ובורר-החודש ישקפו זה את זה.
  const [gaveYearF, setGaveYearF] = useState<number | null>(null);
  // פאנל-סינון מתקדם (בקשת-בעלים) — עוטף דרגות/הו״ק/מעקב לפאנל אחד מתקפל.
  // הצ׳יפים והסינון נשמרים בדיוק — רק מתקפלים; החיפוש+קטגוריה גלויים תמיד.
  const [advOpen, setAdvOpen] = useState(false);
  // חלון-העבודה (הקוקפיט) — opt-in מפורש בלבד (‏featureOn ברירת-מחדל=on, לכן === true).
  // חסר במפורש בכל הלקוחות-החיים ⇒ אפס-השפעה על הפרודקשן.
  const cockpitOn = config.features?.['supporters.cockpit'] === true;
  const [workMode, setWorkMode] = useState(false);
  // מרכז-המודיעין — opt-in מפורש נפרד (אותו טעם: === true, לא featureOn).
  const intelOn = config.features?.['supporters.intel'] === true;
  const [intelMode, setIntelMode] = useState(false);
  // גלקסיית-התורמים — opt-in מפורש נפרד.
  const galaxyOn = config.features?.['supporters.galaxy'] === true;
  const [galaxyMode, setGalaxyMode] = useState(false);
  // היקום התלת-ממדי — opt-in מפורש נפרד (ענן-כוכבים מסתובב).
  const universeOn = config.features?.['supporters.universe3d'] === true;
  const [universeMode, setUniverseMode] = useState(false);
  // מחסן-החומרים — ורטיקל-הסטודיו (מסחרי בלבד: §46 כבוי + דגל).
  const warehouseOn = featureOn(config, 'supporters.ayin.warehouse') && !featureOn(config, 'core.taxreceipt');
  const [warehouseMode, setWarehouseMode] = useState(false);
  // ריברנד — רצועת-KPI חיה מעל הטבלה הקיימת (opt-in מפורש).
  const rebrandOn = config.features?.['supporters.rebrand'] === true;
  // כרטיס-תורם מאוחד (לשוניות) — opt-in מפורש; כבוי = הכרטיס הרגיל (ביט-זהה).
  const cardOn = config.features?.['supporters.card'] === true;
  const [paletteOpen, setPaletteOpen] = useState(false);
  // 🔁 זיהוי-הו"ק-מהיסטוריה — הפעולה מקומית-טהורה (detectRecurringHok על hist);
  // עד היום הכפתור היחיד היה קבור ב-NedarimSyncModal שנעול payments+ענן. חושפים אותו
  // כאן (מגודר hokOn) — מוצג רק כשיש חיובי-נדרים ב-hist, לא-דורס-הו"ק-ידני, no-op כשריק.
  const detectNedarimHok = useApp((s) => s.detectNedarimHok);
  const [hokDetectArmed, setHokDetectArmed] = useState(false);
  const hasNedarimHist = db.supporters.some((sp) => (sp.hist ?? []).some((h) => h.clearer === 'נדרים'));
  // 🔗 איחוד-כפולים (#13) — הכפתור מוצג רק כשיש מה לאחד
  const [dedupOpen, setDedupOpen] = useState(false);
  // 🐛 נחיל-9×9 (13.8): Union-Find על כל התורמים רץ בכל render (כל הקשה/סינון) —
  // ממומואיז על db.supporters בלבד.
  const dedupCount = useMemo(() => findSupporterDupGroups(db.supporters).length, [db.supporters]);
  const rfmBins = useMemo(() => supScoreBins(db.supporters, rate), [db.supporters, rate]);
  // "היום" המקומי — פעם-אחת לרנדר (isoToday, לא UTC), משמש גם את סינון-הרשימה למטה.
  const today = isoToday();
  // 🐛 ביצועים (21.8): סינון-סגמנט 'atrisk' הריץ cockpitAtRisk (סינון+מיון+פרסור-תאריכים)
  // פר-תורם ⇒ O(n²) על כל הקשה. ה-Set מחושב פעם-אחת (useMemo) ומוזרק ל-matchSegment.
  const atRiskIds = useMemo(
    () => (segF === 'atrisk' ? atRiskIdSet(db.supporters, today) : undefined),
    [segF, db.supporters, today],
  );
  const rfmMax = Math.max(1, ...rfmBins);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  // בחירה-מרובה למחיקה (בקשת-בעלים 13.8) — מצב-בחירה + קבוצת-ids + אישור-הרסני.
  const [selMode, setSelMode] = useState(false);
  const [selSet, setSelSet] = useState<ReadonlySet<string>>(new Set<string>());
  const [confirmDel, setConfirmDel] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignVal, setAssignVal] = useState('');
  const deleteSupporters = useApp((s) => s.deleteSupporters);
  const setSupportersPurpose = useApp((s) => s.setSupportersPurpose);
  const toggleSel = (id: string) =>
    setSelSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const exitSelMode = () => {
    setSelMode(false);
    setSelSet(new Set<string>());
    setConfirmDel(false);
  };
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [dialerOpen, setDialerOpen] = useState(false);
  const dialer = useApp((s) => s.db.ui.dialer);
  const dialerStart = useApp((s) => s.dialerStart);
  // צ'יפ-הקמפיין-הצף (20.8) — בקשת-פתיחה מכל מסך (דפוס famFormReq)
  const dialerOpenReq = useApp((s) => s.dialerOpenReq);
  const ackDialerOpen = useApp((s) => s.ackDialerOpen);
  useEffect(() => {
    if (dialerOpenReq) {
      setDialerOpen(true);
      ackDialerOpen();
    }
  }, [dialerOpenReq, ackDialerOpen]);
  // לוח התרומות הכלל-ארגוני (P1.4, legacy supCalOn/supCalAll) — מוצג בלחיצה
  const [orgCalOpen, setOrgCalOpen] = useState(false);
  // בקשת-בעלים 19.8 (פריט ז'): לוח מעקב-הטיפול מוסתר כברירת-מחדל — בחירה מפורשת להצגה.
  const [ayinBoardOpen, setAyinBoardOpen] = useState(false);
  const donCalOn = featureOn(config, 'supporters.doncal');
  // בקשת "+ תומכת" מהפלטה (P1.6) — אותו דפוס כמו famFormReq
  const supFormReq = useApp((s) => s.supFormReq);
  const ackSupporterForm = useApp((s) => s.ackSupporterForm);
  useEffect(() => {
    if (supFormReq) {
      setFormOpen(true);
      ackSupporterForm();
    }
  }, [supFormReq, ackSupporterForm]);
  // UX סבב-ז׳: חיפוש-גלובלי נוחת על הכרטיס — בקשת-פתיחה מהפלטה (דפוס supFormReq)
  const supOpenReq = useApp((s) => s.supOpenReq);
  const ackSupporterOpen = useApp((s) => s.ackSupporterOpen);
  useEffect(() => {
    if (supOpenReq) {
      setSelId(supOpenReq);
      ackSupporterOpen();
    }
  }, [supOpenReq, ackSupporterOpen]);
  // 📞 "+N יעדי קשר נוספים" מהבית — נוחת על הרשימה המסוננת המלאה (דפוס supOpenReq)
  const supListReq = useApp((s) => s.supListReq);
  const ackSupportersFiltered = useApp((s) => s.ackSupportersFiltered);
  useEffect(() => {
    if (supListReq === 'contacts') {
      setNextF(true);
      setAdvOpen(true);
      ackSupportersFiltered();
    }
  }, [supListReq, ackSupportersFiltered]);
  // הכרעת-בעלים 19.8 (פריט ד'): עובד-סגור-לייעוד ננעל לייעודו — בורר-הייעוד מוסר
  // "כל הייעודים", ולכן ברירת-המסנן עוברת לייעוד הראשון שלו (לא 'all' שאינו קיים).
  useEffect(() => {
    if (desigLimit && desigLimit.length && purposeF === 'all') setPurposeF(desigLimit[0]);
  }, [desigLimit, purposeF]);

  /** דוח יומי של מעקב הטיפול — כל מי שטופל היום. */
  function dailyReport() {
    // 🔒 ייעוד-הרשאה (13.8): הדוח-היומי יוצא רק על תורמים בייעוד המותר לעובד/ת
    const rows = ayinDailyRows(config, visibleSupportersForDesignations(db.supporters, desigLimit), isoToday());
    if (rows.length <= 1) {
      toast('עדיין לא עודכן אף פריט היום — עדכנו בכרטיס והדוח יתמלא');
      return;
    }
    downloadCsv('ayin-daily-' + isoToday() + '.csv', rows);
    toast('דוח יומי: ' + (rows.length - 1) + ' פריטים שטופלו היום — הקובץ ירד');
  }

  /** דוח מלא של כל השמות (למשל שמות-לתפילה) — להורדת-מנהל, בסגנון דוחות התרומות. */
  function namesReport() {
    const rows = ayinAllRows(config, visibleSupportersForDesignations(db.supporters, desigLimit));
    if (rows.length <= 1) {
      toast('עדיין לא נוספו שמות בכרטיסי מעקב-הטיפול');
      return;
    }
    downloadCsv('ayin-names-' + isoToday() + '.csv', rows);
    toast('דוח שמות: ' + (rows.length - 1) + ' שמות — הקובץ ירד');
  }

  // 🐛 נחיל-9×9 (13.8): גם פתיחת-כרטיס-ישיר (מהפלטה/עומק) מכובדת להרשאת-הייעוד —
  // id מחוץ-להיקף לא ייפתח (הגנה-בעומק מעל סינון visibleBase).
  // ⌘K — פלטת-הפיקוד (קופיילוט). מגודרת opt-in (cockpitOn); עוטפת פעולות קיימות.
  useEffect(() => {
    if (!cockpitOn) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cockpitOn]);

  const paletteCtx = useMemo(
    () => ({
      supporters: visibleSupportersForDesignations(db.supporters, desigLimit).map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
      })),
      cockpitOn,
      importOn,
      customReportOn,
      dedupCount,
      paymentsOn: integrationOn(config, 'payments') && cloudOn,
      supporterTerm: termOf(config, 'entity.supporter', 'תומך/ת'),
    }),
    [db.supporters, desigLimit, cockpitOn, importOn, customReportOn, dedupCount, config, cloudOn],
  );

  const runCommand = (c: Command) => {
    switch (c.kind) {
      case 'add': setFormOpen(true); break;
      case 'work': setWorkMode(true); break;
      case 'data': setWorkMode(false); break;
      case 'import': setImportOpen(true); break;
      case 'customreport': setExpOpen(true); break;
      case 'dedup': setDedupOpen(true); break;
      case 'incoming': setIncomingOpen(true); break;
      case 'nedarim': setNedSyncOpen(true); break;
      case 'openDonor': if (c.arg) setSelId(c.arg); break;
    }
  };

  const paletteEl =
    cockpitOn && paletteOpen ? (
      <CommandPalette ctx={paletteCtx} onRun={runCommand} onClose={() => setPaletteOpen(false)} />
    ) : null;

  const selRaw = db.supporters.find((s) => s.id === selId);
  const selected = selRaw && supporterVisibleForDesignations(selRaw, desigLimit) ? selRaw : undefined;
  if (selected) {
    return cardOn
      ? <SupporterCard supporter={selected} supporters={db.supporters} config={config} usdRate={db.usdRate} onBack={() => setSelId(null)} />
      : <SupporterDetail supporter={selected} onBack={() => setSelId(null)} />;
  }

  // חלון-העבודה — נפרס רק כשהוא opt-in ובמצב-עבודה. פתיחת-כרטיס מנתבת ל-SupporterDetail
  // (ה-early-return למעלה), וחזרה ממנו חוזרת לקוקפיט (workMode נשמר).
  if (cockpitOn && workMode) {
    const cockpitList = visibleSupportersForDesignations(db.supporters, desigLimit);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>חלון העבודה</h1>
          <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
            המערכת סידרה את היום — לחיצה-אחת לכל פעולה
          </span>
          <Btn
            onClick={() => setWorkMode(false)}
            title="מעבר לטבלה המלאה — כל התורמים, סינון, מיון וייצוא"
          >
            ☰ מסך הנתונים
          </Btn>
        </div>
        <SupportersCockpit
          supporters={cockpitList}
          config={config}
          usdRate={db.usdRate}
          onOpen={(id) => setSelId(id)}
          onExit={() => setWorkMode(false)}
          onSegment={(k) => { setSegF(k); setWorkMode(false); }}
          onDial={telephonyOn(config) ? (ids) => { dialerStart(ids, termOf(config, 'nav.supporters', 'תורמים')); setWorkMode(false); setDialerOpen(true); } : undefined}
        />
        {paletteEl}
      </div>
    );
  }

  if (intelOn && intelMode) {
    const intelList = visibleSupportersForDesignations(db.supporters, desigLimit);
    return (
      <div>
        <SupportersIntel
          supporters={intelList}
          config={config}
          usdRate={db.usdRate}
          onOpen={(id) => setSelId(id)}
          onExit={() => setIntelMode(false)}
          onSegment={(k) => { setSegF(k); setIntelMode(false); }}
          onMonth={(m) => { setMonthF(m); setIntelMode(false); }}
          onYear={(y) => { setAcqYearF(y); setIntelMode(false); }}
        />
        {paletteEl}
      </div>
    );
  }

  if (galaxyOn && galaxyMode) {
    const galaxyList = visibleSupportersForDesignations(db.supporters, desigLimit);
    return (
      <div>
        <SupportersGalaxy
          supporters={galaxyList}
          config={config}
          usdRate={db.usdRate}
          onOpen={(id) => setSelId(id)}
          onExit={() => setGalaxyMode(false)}
        />
        {paletteEl}
      </div>
    );
  }

  if (universeOn && universeMode) {
    const uniList = visibleSupportersForDesignations(db.supporters, desigLimit);
    return (
      <div>
        <SupportersUniverse3D
          supporters={uniList}
          config={config}
          usdRate={db.usdRate}
          onOpen={(id) => setSelId(id)}
          onExit={() => setUniverseMode(false)}
        />
        {paletteEl}
      </div>
    );
  }

  if (warehouseOn && warehouseMode) {
    return (
      <div>
        <WarehouseBoard onExit={() => setWarehouseMode(false)} />
        {paletteEl}
      </div>
    );
  }

  const nq = normSearch(q);
  const qd = q.replace(/\D/g, '');

  // ג' (13.8) — בסיס-הראייה של המשתמש: תורמים המותרים לפי הייעודים שהוקצו.
  // כל הנגזרות בתצוגה (רשימה, מונים, סה"כ, קטגוריות) יוצאות מ-visibleBase כדי
  // שעובד מוגבל לא יראה — ולא יסיק — תורמים של ייעוד אחר.
  const visibleBase = desigLimit
    ? db.supporters.filter((sp) => supporterVisibleForDesignations(sp, desigLimit))
    : db.supporters;

  let list = visibleBase.filter((sp) => {
    if (cat !== 'all' && (sp.cat || '') !== cat) return false;
    if (purposeF !== 'all' && (sp.forWho || '').trim() !== purposeF) return false;
    // 🔁 סינון הו"ק (ROADMAP-100 ‏#2): הוראות פעילות / רק שטרם-נרשמו-החודש
    if (hokF === 'active' && !sp.hok?.active) return false;
    // 🐛 קוהרנטיות (21.8): הצ'יפ "⏳ טרם נרשמו" מונה לפי hokDue (hokEffectivelyActive —
    // הו"ק-נדרים ששתקה >2 חודשים מוחרגת), אבל הסינון השתמש ב-hok?.active הגולמי ⇒
    // מונה-הצ'יפ ≠ שורות-הרשימה ≠ אוכלוסיית HokBulkModal. עכשיו אותו-כלל בדיוק.
    if (hokF === 'due' && !(hokEffectivelyActive(sp, today) && !hokRecordedThisMonth(sp, today))) return false;
    if (tierF && supTier(supScore(sp, rate)).label !== tierF) return false;
    if (segF && !matchSegment(sp, segF, visibleBase, today, rate, atRiskIds)) return false;
    if ((monthF || gaveYearF) && !supGaveInPeriod(sp, gaveYearF, monthF)) return false;
    if (acqYearF && supAcqYear(sp) !== acqYearF) return false;
    // פילטרי numMatch (פריט 13) — תרומות / סה"כ ₪-שקול (לפי השער העריך) / ציון
    if (!numMatch(colF.count, supCount(sp))) return false;
    if (!numMatch(colF.total, Math.round(supTotalIls(sp, rate)))) return false;
    if (!numMatch(colF.score, supScore(sp, rate))) return false;
    // 📞 יעדי-קשר שהגיעו (20.8) — אותה סמנטיקה כמו dueContacts בווידג'ט-הבית
    if (nextF && !(sp.nextDate && sp.nextDate <= today)) return false;
    // סינון מעקב הטיפול (פריט 14)
    if (ayinF === 'eyes' && !(sp.ayin && eyesTotal(sp.ayin) > 0)) return false;
    if (ayinF === 'noeyes' && sp.ayin && eyesTotal(sp.ayin) > 0) return false;
    if (ayinF === 'today' && !(sp.ayin && (sp.ayin.lastTouch === today || sp.ayin.log?.some((l) => l.date === today)))) return false;
    if (!q.trim()) return true;
    const phoneHit = qd.length >= 3 && (sp.phone || '').replace(/\D/g, '').includes(qd);
    const textHit =
      !!nq && normSearch([sp.name, sp.email, sp.cat, sp.address, sp.forWho].join(' ')).includes(nq);
    return phoneHit || textHit;
  });

  if (sort) {
    const { key, dir } = sort;
    list = [...list].sort((a, b) => {
      const va = sortVal(a, key, rate);
      const vb = sortVal(b, key, rate);
      const c = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'he');
      return c * dir;
    });
  }

  const clickSort = (key: SortKey) =>
    setSort(sort && sort.key === key ? (sort.dir > 0 ? { key, dir: -1 } : null) : { key, dir: 1 });

  const catOptions = [...new Set(visibleBase.map((s) => s.cat).filter(Boolean))];
  const purposeOptions = [...new Set(visibleBase.map((s) => (s.forWho || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const tierCounts: Record<string, number> = { זהב: 0, כסף: 0, ארד: 0, רדומה: 0 };
  for (const sp of visibleBase) tierCounts[supTier(supScore(sp, rate)).label]++;

  // הכרעת-בעלים 9.8 ("לכולל"): סה"כ-הכותרת = הצבירה המוצגת (קבלות + היסטוריה),
  // דרך supIls/supUsd — לא sp.ils/sp.usd השמורים (קבלות-בלבד). בלי זה עסקאות
  // הסליקה/נדרים ב-hist[] לא נספרות בכותרת אף שהן מופיעות בכל שורה. (באג: "הסך
  // תרומות לא מתעדכן" אחרי ייבוא/סנכרון נדרים — 19.8.2026.)
  const tIls = visibleBase.reduce((a, x) => a + supIls(x), 0);
  const tUsd = visibleBase.reduce((a, x) => a + supUsd(x), 0);
  // 🐛 (21.8): hokF ו-purposeF מצמצמים את הרשימה אבל לא נכללו בדגל ⇒ הכותרת
  // הציגה "M תומכות" בלי "N מתוך" כשסיננו לפי הו"ק/ייעוד. עכשיו כל מסנן נספר.
  const filtered =
    q.trim() !== '' || cat !== 'all' || purposeF !== 'all' || !!tierF || !!hokF || !!ayinF || nextF || !!segF || !!monthF || !!gaveYearF || !!acqYearF ||
    colF.count.trim() !== '' || colF.total.trim() !== '' || colF.score.trim() !== '';
  const segLabel = segF ? SEGMENTS.find((s) => s.key === segF)?.label : null;
  const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const yearOptions = donationYears(visibleBase);
  // תווית-התקופה: שנה+חודש = "נתנו ב-8/2025"; רק-חודש = "נתנו בחודש אוגוסט";
  // רק-שנה = "נתנו ב-2025". צ׳יפ יחיד מנקה את שני הרכיבים.
  const periodLabel =
    monthF && gaveYearF
      ? 'נתנו ב-' + MONTHS_HE[monthF - 1] + ' ' + gaveYearF
      : monthF
        ? 'נתנו בחודש ' + MONTHS_HE[monthF - 1]
        : gaveYearF
          ? 'נתנו ב-' + gaveYearF
          : null;
  const drillChips: { label: string; clear: () => void }[] = [
    ...(segLabel ? [{ label: 'סגמנט: ' + segLabel, clear: () => setSegF(null) }] : []),
    ...(periodLabel ? [{ label: periodLabel, clear: () => { setMonthF(null); setGaveYearF(null); } }] : []),
    ...(acqYearF ? [{ label: 'גויסו ב-' + acqYearF, clear: () => setAcqYearF(null) }] : []),
  ];
  const countLabel =
    (filtered ? list.length + ' מתוך ' : '') +
    visibleBase.length +
    ' ' + termOf(config, 'nav.supporters', 'משפחות תומכות') + ' · סה"כ ₪' +
    tIls.toLocaleString('he-IL') +
    ' + $' +
    tUsd.toLocaleString('he-IL');

  const openRowKey = (id: string) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelId(id);
    }
  };

  // פאנל-סינון מתקדם: כמה מסננים-מתקדמים פעילים כרגע (לבאדג׳), והאם יש בכלל
  // תוכן-מתקדם להציג (אחרת אין פאנל — מסך ברירת-מחדל נשאר רזה).
  const advActive = (tierF ? 1 : 0) + (hokF ? 1 : 0) + (ayinF ? 1 : 0) + (nextF ? 1 : 0);
  // 📞 מונה יעדי-הקשר שהגיעו — אותו מספר בדיוק כמו הבאדג' בווידג'ט-הבית
  const dueCount = visibleBase.filter((sp) => sp.nextDate && sp.nextDate <= today).length;
  const hasAdvFilters =
    rfmOn || (hokOn && db.supporters.some((sp) => sp.hok)) || (ayinOn && db.supporters.length > 0) ||
    dueCount > 0;

  return (
    <div>
      <PageHead
        title={'💛 ' + termOf(config, 'nav.supporters', 'משפחות תומכות')}
        sub={countLabel}
        actions={
          <>
            {/* גל ד׳ (payments+ענן): תשלומים-נכנסים מה-webhook — לאישור-רישום.
                תג-מונה + חיווי "מושהה" (⏸) כשמעל 400 (החיבור-החי מדלג — צריך סנכרון ידני). */}
            {integrationOn(config, 'payments') && cloudOn && (
              <Btn
                onClick={() => setIncomingOpen(true)}
                title={nedPending > 400 ? 'החיבור-החי מושהה (מעל 400 ממתינים) — בצעו מיזוג/סנכרון ידני' : 'תשלומים שדווחו מחברת-הסליקה — ממתינים לרישום'}
              >
                💰 תשלומים נכנסים
                {nedPending > 0 && (
                  <span style={{ marginInlineStart: 6, fontSize: 11, fontWeight: 700, background: nedPending > 400 ? 'var(--danger, #e05252)' : 'var(--accent)', color: '#fff', borderRadius: 9, padding: '1px 6px' }}>
                    {nedPending > 400 ? '⏸ ' : ''}{nedPending.toLocaleString('he-IL')}
                  </span>
                )}
              </Btn>
            )}
            {integrationOn(config, 'payments') && cloudOn && (
              <Btn onClick={() => setNedSyncOpen(true)} title="ייבוא תורמים ועסקאות מנדרים לכרטיסים — התאמה לפי מפתחות, עם תצוגה-מקדימה">
                🔄 סנכרון מנדרים
              </Btn>
            )}
            {/* UX סבב-ד׳: כל הפעולות המשניות בתפריט ⋯ אחד — אפס אובדן-יכולת,
                אותם handlers בדיוק, קליק-אחד-נוסף */}
            <ActionsMenu
              title={'עוד פעולות — ' + termOf(config, 'nav.supporters', 'תורמים')}
              items={[
                importOn && { label: '⬆ ייבוא מקובץ CSV', onClick: () => setImportOpen(true) },
                customReportOn && { label: '📊 דו"ח מותאם', onClick: () => setExpOpen(true), title: 'בחירת טווח ונתונים' },
                featureOn(config, 'supporters.annualreport') && {
                  label: '📄 דוחות שנתיים לכולם',
                  onClick: () => {
                    const year = isoToday().slice(0, 4);
                    // 🔒 ייעוד-הרשאה: הדוח-לכולם יוצא רק על תורמים גלויים לעובדת, ובכל תורם
                    // רק התרומות בייעוד המותר (לא db.supporters הגולמי)
                    const lines = annualAllLines(config.orgName || db.orgName, config.orgTaxId, year, visibleSupportersForDesignations(db.supporters, desigLimit));
                    downloadAnnualReport('annual-all-' + year + '.txt', lines);
                    toast('📄 דוחות שנת ' + year + ' — הקובץ ירד (מקטע לכל ' + termOf(config, 'entity.supporter', 'תורם/ת') + ')');
                  },
                },
                ayinOn && dailyReportOn && { label: '📋 דוח יומי', onClick: dailyReport },
                // מסך-השמות המלא (20.8, בקשת-בעלים) — הרשימה פר-שם על-המסך, לא רק CSV
                ayinOn && ayinNamesOn && { label: '📋 ' + featLabel(config) + ' — כל השמות', onClick: () => setAyinNamesOpen(true), title: 'כל השמות מכל הכרטיסים — טבלה חיה עם חיפוש וסינון' },
                ayinOn && isAdminUser(config, cloudEmail) && { label: '📥 דוח שמות (למנהל)', onClick: namesReport, title: 'כל השמות בכרטיסי מעקב-הטיפול — CSV' },
                dedupCount > 0 && featureOn(config, 'supporters.dedup') && { label: '🔗 איחוד כפולים · ' + dedupCount, onClick: () => setDedupOpen(true) },
                !!campaignHref && { label: '📣 לקמפיין הגיוס', onClick: () => window.open(campaignHref!, '_blank', 'noopener') },
              ]}
            />
            {/* בחירה-מרובה למחיקה (13.8, בקשת-בעלים) — טוגל מצב-בחירה */}
            {featureOn(config, 'supporters.bulkselect') && (
              <Btn onClick={() => (selMode ? exitSelMode() : setSelMode(true))} title="בחירה מרובה למחיקה">
                {selMode ? '✕ סיום בחירה' : '☑ בחירה'}
              </Btn>
            )}
            {/* תצוגת גריד לתורמים (5.8, בקשת-בעלים) — אותו דפוס כמו המשפחות (db.ui) */}
            {featureOn(config, 'supporters.grid') && (
              <Btn onClick={toggleSupView} title="החלפת תצוגה: רשימה / גריד">
                {supView === 'grid' ? '☰ רשימה' : '▦ גריד'}
              </Btn>
            )}
            <SupportersViewSwitcher
              active="data"
              options={[
                { key: 'data', label: '☰ מסך הנתונים', title: 'הרשימה/הגריד המלא של התורמים' },
                ...(cockpitOn ? [{ key: 'work', label: '🎯 חלון העבודה', title: 'חלון-העבודה: המערכת מסדרת את משימות היום — שיחות, תודות והו״ק' }] : []),
                ...(intelOn ? [{ key: 'intel', label: '📊 מודיעין', title: 'מרכז-המודיעין: RFM · ערך-חיים · תחזית-מתנה · סיכון-נטישה' }] : []),
                ...(galaxyOn ? [{ key: 'galaxy', label: '🌌 גלקסיה', title: 'גלקסיית-התורמים: כל תורם ככוכב — גודל=ערך · צבע=דרגה · מרחק=טריות' }] : []),
                ...(universeOn ? [{ key: 'universe', label: '🪐 היקום 3D', title: 'היקום התלת-ממדי: ענן-כוכבים מסתובב — גררו לסובב, לחיצה לכרטיס' }] : []),
                ...(warehouseOn ? [{ key: 'warehouse', label: '🏭 מחסן', title: 'מחסן-החומרים: מלאי חוצה-פרויקטים — מלאי/הוקצה/נותר + התרעת-מחסור' }] : []),
              ]}
              onSelect={(k) => { if (k === 'work') setWorkMode(true); else if (k === 'intel') setIntelMode(true); else if (k === 'galaxy') setGalaxyMode(true); else if (k === 'universe') setUniverseMode(true); else if (k === 'warehouse') setWarehouseMode(true); }}
            />
            {telephonyOn(config) && (
              <Btn
                onClick={() => {
                  if (!dialer) dialerStart(list.map((s) => s.id), termOf(config, 'nav.supporters', 'תורמים'));
                  setDialerOpen(true);
                }}
                title="חייגן-מונחה: עוברים על הרשימה, מחייגים בלחיצה, מסמנים תוצאה"
              >
                📞 {dialer ? 'המשך חייגן (' + dialer.queue.length + ')' : 'חייגן'}
              </Btn>
            )}
            <Btn kind="primary" onClick={() => setFormOpen(true)}>
              ➕ הוספת {termOf(config, 'entity.supporter', 'תומך/ת')}
            </Btn>
          </>
        }
      />

      {selMode && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
            position: 'sticky',
            top: 0,
            zIndex: 5,
          }}
        >
          <b>{selSet.size + ' נבחרו'}</b>
          <Btn sm onClick={() => setSelSet(new Set(list.map((sp) => sp.id)))}>
            {'בחר הכל (' + list.length + ')'}
          </Btn>
          <Btn sm onClick={() => setSelSet(new Set<string>())}>
            נקה בחירה
          </Btn>
          <div style={{ flex: 1 }} />
          {/* בקשת-בעלים 19.8 (פריט ד'): המנהל משייך ייעוד לכמה תומכ/ות בבת-אחת */}
          {purposeOn && isAdminUser(config, cloudEmail) && (
            <Btn disabled={!selSet.size} onClick={() => { setAssignVal(''); setAssignOpen(true); }}>
              {'🏷 שיוך ייעוד · ' + selSet.size}
            </Btn>
          )}
          {featureOn(config, 'supporters.bulkdelete') && (
            <Btn kind="danger" disabled={!selSet.size} onClick={() => setConfirmDel(true)}>
              {'🗑 מחיקת ' + selSet.size}
            </Btn>
          )}
          <Btn sm onClick={exitSelMode}>
            ביטול
          </Btn>
        </div>
      )}

      {ayinOn && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15 }}>🩺 לוח מעקב הטיפול</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* 📋 מסך-השמות המלא — הלוח הוא תור פר-תומכ/ת; כאן כל השמות פר-שם */}
              {ayinNamesOn && (
                <Btn sm onClick={() => setAyinNamesOpen(true)} title={'כל ה' + itemLabel(config) + ' מכל הכרטיסים — טבלה חיה עם חיפוש וסינון'}>
                  📋 כל השמות
                </Btn>
              )}
              <Btn sm onClick={() => setAyinBoardOpen((v) => !v)}>
                {ayinBoardOpen ? '▲ הסתרה' : '▼ הצגה'}
              </Btn>
            </div>
          </div>
          {ayinBoardOpen && (
            <div style={{ marginTop: 10 }}>
              <AyinBoard onOpen={setSelId} />
            </div>
          )}
        </div>
      )}

      {/* לוח תרומות כלל-ארגוני — כל התומכות + אירועי המעקב (legacy supCalAll) */}
      {donCalOn && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 15 }}>🗓 לוח ה{termOf(config, 'entity.donations', 'תרומות')} הכללי</h3>
            <Btn sm onClick={() => setOrgCalOpen((v) => !v)}>
              {orgCalOpen ? '▲ סגירה' : '▼ הצגה'}
            </Btn>
          </div>
          {orgCalOpen && (
            <div style={{ marginTop: 10 }}>
              <OrgDonationCalendar onOpen={setSelId} />
            </div>
          )}
        </div>
      )}

      {rebrandOn && (
        <SupportersKpiStrip
          supporters={visibleBase}
          config={config}
          usdRate={db.usdRate}
          activeTier={tierF}
          onTier={(t) => setTierF(tierF === t ? null : t)}
          onHokDue={() => setHokF(hokF === 'due' ? null : 'due')}
          onRisk={() => setSegF(segF === 'atrisk' ? null : 'atrisk')}
        />
      )}

      {drillChips.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {drillChips.map((c) => (
            <button key={c.label} type="button" onClick={c.clear}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--accent-deep, #a05008)', background: 'var(--gold-soft, #fbeecb)', color: 'var(--accent-deep, #a05008)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {c.label} <b>({list.length})</b> <span aria-hidden>✕ ניקוי</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 220 }}>
          <TextInput value={q} onChange={setQ} placeholder="חיפוש לפי שם, טלפון, מייל או קטגוריה…" />
        </div>
        <Select
          value={cat}
          onChange={setCat}
          options={[{ value: 'all', label: 'כל הקטגוריות' }, ...catOptions.map((c) => ({ value: c, label: c }))]}
        />
        {/* חיפוש-מפורש לפי תקופת-נתינה (בקשת-בעלים "לפי שנה לפי חודש") —
            שנה/חודש עצמאיים; יחד = חודש-מסוים-בשנה-מסוימת. אפס-נתונים ⇒ מוסתר. */}
        {yearOptions.length > 0 && (
          <Select
            value={gaveYearF == null ? 'all' : String(gaveYearF)}
            onChange={(v) => setGaveYearF(v === 'all' ? null : +v)}
            options={[{ value: 'all', label: 'כל השנים' }, ...yearOptions.map((y) => ({ value: String(y), label: 'נתנו ב-' + y }))]}
          />
        )}
        <Select
          value={monthF == null ? 'all' : String(monthF)}
          onChange={(v) => setMonthF(v === 'all' ? null : +v)}
          options={[{ value: 'all', label: 'כל החודשים' }, ...MONTHS_HE.map((m, i) => ({ value: String(i + 1), label: m }))]}
        />
        {/* בקשת-בעלים 15.8 ("פר תורם") — סינון לפי ייעוד-שעל-הכרטיס */}
        {purposeOn && purposeOptions.length > 0 && (
          <Select
            value={purposeF}
            onChange={setPurposeF}
            // הכרעת-בעלים 19.8 (פריט ד'): עובד-סגור רואה בבורר רק את ייעודיו — בלי "כל הייעודים".
            options={[
              ...(desigLimit ? [] : [{ value: 'all', label: 'כל הייעודים' }]),
              ...purposeOptions.map((p) => ({ value: p, label: '🔐 ' + p })),
            ]}
          />
        )}
      </div>

      {advFilterOn && hasAdvFilters && (
        <div style={{ marginBottom: advOpen ? 8 : 10 }}>
          <button
            type="button"
            onClick={() => setAdvOpen((v) => !v)}
            aria-expanded={advOpen}
            title="דרגות · הוראות-קבע · מעקב טיפול"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--ink)',
            }}
          >
            <span aria-hidden style={{ fontSize: 11 }}>{advOpen ? '▾' : '▸'}</span>
            🔎 סינון מתקדם
            {advActive > 0 && (
              <span className="chip on" style={{ padding: '0 8px', fontSize: 12 }} aria-label={advActive + ' מסננים פעילים'}>
                {advActive}
              </span>
            )}
          </button>
        </div>
      )}
      {advFilterOn && hasAdvFilters && advOpen && (
        <>
      {rfmOn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>דרגות (לחיצה מסננת):</span>
          {TIER_ORDER.map((t) => (
            <Chip key={t} on={tierF === t} onClick={() => setTierF(tierF === t ? null : t)}>
              {t + ' · ' + tierCounts[t]}
            </Chip>
          ))}
        </div>
      )}

      {/* P3 פריט 12 — סטטים והיסטוגרמת ציון (נוסחאות הלגאסי supBars/supAvgDon/sup12m) */}
      {rfmOn && db.supporters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
            {'תרמו ב-12 החודשים: ' + sup12m(db.supporters, today) + ' · ממוצע ל' + termOf(config, 'entity.donation', 'תרומה') + ': ' +
              (supAvgDon(db.supporters, rate) != null ? '₪' + supAvgDon(db.supporters, rate)!.toLocaleString('he-IL') : '—')}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 34 }} aria-label="היסטוגרמת פיזור הציון">
            {/* 🐛 נחיל-9×9 (13.8): supScoreBins חושב 11× (פעם ל-map ופעם בכל איטרציה) —
                מרומם ל-rfmBins/rfmMax המחושבים פעם אחת (useMemo על [db.supporters, rate]). */}
            {rfmBins.map((n, i) => {
              const mx = rfmMax;
              return (
                <span
                  key={i}
                  title={i * 100 + '–' + (i * 100 + 99) + ': ' + n + ' ' + termOf(config, 'nav.supporters', 'תומכות')}
                  style={{
                    width: 10,
                    height: Math.max(5, Math.round((n / mx) * 100)) + '%',
                    borderRadius: 3,
                    background: supTier(i * 100 + 50).dot,
                    display: 'inline-block',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 🔁 הו"ק (ROADMAP-100 ‏#2): פעילות / טרם-נרשמו-החודש (לחיצה מסננת) */}
      {hokOn && (db.supporters.some((sp) => sp.hok) || hasNedarimHist) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>הוראות קבע:</span>
          {db.supporters.some((sp) => sp.hok) && (
            <>
              <Chip on={hokF === 'active'} onClick={() => setHokF(hokF === 'active' ? null : 'active')}>
                {'🔁 פעילות · ' + db.supporters.filter((sp) => sp.hok?.active).length}
              </Chip>
              <Chip on={hokF === 'due'} onClick={() => setHokF(hokF === 'due' ? null : 'due')}>
                {'⏳ טרם נרשמו החודש · ' + hokDue(db.supporters, today).length}
              </Chip>
              {/* לחיצה-אחת-שמבצעת (הכרעת-בעלים "בחירה ידנית מרשימה") — רישום-הו״ק
                  המוני, מגודר opt-in מפורש כי יוצר קבלות-מס אמיתיות. */}
              {hokBulkOn && hokDue(db.supporters, today).length > 0 && (
                <Btn sm kind="primary" title="רישום חיוב-החודש למספר תורמים בבת-אחת — קבלות בסדרה הרציפה" onClick={() => setHokBulkOpen(true)}>
                  {'🔁 רישום המוני · ' + hokDue(db.supporters, today).length}
                </Btn>
              )}
            </>
          )}
          {/* זיהוי-רטרואקטיבי מהיסטוריית-נדרים — פעולה מקומית, בלי שער-ענן */}
          {hasNedarimHist && (
            <Btn
              sm
              kind={hokDetectArmed ? 'danger' : undefined}
              title="סורק חיובי-נדרים ב-hist ומזהה הוראות-קבע לפי תבנית (3+ חודשים) — הו״ק ידני לא נדרס"
              onClick={() => {
                if (!hokDetectArmed) { setHokDetectArmed(true); return; }
                const n = detectNedarimHok();
                toast(n ? '🔁 ' + n + ' הוראות-קבע זוהו ומולאו מהיסטוריה' : 'לא זוהו הוראות-קבע חדשות מהתבנית');
                setHokDetectArmed(false);
              }}
            >
              {hokDetectArmed ? 'לאשר זיהוי הו״ק?' : '🔁 זהה הו״ק מהיסטוריה'}
            </Btn>
          )}
        </div>
      )}

      {/* 📞 יעדי-קשר שהגיעו (20.8) — הרשימה המלאה של ווידג'ט "יעדי קשר" בבית.
          🐛 FLAGMAX: הצ'יפ הוצג גם כש-supporters.nextdate כבוי — נוסף תנאי nextOn. */}
      {nextOn && (dueCount > 0 || nextF) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>יעדי קשר:</span>
          <Chip on={nextF} onClick={() => setNextF(!nextF)}>
            {'📞 יעד שהגיע · ' + dueCount}
          </Chip>
        </div>
      )}

      {/* P3 פריט 14 — סינון מעקב הטיפול: עם מונה / בלי מונה / עודכן היום */}
      {ayinOn && db.supporters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{featLabel(config)}:</span>
          <Chip on={ayinF === 'eyes'} onClick={() => setAyinF(ayinF === 'eyes' ? null : 'eyes')}>
            עם מונה
          </Chip>
          <Chip on={ayinF === 'noeyes'} onClick={() => setAyinF(ayinF === 'noeyes' ? null : 'noeyes')}>
            בלי מונה
          </Chip>
          <Chip on={ayinF === 'today'} onClick={() => setAyinF(ayinF === 'today' ? null : 'today')}>
            {'עודכן היום · ' +
              db.supporters.filter((sp) => sp.ayin && (sp.ayin.lastTouch === today || sp.ayin.log?.some((l) => l.date === today))).length}
          </Chip>
        </div>
      )}
        </>
      )}

      {db.supporters.length === 0 ? (
        <Empty>
          עדיין אין {termOf(config, 'nav.supporters', 'תומכים')} — הוסיפו עם "➕ הוספת{' '}
          {termOf(config, 'entity.supporter', 'תומך/ת')}"
        </Empty>
      ) : list.length === 0 ? (
        <Empty>לא נמצאו {termOf(config, 'nav.supporters', 'תומכים')} התואמים את החיפוש והסינון</Empty>
      ) : supView === 'grid' ? (
        /* תצוגת גריד (5.8) — כרטיסים ידידותיים-למובייל; אותו דפוס כמו המשפחות */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {list.map((sp) => {
            const score = supScore(sp, rate);
            const tier = supTier(score);
            return (
              <div
                key={sp.id}
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => (selMode ? toggleSel(sp.id) : setSelId(sp.id))}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  if (selMode) toggleSel(sp.id);
                  else setSelId(sp.id);
                }}
                style={{ cursor: 'pointer', outline: selMode && selSet.has(sp.id) ? '2px solid var(--brand)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {selMode && (
                    <input type="checkbox" checked={selSet.has(sp.id)} readOnly aria-label={'בחירת ' + sp.name} style={{ flex: 'none' }} />
                  )}
                  {rfmOn && (
                    <span
                      title={tier.label + ' · ציון ' + score}
                      style={{ width: 10, height: 10, borderRadius: 99, background: tier.dot, display: 'inline-block', flex: 'none' }}
                    />
                  )}
                  <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{sp.name}</span>
                  {sp.hok?.active && (
                    <span title={'הו"ק ' + (sp.hok.cur === '$' ? '$' : '₪') + sp.hok.amount + (hokRecordedThisMonth(sp, today) ? ' · נרשמה החודש ✓' : ' · טרם נרשמה החודש')} style={{ fontSize: 13 }}>
                      🔁
                    </span>
                  )}
                  {sp.cat && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{sp.cat}</span>}
                </div>
                {sp.phone && (
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', direction: 'ltr', textAlign: 'end' }}>{sp.phone}</div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>
                  {supCount(sp) + ' ' + termOf(config, 'entity.donations', 'תרומות') + ' · ' + totalLabel(sp)}
                  {supLast(sp) ? ' · אחרונה ' + fmtDate(supLast(sp)) : ''}
                </div>
                {nextOn && sp.nextDate && (
                  <div style={{ fontSize: 12, color: sp.nextDate <= isoToday() ? 'var(--warn, #b45309)' : 'var(--ink-faint)', marginTop: 2 }}>
                    {'☎ קשר הבא: ' + fmtDate(sp.nextDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card hscroll" style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                {selMode && <th aria-hidden style={{ width: 34 }} />}
                {HEAD.filter(
                  (h) =>
                    (nextOn || h.key !== 'nextDate') &&
                    (rfmOn || h.key !== 'score') &&
                    (ayinOn || (h.key !== 'stage' && h.key !== 'eyes' && h.key !== 'paid')),
                ).map((h) => {
                  // supporters.sort כבוי ⇒ כותרות רגילות — בלי לחיצה/חץ/aria-sort
                  if (!sortOn) {
                    return (
                      <th key={h.key} style={{ whiteSpace: 'nowrap' }}>
                        {headLabel(h)}
                      </th>
                    );
                  }
                  const dir = sort && sort.key === h.key ? sort.dir : 0;
                  return (
                    <th
                      key={h.key}
                      onClick={() => clickSort(h.key)}
                      style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title={'מיון לפי ' + headLabel(h)}
                      aria-sort={dir ? (dir > 0 ? 'ascending' : 'descending') : 'none'}
                    >
                      {headLabel(h)}
                      {dir ? (dir > 0 ? ' ▲' : ' ▼') : ''}
                    </th>
                  );
                })}
                {rfmOn && <th>דרגה</th>}
                <th aria-hidden />
              </tr>
              {/* P3 פריט 13 — פילטרים פר-עמודה בתחביר numMatch ('3' / '3+' / '1-5'), כמו scf בלגאסי */}
              {colFilterOn && (
              <tr>
                {selMode && <th />}
                {HEAD.filter(
                  (h) =>
                    (nextOn || h.key !== 'nextDate') &&
                    (rfmOn || h.key !== 'score') &&
                    (ayinOn || (h.key !== 'stage' && h.key !== 'eyes' && h.key !== 'paid')),
                ).map((h) =>
                  h.key === 'count' || h.key === 'ils' || h.key === 'score' ? (
                    <th key={h.key} style={{ padding: '3px 8px' }}>
                      <input
                        value={h.key === 'count' ? colF.count : h.key === 'ils' ? colF.total : colF.score}
                        onChange={(e) =>
                          setColF({
                            ...colF,
                            [h.key === 'count' ? 'count' : h.key === 'ils' ? 'total' : 'score']: e.target.value,
                          })
                        }
                        placeholder={h.key === 'ils' ? '₪-שקול: 500+' : '3 / 3+ / 1-5'}
                        aria-label={'סינון ' + h.label}
                        style={{ width: '100%', minWidth: 70, padding: '4px 6px', fontSize: 12 }}
                        dir="ltr"
                      />
                    </th>
                  ) : (
                    <th key={h.key} />
                  ),
                )}
                {rfmOn && <th />}
                <th aria-hidden />
              </tr>
              )}
            </thead>
            <tbody>
              {list.map((sp) => (
                <tr
                  key={sp.id}
                  onClick={() => (selMode ? toggleSel(sp.id) : setSelId(sp.id))}
                  onKeyDown={openRowKey(sp.id)}
                  tabIndex={0}
                  style={{ cursor: 'pointer', background: selMode && selSet.has(sp.id) ? 'var(--sel, #eef3ff)' : undefined }}
                >
                  {selMode && (
                    <td style={{ width: 34, textAlign: 'center' }}>
                      <input type="checkbox" checked={selSet.has(sp.id)} readOnly aria-label={'בחירת ' + sp.name} />
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: 700 }}>{sp.name}</div>
                    {(sp.cat || sp.forWho) && (
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                        {[sp.cat, sp.forWho].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td>{sp.cat || '—'}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{sp.phone || '—'}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{sp.email || '—'}</td>
                  <td title={'מתי וכמה בכל ' + termOf(config, 'entity.donation', 'תרומה') + ' — בכרטיס'}>{supCount(sp)}</td>
                  <td>{supIls(sp) ? '₪' + supIls(sp).toLocaleString('he-IL') : '—'}</td>
                  <td>{supUsd(sp) ? '$' + supUsd(sp).toLocaleString('he-IL') : '—'}</td>
                  <td title={totalLabel(sp) + (supLast(sp) ? ' · ' + hebDateFull(supLast(sp)) : '')}>
                    {supLast(sp) ? fmtDate(supLast(sp)) : '—'}
                  </td>
                  {nextOn && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {sp.nextDate ? (
                        sp.nextDate <= today ? (
                          <span style={{ color: 'var(--red)', fontWeight: 700 }}>🔔 יעד עבר</span>
                        ) : (
                          // התאריך העברי ראשי — הלועזי בשורת משנה (חובה אצל הקהל החרדי)
                          <span title={fmtDate(sp.nextDate)}>
                            🎯 {hebDateFull(sp.nextDate)}
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)' }}>
                              {fmtDate(sp.nextDate)}
                            </span>
                          </span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  {rfmOn && <td style={{ fontWeight: 700 }}>{supScore(sp, rate)}</td>}
                  {ayinOn && <td>{sp.ayin && ayinActive(sp.ayin) ? stageLabel(config, sp.ayin.stage) : '—'}</td>}
                  {ayinOn && <td>{sp.ayin && eyesTotal(sp.ayin) ? eyesTotal(sp.ayin) : '—'}</td>}
                  {ayinOn && <td>{sp.ayin?.paid ? '✓' : '—'}</td>}
                  {rfmOn && (
                    <td>
                      <TierChip sp={sp} rate={rate} />
                    </td>
                  )}
                  {/* P3 פריט 12 — 📞 פר-שורה: חיוג ישיר בלי לפתוח את הכרטיס.
                      INTEGRATIONS גל א׳ — 💬 וואטסאפ לצדו (הרחבה נמכרת, חסר=כבוי) */}
                  <td onClick={(e) => e.stopPropagation()}>
                    {sp.phone && featureOn(config, 'supporters.click2call') ? (
                      <a href={'tel:' + sp.phone.replace(/\D/g, '')} title={'חיוג ל' + sp.name + ' — ' + sp.phone} aria-label={'חיוג ל' + sp.name}>
                        📞
                      </a>
                    ) : (
                      ''
                    )}
                    {sp.phone && integrationOn(config, 'whatsapp') ? <WaBtn phone={sp.phone} title={'וואטסאפ ל' + sp.name} /> : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {featureOn(config, 'supporters.hint') && (
        <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 14 }}>
          {/* ביקורת 6.8: 'תומכות'+'לקורסים' היו קשיחים — דלפו בכל 7 הוורטיקלים */}
          💡 {termOf(config, 'nav.supporters', 'תורמים')} אינם מחוברים ל{termOf(config, 'nav.courses', 'חוגים')} — זמינים בחיפוש (⌘K), בלוח השנה (תזכורת 📞) ובגיבויים.
        </p>
      )}

      {formOpen && (
        <SupporterForm
          supporter={null}
          onClose={(newId) => {
            setFormOpen(false);
            if (newId) setSelId(newId);
          }}
        />
      )}

      {dedupOpen && <SupDedupModal onClose={() => setDedupOpen(false)} />}
      {hokBulkOpen && <HokBulkModal config={config} onClose={() => setHokBulkOpen(false)} />}
      {/* 📋 מסך-השמות המלא (20.8) — הרשימה פר-שם מכל הכרטיסים; שורה ⇒ כרטיס */}
      {ayinNamesOpen && (
        <AyinNamesBoard
          config={config}
          supporters={visibleSupportersForDesignations(db.supporters, desigLimit)}
          onClose={() => setAyinNamesOpen(false)}
          onOpenSupporter={(id) => {
            setAyinNamesOpen(false);
            setSelId(id);
          }}
          onCsv={isAdminUser(config, cloudEmail) ? namesReport : null}
        />
      )}
      {importOpen && (
        <Modal title="⬆ ייבוא תומכות מ-CSV / Excel" onClose={() => setImportOpen(false)}>
          <SupporterImport onDone={() => setImportOpen(false)} />
        </Modal>
      )}

      {confirmDel && (
        <Modal
          title={'מחיקת ' + selSet.size + ' ' + termOf(config, 'nav.supporters', 'תומכים')}
          onClose={() => setConfirmDel(false)}
        >
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            {'פעולה בלתי-הפיכה: יימחקו לצמיתות '}
            <b>{selSet.size}</b>
            {' ' + termOf(config, 'nav.supporters', 'תומכים') + ' — כולל היסטוריית ה' + termOf(config, 'entity.donations', 'תרומות') + ' והתזכורות שלהם. האם להמשיך?'}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn
              kind="danger"
              onClick={() => {
                const ids = [...selSet];
                deleteSupporters(ids);
                toast('נמחקו ' + ids.length + ' ' + termOf(config, 'nav.supporters', 'תומכים'));
                exitSelMode();
              }}
            >
              {'🗑 מחק ' + selSet.size}
            </Btn>
            <Btn onClick={() => setConfirmDel(false)}>ביטול</Btn>
          </div>
        </Modal>
      )}

      {/* פריט ד' (19.8): שיוך-ייעוד לכמה תומכ/ות בבת-אחת */}
      {assignOpen && (
        <Modal title={'שיוך ייעוד ל-' + selSet.size + ' ' + termOf(config, 'nav.supporters', 'תומכים')} onClose={() => setAssignOpen(false)}>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            הייעוד קובע אילו עובדות רואות את התומכ/ת. הזינו ייעוד (או בחרו מהקיימים); ריק = ללא ייעוד.
          </p>
          <input
            list="assign-purposes"
            value={assignVal}
            onChange={(e) => setAssignVal(e.target.value)}
            placeholder="למשל: חתונות / קמחא דפסחא"
            style={{ width: '100%', padding: '8px 10px', fontSize: 14, borderRadius: 8, border: '1px solid var(--line)' }}
          />
          <datalist id="assign-purposes">
            {purposeOptions.map((p) => <option key={p} value={p} />)}
          </datalist>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn
              kind="primary"
              onClick={() => {
                const ids = [...selSet];
                setSupportersPurpose(ids, assignVal);
                toast('שויך ייעוד ל-' + ids.length + ' ' + termOf(config, 'nav.supporters', 'תומכים'));
                setAssignOpen(false);
                exitSelMode();
              }}
            >
              🏷 שייך
            </Btn>
            <Btn onClick={() => setAssignOpen(false)}>ביטול</Btn>
          </div>
        </Modal>
      )}

      {expOpen && <CustomExport target="supporters" onClose={() => setExpOpen(false)} />}
      {paletteEl}
      {incomingOpen && <IncomingPaymentsModal onClose={() => setIncomingOpen(false)} />}
      {nedSyncOpen && <NedarimSyncModal onClose={() => setNedSyncOpen(false)} />}
      {dialerOpen && <DialerModal onClose={() => setDialerOpen(false)} />}
    </div>
  );
}
