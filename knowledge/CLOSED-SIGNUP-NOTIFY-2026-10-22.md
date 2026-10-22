# 🔔 התראת-בעלים על הרשמה/ליד (22.10.2026)

בקשת-בעלים: "ברגע שאדם מבצע הרשמה אני מקבל גם הודעה בווצאפ וגם באתר" · וואטסאפ = "הודעה רגילה שמפעיל את הווצאפ של הלוקח".

- **וואטסאפ (אפס API):** במסך-ההצלחה של אשף-ההרשמה וב"נחזור אליכם" — כפתור ירוק `OwnerWaButton` ⇒ wa.me ממולא למספר-הבעלים (`waLink` הקיים), ההודעה יוצאת מהוואטסאפ של הנרשם. נוסחים טהורים ב-`lib/signupNotify.ts` (`signupOwnerText`/`leadOwnerText`).
- **מספר-הבעלים:** `ORBIT_OWNER_WHATSAPP` ב-signupNotify (הכרעת-בעלים 22.10), ניתן לדריסה ב-`VITE_ORBIT_WHATSAPP`. לא נלקח מ-`site.contact` של השורש — זה של הלקוח, לא של הפלטפורמה.
- **באתר:** `watchPlatformInbox` (onSnapshot על platformRequests+platformLeads) ⇒ `PlatformInboxBell` למיילי-על: טוסט + צליל + התראת-מערכת (אם הותרה) על כל פריט חדש, וגלולה "🔔 N פניות חדשות" ⇒ #platform. "נצפה" = `orbit_inbox_seen` מקומי. `PlatformPanel` מתרענן חי (דיבאונס 400ms).
- **הקשר-חנות:** `?signup=1&v=&picks=` ⇒ התחום נבחר מראש באשף; הבחירות נכנסות להודעת-הוואטסאפ, ובליד — לשדה notes (`leadNotesWithStore`). **לא נוספו שדות ל-Firestore**: Rules של platformRequests (8 שדות) ו-platformLeads (5 שדות) הם allowlist — שדה חדש היה שובר הרשמה. הוספת שדות = עדכון Rules (חלון-בעלים).
- ratchet: `src/lib/signupNotify.test.ts`.
