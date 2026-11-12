"""הפעלה 155 · /ui: הסימון ברשימת התזכורות עובר בלחיצה עצמה, לא רק כשהרענון של /reminders חוזר.

הבאג: `show()` קבע `sel=id` אבל המחלקה `sel` ברשימה התעדכנה רק בציור מחדש שבסוף `load()`. עד שהשרת ענה,
הרשימה סימנה את התזכורת הקודמת בזמן שהלוח כבר טען את החדשה. ב-CI (הרצה 475) זה הפיל את `web/e2e/ui.mjs`
כשהרענון איחר. הבדיקה המלאה בדפדפן: `web/e2e/ui.mjs` (מחזיק את /reminders ובודק את הסימון לפני שהוא חוזר).
"""
import pathlib
import re

SRC = (pathlib.Path(__file__).parent.parent / "app" / "ui.html").read_text(encoding="utf-8")


def test_show_marks_selection_before_any_await():
    body = SRC[SRC.index("async function show(id,info,stale){"):]
    first_await = body.index("await ")
    pattern = r'querySelectorAll\("#list \.item"\)\.forEach\(b=>b\.classList\.toggle\("sel",\+b\.dataset\.id===id\)\)'
    mark = re.search(pattern, body)
    assert mark, "show() לא מעדכן את הסימון ברשימה"
    assert mark.start() < first_await, "הסימון ברשימה מתעדכן רק אחרי המתנה לשרת"
    assert mark.start() < body.index("load();"), "הסימון צריך לקרות לפני הרענון, לא אחריו"


def test_list_render_still_marks_selected_row():
    # הציור מחדש של הרשימה (אחרי הרענון) ממשיך לסמן לפי sel, כך שהסימון לא אובד כשהתור חוזר
    assert 'class="item card ${r.id===sel?"sel":""}"' in SRC
