# 🛠 Runbook — התקנת המרכזייה (חד-פעמי אצל המפעיל)

> מתקינים **פעם-אחת** את השרת המרכזי; אחר-כך כל לקוח = מילוי-נתונים + `apply`.
> **pure-downstream:** אין רכישת-trunk, אין רישום-לספק. הציוד היחיד אצל הלקוח =
> שער-GSM עם ה-SIM שלו.

## 0 · דרישות
- VPS ‏≥2vCPU/4GB + IP-קבוע + DNS ‏`pbx.<domain>`.
- אצל כל לקוח: שער-GSM (GoIP-8/Dinstar) עם ה-SIM שלו, מחובר-לרשת.
- אצל המנהל/משרד: softphone (Zoiper/Linphone — חינם, לא-חברה).

## 1 · השרת (חד-פעמי)
```bash
# OS: SSH-מפתחות-בלבד, root חסום, unattended-upgrades + NTP
# חומת-אש default-deny: SSH · 443 · 5060/5061 · 16384-32768/udp (RTP)
# התקנת FusionPBX + FreeSWITCH (PostgreSQL)
# TLS אמיתי (Let's Encrypt) ל-GUI ול-SIP-TLS + חידוש-אוטומטי
# הקשחת-SIP: fail2ban · חסימת guest/anonymous · ACL-רישום
```
אימות-הקשחה: `hardeningChecklist` (security.mjs) — כל הבדיקות ✅ לפני-חי.

## 2 · הזרקת-סודות פר-לקוח
המנוע מפיק placeholders (`security.mjs secretsFor`) — ייחודיים פר-לקוח:
```
default_provision_password  → PROVISION_PW__<tenant>
gsm_gateway_password        → GSM_PW__<tenant>
gsm_gateway_ip              → GSM_IP__<tenant>
```
מזריקים אותם ל-`vars.xml`/env בהתקנה. **לא נשמרים בפלט-המנוע** (בידוד).

## 3 · הקמת-לקוח
```bash
# א. נתוני-הלקוח → chesed.json (אשף/CSV/ידני)
node telephony/tel.mjs validate chesed.json          # תקינות
node telephony/tel.mjs preview  chesed.json          # ניתוב + מוכנות
# ב. החלה לספריית-המרכזייה
node telephony/tel.mjs apply ./tenants /etc/freeswitch --write
# ג. טעינה
fs_cli -x reloadxml
fs_cli -x 'sofia profile internal rescan reloadxml'   # אם השתנו gateways
```
פקודות-ה-reload המדויקות: `apply.mjs reloadPlan(plan)`.

## 4 · צד-הלקוח (שער + softphone)
1. מכניסים את ה-SIM לשער, מגדירים כל ערוץ כ-`<tenant>-gwN` מול ה-IP של השרת.
2. מספר-וירטואלי (07x): הלקוח מגדיר **בפורטל-הספק שלו** הפניה אל SIM-נחיתה שלנו.
3. ווצאפ: מקשרים את מכשיר-העמותה כ-"מכשיר-נלווה" (בלי Business API).
4. softphone למנהל/משרד: `tel.mjs`→`provisioningQr` נותן `sipUri` + תוכן-QR.

## 5 · אימות-קבלה (E2E)
- [ ] שיחה לכל מספר בשעות-משרד → מצלצל במשרד.
- [ ] שיחה אחרי-שעות → חוזר למנהל → תא-קולי-במייל.
- [ ] שבת/חג (אם `calendar.hebrew`) → סגור.
- [ ] יציאה `N#<מספר>` → הצד-השני רואה מספר-N.
- [ ] (אם CTI) שיחה ממספר-מוכר → קופץ כרטיס-מאור.

## 6 · שוטף
- גיבוי: `pg_dump` + `/etc/freeswitch` + הקלטות off-site.
- ניטור: `healthReport` (registration/latency) · התראת-נפילה.
- שחזור: `restoreFrom(history, version)` → `apply` את התצלום.
- סחף: `detectDrift` לפני כל החלה (עריכה-ידנית לא-מכוונת).

## מה שנשאר לבעלים/מפעיל (לא-אוטומטי)
- רכישת-VPS + התקנת-FusionPBX (סעיף 1) — חד-פעמי.
- ציוד-לקוח (שער+SIM) + הפניות-הלקוח (וירטואלי/ווצאפ) — פר-לקוח.
- הקלטת-הברכות (`manifest.requiredPrompts` נותן את הרשימה+נוסח).
