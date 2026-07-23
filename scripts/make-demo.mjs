/**
 * מחולל קובץ דמו — node scripts/make-demo.mjs
 * מייצר public/demo.json: קובץ גיבוי v2 תקין (בדיוק בצורת Db מ-src/types/domain.ts)
 * עבור "עמותת אור הדגמה" — 60 משפחות, 14 חוגים, ~150 שיבוצים, אירועים ותורמים.
 *
 * דטרמיניסטי: מערכי שמות קבועים + PRNG זרוע (mulberry32) — ללא Math.random.
 * תאריכים יחסיים להיום כדי שימי הולדת/חובות יידלקו בלוח הבקרה בכל הרצה.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── PRNG זרוע — דטרמיניסטי לחלוטין ───

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260720);
const rand = (n) => Math.floor(rng() * n);
const pick = (arr) => arr[rand(arr.length)];
const between = (min, max) => min + rand(max - min + 1);

// ─── עזרי תאריכים ───

const TODAY = new Date();
TODAY.setHours(12, 0, 0, 0);
const iso = (d) => d.toISOString().slice(0, 10);
function daysFromToday(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d;
}
/** תאריך לידה: בגיל נתון, כשהיום-חודש הם offsetDays מהיום (ליום הולדת קרוב). */
function birthAtAge(age, offsetDays) {
  const d = daysFromToday(offsetDays);
  d.setFullYear(d.getFullYear() - age);
  return iso(d);
}

// ─── ת"ז ישראלית תקינה (ספרת ביקורת) ───

function makeIdNum() {
  const digits = [];
  for (let i = 0; i < 8; i++) digits.push(rand(10));
  if (digits[0] === 0) digits[0] = 2;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let p = digits[i] * ((i % 2) + 1);
    if (p > 9) p -= 9;
    sum += p;
  }
  digits.push((10 - (sum % 10)) % 10);
  return digits.join('');
}

const phone = () => `05${pick([0, 2, 3, 4, 8])}-${String(1000000 + rand(9000000))}`;

// ─── מערכי זרע — שמות עבריים ───

const SURNAMES = [
  'כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דהן', 'אברהם', 'פרידמן', 'אזולאי', 'אוחיון',
  'גבאי', 'שפירא', 'מלכה', 'אמסלם', 'בן דוד', 'חדד', 'אלבז', 'ועקנין', 'סבן', 'אטיאס',
  'זוהר', 'רוזנברג', 'קליין', 'וייס', 'גולדשטיין', 'שטרן', 'הורוביץ', 'בן שמעון', 'אלמליח', 'טולדנו',
  'אביטל', 'נחמיאס', 'בוזגלו', 'שרעבי', 'גרשוני', 'לנדאו', 'ברנשטיין', 'קדוש', 'עמר', 'סויסה',
  'אדרי', 'חזן', 'ממן', 'אשכנזי', 'מועלם', 'צרפתי', 'אלקיים', 'ברוך', 'נבון', 'עטיה',
  'דניאל', 'יוסף', 'ששון', 'כץ', 'גרוס', 'פישר', 'ברגר', 'הלוי', 'רחמים', 'עבו',
];
const BOYS = [
  'משה', 'דוד', 'יוסף', 'אברהם', 'יעקב', 'שמואל', 'אליהו', 'מאיר', 'חיים', 'ישראל',
  'מרדכי', 'אהרן', 'נתן', 'בנימין', 'יהודה', 'שלמה', 'עקיבא', 'נחום', 'רפאל', 'גדעון',
  'אליעזר', 'מנחם', 'צבי', 'ראובן', 'שמעון', 'דניאל', 'יונתן', 'עמיחי', 'אורי', 'איתמר',
];
const GIRLS = [
  'שרה', 'רבקה', 'רחל', 'לאה', 'מרים', 'אסתר', 'חנה', 'דבורה', 'יעל', 'תמר',
  'נעמי', 'רות', 'אביגיל', 'מיכל', 'בתיה', 'שולמית', 'ציפורה', 'גילה', 'אורית', 'טליה',
  'הדסה', 'נחמה', 'עדינה', 'ברכה', 'שירה', 'נועה', 'אילנה', 'יהודית', 'מלכה', 'פנינה',
];
const CITIES = ['ירושלים', 'בני ברק', 'אשדוד', 'פתח תקווה', 'ביתר עילית', 'מודיעין עילית', 'אלעד', 'נתניה', 'בית שמש', 'צפת'];
const STREETS = ['הרב קוק', 'חזון איש', 'רש"י', 'הנביאים', 'יפו', 'ז\'בוטינסקי', 'העצמאות', 'הרצל', 'בן גוריון', 'הפלמ"ח'];
const COMMUNITIES = ['כללי', 'חסידי', 'ליטאי', 'ספרדי', 'דתי לאומי'];
const SCHOOLS = ['תלמוד תורה אור החיים', 'בית יעקב', 'ישיבת בני עקיבא', 'ממ"ד נעם', 'חיידר דרכי איש', 'בית ספר מוריה'];
const TZEDAKA = ['', '', '', 'קרן עזרה וחסד', 'קופת העיר', 'ועד הקהילה'];

// ─── מזהים רצים (כמו nextId באפליקציה) ───

let seq = 100;
const nextId = (prefix) => prefix + seq++;
// מוני קבלות רציפים ונפרדים (כמו במערכת) — R- לחוגים, D- לתרומות
let receiptSeq = 1;
let donationSeq = 1;

// ─── מורים (8) וחדרים (6) ───

const TEACHER_DEFS = [
  ['רות אלבז', 'ציור ואומנות'],
  ['אריאל שוורץ', 'מוזיקה וכלי נגינה'],
  ['יוסי בן חמו', "ג'ודו ואומנויות לחימה"],
  ['מיכל רוזן', 'מחשבים ורובוטיקה'],
  ['אפרת דיין', 'אפייה ובישול'],
  ['נתנאל פרידמן', 'תיפוף וקצב'],
  ['שירה גולן', 'אנגלית מדוברת'],
  ['אבי מלול', 'שחמט וחשיבה'],
];
const teachers = TEACHER_DEFS.map(([name, specialty], i) => ({
  id: nextId('t'),
  name,
  phone: phone(),
  phone2: i % 3 === 0 ? phone() : '',
  email: `teacher${i + 1}@or-demo.org.il`,
  idNum: makeIdNum(),
  address: `${pick(STREETS)} ${between(2, 60)}, ${pick(CITIES)}`,
  specialty,
  payRate: between(90, 180),
  startDate: iso(daysFromToday(-between(200, 900))),
  notes: '',
}));

const ROOM_DEFS = [
  ['אולם ראשי', 60, 120, true],
  ['חדר יצירה', 45, 20, true],
  ['חדר מוזיקה', 45, 15, false],
  ['כיתת מחשבים', 60, 16, true],
  ['מטבח לימודי', 90, 12, false],
  ['סטודיו תנועה', 60, 25, true],
];
const rooms = ROOM_DEFS.map(([name, slot, cap, access]) => ({
  id: nextId('r'),
  name,
  active: true,
  slot,
  cap,
  location: pick(['קומה א׳', 'קומה ב׳', 'מבנה מרכזי', 'אגף חדש']),
  rate: between(40, 120),
  from: '13:00',
  to: '21:00',
  access,
  notes: '',
  eq: {
    מקרן: rng() < 0.5,
    הגברה: rng() < 0.5,
    מזגן: true,
    פסנתר: name === 'חדר מוזיקה',
    מראות: name === 'סטודיו תנועה',
    'מטבח מאובזר': name === 'מטבח לימודי',
    מחשבים: name === 'כיתת מחשבים',
    'שולחנות מתקפלים': rng() < 0.6,
  },
}));

// ─── חוגים (14) ───

const COURSE_DEFS = [
  // [שם, קטגוריה, מגדר, מודל, מחיר, חדר, מורה]
  ['ציור ורישום', 'אומנות', 'f', 'monthly', 160, 1, 0],
  ['פיסול בחימר', 'אומנות', 'all', 'punch', 45, 1, 0],
  ['גיטרה למתחילים', 'מוזיקה', 'm', 'monthly', 200, 2, 1],
  ['אורגנית ומקלדות', 'מוזיקה', 'all', 'monthly', 190, 2, 1],
  ["ג'ודו בנים", 'ספורט', 'm', 'monthly', 170, 5, 2],
  ['התעמלות קרקע בנות', 'ספורט', 'f', 'monthly', 150, 5, 2],
  ['רובוטיקה צעירה', 'טכנולוגיה', 'm', 'monthly', 220, 3, 3],
  ['תכנות סקראץ׳', 'טכנולוגיה', 'all', 'punch', 50, 3, 3],
  ['אפיית חלות ולחמים', 'בישול', 'f', 'punch', 55, 4, 4],
  ['קונדיטוריה צעירה', 'בישול', 'f', 'monthly', 185, 4, 4],
  ['תופים ודרבוקות', 'מוזיקה', 'm', 'monthly', 175, 2, 5],
  ['אנגלית בכיף', 'העשרה', 'all', 'monthly', 160, 0, 6],
  ['שחמט ואסטרטגיה', 'העשרה', 'all', 'punch', 40, 0, 7],
  ['מחול ותנועה', 'ספורט', 'f', 'punch', 48, 5, 2],
];
const SEMESTER_START = iso(daysFromToday(-240));
const SEMESTER_END = iso(daysFromToday(90));
const courses = COURSE_DEFS.map(([name, cat, gender, model, price, roomIdx, teacherIdx], i) => {
  const weekday = i % 6; // 0=ראשון … 5=שישי
  const time = `${between(14, 19)}:${pick(['00', '30'])}`;
  const twoGroups = i % 5 === 0;
  return {
    id: nextId('c'),
    name,
    teacherId: teachers[teacherIdx].id,
    roomId: rooms[roomIdx].id,
    description: `חוג ${name} שנתי — ${cat}, בהדרכת ${teachers[teacherIdx].name}`,
    price,
    price1: Math.round(price * 0.85),
    price2: Math.round(price * 0.7),
    price1Name: 'אחים',
    price2Name: 'מלגה',
    model,
    size: model === 'punch' ? pick([10, 12]) : 0,
    start: SEMESTER_START,
    end: SEMESTER_END,
    weekday,
    time,
    maxStudents: between(12, 24),
    gender,
    ageMin: between(5, 8),
    ageMax: between(11, 16),
    cat,
    semester: 'תשפ"ו',
    sector: pick(COMMUNITIES),
    sessions: twoGroups
      ? [
          { day: weekday, time, label: 'קבוצה א׳' },
          { day: (weekday + 2) % 6, time, label: 'קבוצה ב׳' },
        ]
      : [{ day: weekday, time, label: '' }],
    notes: '',
  };
});

// ─── משפחות (60) — 2-6 ילדים, חלקן ממתינות/ניקוד נמוך/בלי ספח ───

const families = [];
let bdaySoonCount = 0;
for (let i = 0; i < 60; i++) {
  const surname = SURNAMES[i];
  const city = pick(CITIES);
  const famId = nextId('f');
  const kidCount = between(2, 6);
  const members = [];
  for (let k = 0; k < kidCount; k++) {
    const gender = rng() < 0.5 ? 'm' : 'f';
    const age = between(4, 15);
    // המשפחה הראשונה: לילד הראשון יום הולדת *היום* — מדליק את באנר יום
    // ההולדת במסך הבית בכל הדגמה. ל-11 הבאות: בתוך 14 הימים הקרובים.
    const bdayToday = i === 0 && k === 0;
    const bdaySoon = i > 0 && i < 12 && k === 0;
    if (bdayToday || bdaySoon) bdaySoonCount++;
    members.push({
      id: nextId('m'),
      first: gender === 'm' ? pick(BOYS) : pick(GIRLS),
      gender,
      birth: bdayToday ? birthAtAge(age, 0) : bdaySoon ? birthAtAge(age, 1 + (i % 14)) : birthAtAge(age, -between(15, 350)),
      idNum: makeIdNum(),
      phone: age >= 13 ? phone() : '',
      phone2: '',
      school: pick(SCHOOLS),
      grade: age < 6 ? 'גן' : `${['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'][Math.min(age - 6, 8)]}׳`,
      health: rng() < 0.12 ? pick(['רגישות לבוטנים', 'אסטמה קלה', 'רגישות לגלוטן']) : '',
      mSefach: rng() < 0.8,
      mInvite: rng() < 0.7,
      mRecommend: rng() < 0.5,
      mPhotos: rng() < 0.6,
      mVideos: rng() < 0.4,
      notes: '',
    });
  }
  const pending = i >= 54; // 6 משפחות ממתינות לאישור
  const lowCred = i % 9 === 4; // ~7 משפחות עם ניקוד נמוך
  const score = lowCred ? between(120, 280) : between(420, 900);
  families.push({
    id: famId,
    name: surname,
    father: pick(BOYS),
    fatherId: makeIdNum(),
    mother: pick(GIRLS),
    motherId: makeIdNum(),
    phone: phone(),
    phone2: rng() < 0.6 ? phone() : '',
    email: `family${i + 1}@example.co.il`,
    city,
    address: `${pick(STREETS)} ${between(1, 80)}`,
    community: pick(COMMUNITIES),
    maritalStatus: rng() < 0.9 ? 'נשואים' : pick(['גרושים', 'אלמן/ה']),
    language: rng() < 0.85 ? 'עברית' : pick(['יידיש', 'צרפתית', 'אנגלית']),
    tzedaka: pick(TZEDAKA),
    fullSefach: !(i % 7 === 2), // ~9 משפחות בלי ספח מלא
    discount: i % 11 === 3 ? 'אחים' : '',
    status: pending ? 'pending' : i % 17 === 13 ? 'inactive' : 'active',
    notes: pending ? 'ממתינה להשלמת מסמכים' : '',
    members,
    docs:
      rng() < 0.5
        ? [{ id: nextId('d'), name: 'ספח תעודת זהות.pdf', addedAt: iso(daysFromToday(-between(10, 300))) }]
        : [],
    cred: {
      score,
      log: lowCred
        ? [{ date: iso(daysFromToday(-between(5, 60))), delta: -100, reason: 'ביטול השתתפות ברגע האחרון' }]
        : [{ date: iso(daysFromToday(-between(5, 200))), delta: 50, reason: 'התנדבות באירוע קהילתי' }],
    },
    createdAt: iso(daysFromToday(-between(30, 700))),
  });
}

// ─── שיבוצים (~150) — כולל כרטיסיות כמעט-גמורות וחובות באיחור ───

const enrollments = [];
const activeFams = families.filter((f) => f.status === 'active');
let ei = 0;
outer: for (let round = 0; round < 4; round++) {
  for (const fam of activeFams) {
    if (enrollments.length >= 150) break outer;
    if (round >= fam.members.length) continue;
    const member = fam.members[round];
    const eligible = courses.filter((c) => c.gender === 'all' || c.gender === member.gender);
    const course = eligible[(ei * 7 + round * 3) % eligible.length];
    ei++;
    const punch = course.model === 'punch';
    const nearlyDone = punch && ei % 6 === 0; // כרטיסייה על הקשקש
    const overdue = !punch && ei % 8 === 3; // חוב שעבר את מועד התשלום
    const months = between(3, 8);
    const totalDue = punch ? course.price * course.size : course.price * months;
    const paidCount = overdue ? between(0, 1) : between(1, 3);
    const payments = [];
    for (let p = 0; p < paidCount; p++) {
      payments.push({
        rid: 'R-' + receiptSeq++,
        date: iso(daysFromToday(-between(10, 150))),
        amount: punch ? Math.round(totalDue / 2) : course.price,
        method: pick(['אשראי', 'מזומן', 'העברה בנקאית', 'הוראת קבע']),
      });
    }
    enrollments.push({
      id: nextId('e'),
      memberId: member.id,
      courseId: course.id,
      plan: course.model,
      purchased: punch ? course.size : 0,
      used: punch ? (nearlyDone ? course.size - 1 : between(1, Math.max(1, course.size - 4))) : 0,
      group: course.sessions.length > 1 ? pick(course.sessions).label : '',
      absences:
        ei % 5 === 0
          ? [{ date: iso(daysFromToday(-between(3, 40))), reason: pick(['מחלה', 'אירוע משפחתי', 'לא הודיעו']), noshow: ei % 10 === 0 }]
          : [],
      payments,
      totalDue,
      dueDate: overdue ? iso(daysFromToday(-between(5, 45))) : iso(daysFromToday(between(10, 60))),
      status: 'active',
      note: '',
      enrolledAt: iso(daysFromToday(-between(30, 220))),
    });
  }
}

// ─── אירועים (~25) — כולל אזכרות וימי הולדת (חוזרים עברית) ───

const events = [];
const EVENT_SEEDS = [
  ['ישיבת צוות חודשית', 'org', 3, 'green'],
  ['ערב הוקרה למתנדבים', 'org', 12, 'orange'],
  ['רישום לקייטנת הקיץ נפתח', 'reminder', 5, 'red'],
  ['הזמנת ציוד יצירה', 'reminder', 2, 'orange'],
  ['שיחה עם מנהל בית הספר', 'call', 4, 'green'],
  ['ביקור בית — משפחה חדשה', 'custom', 7, 'orange'],
  ['הצגת סוף שנה — חזרה כללית', 'org', 20, 'red'],
  ['בדיקת בטיחות שנתית לאולם', 'reminder', 25, 'red'],
  ['ישיבת ועד עמותה', 'org', 9, 'green'],
  ['סיור במרכז קהילתי חדש', 'org', 15, 'green'],
  ['תיאום הסעות לטיול', 'call', 6, 'orange'],
  ['חידוש ביטוח צד ג׳', 'reminder', 18, 'red'],
  ['מפגש הורים — חוגי טכנולוגיה', 'org', 11, 'green'],
  ['הכנת דו"ח רבעוני לרשם', 'reminder', 14, 'orange'],
];
for (const [title, type, offset, priority] of EVENT_SEEDS) {
  events.push({
    id: nextId('ev'),
    title,
    date: iso(daysFromToday(offset)),
    time: `${between(9, 19)}:${pick(['00', '15', '30'])}`,
    type,
    customType: type === 'custom' ? 'ביקור בית' : '',
    notes: '',
    price: title.includes('ערב הוקרה') ? 3500 : 0,
    roomId: type === 'org' ? pick(rooms).id : '',
    famId: '',
    priority,
    done: false,
  });
}
// אזכרות (4) — חוזרות לפי תאריך עברי, מקושרות למשפחות
for (let i = 0; i < 4; i++) {
  const fam = families[i * 13];
  events.push({
    id: nextId('ev'),
    title: `אזכרה — ${fam.name}`,
    date: iso(daysFromToday(between(2, 28))),
    time: '19:30',
    type: 'memorial',
    customType: '',
    notes: 'עלייה לקבר ולימוד משניות',
    price: 0,
    roomId: '',
    famId: fam.id,
    priority: 'orange',
    done: false,
  });
}
// ימי הולדת (4) ויום נישואין (1) — חוזרים לפי תאריך עברי
for (let i = 0; i < 4; i++) {
  const fam = families[i * 3];
  const kid = fam.members[0];
  events.push({
    id: nextId('ev'),
    title: `יום הולדת — ${kid.first} ${fam.name}`,
    date: iso(daysFromToday(1 + i * 4)),
    time: '',
    type: 'bday',
    customType: '',
    notes: 'לשלוח ברכה מהעמותה',
    price: 0,
    roomId: '',
    famId: fam.id,
    priority: 'green',
    done: false,
  });
}
events.push({
  id: nextId('ev'),
  title: `יום נישואין — ${families[20].name}`,
  date: iso(daysFromToday(10)),
  time: '',
  type: 'anniversary',
  customType: '',
  notes: '',
  price: 0,
  roomId: '',
  famId: families[20].id,
  priority: 'green',
  done: false,
});
// שני אירועים שכבר בוצעו (עבר)
for (let i = 0; i < 2; i++) {
  events.push({
    id: nextId('ev'),
    title: i === 0 ? 'מסיבת חנוכה קהילתית' : 'ישיבת תקציב שנתית',
    date: iso(daysFromToday(-between(10, 60))),
    time: '18:00',
    type: 'org',
    customType: '',
    notes: '',
    price: i === 0 ? 4200 : 0,
    roomId: rooms[0].id,
    famId: '',
    priority: 'green',
    done: true,
  });
}

// ─── תורמים (15) עם היסטוריית תרומות מרשימה ───

const SUPPORTER_DEFS = [
  ['הרב יחיאל גרינוולד', 'תורם פרטי', 45000],
  ['קרן משפחת שטיינברג', 'קרן', 120000],
  ['אליעזר ברנד ובניו בע"מ', 'עסקי', 68000],
  ['גב׳ שולמית הרשקוביץ', 'תורם פרטי', 22000],
  ['קרן ידידות ירושלים', 'קרן', 95000],
  ['מרדכי פלדמן', 'תורם פרטי', 15000],
  ['חברת בוני העיר בע"מ', 'עסקי', 54000],
  ['משפחת רוטשילד-אדלר', 'תורם פרטי', 80000],
  ['קרן החסד ע"ש רחל', 'קרן', 36000],
  ['יעקב ומרים זילברשטיין', 'תורם פרטי', 28000],
  ['דוד אוחנה', 'תורם פרטי', 9500],
  ['מאפיית הזהב בע"מ', 'עסקי', 18000],
  ['פרופ׳ נתן וייסמן', 'תורם פרטי', 42000],
  ['קהילת אהבת ישראל — ניו יורק', 'קהילה', 150000],
  ['שמעון טוויל', 'תורם פרטי', 12000],
];
const DONATION_CATS = ['כללי', 'מלגות לחוגים', 'קייטנת קיץ', 'ציוד ומבנה', 'סל מזון לחג'];
const supporters = SUPPORTER_DEFS.map(([name, cat, target], i) => {
  const donationCount = between(2, 8);
  const donations = [];
  let ils = 0;
  let usd = 0;
  for (let d = 0; d < donationCount; d++) {
    const isUsd = i === 13 && d % 2 === 0; // הקהילה מחו"ל תורמת בדולרים
    const amount = Math.max(500, Math.round(target / donationCount / 50) * 50);
    if (isUsd) usd += amount;
    else ils += amount;
    donations.push({
      rid: 'D-' + donationSeq++,
      date: iso(daysFromToday(-between(10, 700))),
      amount,
      cur: isUsd ? '$' : '₪',
      cat: pick(DONATION_CATS),
    });
  }
  donations.sort((a, b) => (a.date < b.date ? 1 : -1));
  const dates = donations.map((d) => d.date).sort();
  return {
    id: nextId('sp'),
    name,
    phone: phone(),
    email: `donor${i + 1}@example.com`,
    address: `${pick(STREETS)} ${between(1, 90)}, ${pick(CITIES)}`,
    idNum: '',
    cat,
    forWho: pick(DONATION_CATS),
    notes: i === 1 ? 'מעדיפים פנייה דרך מנהל הקרן בלבד' : '',
    count: donations.length,
    ils,
    usd,
    first: dates[0],
    last: dates[dates.length - 1],
    // שני הראשונים באיחור (מדליק את "דורש טיפול"), השאר עתידיים
    nextDate:
      i === 0 || i === 1
        ? iso(daysFromToday(-between(4, 12)))
        : i % 4 === 0
          ? iso(daysFromToday(between(3, 21)))
          : '',
    donations,
  };
});

// ─── הרכבת מסמך ה-DB (v2) ───

const db = {
  v: 5,
  savedAt: new Date().toISOString(),
  seq,
  receiptSeq,
  donationSeq,
  security: {}, // הדמו פתוח — אין קוד נעילה
  families,
  enrollments,
  courses,
  events,
  rooms,
  teachers,
  supporters,
  orgName: 'עמותת אור הדגמה',
  orgSite: 'https://or-demo.org.il',
  orgDonate: 'https://or-demo.org.il/donate',
  notif: { email: true, push: false, sms: true, strong: false },
  reports: { daily: true, weekly: true, monthly: false, quarterly: false },
  ui: { famView: 'list', crsView: 'grid' },
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'demo.json');
const json = JSON.stringify(db, null, 1);
writeFileSync(outPath, json);

const members = families.reduce((n, f) => n + f.members.length, 0);
console.log(`demo.json נכתב אל ${outPath}`);
console.log(
  `משפחות: ${families.length} · בני משפחה: ${members} (מהם ${bdaySoonCount} עם יום הולדת ב-14 הימים הקרובים)`,
);
console.log(
  `חוגים: ${courses.length} · מורים: ${teachers.length} · חדרים: ${rooms.length} · שיבוצים: ${enrollments.length}`,
);
console.log(
  `אירועים: ${events.length} · תורמים: ${supporters.length} · סה"כ תרומות ₪: ${supporters.reduce((n, s) => n + s.ils, 0).toLocaleString()}`,
);
console.log(`גודל קובץ: ${(json.length / 1024).toFixed(1)} KB · seq סופי: ${seq}`);
