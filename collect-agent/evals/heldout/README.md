# סט מוחזק מבחוץ — למבקר / QA (לא לגבי מנוע)

מטרה: מדידה נקייה של מנוע השיחה על טקסט ש**כותב המנוע לא ראה**. כל 4 הסטים עד היום נכתבו ע"י גבי מנוע עצמו.

## איך כותבים (גבי מבקר / גבי בדיקות)
1. קובץ חדש: `evals/heldout/external-<YYYY-MM-DD>-<כותב>.jsonl`, ‏30 שורות לפחות, ניסוח **מייל** ו**עמוד /p** (כך הלקוחות עונים).
2. שורה = `{"id","text","ctx":{"channel":"email"|"sms"},"expect":{"intent":...},"critical":bool}`.
   כוונות: ‏`opt_out, wrong_person, legal, dispute, paid_claim, cant_pay, plan_request, plan_accept, plan_reject, promise, copy_request, how_to_pay, callback, who_is_this, abusive, thanks, distress, minor, unknown`.
   ציפיות אופציונליות: ‏`stop` (none/pause/permanent), ‏`escalate` (none/normal/urgent), ‏`reply` (true/false), ‏`tags` (למשל `foreign_language`), ‏`not` (כוונות שאסור שיופיעו).
3. `critical: true` להסרה, מספר שגוי, מחלוקת, עו"ד, מצוקה, קטין, טענת תשלום — ולמלכודות (הודעה תמימה שאסור שתעצור/תסלים).
4. commit **רק** של הקובץ, עם sha256 בהודעת ה-commit. לא להריץ את המנוע לפני ה-commit.

## מה גבי מנוע עושה
מריץ **פעם אחת**: `python3 -m evals.harness --heldout evals/heldout/external-…jsonl`, ומוסיף את התוצאה ל-`RESULTS.md`:
דיוק, קריטיים, פספוסים בטוחים, ובעיקר **טעויות בטוחות-בעצמן**. **לא מכווננים לפי הסט.** תיקונים נמדדים על הסט החיצוני הבא.
התיקייה הזו מחוץ לשער pytest (`evals/*.jsonl` בלבד), כדי שאי אפשר יהיה "לעבור" אותה בכוונון.
