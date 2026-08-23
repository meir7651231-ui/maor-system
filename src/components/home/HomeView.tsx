/**
 * מסך הבית — לוח ווידג'טים הניתן להתאמה אישית פר-ארגון:
 * כל מקטע (ברכה, תקציר, קרוסלה, כרטיסים, היום, דורש טיפול, משפחות אחרונות)
 * הוא ווידג'ט רשום (widgets.tsx); הסדר וההצגה נשמרים ב-db.ui.homeLayout
 * (undefined = ברירת המחדל). מצב עריכה (BoardEdit.tsx) כפוף לפיצ'ר home.board.
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { holidayOf } from '../../lib/hebrew';
import { featureOn, moduleOn } from '../../lib/config';
import {
  attentionItems,
  birthdaysOn,
  carouselItems,
  digestLines,
  eventsOnDate,
  homeStats,
  isoOf,
  recentFamilies,
  todaySessions,
  type AttentionNav,
} from './homeData';
import { visibleSupportersForDesignations } from '../supporters/lib';
import { requestSupportersSegment } from '../supporters/segments';
import {
  defaultLayoutFor,
  noBoardLayoutFor,
  HOME_WIDGETS,
  sanitizeLayout,
  THEME_TEMPLATES,
  type HomeCtx,
  type WidgetId,
} from './widgets';
import { BoardEditor } from './BoardEdit';

export function HomeView() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const setDb = useApp((s) => s.setDb);
  // חוזה המודולים (types/config.ts): מודול כבוי מוסתר מכל משטחי הבית — בלי למחוק נתונים
  const familiesOn = moduleOn(config, 'families');
  const coursesOn = moduleOn(config, 'courses');
  const calendarOn = moduleOn(config, 'calendar');
  const supportersOn = moduleOn(config, 'supporters');
  // לוח הווידג'טים — כשהפיצ'ר home.board כבוי: אין כפתור עריכה ותמיד ברירת המחדל
  const boardOn = featureOn(config, 'home.board');
  const go = useApp((s) => s.go);
  const selectFamily = useApp((s) => s.selectFamily);
  const selectCourse = useApp((s) => s.selectCourse);
  const openSupporterCard = useApp((s) => s.openSupporterCard);
  const markAttnDone = useApp((s) => s.markAttnDone);
  const unmarkAttnDone = useApp((s) => s.unmarkAttnDone);
  const toast = useApp((s) => s.toast);
  const exportBackup = useApp((s) => s.exportBackup);

  // ⏰ דופק-דקה (19.8): ברכת-השעה מתעדכנת והלוח מתגלגל בחצות בלי רענון —
  // now/todayIso נגזרים מחדש בכל רנדר, וה-useMemo של data מוקפץ כש-todayIso מתחלף.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const todayIso = isoOf(now);

  // 🔒 ייעוד-הרשאה (13.8): עובדת מוגבלת רואה בבית רק תורמים/תרומות בייעוד המותר —
  // db מסונן פעם-אחת ומוזרם לכל נגזרות-התורמים (סטטיסטיקה/תשומת-לב/דיג'סט/קרוסלה).
  const allowedDesignations = useApp((s) => s.cloud.allowedDesignations ?? null);
  const desigLimit = featureOn(config, 'supporters.purpose') ? allowedDesignations : null;
  const vdb = useMemo(
    () => (desigLimit ? { ...db, supporters: visibleSupportersForDesignations(db.supporters, desigLimit) } : db),
    [db, desigLimit],
  );

  const data = useMemo(() => {
    // ⚡ attention מחושב פעם-אחת ומוזרם ל-digest (חוסך חישוב-כפול של כל המנוע)
    const attention = attentionItems(vdb, now, config.modules, config);
    return {
      stats: homeStats(vdb, new Date(todayIso + 'T12:00:00')),
      sessions: coursesOn ? todaySessions(db, now) : [],
      // מודול כבוי ⇒ הנגזרת ריקה — כך כל צרכני data במורד מוגנים אוטומטית
      events: calendarOn ? eventsOnDate(db, now) : [],
      bdays: familiesOn ? birthdaysOn(db, now) : [],
      attention,
      digest: digestLines(vdb, now, config.modules, config, attention),
      carousel: carouselItems(vdb, now, config.modules, config),
      recent: familiesOn ? recentFamilies(db, 5) : [],
      holiday: holidayOf(now),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, vdb, todayIso, config, config.modules, coursesOn, calendarOn, familiesOn]);

  // ניווט ממוגן-מודולים: לעולם לא מנווט למסך של מודול כבוי (no-op במקום קריסה/דליפה)
  const navTo = (nav: AttentionNav) => {
    if (nav.kind === 'course') {
      if (coursesOn) selectCourse(nav.id);
    } else if (nav.kind === 'family') {
      if (familiesOn) selectFamily(nav.id);
    } else if (nav.kind === 'supporter') {
      // חיווט-עומק (19.8): ישר לכרטיס-התומך (openSupporterCard) — מגודר-מודול
      if (supportersOn) openSupporterCard(nav.id);
    } else if (nav.kind === 'supporters') {
      if (supportersOn) { if (nav.seg) requestSupportersSegment(nav.seg); go('supporters'); }
    } else if (calendarOn) go('calendar');
  };

  /* ── פריסת הלוח + מצב עריכה ── */

  // ברירת המחדל תלוית-ערכה (THEME_LAYOUTS) — פריסה שמורה תמיד גוברת עליה.
  // ביקורת 6.8: בלי עריכת-לוח (home.board:false) אין "הוסיפו בקליק" ⇒ הפריסה
  // המלאה ההיסטורית, אחרת 4 ווידג'טים מגודרי-דגל היו אובדים לגמרי.
  // תיקון (19.8): הערכה האפקטיבית = העדפת-המשתמש (db.ui.theme) לפני ערכת-הארגון —
  // אותו מקור כמו התבנית למטה; קודם הפריסה נגזרה מ-config.theme והתבנית מ-db.ui.theme.
  const activeTheme = db.ui.theme ?? config.theme;
  const defaultLayout = boardOn ? defaultLayoutFor(activeTheme) : noBoardLayoutFor(activeTheme);
  // הפריסה השמורה של הארגון — מנורמלת; כשהפיצ'ר כבוי מתעלמים ממנה לגמרי
  const savedLayout = useMemo(
    () => (boardOn ? sanitizeLayout(db.ui.homeLayout, defaultLayout) : [...defaultLayout]),
    [boardOn, db.ui.homeLayout, defaultLayout],
  );
  // ברירת המחדל בפועל — רק ווידג'טים שה-config מציג (להשוואת "האם השתנה")
  const defaultVisible = defaultLayout.filter((id) => HOME_WIDGETS[id].visible(config));

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WidgetId[]>([...defaultLayout]);

  const startEdit = () => {
    // ה-draft כולל רק ווידג'טים visible — כך אינדקסי הגרירה/חצים פשוטים ואמינים
    setDraft(savedLayout.filter((id) => HOME_WIDGETS[id].visible(config)));
    setEditing(true);
  };
  const saveBoard = () => {
    const isDefault =
      draft.length === defaultVisible.length && draft.every((id, i) => id === defaultVisible[i]);
    // תיקון (19.8): ווידג'טים שמוסתרים כרגע (מודול/דגל כבוי זמנית) שורדים שמירה —
    // אחרת עריכה בזמן שמודול כבוי הייתה משמיטה אותם מהפריסה לתמיד.
    const hidden = savedLayout.filter((id) => !HOME_WIDGETS[id].visible(config));
    const homeLayout = isDefault && hidden.length === 0 ? undefined : [...draft, ...hidden];
    setDb((cur) => ({ ui: { ...cur.ui, homeLayout } }));
    setEditing(false);
    toast('פריסת לוח הבית נשמרה ✓');
  };
  // ביטול — ה-draft נזרק; הפריסה שלפני הכניסה לעריכה (db.ui.homeLayout) לא נגעה
  const cancelEdit = () => setEditing(false);
  // איפוס — מחזיר את ה-draft לברירת המחדל; בשמירה יתמיד homeLayout=undefined
  const resetDraft = () => setDraft([...defaultVisible]);

  const ctx: HomeCtx = {
    // 🔒 ייעוד-הרשאה (19.8): הווידג'טים מקבלים את ה-db המסונן (vdb) — ווידג'ט שקורא
    // תורמים ישירות (סטטיסטיקה/תרומות/יעדי-קשר) לא ידלוף מעבר לייעוד; בלי הגבלה vdb===db.
    db: vdb,
    config,
    now,
    todayIso,
    data,
    navTo,
    go,
    selectFamily,
    selectCourse,
    markAttnDone,
    unmarkAttnDone,
    toast,
    exportBackup,
    // ✏️ קישור-אייקון שקט בפינת העמוד (מוצמד ל-.hm-hero) — כניסה למצב העריכה
    headActions:
      boardOn && !editing ? (
        <button
          type="button"
          className="hm-edit-link"
          onClick={startEdit}
          title="עריכת הלוח — הוספה, הסרה וסידור מחדש של ווידג'טים בלוח הבית"
          aria-label="עריכת הלוח"
        >
          <span aria-hidden>✏️</span>
        </button>
      ) : undefined,
  };

  if (editing) {
    return (
      <BoardEditor
        ctx={ctx}
        draft={draft}
        setDraft={setDraft}
        onSave={saveBoard}
        onCancel={cancelEdit}
        onReset={resetDraft}
      />
    );
  }

  /* ── מצב תצוגה — הפריסה השמורה, בדילוג על ווידג'טים לא-visible ── */

  const visible = (id: WidgetId) => HOME_WIDGETS[id].visible(config);

  // תבנית שתי-העמודות של המוקאפ — רק לפריסת ברירת המחדל של הערכה
  // (פריסה מותאמת שמורה גוברת ומתרנדרת בגריד הגנרי למטה)
  // הערכה המוחלת בפועל — העדפת המשתמש גוברת על ערכת הארגון (כמו applyTheme)
  const tpl = !boardOn || !db.ui.homeLayout ? THEME_TEMPLATES[activeTheme] : undefined;
  if (tpl) {
    // איזון-עמודות מדויק (בקשת-בעלים "מסך הבית בלגן", 23.8): במקום פיצול-קבוע
    // colA/colB שהשאיר חצי-לוח-ריק כשווידג'ט סונן — masonry דו-טורי (CSS columns)
    // שמאזן את הגבהים **בפועל** בדפדפן ⇒ שתי העמודות דומות-גובה בכל צירוף-ווידג'טים.
    const mainIds = [...tpl.colA, ...tpl.colB].filter(visible);
    // 🛡 תיקון (20.8, ממצא-ביקורת HIGH): מסלול-התבנית עקף את ערובת-הפריסה-המלאה —
    // ב-home.board:false ה-savedLayout הוא FULL_LAYOUTS, אבל התבנית רינדרה רק את
    // הווידג'טים שלה ⇒ 4 ווידג'טי-האנליטיקה לא עלו כלל. ה"עודפים" מרונדרים אחרי
    // התבנית (קיבוץ-חצאים כמו בגריד); כשאין עודפים — ביט-זהה להיום.
    const tplIds = new Set<WidgetId>(['hero', ...tpl.pre, ...tpl.colA, ...tpl.colB, ...tpl.post]);
    const extras = savedLayout.filter((id) => visible(id) && !tplIds.has(id));
    // פחות משני ווידג'טים גלויים (מודולים כבויים) — נופלים לגריד הגנרי במקום טור-בודד
    if (mainIds.length >= 2) {
      const extraGroups: WidgetId[][] = [];
      for (const id of extras) {
        const last = extraGroups[extraGroups.length - 1];
        if (HOME_WIDGETS[id].slot === 'half' && last && HOME_WIDGETS[last[0]].slot === 'half') last.push(id);
        else extraGroups.push([id]);
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {HOME_WIDGETS.hero.render(ctx)}
          {tpl.pre.filter(visible).map((id) => (
            <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
          ))}
          <div className="hm-masonry">
            {mainIds.map((id) => (
              <div className="hm-ma-item" key={id}>{HOME_WIDGETS[id].render(ctx)}</div>
            ))}
          </div>
          {tpl.post.filter(visible).map((id) => (
            <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
          ))}
          {extraGroups.map((g) =>
            HOME_WIDGETS[g[0]].slot === 'half' ? (
              <div
                key={g[0]}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}
              >
                {g.map((id) => (
                  <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
                ))}
              </div>
            ) : (
              <Fragment key={g[0]}>{HOME_WIDGETS[g[0]].render(ctx)}</Fragment>
            ),
          )}
        </div>
      );
    }
  }

  const shown = savedLayout.filter(visible);
  // רצפים של ווידג'טים "חצי רוחב" (היום/דורש טיפול) מקובצים לשורת גריד אחת —
  // בדיוק הפריסה המקורית (auto-fit minmax(320px,1fr)) כשהם סמוכים
  const groups: WidgetId[][] = [];
  for (const id of shown) {
    const last = groups[groups.length - 1];
    if (HOME_WIDGETS[id].slot === 'half' && last && HOME_WIDGETS[last[0]].slot === 'half') last.push(id);
    else groups.push([id]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {groups.map((g) =>
        HOME_WIDGETS[g[0]].slot === 'half' ? (
          <div
            key={g[0]}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}
          >
            {g.map((id) => (
              <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
            ))}
          </div>
        ) : (
          <Fragment key={g[0]}>{HOME_WIDGETS[g[0]].render(ctx)}</Fragment>
        ),
      )}
    </div>
  );
}
