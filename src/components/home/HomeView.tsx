/**
 * מסך הבית — לוח ווידג'טים הניתן להתאמה אישית פר-ארגון:
 * כל מקטע (ברכה, תקציר, קרוסלה, כרטיסים, היום, דורש טיפול, משפחות אחרונות)
 * הוא ווידג'ט רשום (widgets.tsx); הסדר וההצגה נשמרים ב-db.ui.homeLayout
 * (undefined = ברירת המחדל). מצב עריכה (BoardEdit.tsx) כפוף לפיצ'ר home.board.
 */
import { Fragment, useMemo, useState } from 'react';
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
import {
  defaultLayoutFor,
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
  const markAttnDone = useApp((s) => s.markAttnDone);
  const unmarkAttnDone = useApp((s) => s.unmarkAttnDone);
  const toast = useApp((s) => s.toast);
  const exportBackup = useApp((s) => s.exportBackup);

  const now = new Date();
  const todayIso = isoOf(now);

  const data = useMemo(
    () => ({
      stats: homeStats(db, new Date(todayIso + 'T12:00:00')),
      sessions: coursesOn ? todaySessions(db, now) : [],
      // מודול כבוי ⇒ הנגזרת ריקה — כך כל צרכני data במורד מוגנים אוטומטית
      events: calendarOn ? eventsOnDate(db, now) : [],
      bdays: familiesOn ? birthdaysOn(db, now) : [],
      attention: attentionItems(db, now, config.modules),
      digest: digestLines(db, now, config.modules),
      carousel: carouselItems(db, now, config.modules),
      recent: familiesOn ? recentFamilies(db, 5) : [],
      holiday: holidayOf(now),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, todayIso, config.modules, coursesOn, calendarOn, familiesOn],
  );

  // ניווט ממוגן-מודולים: לעולם לא מנווט למסך של מודול כבוי (no-op במקום קריסה/דליפה)
  const navTo = (nav: AttentionNav) => {
    if (nav.kind === 'course') selectCourse(nav.id);
    else if (nav.kind === 'family') selectFamily(nav.id);
    else if (nav.kind === 'supporters') {
      if (supportersOn) go('supporters');
    } else if (calendarOn) go('calendar');
  };

  /* ── פריסת הלוח + מצב עריכה ── */

  // ברירת המחדל תלוית-ערכה (THEME_LAYOUTS) — פריסה שמורה תמיד גוברת עליה
  const defaultLayout = defaultLayoutFor(config.theme);
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
    const homeLayout = isDefault ? undefined : [...draft];
    setDb((cur) => ({ ui: { ...cur.ui, homeLayout } }));
    setEditing(false);
    toast('פריסת לוח הבית נשמרה ✓');
  };
  // ביטול — ה-draft נזרק; הפריסה שלפני הכניסה לעריכה (db.ui.homeLayout) לא נגעה
  const cancelEdit = () => setEditing(false);
  // איפוס — מחזיר את ה-draft לברירת המחדל; בשמירה יתמיד homeLayout=undefined
  const resetDraft = () => setDraft([...defaultVisible]);

  const ctx: HomeCtx = {
    db,
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
  const tpl = !boardOn || !db.ui.homeLayout ? THEME_TEMPLATES[db.ui.theme ?? config.theme] : undefined;
  if (tpl) {
    const colA = tpl.colA.filter(visible);
    const colB = tpl.colB.filter(visible);
    // עמודה שהתרוקנה כולה (מודולים כבויים) — נופלים לגריד הגנרי במקום חצי לוח ריק
    if (colA.length && colB.length) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {HOME_WIDGETS.hero.render(ctx)}
          {tpl.pre.filter(visible).map((id) => (
            <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
          ))}
          <div className="hm-cols">
            <div className="hm-col">
              {colA.map((id) => (
                <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
              ))}
            </div>
            <div className="hm-col">
              {colB.map((id) => (
                <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
              ))}
            </div>
          </div>
          {tpl.post.filter(visible).map((id) => (
            <Fragment key={id}>{HOME_WIDGETS[id].render(ctx)}</Fragment>
          ))}
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
