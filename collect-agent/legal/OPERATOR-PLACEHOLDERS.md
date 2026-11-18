# איפה מופיעים פרטי החברה המפעילה (placeholder)

> ## ⚠️ טיוטה – לבדיקת עו״ד
> ביום שמאיר מקים ישות: ממלאים פעם אחת בסביבה, ואז מעדכנים ידנית את הקבצים הסטטיים שבטבלה ב׳.
> `python3 -m app.golive` לא ייפתח כל עוד נשאר placeholder באחד מהם. הבדיקה `tests/test_operator_placeholders.py` נכשלת אם נוסף מקום חדש שלא בטבלה.

## א. דינמי — מתמלא מהסביבה (בלי לגעת בקוד)
`OPERATOR_NAME`, `OPERATOR_ID`, `OPERATOR_ADDRESS`, `OPERATOR_PRIVACY_EMAIL`: **כולם או אף אחד** (חלקי ⇒ השרת לא עולה). נטען ב-`app/legal.py` (`load_operator`) ומופיע ב:
| איפה | מה החייב/העסק רואה |
|---|---|
| `GET /u/{token}` (עמוד ההסרה) | «למה קיבלתם», בעל השליטה, פרטיות, תווית טיוטה |
| `GET /p/{code}` (עמוד הקישור הקצר) | אותו דבר, בתחתית |
| `GET /api/pay/{code}` → `/pay/{code}` ב-web | `legal.privacy_points` (בלי HTML) |
| `app/golive.py` | חוסם המעבר לשליחה אמיתית כל עוד placeholder |

## ב. סטטי — לעדכן ידנית (18 קבצים, נכון להיום)
| קובץ | איפה בקובץ |
|---|---|
| `legal/DPA.md` | צדדים בראש ההסכם |
| `legal/PRIVACY.md` | §1 מי אנחנו, באנר |
| `legal/TERMS.md` | §1 הצדדים, §18 קשר |
| `marketing/accessibility.html` | הצהרת נגישות — רכז נגישות |
| `marketing/emails-trial.md` | חתימת מיילי הניסיון |
| `marketing/faq/build.py` | תבנית פוטר דף «שאלות נפוצות» (מקור) |
| `marketing/faq/index.html` | פוטר (נבנה מ-build.py) |
| `marketing/landing/for/accountants-clients.html` | פוטר (נבנה מ-build.py) |
| `marketing/landing/for/barbers.html` | פוטר (נבנה מ-build.py) |
| `marketing/landing/for/build.py` | תבנית פוטר דפי הענפים (מקור) |
| `marketing/landing/for/clinics.html` | פוטר (נבנה מ-build.py) |
| `marketing/landing/for/garages.html` | פוטר (נבנה מ-build.py) |
| `marketing/landing/index.html` | פוטר דף הנחיתה |
| `marketing/library/build.py` | תבנית פוטר ספריית הנוסחים (מקור) |
| `marketing/library/index.html` | פוטר (נבנה מ-build.py) |
| `marketing/privacy.html` | עותק HTML של מדיניות הפרטיות |
| `marketing/terms.html` | עותק HTML של תנאי השימוש |
| `web/src/pages/Landing.tsx` | פוטר דף הנחיתה באפליקציה |

קבצי HTML שנבנים מ-`build.py`: מעדכנים את ה-`build.py` ומריצים אותו שוב.
