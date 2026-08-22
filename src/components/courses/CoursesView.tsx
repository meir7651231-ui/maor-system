/**
 * מסך ניהול הקורסים — גריד/רשימה (db.ui.crsView), חיפוש וסינון לפי קטגוריה
 * וסמסטר, קורס חדש, וכרטיס קורס מלא בבחירה.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Course } from '../../types/domain';
import { useApp, useCourse } from '../../store/useApp';
import { featureOn, isSuperAdmin, roleOf, teacherIdOf, termOf } from '../../lib/config';
import { normSearch } from '../../lib/validate';
import { Btn, Empty, Modal, PageHead, Select, TextInput } from '../ui';
import { numMatch } from '../families/lib';
import { CourseForm } from './CourseForm';
import { CourseDetail } from './CourseDetail';
import { CourseWheel } from '../wheel/CourseWheel';
import { CoursesCockpit } from './CoursesCockpit';
import { CollectionCenter } from './CollectionCenter';
import { CoursesDashboard } from './CoursesDashboard';
import { TeacherPanel } from './TeacherPanel';
import { RetentionCenter } from './RetentionCenter';
import { coursesOfTeacher, DAY_LETTERS, TINTS, chipStyle, modelMeta, priceSuffix, roomsNow } from './lib';

type CrsSortKey = 'name' | 'audience' | 'teacher' | 'model' | 'count' | 'price' | 'price1' | 'price2' | 'price3';

const EMPTY_CRS_COLF = { name: '', audience: '', teacher: '', model: 'all', count: '', price: '' };

export function CoursesView() {
  const selCourseId = useApp((s) => s.selCourseId);
  const selected = useCourse(selCourseId);
  const cfg = useApp((s) => s.config);
  const wheelOn = featureOn(cfg, 'courses.wheel');
  const [wheelOpen, setWheelOpen] = useState(false);

  // פלטת הפקודות מסמנת דגל ב-sessionStorage (וגם משדרת אירוע, למקרה
  // שהמסך כבר פתוח) — הגלגל נפתח מיד עם הכניסה לחוגים.
  useEffect(() => {
    const check = () => {
      try {
        if (sessionStorage.getItem('maor_open_wheel') === '1') {
          sessionStorage.removeItem('maor_open_wheel');
          setWheelOpen(true);
        }
      } catch {
        /* sessionStorage חסום */
      }
    };
    check();
    window.addEventListener('maor:open-wheel', check);
    return () => window.removeEventListener('maor:open-wheel', check);
  }, []);

  return (
    <>
      {selected ? <CourseDetail course={selected} /> : <CoursesList onOpenWheel={() => setWheelOpen(true)} />}
      {wheelOn && wheelOpen && <CourseWheel onClose={() => setWheelOpen(false)} />}
    </>
  );
}

function CoursesList(props: { onOpenWheel: () => void }) {
  const db = useApp((s) => s.db);
  const setDb = useApp((s) => s.setDb);
  const selectCourse = useApp((s) => s.selectCourse);
  const cfg = useApp((s) => s.config);
  const wheelOn = featureOn(cfg, 'courses.wheel');
  // תמונת-חוג בלוח (בקשת-בעלים 9.8) — אותו דגל של התמונה בכרטיס
  const gradeimgOn = featureOn(cfg, 'courses.gradeimg');
  // רצועת חדרים LIVE (P2 פער 27) — "עכשיו" מתעדכן דקה-דקה בלי אינטראקציה
  const roomsLiveOn = featureOn(cfg, 'courses.roomslive');
  // מדרגות-מחיר (הנחות) — כבוי ⇒ עמודות הנחה 1–3 מוסתרות מהרשימה
  const discountsOn = featureOn(cfg, 'courses.discounts');
  // תפריט ⋯ הערות-ופרטים בשורה/בכרטיס — כבוי ⇒ מוסתר
  const rownotesOn = featureOn(cfg, 'courses.rownotes');
  // תג-תפוסה N/max — כבוי ⇒ העמודה/התג מוסתרים
  const occupancyOn = featureOn(cfg, 'courses.occupancy');
  // מיון בלחיצה על כותרת — כבוי ⇒ כותרות סטטיות
  const sortOn = featureOn(cfg, 'courses.sort');
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!roomsLiveOn) return;
    const t = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [roomsLiveOn]);
  const liveRooms = useMemo(() => (roomsLiveOn ? roomsNow(db, new Date(nowTick)) : []), [roomsLiveOn, db, nowTick]);
  // תפקיד מורה (P3 פריט 15, הכרעה 2): מורה מחוברת רואה רק את החוגים שלה,
  // ופעולות הניהול מוסתרות. בלי ענן/בלי roles — null ⇒ התנהגות של היום בדיוק.
  const userEmail = useApp((s) => s.cloud.user?.email ?? null);
  const rolesOn = featureOn(cfg, 'shell.roles');
  const myTeacherId = rolesOn && roleOf(cfg, userEmail) === 'teacher' ? teacherIdOf(cfg, userEmail) : null;

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sem, setSem] = useState('all');
  const [sort, setSort] = useState<{ key: CrsSortKey; dir: 1 | -1 } | null>(null);
  const [colFOn, setColFOn] = useState(false);
  const [colF, setColF] = useState(EMPTY_CRS_COLF);
  const [formOpen, setFormOpen] = useState(false);
  // בקשת-בעלים: תפריט-⋯ בכרטיס-החוג במסך-החיצוני — מציג את ההערות (התיאור)
  const [notesCourse, setNotesCourse] = useState<Course | null>(null);
  // 🎯 קוקפיט-חוגים (פאזה 2) — opt-in מפורש (=== true), במכוון לא featureOn (ברירת-מחדל
  // 'on' הייתה מדליקה לכל לקוח-חי). חסר-הדגל ⇒ אין מתג, אפס-השפעה.
  // ‏!myTeacherId — כמו אחיו (גבייה/דשבורד/שימור): מורה מחוברת לא רואה חובות/סיכון
  // של כל החוגים (חשיפת מידע חוצה-מורים). לבעלים/מקומי ⇒ נשאר כשהיה.
  const cockpitOn = cfg.features?.['courses.cockpit'] === true && !myTeacherId;
  const [workMode, setWorkMode] = useState(false);
  // 💰 מרכז-גבייה (פאזה 5) — כל החייבים חוצה-חוגים, מגודר courses.collect.
  const collectOn = featureOn(cfg, 'courses.collect') && !myTeacherId;
  const [collectOpen, setCollectOpen] = useState(false);
  // 📊 דשבורד-חוגים (פאזה 8) — מבט-על פר-חוג, מגודר courses.dashboard (ולא-מורה).
  const dashboardOn = featureOn(cfg, 'courses.dashboard') && !myTeacherId;
  const [dashboardOpen, setDashboardOpen] = useState(false);
  // 🎓 אפליקציית-המורה (גל ה׳ · פאזה 9) — opt-in מפורש (=== true) + תפקיד-מורה בלבד.
  // המסך המצומצם של המורה (מפגשי-היום שלה + נוכחות + השלמות + דוח). ברירת-מחדל דלוקה למורה.
  const teacherAppOn = cfg.features?.['courses.teacherapp'] === true && !!myTeacherId;
  const [teacherMode, setTeacherMode] = useState(() => teacherAppOn);
  // 💚 מרכז-שימור (גל ה׳ · פאזה 11) — חיזוי-נשירה + הצעת-התערבות AI. opt-in מפורש (ולא-מורה).
  const retentionOn = cfg.features?.['courses.ai'] === true && !myTeacherId;
  const [retentionOpen, setRetentionOpen] = useState(false);
  // 👁 תצוגה-כמורה לבעלים (גל ה׳ · תיקון) — הבעלים אינו מורה ולכן מסך-המורה מוסתר ממנו,
  // ואינו יכול לאמת את היכולת. כאן: בעלים בוחר מורה וצופה במסך-שלה בדיוק (בלי התחברות-ענן).
  // גישה: מקומי בלי-ענן = בעלים; בענן = מייל-על בלבד. תמיד `!myTeacherId` (למורה יש מסך-אמת).
  const canTeacherPreview =
    cfg.features?.['courses.teacherapp'] === true && !myTeacherId && db.teachers.length > 0 && (!userEmail || isSuperAdmin(userEmail));
  const [previewTid, setPreviewTid] = useState<string | null>(null);
  const [previewPickerOpen, setPreviewPickerOpen] = useState(false);

  // בקשת "+ חוג" מהפלטה (P1.6) — אותו דפוס כמו famFormReq
  const courseFormReq = useApp((s) => s.courseFormReq);
  const ackCourseForm = useApp((s) => s.ackCourseForm);
  useEffect(() => {
    if (courseFormReq) {
      setFormOpen(true);
      ackCourseForm();
    }
  }, [courseFormReq, ackCourseForm]);

  const view = db.ui.crsView;
  const teacherName = useCallback(
    (id: string) => db.teachers.find((t) => t.id === id)?.name ?? '—',
    [db.teachers],
  );

  const cats = useMemo(() => [...new Set(db.courses.map((c) => c.cat).filter(Boolean))], [db.courses]);
  const sems = useMemo(() => [...new Set(db.courses.map((c) => c.semester).filter(Boolean))], [db.courses]);

  // ספירת שיבוצים לכל חוג במעבר O(E) יחיד, במקום enrollCount(db,c.id) (סריקה מלאה)
  // שנקרא בפילטר, בממיין, ובכל שורה מרונדרת — כלומר O(חוגים × שיבוצים) לכל render.
  const enrollCounts = useMemo(() => {
    const cnt = new Map<string, number>();
    for (const e of db.enrollments) {
      // כמו enrollCount (lib): 'wait' אינו תופס מקום — ספירתו כאן ניפחה את התפוסה
      // המוצגת בלוח ("11/10" אדום) בעוד הכרטיס הראה 8/10 (המונה היחיד שסטה).
      if (e.status === 'ended' || e.status === 'wait') continue;
      cnt.set(e.courseId, (cnt.get(e.courseId) || 0) + 1);
    }
    return cnt;
  }, [db.enrollments]);

  const shown = useMemo(() => {
    const nq = normSearch(q);
    const list = coursesOfTeacher(db.courses, myTeacherId).filter((c) => {
      if (cat !== 'all' && c.cat !== cat) return false;
      if (sem !== 'all' && c.semester !== sem) return false;
      if (colF.name.trim() && !normSearch(c.name).includes(normSearch(colF.name))) return false;
      if (colF.audience.trim() && !normSearch(c.audience || '').includes(normSearch(colF.audience))) return false;
      if (colF.teacher.trim() && !normSearch(teacherName(c.teacherId)).includes(normSearch(colF.teacher))) return false;
      if (colF.model !== 'all' && c.model !== colF.model) return false;
      if (!numMatch(colF.count, (enrollCounts.get(c.id) || 0))) return false;
      if (!numMatch(colF.price, c.price || 0)) return false;
      if (nq) {
        const hay = normSearch([c.name, teacherName(c.teacherId), c.cat, c.audience ?? ''].join(' '));
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
    if (!sort) return list;
    const val = (c: Course): string | number =>
      sort.key === 'name' ? c.name
      : sort.key === 'audience' ? c.audience || ''
      : sort.key === 'teacher' ? teacherName(c.teacherId)
      : sort.key === 'model' ? c.model
      : sort.key === 'count' ? (enrollCounts.get(c.id) || 0)
      : sort.key === 'price1' ? c.price1 || 0
      : sort.key === 'price2' ? c.price2 || 0
      : sort.key === 'price3' ? c.price3 || 0
      : c.price || 0;
    return [...list].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cc = typeof va === 'string' ? va.localeCompare(String(vb), 'he') : va - (vb as number);
      return cc * sort.dir;
    });
  }, [db, q, cat, sem, colF, sort, teacherName, enrollCounts]);

  const clickSort = (key: CrsSortKey) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  // courses.sort כבוי ⇒ כותרת סטטית (בלי קליק-מיון ובלי חצים)
  const thSort = (key: CrsSortKey, label: string) =>
    sortOn ? (
      <th
        onClick={() => clickSort(key)}
        title="מיון לפי העמודה — לחיצה נוספת הופכת כיוון"
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        {label}{' '}
        <span style={{ fontSize: 10, opacity: sort?.key === key ? 1 : 0.35 }}>
          {sort?.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}
        </span>
      </th>
    ) : (
      <th style={{ whiteSpace: 'nowrap' }}>{label}</th>
    );

  const colInput = (field: 'name' | 'audience' | 'teacher' | 'count' | 'price', placeholder: string) => (
    <th style={{ padding: '4px 8px' }}>
      <input
        value={colF[field]}
        onChange={(e) => setColF({ ...colF, [field]: e.target.value })}
        placeholder={placeholder}
        style={{ width: '100%', minWidth: 56, padding: '5px 8px', fontSize: 12 }}
      />
    </th>
  );

  const colFActive =
    colF.name.trim() !== '' || colF.audience.trim() !== '' || colF.teacher.trim() !== '' ||
    colF.model !== 'all' || colF.count.trim() !== '' || colF.price.trim() !== '';

  function toggleView() {
    setDb((d) => ({ ui: { ...d.ui, crsView: d.ui.crsView === 'grid' ? 'list' : 'grid' } }));
  }

  const countColor = (c: Course, n: number) =>
    n >= (c.maxStudents || 999) ? '#dc2626' : n >= (c.maxStudents || 999) * 0.8 ? '#9a6414' : '#8b8474';

  // 🎓 מסך-המורה — מחליף את הרשימה במסך המצומצם של המורה (כל ההוקים למעלה).
  if (teacherAppOn && teacherMode && myTeacherId) {
    return (
      <div>
        <PageHead
          title={termOf(cfg, 'nav.courses', 'חוגים')}
          sub="המסך שלי — המפגשים, הנוכחות וההשלמות שלי"
          actions={<Btn onClick={() => setTeacherMode(false)}>☰ כל ה{termOf(cfg, 'nav.courses', 'חוגים')}</Btn>}
        />
        <TeacherPanel teacherId={myTeacherId} />
      </div>
    );
  }

  // 👁 תצוגה-כמורה לבעלים — מציג את מסך-המורה של המורה הנבחרת בדיוק, בלי צורך בהתחברות-מורה.
  if (canTeacherPreview && previewTid) {
    const t = db.teachers.find((x) => x.id === previewTid);
    return (
      <div>
        <PageHead
          title={termOf(cfg, 'nav.courses', 'חוגים')}
          sub={'👁 תצוגה מקדימה — כפי שהמורה ' + (t?.name || '') + ' רואה'}
          actions={<Btn onClick={() => setPreviewTid(null)}>← יציאה מהתצוגה</Btn>}
        />
        <div style={{ fontSize: 12.5, color: '#9a6414', background: '#fdf1d4', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
          👁 זו התצוגה המדויקת שהמורה תראה כשתתחבר לחשבון-הענן שלה — לבדיקה ולהדגמה.
        </div>
        <TeacherPanel teacherId={previewTid} />
      </div>
    );
  }

  // 🎯 חלון-העבודה — מחליף את הרשימה במסך-אחד שמסדר את היום (כל ההוקים למעלה).
  if (cockpitOn && workMode) {
    return (
      <div>
        <PageHead
          title={termOf(cfg, 'nav.courses', 'חוגים')}
          sub="חלון-העבודה — המערכת מסדרת את היום"
          actions={
            <>
              {collectOn && <Btn onClick={() => setCollectOpen(true)}>💰 גבייה</Btn>}
              {dashboardOn && <Btn onClick={() => setDashboardOpen(true)}>📊 דשבורד</Btn>}
              {retentionOn && <Btn onClick={() => setRetentionOpen(true)}>💚 שימור</Btn>}
              <Btn onClick={() => setWorkMode(false)}>☰ הרשימה</Btn>
            </>
          }
        />
        <CoursesCockpit />
        {collectOpen && <CollectionCenter onClose={() => setCollectOpen(false)} />}
        {dashboardOpen && <CoursesDashboard onClose={() => setDashboardOpen(false)} />}
        {retentionOpen && <RetentionCenter onClose={() => setRetentionOpen(false)} />}
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title={termOf(cfg, 'nav.courses', 'ניהול קורסים')}
        sub={
          shown.length === db.courses.length
            ? db.courses.length + ' קורסים פעילים'
            : shown.length + ' מתוך ' + db.courses.length + ' קורסים — מסונן'
        }
        actions={
          <>
            {teacherAppOn && (
              <Btn onClick={() => setTeacherMode(true)} title="המסך שלי — המפגשים, הנוכחות וההשלמות שלי">
                🎓 המסך שלי
              </Btn>
            )}
            {canTeacherPreview && (
              <Btn onClick={() => setPreviewPickerOpen(true)} title="צפייה במסך-המורה כפי שהמורה רואה אותו — לבדיקה והדגמה">
                👁 תצוגה כמורה
              </Btn>
            )}
            {wheelOn && (
              <Btn onClick={props.onOpenWheel} title={'גלגל מזל שבוחר ' + termOf(cfg, 'entity.course', 'חוג') + ' לפי הסינון שלכם'}>
                🎡 מצא {termOf(cfg, 'entity.course', 'חוג')}
              </Btn>
            )}
            {featureOn(cfg, 'courses.viewtoggle') && (
              <Btn onClick={toggleView} title="החלפת תצוגה: גריד / רשימה">
                {view === 'list' ? '▦ גריד' : '☰ רשימה'}
              </Btn>
            )}
            {cockpitOn && (
              <Btn onClick={() => setWorkMode(true)} title="חלון-העבודה — המערכת מסדרת את היום">
                🎯 חלון-העבודה
              </Btn>
            )}
            {collectOn && (
              <Btn onClick={() => setCollectOpen(true)} title="מרכז-גבייה — כל החייבים חוצה-חוגים">
                💰 גבייה
              </Btn>
            )}
            {dashboardOn && (
              <Btn onClick={() => setDashboardOpen(true)} title="דשבורד-חוגים — תפוסה, חוב, נשירה והחוגים-המבוקשים במבט-אחד">
                📊 דשבורד
              </Btn>
            )}
            {retentionOn && (
              <Btn onClick={() => setRetentionOpen(true)} title="מרכז-שימור — תלמידים בסיכון-נשירה + הצעת-התערבות">
                💚 שימור
              </Btn>
            )}
            {!myTeacherId && (
              <Btn kind="primary" onClick={() => setFormOpen(true)}>
                ➕ הוספת {termOf(cfg, 'entity.course', 'חוג')}
              </Btn>
            )}
          </>
        }
      />

      {/* רצועת חדרים LIVE (P2 פער 27) — 🟢 פנוי / 🔴 שם החוג שמתקיים עכשיו */}
      {roomsLiveOn && liveRooms.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {liveRooms.map(({ room, busyWith }) => (
            <button
              key={room.id}
              type="button"
              onClick={() => busyWith && selectCourse(busyWith.id)}
              title={busyWith ? 'מתקיים עכשיו — פתיחת ה' + termOf(cfg, 'entity.course', 'חוג') : 'ה' + termOf(cfg, 'entity.room', 'חדר') + ' פנוי עכשיו'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid var(--line)',
                background: busyWith ? '#fdeaea' : '#e4f5ea',
                color: busyWith ? '#b91c1c' : '#12803c',
                cursor: busyWith ? 'pointer' : 'default',
              }}
            >
              <span aria-hidden>{busyWith ? '🔴' : '🟢'}</span>
              {room.name + (busyWith ? ' · ' + busyWith.name : ' · פנוי')}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <TextInput value={q} onChange={setQ} placeholder={'חיפוש לפי שם, ' + termOf(cfg, 'entity.teacher', 'מורה') + ', קהל או קטגוריה…'} />
        </div>
        <div style={{ width: 170 }}>
          <Select
            value={cat}
            onChange={setCat}
            options={[{ value: 'all', label: 'כל הקטגוריות' }, ...cats.map((x) => ({ value: x, label: x }))]}
          />
        </div>
        <div style={{ width: 150 }}>
          <Select
            value={sem}
            onChange={setSem}
            options={[{ value: 'all', label: 'כל הסמסטרים' }, ...sems.map((x) => ({ value: x, label: x }))]}
          />
        </div>
        {view === 'list' && featureOn(cfg, 'courses.colfilter') && (
          <Btn
            onClick={() => setColFOn(!colFOn)}
            title={'שורת סינון מתחת לכל עמודה: שם, קהל, ' + termOf(cfg, 'entity.teacher', 'מורה') + ', מסלול, ' + termOf(cfg, 'entity.students', 'תלמידים') + ' (3 / 3+ / 2-4) ומחיר'}
            kind={colFOn || colFActive ? 'primary' : undefined}
          >
            ⏷ סינון עמודות
          </Btn>
        )}
      </div>

      {shown.length === 0 ? (
        <Empty>
          {db.courses.length === 0
            ? 'עדיין אין ' + termOf(cfg, 'nav.courses', 'חוגים') + ' — לחצו על "➕ הוספת ' + termOf(cfg, 'entity.course', 'חוג') + '"'
            : 'אין ' + termOf(cfg, 'nav.courses', 'חוגים') + ' תואמים לסינון'}
        </Empty>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {shown.map((c, i) => {
            const mm = modelMeta(c);
            const n = (enrollCounts.get(c.id) || 0);
            return (
              <div
                key={c.id}
                className="card"
                role="button"
                tabIndex={0}
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => selectCourse(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectCourse(c.id);
                  }
                }}
              >
                {/* בקשת-בעלים 9.8: תמונת-החוג מוצגת גם בלוח (כשקיימת) — אחרת האות-הצבעונית */}
                {gradeimgOn && c.img ? (
                  <img
                    src={c.img}
                    alt=""
                    style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      height: 90,
                      background: TINTS[i % TINTS.length],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      fontWeight: 800,
                      color: 'rgba(33,29,23,.38)',
                    }}
                  >
                    {c.name[0]}
                  </div>
                )}
                <div style={{ padding: '13px 15px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5 }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={chipStyle(mm.bg, mm.c)}>{mm.label}</span>
                      {rownotesOn && (
                        <button
                          type="button"
                          title="הערות ופרטים"
                          onClick={(e) => { e.stopPropagation(); setNotesCourse(c); }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'var(--ink-faint)', padding: '0 2px' }}
                        >
                          ⋯
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                    {(c.audience || 'כללי') + ' · ' + termOf(cfg, 'entity.teacher', 'מורה') + ': ' + teacherName(c.teacherId)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 11,
                      paddingTop: 10,
                      borderTop: '1px solid var(--line)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{c.price ? '₪' + c.price + ' ' + priceSuffix(c.model) : '—'}</span>
                    {occupancyOn && (
                      <span style={{ fontWeight: 700, color: countColor(c, n) }}>
                        {n + '/' + (c.maxStudents || '∞') + ' ' + termOf(cfg, 'entity.students', 'תלמידים')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                {thSort('name', 'שם ' + termOf(cfg, 'entity.course', 'חוג'))}
                {thSort('audience', 'קהל')}
                {thSort('teacher', termOf(cfg, 'entity.teacher', 'מורה'))}
                {thSort('model', 'מסלול')}
                <th>יום</th>
                {occupancyOn && thSort('count', termOf(cfg, 'entity.students', 'תלמידים'))}
                {thSort('price', 'מחיר')}
                {/* מדרגות-מחיר כבויות ⇒ עמודות ההנחה מוסתרות (כותרת+סינון+תא) */}
                {discountsOn && thSort('price1', 'הנחה 1')}
                {discountsOn && thSort('price2', 'הנחה 2')}
                {discountsOn && thSort('price3', 'הנחה 3')}
                {rownotesOn && <th />}
              </tr>
              {colFOn && (
                <tr>
                  {colInput('name', 'שם…')}
                  {colInput('audience', 'קהל…')}
                  {colInput('teacher', termOf(cfg, 'entity.teacher', 'מורה') + '…')}
                  <th style={{ padding: '4px 8px' }}>
                    <select
                      value={colF.model}
                      onChange={(e) => setColF({ ...colF, model: e.target.value })}
                      style={{ width: '100%', padding: '5px 6px', fontSize: 12 }}
                    >
                      <option value="all">הכל</option>
                      <option value="monthly">מנוי חודשי</option>
                      {/* P3 פריט 2 — כל ארבעת המסלולים, בתוויות planWord */}
                      <option value="half_year">מנוי חצי-שנתי</option>
                      <option value="year">מנוי שנתי</option>
                      <option value="punch">כרטיסייה</option>
                    </select>
                  </th>
                  <th />
                  {occupancyOn && colInput('count', '3 / 3+')}
                  {colInput('price', '150 / 100-200')}
                  {discountsOn && <th />}
                  {discountsOn && <th />}
                  {discountsOn && <th />}
                  {rownotesOn && <th />}
                </tr>
              )}
            </thead>
            <tbody>
              {shown.map((c) => {
                const mm = modelMeta(c);
                const n = (enrollCounts.get(c.id) || 0);
                return (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => selectCourse(c.id)}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{c.audience || 'כללי'}</td>
                    <td>{teacherName(c.teacherId)}</td>
                    <td style={{ fontSize: 12 }}>{mm.label}</td>
                    <td style={{ fontSize: 12 }}>{DAY_LETTERS[c.weekday] + ' ' + (c.time || '')}</td>
                    {occupancyOn && <td style={{ fontWeight: 700, color: countColor(c, n) }}>{n + '/' + (c.maxStudents || '∞')}</td>}
                    <td style={{ fontWeight: 800 }}>{c.price ? '₪' + c.price : '—'}</td>
                    {discountsOn && (
                      <td style={{ color: '#12803c', fontWeight: 700 }}>
                        {c.price1 ? '₪' + c.price1 + (c.price1Name ? ' · ' + c.price1Name : '') : '—'}
                      </td>
                    )}
                    {discountsOn && (
                      <td style={{ color: '#7c3aed', fontWeight: 700 }}>
                        {c.price2 ? '₪' + c.price2 + (c.price2Name ? ' · ' + c.price2Name : '') : '—'}
                      </td>
                    )}
                    {discountsOn && (
                      <td style={{ color: '#b45309', fontWeight: 700 }}>
                        {c.price3 ? '₪' + c.price3 + (c.price3Name ? ' · ' + c.price3Name : '') : '—'}
                      </td>
                    )}
                    {rownotesOn && (
                      <td style={{ width: 34 }}>
                        <button
                          type="button"
                          title="הערות ופרטים"
                          onClick={(e) => { e.stopPropagation(); setNotesCourse(c); }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'var(--ink-faint)' }}
                        >
                          ⋯
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && <CourseForm course={null} onClose={() => setFormOpen(false)} />}
      {collectOpen && <CollectionCenter onClose={() => setCollectOpen(false)} />}
      {dashboardOpen && <CoursesDashboard onClose={() => setDashboardOpen(false)} />}
      {retentionOpen && <RetentionCenter onClose={() => setRetentionOpen(false)} />}

      {/* 👁 בורר-מורה לתצוגה-מקדימה (בעלים) */}
      {previewPickerOpen && (
        <Modal title="👁 תצוגה כמורה — בחרו מורה" onClose={() => setPreviewPickerOpen(false)}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
            בחרו {termOf(cfg, 'entity.teacher', 'מורה')} כדי לראות את המסך המצומצם שהיא רואה — מפגשי-היום, נוכחות והשלמות.
          </div>
          {db.teachers.length === 0 ? (
            <Empty>עדיין אין {termOf(cfg, 'entity.teacher', 'מורים')} מוגדרים — הוסיפו דרך הגדרות.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {db.teachers.map((t) => (
                <Btn key={t.id} onClick={() => { setPreviewTid(t.id); setPreviewPickerOpen(false); }}>
                  🎓 {t.name}
                </Btn>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* בקשת-בעלים: תפריט-⋯ במסך-החיצוני — הערות (התיאור) + מעבר לכרטיס */}
      {notesCourse && (
        <Modal title={'📝 הערות — ' + notesCourse.name} onClose={() => setNotesCourse(null)}>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: notesCourse.description.trim() ? 'var(--ink)' : 'var(--ink-faint)',
              minHeight: 40,
            }}
          >
            {notesCourse.description.trim() || 'אין הערות לחוג זה. אפשר להוסיף בכרטיס החוג ← עריכה.'}
          </div>
          <div className="modal-actions">
            <Btn
              kind="primary"
              onClick={() => {
                const id = notesCourse.id;
                setNotesCourse(null);
                selectCourse(id);
              }}
            >
              פתיחת כרטיס ה{termOf(cfg, 'entity.course', 'חוג')} ←
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
