# סגירה · שומר-מסך במעקב-הטיפול — 17.9.2026 (PR ‏#498)

## הבקשה (בעלים, הודעה קולית דרך שגרת "ליבה → אדריכל")
"שומר-חזרה" במעקב-הטיפול — כמו שכבר קיים בחוגים ובתורמים (10.9, ‏#490): יוצאים מכרטיס-תורם או עוברים מסך, חוזרים — ו**המקום המדויק נשמר**: הלוח פתוח/סגור, מסך-השמות פתוח/סגור, המסננים, המיון, ואפילו הגלילה בטבלת-השמות.

## מה נבנה (additive · אפס-סכמה · אפס-כסף · לקוח-חי ביט-זהה)
| קובץ | שינוי |
|---|---|
| `src/lib/scrollMemory.ts` | `useElementScrollMemory<T>(key)` — זיכרון-גלילה לאלמנט פנימי (לא לחלון): מחזיר ref, שומר ב-scroll, משחזר ב-double-rAF אחרי הרינדור. |
| `src/components/supporters/AyinBoard.tsx` | `filter`/`sort`/`region` → `useRemembered('ayin.filter'|'ayin.sort'|'ayin.region')`. |
| `src/components/supporters/AyinNamesBoard.tsx` | `q`/`status`/`stageF`/`regionF` → `useRemembered('names.*')`; גלילת הטבלה דרך `useElementScrollMemory('names.table')`. |
| `src/components/supporters/SupportersView.tsx` | מצב-הפתיחה של הלוח ומסך-השמות נזכר (`sup.ayinBoardOpen`/`sup.ayinNamesOpen`); לחיצה על שם במסך-השמות פותחת כרטיס **בלי לסגור** את המסך ⇒ סגירת-הכרטיס מחזירה לרשימה באותה נקודה. |

## כלל-פרויקט (מחוזק)
מסך-רשימה/לוח חדש = `useRemembered` לכל מסנן + `useListScrollRestore` (חלון) או `useElementScrollMemory` (מכולה פנימית). זיכרון-סשן בלבד — רענון = נקי.

## ratchets
- `src/test/care-back-memory.test.ts` — הגנות-מקור: כל המסננים ב-AyinBoard/AyinNamesBoard דרך useRemembered, ref-הגלילה על מכולת-הטבלה, onOpenSupporter לא סוגר את המודאל, hook חדש קיים.
- `filter-memory.test.ts` — מונה-מפתחות 19+10+9.
- `ayin-board-ui`/`ayin-board-default`/`ayin-region-filter` — עודכנו מ-useState ל-useRemembered.

## שערים
`verify:fast` ✅ 2768 · `e2e/care-back-smoke.mjs` 12/12 · `ayin-names` 6/6 · `filter-memory` 10/10.

## פריסה
main ‏6faeba2 → github.io (deploy.yml) + orbit-il (workflow הופעל ב-push ל-README). אימות: `version.json` מתחלף + המחרוזת `sup.ayinNamesOpen` בצ׳אנק SupportersView המוגש.
