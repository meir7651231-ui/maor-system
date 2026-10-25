# חומרה — אב-טיפוס (נבדק 25.10.2026)

## רשימת קנייה
| # | פריט | איפה | מחיר שנמצא | הערות |
|---|---|---|---|---|
| 1 | ClockworkPi **PicoCalc** | clockworkpi.com (אין בארץ) | $79 | מסך 4″ 320×320, מקלדת, חריץ SD, בקר Pico 1 H. **סוללות לא כלולות** |
| 2 | 2 × סוללת 18650 | חנות מקומית | לא נבדק | |
| 3 | מדפסת **Epson TM-T20III — USB + Serial** | אירופה (לא נמצא מחיר בארץ) | €147–174 | לוודא SKU עם RS-232 (יש גרסה בלי). ספק כוח משלה. 80 מ"מ |
| 4א | אקדח ברקוד עם כבל RS232 (ערכה) | חו"ל | $36 | זול |
| 4ב | Zebra **LS2208** + כבל **CBA-R01-S07PBR** (RS232) + ספק כוח | חו"ל | לא נמצא מחיר בארץ | לפי המוכר: הכבל דורש ספק כוח נפרד |
| 5 | 2 × ממיר RS232↔TTL (MAX3232) | חנות רכיבים | ≈ 10–20 ₪ (הערכה) | אחד לאקדח, אחד למדפסת. **3.3V** |
| 6 | חוטי dupont, מדבקות מקשים, גלילי נייר 80 מ"מ | — | — | |

אופציונלי (רק אם הוחלט על לינוקס): **Luckfox Lyra RK3506G2 הבסיסי** (≈$12+$9 משלוח). **לא** Lyra B (זיכרון SPI NAND — חייבים למחוק לפני אתחול מ-SD), **לא** Lyra Zero W (לוח אחר).

## חיבור
- **מקלדת:** מובנית (שבב STM32 ⇒ I2C). רק מיפוי מקשים בתוכנה + מדבקות.
- **אקדח + מדפסת:** כל אחד ⇒ ממיר MAX3232 ⇒ פיני UART בצד ה-PicoCalc. לבקר 2 ערוצי UART; ערוץ נוסף אפשר ב-PIO.
- **חשמל:** המדפסת על ספק משלה (5–9V, עד ≈2A בהדפסה — הסוללות לא יחזיקו). מחברים רק נתונים + אדמה.

## ⚠️ לא אומת — לבדוק ביום שהמכשיר מגיע, לפני שמחברים
1. סידור הפינים בצד ה-PicoCalc (אין תרשים רשמי שנמצא; UART בצד נראה רק בפרויקט קהילה אחד).
2. רמת המתח בפינים (צפוי 3.3V) — במולטימטר.
3. כמה UART חשופים בצד. אם אחד — השני ב-PIO, או הלחמה ישירה לבקר.
4. בדיקה לכל רכיב בנפרד: אקדח ⇒ מקבלים מספר ברקוד · מדפסת ⇒ שורת בדיקה (ESC/POS) · כרטיס ⇒ כתיבה/קריאה.

## מה נבדק ונפסל
- מסופי Sunmi/אנדרואיד — נראים כמו טלפון (נפסל ע"י הבעלים).
- קופות רושמות סגורות (קסיו/SAM4S) — אי אפשר להתקין תוכנה.
- אקדח/מדפסת USB — לבקר יכולת USB-host מוגבלת; לא בטוח.
- בלוטות' (Pico 2 W) — אפשרי אבל לא נמצאה הוכחה לשילוב; הבעלים בחר כבל.

## מקורות
- https://www.clockworkpi.com/product-page/picocalc
- https://www.hackster.io/news/clockwork-pi-launches-the-picocalc-kit-a-raspberry-pi-pico-powered-handheld-from-the-golden-age-349aff57fd06
- https://github.com/acwright/6502-PICOCALC (UART בצד)
- https://forum.clockworkpi.com/t/luckfox-lyra-on-picocalc/16280 · https://github.com/sunslayr/PicoCalc-Lyra
- https://www.lambda-tek.com/Epson-C31CH51011-sh/B43653016 (TM-T20III USB+Serial)
- https://www.zebra.com/us/en/products/scanners/general-purpose-scanners/handheld/ls2208.html
- https://www.ers-online.co.uk/a9727/cba-r01-s07pbr-rs232-straight-2m-cable
- https://notredame-high.co.uk/products/214875241/handheld-wired-qr-barcode-scanner-1d-2d-bar-code-reader-rs23/
