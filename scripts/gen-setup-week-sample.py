"""W2-S3 · מחולל אקסל-דוגמה למרכז חוגים — נתונים מזויפים, צורה אמיתית.
150 משפחות · 300 ילדים · 12 חוגים · 4 מורות · 4 חדרים · 300 שיבוצים.
python3 scripts/gen-setup-week-sample.py  ⇒ knowledge/playbook/setup-week-sample.xlsx + CSV לכל גיליון.
"""
import csv, random, os
from openpyxl import Workbook
random.seed(7)
OUT = 'knowledge/playbook'
LAST = ['כהן','לוי','מזרחי','פרץ','ביטון','דהן','אברהם','פרידמן','אזולאי','כץ','יוסף','עמר','חדד','גבאי','שפירא','וייס','קליין','רוזנברג','שטרן','אלבז','סבג','נחום','אסולין','ממן','חזן','ברק','גולן','רז','שרון','טל']
FATHER = ['אברהם','יצחק','יעקב','משה','דוד','יוסף','מאיר','חיים','שמואל','נתן','אריה','ברוך']
MOTHER = ['שרה','רבקה','רחל','לאה','מרים','חנה','אסתר','רות','תמר','נעמי','יעל','מיכל']
BOY = ['נועם','איתי','יונתן','אורי','דניאל','אריאל','עידו','יהונתן','אלון','רועי','משה','דוד']
GIRL = ['נועה','תמר','מאיה','שירה','אביגיל','הדס','יעל','רוני','אורי','טליה','שקד','ליה']
CITIES = ['ירושלים','בית שמש','מודיעין','רחובות','פתח תקווה','חיפה']
fams, kids = [], []
used = set()
for i in range(150):
    while True:
        last = random.choice(LAST); father = random.choice(FATHER)
        if (last, father) not in used: used.add((last, father)); break
    phone = f'050-555{i:04d}'
    fams.append({'שם משפחה': last, 'שם האב': father, 'שם האם': random.choice(MOTHER), 'טלפון': phone, 'עיר': random.choice(CITIES), '_key': i})
# 300 ילדים: לכל משפחה 1–3, עד 300 בדיוק
counts = [2] * 150
idx = random.sample(range(150), 100)  # 50 משפחות עם 3, 50 עם 1 ⇒ סה"כ 300
for j in idx[:50]: counts[j] = 3
for j in idx[50:]: counts[j] = 1
assert sum(counts) == 300, sum(counts)
for f, n in zip(fams, counts):
    for k in range(n):
        g = random.choice(['ז', 'נ'])
        y = random.randint(2012, 2020)
        kids.append({'שם משפחה': f['שם משפחה'], 'שם פרטי': random.choice(BOY if g == 'ז' else GIRL), 'טלפון': f['טלפון'], 'שם האם': f['שם האם'],
                     'תאריך לידה': f'{y}-{random.randint(1,12):02d}-{random.randint(1,28):02d}', 'מין': g, 'כיתה': ['א','ב','ג','ד','ה','ו','ז','ח'][min(7, max(0, 2026 - y - 6))]})
teachers = [{'שם': n, 'טלפון': f'052-555{i:04d}'} for i, n in enumerate(['רינה אלון', 'מיכל ברק', 'דנה גל', 'אורית שמש'])]
rooms = [{'חדר': r} for r in ['אולם גדול', 'סטודיו', 'כיתת אמנות', 'חדר מחשבים']]
COURSES = [('בלט מתחילות','סטודיו',0,'א','16:00'),('בלט מתקדמות','סטודיו',0,'ג','17:00'),('ג׳ודו','אולם גדול',1,'ב','16:30'),('כדורגל','אולם גדול',1,'ד','17:00'),
           ('ציור','כיתת אמנות',2,'א','15:30'),('קרמיקה','כיתת אמנות',2,'ג','16:00'),('רובוטיקה','חדר מחשבים',3,'ב','17:00'),('תכנות לילדים','חדר מחשבים',3,'ה','16:00'),
           ('התעמלות קרקע','אולם גדול',0,'ה','15:30'),('אנגלית בכיף','כיתת אמנות',2,'ד','16:30'),('שחמט','חדר מחשבים',3,'א','17:30'),('מחול מודרני','סטודיו',0,'ד','15:30')]
courses = [{'חוג': c, 'חדר': r, 'מורה': teachers[t]['שם'], 'יום': d, 'שעה': h, 'מחיר': random.choice([180, 220, 250, 280]), 'מקסימום': 30} for c, r, t, d, h in COURSES]
enroll = [{'שם משפחה': k['שם משפחה'], 'שם פרטי': k['שם פרטי'], 'טלפון': k['טלפון'], 'חוג': courses[i % 12]['חוג']} for i, k in enumerate(kids)]
sheets = {'משפחות': (fams, ['שם משפחה','שם האב','שם האם','טלפון','עיר']), 'ילדים': (kids, list(kids[0].keys())), 'חוגים': (courses, list(courses[0].keys())),
          'מורות': (teachers, ['שם','טלפון']), 'חדרים': (rooms, ['חדר']), 'שיבוצים': (enroll, list(enroll[0].keys()))}
wb = Workbook(); wb.remove(wb.active)
for name, (rows, cols) in sheets.items():
    ws = wb.create_sheet(name); ws.sheet_view.rightToLeft = True; ws.append(cols)
    for r in rows: ws.append([r[c] for c in cols])
    with open(os.path.join(OUT, f'setup-week-{name}.csv'), 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh); w.writerow(cols); [w.writerow([r[c] for c in cols]) for r in rows]
# פורמט-הייבוא של המערכת: "משפחות (CSV)" = 13 עמודות קבועות (familiesImport.ts)
F13 = ['שם','ת"ז אב','טלפון','שם האם','ת"ז אם','טלפון2','עיר','רחוב','מס׳ בית','מצב (אלמן)','קהילה','—','הערות']
f13 = [[f['שם משפחה'], '', f['טלפון'], f['שם האם'], '', '', f['עיר'], '', '', '', 'כללי', '', 'אב: ' + f['שם האב']] for f in fams]
ws = wb.create_sheet('משפחות-לייבוא (13 עמודות)'); ws.sheet_view.rightToLeft = True; ws.append(F13)
for r in f13: ws.append(r)
with open(os.path.join(OUT, 'setup-week-משפחות-13.csv'), 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh); w.writerow(F13); [w.writerow(r) for r in f13]
wb.save(os.path.join(OUT, 'setup-week-sample.xlsx'))
print({k: len(v[0]) for k, v in sheets.items()})
