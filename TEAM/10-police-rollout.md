# 10 · התקנת השוטר (agent-police) בכל הריפואים — S-POLICE

**הכרעת מאיר 6.11:** להתקין את השוטר בכל הפרויקטים, חוץ מ-`meir7651231-ui/agent-police` ו-`agentpolice/police` (שם בונים אותו).

## שלב 0 · מה ההתקנה כותבת (מקריאת README + CHANGELOG של agentpolice/police v1.7.15)
- פקודה: `npx --yes github:agentpolice/police install` (או `--vendor` מקופה מקומית). רמות: `--level basic|protected|strict` (ברירת-מחדל protected), `--audit daily|weekly|monthly|off`.
- כותבת לריפו: תיקיית **`.agent-police/`** (עותק-ספק של המנוע, חתום/מוחתם) · **`harness.json`** (קונפיג השופט; ה-commit שלו מוגבל ע"י ה-pre-tool hook) · הוראות קצרות לסוכנים (קבצי-הוראות: CLAUDE.md/AGENTS.md וכו') · hooks לסוכנים (Claude Code `.claude/settings.json` — PreToolUse matcher `*`, Stop, prompt; Cursor/Codex/Copilot) · **git hooks** (pre-commit לפחות).
- מצב מקומי: `.harness/` בריפו + `~/.agent-police/state/` (HMAC).
- **CI לא נכתב ע"י install** — זו פקודה נפרדת `agent-police ci` (`.github/workflows/agent-police.yml` + `agent-police-sign.yml`), שדורשת `harness.json` מחויב ב-base ו-`AGENT_POLICE_BOOTSTRAP=1` ל-PR הראשון ⇒ **שינוי הגדרות-ריפו = אסור בתדריך** ⇒ לא בהיקף.
- רישיון: ניסיון 2 ימים; אחריו `check` = NOT JUDGED (exit 3) — לא חוסם עבודה.
- ⚠️ **לא ידוע:** אם install מגדיר `core.hooksPath` או כותב ל-`.git/hooks` ואם הוא ממזג/דורס `.claude/settings.json` ו-`CLAUDE.md` קיימים — הקוד ב-`lib/*.mjs` **מוצפן (APX1)**, אי-אפשר לקרוא. הניסוי המתוכנן (התקנה על עותק-scratch של maor-system + diff) נחסם — ראו למטה.
- ⚠️ ה-CHANGELOG: "The agent may run neither, nor install / uninstall the police" — ההתקנה מיועדת להרצה **ע"י הבעלים**, לא ע"י סוכן.

### תוספת מ-S-AP/S-SEC (דרך «מעקב ביצוע», 6.11)
- בלוק-מסומן (לא דורס; uninstall מסיר רק אותו) ל-AGENTS.md/CLAUDE.md/GEMINI.md/copilot-instructions/.cursor/rules · hooks ב-`.claude/settings.json` **ממוזגים** · דגלים: `--only`, `--no-hooks`, `--no-claude`.
- ⚠️ **git hooks:** הבלוק נכנס **בראש** ה-hook הקיים בנתיב `git rev-parse --git-path hooks` ⇒ ב-maor-system (`core.hooksPath=.githooks`, committed) ישנה את שער-ה-commit לכל משכפל. כלל: בריפו עם hooksPath/husky — לא לגעת ב-git hooks; שילוב בשערים הקיימים = שאלה למאיר.
- בענן `.git/hooks` לא שורד — רק committed. `harness.json` לקמט רק כפי ש-install כתב. **לא לקמט קובץ רישיון.**
- Stop hook = check מלא, timeout 900s — ב-buildsmart (~6,000 בדיקות Flutter) לבדוק/להגביל את verify ב-harness.json.
- עשן: `check --fast` מדלג על build/verify — אינו הוכחה שהבדיקות עוברות.
- **החסם בעינו:** המידע הזה לא משנה את חסימת ההרצה בסשן.

## 🔴 חסם (6.11)
הרצת קוד ההתקנה (קוד חיצוני מוצפן מ-GitHub) **נחסמה ע"י מסווג ההרשאות של הסשן** ("Code from External"), גם על עותק-ניסוי מבודד. לא עקפתי את החסימה. לא נגעתי באף ריפו-יעד.

**כדי להתקדם — אחת מאלה (החלטת מאיר):**
1. מאיר מריץ בעצמו בכל ריפו (המסלול שה-README והמנוע עצמו מצפים לו): `npx --yes github:agentpolice/police install` על ענף `claude/install-agent-police`, ואז הסשן ממשיך משלב 3 (check + שער-הריפו + PR טיוטה).
2. או: מאיר מוסיף הרשאה מפורשת לסשן (כלל Bash ל-`node …/agent-police.mjs install` / `npx … github:agentpolice/police install`) ומבקש להמשיך.

## טבלה
| ריפו | PR | check | CI על main | הערות |
|---|---|---|---|---|
| maor-system | — | — | — | חסום: הרצת install נחסמה. יש `.githooks/` + `core.hooksPath` + `.claude/settings.json` + CLAUDE.md — לבדוק מיזוג אחרי הרצה |
| buildsmart | — | — | — | לא התחיל (חסם) |
| smartgrid | — | — | — | לא התחיל (חסם) |
| yoman-habina | — | — | — | לא התחיל (חסם) |
| yeshiva-engine | — | — | — | לא התחיל (חסם) |
| -ai-chat-server | — | — | — | לא התחיל (חסם) |
| 14kk | — | — | — | לא התחיל (חסם) |
| MMMM | — | — | — | לא התחיל (חסם) |
| qa-scanner | — | — | — | לא התחיל (חסם) |
| orbit-il | — | — | — | צפוי דילוג: workflow-בלבד (build מ-maor-system ⇒ gh-pages), אין קוד/בדיקות לשפוט |
