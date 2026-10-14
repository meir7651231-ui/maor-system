// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/compose-engine.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ATOM = {
    magnitude: { atom: 'BareStat', seam: 'bare_stat.dart:6 required this.value' }, // ערך+תווית inline
    headline: { atom: 'KpiTile', seam: 'premium/dataviz/kpi_tile.dart value/label' }, // מדד-כותרת
    hero: { atom: 'stat_hero', seam: 'premium/surfaces/stat_hero.dart:5 required this.value' }, // מספר-ענק
    ratio: { atom: 'StatRow', seam: 'premium/lists/stat_row.dart:11-13 value+fraction' }, // חלק-מתוך-שלם + בר
    compare: { atom: 'NeonBars', seam: 'premium/dataviz/neon_bars.dart:5 labels+values' }, // גדלים זה-מול-זה
    diff: { atom: 'BareStat', seam: 'bare_stat.dart:6 (inkColor לפי-סימן)' }, // הפרש חתום
    fact: { atom: 'StatusChip', seam: 'premium/feedback/status_chip.dart:7 required this.label' }, // עובדה תווית+ערך
    group: { atom: 'DsSection', seam: 'ds/ds.dart:155 title+tone' }, // קיבוץ פר-מצב
    identity: { atom: 'MediaRow', seam: 'premium/lists/media_row.dart:12-15 title/subtitle/glyph' },
    action: { atom: 'SoftButton', seam: 'premium/actions/soft_button.dart:7 label+onTap' },
    // ── פעולות-מסך-מלא (גלים 2–4 · אטומי-מדף-אמת, סוכני-חקר 3.9) ──
    search: { atom: 'DsSearch', seam: 'ds/ds_search.dart:5 value+onChanged (מבוקר)' }, // איתור · תצוגה
    match: { atom: 'smartFilter', seam: 'dart-maor/smart-filter.dart:84 ⊕smartScore⊕normSearch (לוגיקה §21)' }, // איתור · מנוע
    filter: { atom: 'FilterChipPill', seam: 'screens__manager_dashboard_screen/filter_chip_pill.dart:7 selected+onTap (מבוקר)' }, // חריגה · תצוגה
    predicate: { atom: 'finderMatches', seam: 'dart-maor/finder-matches.dart:23 locks+axisValue (לוגיקה §21)' }, // חריגה · מנוע
    serialize: { atom: 'toCsv', seam: 'dart-maor/to-csv.dart ⊕csvEscape⊕exportAllowed (לוגיקה §21)' }, // ייצוא · מנוע
    switch: { atom: 'SegmentedSwitch', seam: 'premium/actions/segmented_switch.dart items+selected+onSelect' }, // בורר · תצוגה
    role: { atom: 'roleOf', seam: 'dart-maor/role-of.dart admin/teacher/staff (לוגיקה §21)' }, // הרשאות · מנוע
    grant: { atom: 'canGrantedAction', seam: 'dart-maor/can-granted-action.dart גידור-פר-מפתח (לוגיקה §21)' }, // הרשאות · מנוע
    alert: { atom: 'AlertBanner', seam: 'premium/feedback/alert_banner.dart message+tone+glyph' }, // אוטומציה · תצוגה
    expiry: { atom: 'expiringIntakes', seam: 'dart-maor/expiring-intakes.dart ⊕shopExpiryWarnDays (לוגיקה §21)' }, // פקיעה · מנוע
    capital: { atom: 'warehouseValue', seam: 'dart-maor/warehouse-value.dart Σqty×cost (לוגיקה §21)' }, // הון-כלוא · מנוע
    table: { atom: 'DsTable', seam: 'ds/ds_table.dart:7 labels+rows+מיון' }, // הצגת-אוסף (לא DataGrid)
    panel: { atom: 'GlassCard', seam: 'premium/surfaces/glass_card.dart:5 required this.child' }, // מיכל-פריט-נבחר
    timeline: { atom: 'TimelineItem', seam: 'premium/lists/timeline_item.dart title+time+body' }, // שורת-תנועה (לא timeline_flow)
    empty: { atom: 'EmptyState', seam: 'premium/feedback/empty_state.dart glyph+message' }, // מצב אין-תוצאות
    // ── 8 מודולי-SchoolOS (4.9 · תפרים מהאורקל atom-index-full.json — V3, לא grep-ידני; DsCalendar=תפר-zero ⇒ מחוץ לטבלה) ──
    trend: { atom: 'TrendStat', seam: 'premium/dataviz/trend_stat.dart:8-10 value+delta+label (אחוז-אמת בלבד)' },
    ring: { atom: 'ProgressRing', seam: 'premium/dataviz/progress_ring.dart:69 value 0..1' },
    gauge: { atom: 'GaugeMeter', seam: 'premium/dataviz/gauge_meter.dart (index: fields)' },
    bars: { atom: 'DsBars', seam: 'ds/ds_bars.dart (index: series)' },
    avatar: { atom: 'AvatarTile', seam: 'premium/lists/avatar_tile.dart:11-13 initials+title+subtitle' },
    expand: { atom: 'ExpandableTile', seam: 'premium/lists/expandable_tile.dart:10-11 title+body' },
    field: { atom: 'DsField', seam: 'ds/ds_field.dart:8 onChanged (מבוקר)' },
    enumfield: { atom: 'DsEnumField', seam: 'ds/ds_enum_field.dart:7 onChanged (index: collection)' },
    board: { atom: 'DsBoard', seam: 'ds/ds_board.dart:9-12 stages+records+stageOf+titleOf' },
    primary: { atom: 'DsPrimaryButton', seam: 'ds/ds.dart:244 label+onTap' },
    queue: { atom: 'cockpitQueue', seam: 'dart-maor/cockpit-queue.dart (List,String,num,…) (לוגיקה §21)' },
    progress: { atom: 'cockpitProgress', seam: 'dart-maor/cockpit-progress.dart (Map,Set) (לוגיקה §21)' },
    sheet: { atom: 'sheetSummary', seam: 'dart-maor/sheet-summary.dart ⇒ {present,total} (לוגיקה §21)' },
    makeup: { atom: 'pendingMakeups', seam: 'dart-maor/pending-makeups.dart (List,String?) (לוגיקה §21)' },
    balance: { atom: 'payBal', seam: 'dart-maor/pay-bal.dart (Map, paidOf) (לוגיקה §21)' },
    paidstatus: { atom: 'enrollmentPaidStatus', seam: 'dart-maor/enrollment-paid-status.dart (Map, payBal, paidOf) (לוגיקה §21)' },
    hok: { atom: 'hokDue', seam: 'dart-maor/hok-due.dart (List, String, hokEffectivelyActive…) (לוגיקה §21)' },
    clash: { atom: 'scheduleClashText', seam: 'dart-maor/schedule-clash-text.dart (…, T) (לוגיקה §21)' },
    slots: { atom: 'buildSlots', seam: 'dart-maor/build-slots.dart (Map,Map,String,…) (לוגיקה §21)' },
    block: { atom: 'blockReason', seam: 'dart-maor/block-reason.dart (DateTime, hebParts, …) (לוגיקה §21)' },
    holiday: { atom: 'holidayOf', seam: 'dart-maor/holiday-of.dart (DateTime, hebParts, scanHebYear, …) (לוגיקה §21)' },
    weekly: { atom: 'weeklyRoomSessions', seam: 'dart-maor/weekly-room-sessions.dart (Map, room, String, sessionsOf) (לוגיקה §21)' },
    sessions: { atom: 'sessionsOf', seam: 'dart-maor/sessions-of.dart (course) (לוגיקה §21)' },
    enrol: { atom: 'enrollCount', seam: 'dart-maor/enroll-count.dart (db, course) — מחריג wait (לוגיקה §21)' },
    wait: { atom: 'waitlistFor', seam: 'dart-maor/waitlist-for.dart (db, course) (לוגיקה §21)' },
    byteacher: { atom: 'coursesOfTeacher', seam: 'dart-maor/courses-of-teacher.dart (db, teacher) (לוגיקה §21)' },
    whoami: { atom: 'teacherIdOf', seam: 'dart-maor/teacher-id-of.dart (db, email-מוזרק · חוק-6) (לוגיקה §21)' },
    cert: { atom: 'certExpiryStatus', seam: 'dart/cert_expiry_status.dart (DateTime, DateTime) (בנייה-חכמה §21)' },
    contact: { atom: 'waLink', seam: 'dart-maor/wa-link.dart (phone-מוזרק · חוק-6) (לוגיקה §21)' },
    recipients: { atom: 'bulkWaRecipients', seam: 'dart-maor/bulk-wa-recipients.dart (List, waDigits) (לוגיקה §21)' },
    template: { atom: 'renderTemplate', seam: 'dart-maor/render-template.dart (Map?, String, Map, List) (לוגיקה §21)' },
    parse: { atom: 'parseCsv', seam: 'dart-maor/parse-csv.dart (String) (לוגיקה §21)' },
    trendengine: { atom: 'trendFromScan', seam: 'dart-maor/intel-trend-from-scan.dart (Map) ⇒ {dir,pct} (לוגיקה §21)' },
};
const FAKERS = new Set([]);
function ops(formula) {
    const f = formula;
    if (f.kind === 'raw')
        return [{ op: 'fact', why: 'ערך-גלם, אין תת-פעולה ⇒ עובדה עוצרת' }];
    if (f.kind === 'name')
        return [{ op: 'identity', why: 'זהות = שם+אייקון+תמצית' }];
    if (f.kind === 'act')
        return [{ op: 'action', why: 'מעשה אטומי' }];
    if (f.kind === 'partition')
        return [{ op: 'group', why: 'חלוקה-לדליים פר-מצב, אטום חוזר פר-קבוצה' }];
    if (f.kind === 'count')
        return [{ op: 'headline', why: 'ספירה-מסוננת = מדד-כותרת' }];
    if (f.kind === 'sum')
        return [{ op: f.headline ? 'hero' : 'headline', why: 'סכום = מדד' }];
    if (f.kind === '/')
        return [{ op: 'ratio', why: 'חלק-מתוך-שלם ⇒ בר-מילוי (ערך+יעד+יחס באטום-אחד)' }];
    if (f.kind === '−')
        return [{ op: 'diff', why: 'הפרש חתום ⇒ BareStat צבוע-לפי-סימן' }];
    if (f.kind === '×') // מכפלה = תובנה: אופרנד × אופרנד = תוצאה (3 פעולות)
        return [{ op: 'magnitude', label: f.a }, { op: 'magnitude', label: f.b }, { op: 'diff', label: '=' + f.out, emphasize: true, why: 'תוצאת-המכפלה' }];
    if (f.kind === 'vs') // השוואה = תובנה: שני-גדלים + הפרש + יחס (3 אטומים)
        return [{ op: 'compare', why: 'שני הגדלים זה-מול-זה' }, { op: 'diff', label: 'מרווח', why: 'ההפרש בין הגדלים' }, { op: 'magnitude', label: 'כיסוי%', why: 'יחס-הכיסוי' }];
    // ── פעולות-מסך-מלא ──
    if (f.kind === 'search') // איתור = תובנה: תצוגה(קלט-מבוקר) ⊕ לוגיקה(ניקוד-רב-מילתי+נרמול-עברי) — 23-ג
        return [{ op: 'search', why: 'קלט-חיפוש מבוקר (value+onChanged)' }, { op: 'match', why: 'מנוע-התאמה: smartFilter⊕smartScore⊕normSearch (רב-מילתי AND, לא .contains)' }];
    if (f.kind === 'filter') // חריגה = תובנה: תצוגה(צ׳יפ) ⊕ לוגיקה(מנוע-פרדיקט-רב-צירי) — 23-ג
        return [{ op: 'filter', why: 'צ׳יפ-סינון מבוקר (selected+onTap)' }, { op: 'predicate', why: 'מנוע-פרדיקט: finderMatches (נעילות-AND, לא בוליאני-ידני)' }];
    if (f.kind === 'table')
        return [{ op: 'table', why: 'הצגת-אוסף = טבלה (labels+rows+מיון); DataGrid מזייף ⇒ נחסם' }];
    if (f.kind === 'empty')
        return [{ op: 'empty', why: 'מצב אין-תוצאות = glyph+message' }];
    if (f.kind === 'export') // ייצוא = תובנה: תצוגה(כפתור-הפעלה) ⊕ לוגיקה(סריאליזציה-בטוחה) — 23-ג
        return [{ op: 'action', why: 'כפתור-הפעלת-הייצוא (label+onTap)' }, { op: 'serialize', why: 'מנוע: toCsv⊕csvEscape (BOM+חסימת-הזרקה, לא join ידני)' }];
    if (f.kind === 'perm') // הרשאות = תובנה: תצוגה(בורר-תפקיד) ⊕ לוגיקה(תפקיד + גידור-פעולה) — 23-ג · חוק-6
        return [{ op: 'switch', why: 'בורר-תפקיד (זהות-מוזרקת, חוק-6)' }, { op: 'role', why: 'מנוע: roleOf ⇒ admin/teacher/staff' }, { op: 'grant', why: 'מנוע: canGrantedAction ⇒ הצג/הסתר-פעולה פר-מפתח' }];
    if (f.kind === 'auto') // אוטומציה = תובנה: תצוגה(התראה) ⊕ לוגיקה(זיהוי-פקיעה + הון-כלוא) — 23-ג פרואקטיבי
        return [{ op: 'alert', why: 'באנר-התראה (message+tone+glyph)' }, { op: 'expiry', why: 'מנוע: expiringIntakes ⊕ shopExpiryWarnDays (מה פוקע תוך החלון)' }, { op: 'capital', why: 'מנוע: warehouseValue על מלאי-מת (הון-כלוא)' }];
    if (f.kind === 'life') // מחזור-חיים = תובנה: תג-מצב (StatusChip) ⊕ toggle (SoftButton) — 23-ב דגל=עובדה
        return [{ op: 'fact', label: 'לא-פעיל', why: 'תג-מצב פריט-לא-פעיל (StatusChip)' }, { op: 'action', label: 'toggle', why: 'הפעלה/השבתה (SoftButton) — מגודר-הרשאה' }];
    if (f.kind === 'log') // יומן = תובנה: כותרת-קיבוץ (Σ) + שורת-תנועה פר-רשומה (2 אטומים)
        return [{ op: 'group', label: 'כותרת+Σ', why: 'כותרת-היומן נושאת מונה+Σעלות' }, { op: 'timeline', why: 'שורת-תנועה פר-רשומה (title/time/body); timeline_flow מזייף ⇒ נחסם' }];
    if (f.kind === 'panel') // פאנל-פריט = תובנה: מיכל + זהות + מצב(יחס) + תנועות + פעולה (5 אטומים)
        return [{ op: 'panel', why: 'מיכל-פריט-נבחר (GlassCard child) מארח את תת-החלקיקים' },
            { op: 'identity', why: 'זהות-הפריט (שם/מק״ט/קטגוריה)' },
            { op: 'ratio', label: 'מלאי מול יעד', why: 'מצב-אמת = יחס במילוי-בר' },
            { op: 'timeline', why: 'תנועות-הפריט (intakeLog מסונן)' },
            { op: 'action', why: 'פעולות על הפריט (קבלה/הוצאה/מלא/הזמן)' }];
    // ── 8 מודולי-SchoolOS (4.9) — כל סוג = תובנה מרובת-אטומים (תצוגה⊕לוגיקה, 23-ג); סוכני-הבנייה הרכיבו, המנוע מקבע ──
    if (f.kind === 'triage')
        return [{ op: 'queue', why: 'מנוע: cockpitQueue ⇒ תור-משימות עם סיבה' }, { op: 'progress', why: 'מנוע: cockpitProgress ⇒ נעשה/סה"כ' }, { op: 'ratio', why: 'פס-התקדמות (StatRow)' }, { op: 'table', why: 'התור כטבלה-מונחית-חוזה' }];
    if (f.kind === 'trend')
        return [{ op: 'trendengine', why: 'מנוע: trendFromScan ⇒ {dir,pct} מסדרה-חודשית' }, { op: 'trend', why: 'TrendStat value+delta — אחוז-אמת (לא ימים)' }];
    if (f.kind === 'roster')
        return [{ op: 'sheet', why: 'מנוע: sheetSummary ⇒ present/total לתאריך' }, { op: 'table', why: 'גיליון-הכיתה כטבלה' }, { op: 'action', why: 'סימון-נוכחות/חיסור (SoftButton)' }];
    if (f.kind === 'attendance')
        return [{ op: 'sheet', why: 'מנוע: sheetSummary' }, { op: 'ring', why: 'ProgressRing 0..1 = יחס-נוכחות' }];
    if (f.kind === 'makeups')
        return [{ op: 'makeup', why: 'מנוע: pendingMakeups (חיסור-זכאי בלי תאריך)' }, { op: 'timeline', why: 'שורת-השלמה (TimelineItem)' }, { op: 'action', why: 'תזמון-השלמה' }];
    if (f.kind === 'holidayGuard')
        return [{ op: 'holiday', why: 'מנוע: holidayOf (לוח-עברי, today מוזרק)' }, { op: 'block', why: 'מנוע: blockReason (שבת/חג/צום-נדחה)' }, { op: 'fact', why: 'תג-חסימה (StatusChip)' }];
    if (f.kind === 'clash')
        return [{ op: 'slots', why: 'מנוע: buildSlots (מפגשים⇒משבצות)' }, { op: 'clash', why: 'מנוע: scheduleClashText (התנגשות חוג/חדר/מורה)' }, { op: 'alert', why: 'באנר-התנגשות' }];
    if (f.kind === 'weekly')
        return [{ op: 'sessions', why: 'מנוע: sessionsOf' }, { op: 'weekly', why: 'מנוע: weeklyRoomSessions (תפוסה-שבועית)' }, { op: 'table', why: 'גריד-שבועי כטבלה' }];
    if (f.kind === 'enrollment')
        return [{ op: 'enrol', why: 'מנוע: enrollCount (מחריג wait)' }, { op: 'wait', why: 'מנוע: waitlistFor' }, { op: 'ratio', why: 'תפוסה/קיבולת (StatRow)' }];
    if (f.kind === 'balance')
        return [{ op: 'balance', why: 'מנוע: payBal' }, { op: 'paidstatus', why: 'מנוע: enrollmentPaidStatus' }, { op: 'diff', why: 'יתרה חתומה (BareStat לפי-סימן)' }];
    if (f.kind === 'hok')
        return [{ op: 'hok', why: 'מנוע: hokDue (הוראת-קבע לחודש)' }, { op: 'fact', why: 'תג נרשמה/ממתינה' }, { op: 'action', why: 'תזכורת (אפס-קבלה)' }];
    if (f.kind === 'contact')
        return [{ op: 'avatar', why: 'זהות (initials+title+subtitle)' }, { op: 'contact', why: 'מנוע: waLink על טלפון-מוזרק (חוק-6)' }, { op: 'action', why: 'פתיחת-ערוץ (SoftButton)' }];
    if (f.kind === 'broadcast')
        return [{ op: 'recipients', why: 'מנוע: bulkWaRecipients (דדופ-משפחה)' }, { op: 'template', why: 'מנוע: renderTemplate' }, { op: 'action', why: 'שלח (פר-נמען, wa.me)' }];
    if (f.kind === 'import')
        return [{ op: 'field', why: 'הדבקת-CSV (DsField מבוקר)' }, { op: 'parse', why: 'מנוע: parseCsv' }, { op: 'table', why: 'תצוגה-מקדימה דו-שלבית' }];
    if (f.kind === 'form')
        return [{ op: 'field', why: 'שדה-טקסט מבוקר' }, { op: 'enumfield', why: 'שדה-בחירה (collection)' }, { op: 'primary', why: 'שמירה (DsPrimaryButton)' }];
    if (f.kind === 'load')
        return [{ op: 'byteacher', why: 'מנוע: coursesOfTeacher' }, { op: 'sessions', why: 'מנוע: sessionsOf ⇒ שעות' }, { op: 'bars', why: 'DsBars series = עומס פר-מורה' }];
    if (f.kind === 'certs')
        return [{ op: 'cert', why: 'מנוע: certExpiryStatus (today מוזרק)' }, { op: 'fact', why: 'תג-תוקף' }, { op: 'alert', why: 'התראת-פקיעה' }];
    if (f.kind === 'pipeline')
        return [{ op: 'whoami', why: 'מנוע: teacherIdOf (מייל-מוזרק · חוק-6)' }, { op: 'board', why: 'DsBoard stages+records' }];
    if (f.kind === 'risk')
        return [{ op: 'trendengine', why: 'מנוע: trendFromScan (מגמת-נוכחות/ציון)' }, { op: 'gauge', why: 'GaugeMeter = ציון-סיכון 0–100' }, { op: 'fact', why: 'האות-המוביל (StatusChip)' }];
    if (f.kind === 'details')
        return [{ op: 'expand', why: 'ExpandableTile title+body' }, { op: 'identity', why: 'זהות (MediaRow)' }];
    throw new Error('unknown formula kind: ' + f.kind);
}
export function inner$compose$list(p) {
    const list = ops(p.f);
    return list;
}
export function inner$compose$atoms(p) {
    const list = ops(p.f);
    const atoms = list.map(o => {
        const pick = ATOM[o.op];
        if (!pick)
            throw new Error('no atom for op ' + o.op);
        if (FAKERS.has(pick.atom))
            throw new Error('🔴 selected a FAKER: ' + pick.atom);
        return { op: o.op, atom: pick.atom, seam: pick.seam, label: o.label, why: o.why };
    });
    return atoms;
}
export function inner$compose$atoms$$step(list) {
    const atoms = list.map(o => {
        const pick = ATOM[o.op];
        if (!pick)
            throw new Error('no atom for op ' + o.op);
        if (FAKERS.has(pick.atom))
            throw new Error('🔴 selected a FAKER: ' + pick.atom);
        return { op: o.op, atom: pick.atom, seam: pick.seam, label: o.label, why: o.why };
    });
    return atoms;
}
export function inner$compose$insight(p) {
    const list = ops(p.f);
    const insight = list.length > 1;
    return insight;
}
export function inner$compose$insight$$step(list) {
    const insight = list.length > 1;
    return insight;
}
export function inner$forEach$kind(p) {
    const kind = p.insight ? `תובנה·${p.atoms.length}` : 'עובדה·1';
    return kind;
}
export function inner$forEach$atoms(p) {
    const atoms = p.atoms.map(a => a.atom + (a.label ? `(${a.label})` : '')).join(' + ');
    return atoms;
}

export const SIGS = {
  inner$compose$list: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$compose$atoms: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$compose$atoms$$step: [{"name":"list","d":{"t":"or","of":[{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"str"},false],["label",{"t":"any"},false],["emphasize",{"t":"undef"},true],["why",{"t":"undef"},true]]},{"t":"obj","p":[["op",{"t":"str"},false],["label",{"t":"str"},false],["emphasize",{"t":"bool"},false],["why",{"t":"str"},false]]}]}},{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"str"},false],["why",{"t":"str"},false],["label",{"t":"undef"},true]]},{"t":"obj","p":[["op",{"t":"str"},false],["label",{"t":"str"},false],["why",{"t":"str"},false]]}]}}]},"opt":false}],
  inner$compose$insight: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$compose$insight$$step: [{"name":"list","d":{"t":"or","of":[{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"str"},false],["label",{"t":"any"},false],["emphasize",{"t":"undef"},true],["why",{"t":"undef"},true]]},{"t":"obj","p":[["op",{"t":"str"},false],["label",{"t":"str"},false],["emphasize",{"t":"bool"},false],["why",{"t":"str"},false]]}]}},{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"str"},false],["why",{"t":"str"},false],["label",{"t":"undef"},true]]},{"t":"obj","p":[["op",{"t":"str"},false],["label",{"t":"str"},false],["why",{"t":"str"},false]]}]}}]},"opt":false}],
  inner$forEach$kind: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$forEach$atoms: [{"name":"p","d":{"t":"any"},"opt":false}],
};
