# 🔐 עיצוב · הצפנת-ענן במנוחה (Cloud-at-Rest Encryption)

**מאת:** הארכיטקט · 1.8.2026 · הכרעת בעלים: "לעצב הצפנת-ענן מלאה עכשיו". סוגר את **באג 4** (חצי ב׳) — היום העותק בענן plaintext גם כשההצפנה המקומית דלוקה.

> זהו מסמך-עיצוב + פקודת-בנייה לעוסה. **אינו מיושם עדיין** — יישום דורש אישור-בעלים נוסף כי הוא נוגע בסנכרון החי. המסמך מסיר את אי-הוודאות כדי שהיישום יהיה מכני.

---

## 1. הבעיה — מעוגנת בקוד (לא בתקציר)

- **דחיפה = מסמך-שלם.** `cloud.ts:192` — `b.set(doc(...), toPlain(s.data))`. אין כתיבת-שדה; כל ישות נכתבת כמסמך שלם.
- **מיזוג = doc-level upsert, לא field-level.** `cloud-merge.ts:43 applyEntityPartial` — upsert לפי `id`, המסמך הנכנס **מחליף את כולו** את המקומי (שורות 60-67). זו כבר סמנטיקת LWW-פר-מסמך.
- **מסקנה מכרעת:** הפחד ש"הצפנה תשבור מיזוג-שדות" **אינו נכון** — אין מיזוג-שדות מלכתחילה. הצפנה ברמת-המסמך **לא מאבדת שום גרעיניות**. זה הופך את העיצוב לפשוט ובטוח.
- **החריג היחיד:** `applyMetaPartial` (meta/org) כן ממזג שדות בודדים + מונים ("לעולם לא מקטינים"). פתרון: **מפענחים בגבול הקריאה, לפני המיזוג** ⇒ `applyMetaPartial` מקבל plaintext ⇒ ללא שינוי.

**הנכס הקיים:** `crypto.ts` כבר מממש envelope מלא — DEK אקראי עטוף פעמיים (סיסמה PBKDF2-210K + מפתח-שחזור), AES-GCM-256: `encryptDb/openDek/decryptDb/reencryptDb/isEncrypted`. **בונים עליו, לא מחדש.**

---

## 2. עקרון-העיצוב — הצפנה בגבול-החוט (wire boundary), doc-level

ההצפנה חיה **רק** בשתי נקודות-המעבר לענן; כל שאר הקוד (diff/merge/store) ממשיך לעבוד על plaintext:

```
        [ DB מקומי plaintext ]
   diff ↓ (plaintext, ללא שינוי)         ↑ merge (plaintext, ללא שינוי)
   encryptDoc ↓  ← הגבול היחיד →   ↑ decryptDoc
        [ Firestore: { id, enc, iv } ]
```

- **push:** `diffDb` רץ על plaintext כרגיל ⇒ לכל `set` מצפינים את `toPlain(data)` ל-`{ enc: b64(ct), iv: b64 }` (ה-`id` נשאר מפתח-המסמך, plaintext).
- **pull/subscribe:** לכל מסמך שנקרא — אם יש `enc` ⇒ מפענחים חזרה ל-plaintext **לפני** `applyEntityPartial`/`applyMetaPartial`/`migrate`.
- **תאימות-לאחור (קריטי למיגרציה):** `decodeDoc(d)` — יש `enc`? פענח. אין? החזר כמו-שהוא. ⇒ ארגון יכול להכיל מסמכים מעורבים (plaintext ישן + מוצפן חדש) בזמן המיגרציה.

---

## 3. מה מוצפן ומה נשאר plaintext (הכרעה מפורשת)

| נתיב | סטטוס | נימוק |
|---|---|---|
| `orgs/{slug}/{col}/{doc}` (18 האוספים — משפחות, תרומות, קבלות…) | **מוצפן** | ה-PII האמיתי. |
| `orgs/{slug}/meta/org` (מונים + orgName + notif…) | **מוצפן** | עקבי; המונים מפוענחים לפני "לא-מקטינים". |
| `orgs/{slug}/_enc/envelope` (ה-DEK העטוף) | plaintext-ciphertext | זה **הצופן עצמו** — חסר-ערך בלי הסיסמה. |
| `platformOrgs/{slug}.members` | **plaintext** | ה-Rules קוראים אותו ל-`orgMember()`. חובה. |
| `platformOrgs/{slug}.config` | **plaintext** | קונפיג-עסקי (הבעלים עורך בלוח-הבקרה) — לא PII. |
| `platformOrgs/{slug}.provisioned/orgName/createdAt` | **plaintext** | מטא-נתוני-ניהול. |
| אוספי-השורש (הלקוח הקיים, `cloudRoot`) | **plaintext עד opt-in** | ראה §6 — הצפנה = opt-in, לא כפוי. |

**האינווריאנט:** ה-Rules לעולם לא זקוקים לתוכן-מוצפן. חברות/הרשאה נשענות רק על `platformOrgs.members` שנשאר גלוי.

---

## 4. מחזור-חיי המפתח (השאלה הקשה — חלוקת-מפתחות)

הבעיה: הסיסמה של Firebase Auth **אינה זמינה** לאפליקציה (Firebase מנהל אותה). לכן ה-DEK לא נגזר ממנה. הפתרון = **סיסמת-הצפנה נפרדת** (בדיוק כמו מודל ההצפנה-המקומי הקיים, `EncUnlockScreen`).

1. **הפעלה (הבעלים/מנהל-הארגון, פעם אחת):**
   - מזין **סיסמת-הצפנה** (≠ סיסמת-הכניסה) + מקבל **מפתח-שחזור** אקראי (מוצג פעם אחת — `genRecoveryKey`).
   - `encryptDb`-סגנון: DEK אקראי נוצר, עטוף פעמיים (סיסמה + שחזור) ⇒ נכתב ל-`orgs/{slug}/_enc/envelope`.
   - דגל `platformOrgs/{slug}.config.cloudEnc = true` (או שדה-על נפרד `encMeta`) מסמן לכל המכשירים "הארגון מוצפן".
2. **מכשיר חדש (אחרי כניסת-ענן):** רואה `cloudEnc=true` ⇒ מסך `CloudUnlock` (וריאנט של `EncUnlockScreen`) ⇒ מזין סיסמת-הצפנה ⇒ `openDek(envelope, password)` ⇒ ה-DEK במטמון-זיכרון (וב-`localStorage` מקומי-מוצפן כמו הנעילה הקיימת) ⇒ סנכרון עובד.
3. **שחזור:** שכח סיסמה ⇒ מפתח-השחזור פותח את אותו envelope (`openDek` עם ה-recovery).
4. **סבב-מפתח (rotate):** `reencryptDb` על ה-envelope עם DEK חדש — **דורש מיגרציה מלאה** (כמו §6). נדיר; מחוץ ל-MVP.

**גבול-כשל:** מכשיר בלי סיסמת-ההצפנה **לא מסנכרן** (רואה מסך-פתיחה). זה מכוון — אין דרך לפענח בלי המפתח. תואם למודל המקומי.

---

## 5. פורמט-החוט

```ts
// מסמך-ישות מוצפן ב-Firestore:
{ id: "f123",            // מפתח-המסמך — plaintext תמיד
  enc: "<base64 ct>",    // AES-GCM(JSON.stringify(plainDoc), DEK)
  iv:  "<base64 iv>" }   // 12-byte IV לכל מסמך (חדש בכל כתיבה)

// ה-envelope (orgs/{slug}/_enc/envelope) — מבנה EncEnvelope הקיים מ-crypto.ts
{ v, iter, dekPass:{iv,ct,salt}, dekRec:{iv,ct,salt} }
```

IV ייחודי-לכל-כתיבה (חובה ל-GCM). ה-`id` נשאר גלוי — לא PII (מזהה-רץ פנימי), ונדרש כמפתח-מסמך + ל-diff/merge.

---

## 6. מיגרציה של הלקוח החי (החלק המסוכן — לכן opt-in)

**הצפנה = opt-in פר-ארגון. הלקוח הקיים (מאור החסד, `cloudRoot`) נשאר plaintext עד שהבעלים מפעיל במפורש.** אין שינוי-התנהגות בלי פעולה.

זרימת-ההפעלה (חד-פעמית, כשאף מכשיר אחר לא כותב):
1. **גיבוי מקומי כפוי** לפני הכל (הורדת JSON — כבר קיים `exportBackup`).
2. סימון `encMeta.state = 'migrating'`.
3. קריאת כל המסמכים ⇒ הצפנה ⇒ כתיבה-חוזרת ב-batch (400/batch, כמו `pushDiff`). כל מסמך: plaintext→`{id,enc,iv}`.
4. סימון `encMeta.state = 'on'`.
5. `decodeDoc` תומך בשני הפורמטים לאורך כל הדרך ⇒ מכשיר שקורא באמצע-מיגרציה לא קורס.

**סיכון + מיטיגציה:**
- *כתיבה מקבילה בזמן מיגרציה* ⇒ נדרוס. מיטיגציה: מיגרציה רק כשמכשיר-יחיד; דגל `migrating` חוסם push ממכשירים אחרים (הם רואים "ממתין להצפנה"). ל-MVP: הנחיה-לבעלים "הפעל כשאף אחד לא עובד" + הגיבוי הכפוי.
- *אובדן סיסמת-הצפנה* ⇒ אובדן-נתונים-בענן. מיטיגציה: מפתח-השחזור (חובה לשמור) + הגיבוי המקומי (3-שכבות עדיין plaintext-מקומי-מוצפן).

---

## 7. שינויי Rules (מינימליים)

```
// מסמך-המפתח: חברי-הארגון קוראים (צריך את ה-envelope לפענוח), מיילי-על כותבים.
match /orgs/{slug}/_enc/{doc} {
  allow read: if superAdmin() || orgMember(slug);
  allow write: if superAdmin();   // הפעלה/סבב = פעולת-בעלים
}
```
שאר ה-Rules ללא שינוי — התוכן-המוצפן חי תחת `orgs/{slug}/{col}` שכבר מכוסה, וה-ciphertext בטוח-מטבעו.

---

## 8. פקודת-הבנייה הלעוסה (קבצים · פונקציות · בדיקות · שערים)

**אשכול יחיד `הצפנה · ` (או פר-שלב אם גדול):**

1. **`src/lib/cloudCrypto.ts` (חדש, טהור):**
   - `encryptDoc(plain: object, dek: CryptoKey): Promise<{enc,iv}>` · `decryptDoc(d: {enc?,iv?}, dek): Promise<object>` (אם אין `enc` ⇒ מחזיר `d` כמו-שהוא — תאימות-לאחור).
   - `wrapCloudDek(password, recovery): Promise<EncEnvelope>` · `openCloudDek(env, secret)` — עטיפות דקות מעל `crypto.ts` הקיים.
   - **בדיקות-יחידה:** round-trip (encrypt→decrypt=זהות); decryptDoc על plaintext=identity (תאימות); IV שונה בכל קריאה; envelope נפתח בסיסמה ובשחזור.
2. **`src/lib/cloud.ts`:** הזרקת `dek` ל-`pushDiff`/`pullAll`/`subscribeAll`:
   - `pushDiff`: אם `dek` — `encryptDoc(toPlain(s.data))` לפני `b.set`; ה-meta גם.
   - `pullAll`/`subscribeAll`: `decryptDoc(d.data())` לפני `migrate`/`onRemote`.
   - `dek` מגיע מ-`cloudSync` (מטמון-זיכרון). כש-`dek===null` והארגון לא-מוצפן ⇒ נתיב היום, ביט-זהה (**ratchet**).
3. **`src/store/cloudSync.ts`:** החזקת ה-DEK במטמון; שער-פתיחה: אם `encMeta.state==='on'` ואין DEK ⇒ מצב `needCloudUnlock` (כמו `needDecrypt` הקיים).
4. **`src/components/cloud/CloudUnlockScreen.tsx` (חדש):** וריאנט של `EncUnlockScreen` — מזין סיסמת-הצפנה, `openCloudDek`, שגיאה חיננית.
5. **`src/components/.../CloudEncryptToggle`:** בהגדרות/לוח-הבקרה — הפעלה (סיסמה+שחזור), מצב, מיגרציה עם progress + הגיבוי-הכפוי.
6. **Rules:** בלוק `_enc` (§7) — הבעלים מפרסם.
7. **בדיקות ratchet:** (א) ארגון-לא-מוצפן = נתיב ביט-זהה (אין `enc` בחוט). (ב) round-trip מלא דרך pushDiff/pullAll מדומים. (ג) `decodeDoc` דו-פורמט. (ד) meta-counters "לא-מקטינים" עובד אחרי פענוח. (ה) הגנת-מקור: `cloud.ts` לא כותב plaintext כש-dek קיים.
8. **שערים:** verify מלא + שלוש הסוויטות (הצפנה כבויה = ירוק ללא שינוי) + e2e ייעודי `cloud-encrypt.mjs` (הפעלה→מיגרציה→מכשיר-חדש-פותח).

**גבולות:** הצפנה = opt-in; ברירת-מחדל off; הלקוח החי ביט-זהה עד הפעלה מפורשת. אין לגעת ב-diff/merge (הם נשארים plaintext). אין להצפין את `platformOrgs.members`/`config`.

---

## 9. סיכונים שנותרים (לתשומת הבעלים לפני היישום)

1. **סיסמת-הצפנה נוספת** = חיכוך-משתמש (עוד סוד לזכור). מיטיגציה: מפתח-שחזור + אפשרות "אני מבין, בלי הצפנת-ענן" (ברירת-המחדל).
2. **מיגרציה חד-פעמית** = החלון המסוכן היחיד. חובה: גיבוי + מכשיר-יחיד + מפתח-שחזור שמור.
3. **`?org=demo` והדמו** — לא מוצפנים (אין PII; ציבורי במכוון).
4. **חיפוש/מיון בענן** — Firestore לא יכול לשאול על שדות-מוצפנים. אין לנו שאילתות-שרת (הכל local-first, נמשך-מלא ומסונן מקומית) ⇒ **אפס השפעה**. (לו היו — היה נשבר.)

**המלצת-הארכיטקט:** הפורמט doc-level + wire-boundary + envelope-קיים הופך את זה לישים ובטוח (~2-3 אשכולות). ה-MVP: §8.1-8.4 + ratchets (הליבה). ה-UI וההפעלה (8.5) + המיגרציה החיה — אשכול-שני, בזהירות, כשהבעלים מוכן להריץ את חלון-המיגרציה.
