/**
 * 🏡 אירוח משפחתי — פעולות-ה-store (BUILD-ORDER-HOSTING-2026-10-12, אשכול 4).
 *
 * **נטענות עם המסך** ("שוקל רק מה שהדלקת"): HostingView מריץ installHostingActions() בטעינת הצ'אנק העצל, וזה מתקין את
 * 29 הפעולות ב-store (מיזוג-מצב של zustand). ארגון שהמודול כבוי אצלו לא מוריד אותן — ה-store המרכזי מחזיק רק את ההצהרות
 * (HostingActions), שומרי-מקום, ואת צינור-הכתיבה המוגבל hostApi.
 *
 * בידוד (הכרעה 2): כל כתיבה עוברת ב-hostApi.write — שהטיפוס שלו (HostPatch) מתיר רק hostUnits/hostBookings/hostRecords
 * ו-ui.hosting (ננעל ב-hosting-isolation.test): אפס נגיעה במוני-הקבלות, בתרומות, בלוח-הראשי ובחדרי-החוגים; הכסף = פנקס-
 * שהייה (חיובים/תשלומים) בלבד. שער לפני נגיעה ב-db (לקח באג-5): קלט לא-תקין / הרשאה חסרה ⇒ טוסט + false, בלי לצרוך
 * מזהה. מה שתלוי במצב — מחושב בתוך ה-updater מול ה-db החי (לקח 3.9). הודעות-ההצלחה של מעברי-עסק (צ׳ק-אאוט, תשלום,
 * שחרור-יחידה, חריגת-טמפ׳…) — כאן, אחידות בכל משטח; "נשמר ✓" של טפסים — בממשק.
 * הרשאות: מחיקה-לצמיתות/איפוס = hosting.delete · הגדרות/שחזור = hosting.manage (hostCan = featureOn ∧ canGrantedAction).
 */
import { useApp, type HostingActions, type HostPatch } from '../../store/useApp';
import type {
  Db,
  HostBooking,
  HostCharge,
  HostCleanTask,
  HostDish,
  HostFault,
  HostMeal,
  HostRecord,
  HostTempLog,
  HostUnit,
  HostUnitStatus,
} from '../../types/domain';
import { featureOn } from '../../lib/config';
import { isoToday as isoTodayLocal } from '../../lib/date-util';
import {
  AFTER_CHECKOUT_CLEAN,
  blocksAvailability,
  canAddPayment,
  canSetBookingStatus,
  checkAvailability,
  checkoutTasksToClose,
  cleanPlainRecord,
  clearAssetRefs,
  clearStaffRefs,
  faultBlocksUnit,
  HOST_TEMP_DEVICES,
  hostCan,
  hostSettings,
  hostTerms,
  isActive as hostIsActive,
  isPlainKind,
  nextFaultStatus,
  nextLocalId,
  otherBlockingFault,
  priceQuote,
  releasedUnitStatus,
  SHABBAT_PACKAGE_PRICE,
  shabbatPackageMeal,
  syncAllKitchen,
  syncMealsToParty,
  tempBreachFault,
  tempOk,
  unitFreeAfter,
  unitHasRooms,
  unlinkBookingRecords,
  withMealCharge,
  withSystemCharges,
  type HostGrantKey,
  type HostTerms,
} from './transitions';
import { healHostCollection, healHostingPrefs, healHostRecord, HOST_MEAL_STATUSES, HOST_UNIT_STATUSES } from './model';

const get = useApp.getState;

/* ═══════════════ עזרים ═══════════════ */

/** הכתיבה היחידה — צינור-ה-store המוגבל (HostPatch = 3 אוספים + הגדרות). */
function hostWrite(f: (db: Db) => HostPatch): void {
  get().hostApi.write(f);
}
/** מזהה חדש בלי התנגשות (קיים/מצבה ⇒ דילוג) — מוקצה **לפני** הכתיבה (nextId כותב ל-db). */
function hostNewId(prefix: 'hu' | 'hb' | 'hr'): string {
  return get().hostApi.newId(prefix);
}
function logAudit(act: string, what: string): void {
  get().hostApi.audit(act, what);
}

/** הרשאה ברגע הפעולה (אותו hostCan שהממשק מציג — מקור-אמת אחד). */
function hostCanNow(key: HostGrantKey): boolean {
  const s = get();
  return hostCan(s.config, s.cloud.user?.email, s.cloud.isManager === true, key);
}

/** מונחי-המודול (hostTerms — אותם מונחים שהממשק מציג). */
function hostWord(k: keyof HostTerms): string {
  return hostTerms(get().config, get().db.ui.hosting)[k];
}

/** טוסט-הרשאה אחיד. */
function hostNoPerm(key: HostGrantKey): void {
  get().toast(
    key === 'hosting.delete'
      ? 'אין הרשאת מחיקה ב' + hostWord('nav') + ' — המנהל/ת מדליק/ה פר-עובד/ת'
      : 'הגדרות ' + hostWord('nav') + ' — רק למנהל/ת (או לעובד/ת שהודלק/ה לו/ה)',
  );
}

/** טקסט-טופס: מחרוזת, ללא רווחים בקצוות, עד תקרה. */
function hostText(v: unknown, cap: number): string {
  return typeof v === 'string' ? v.trim().slice(0, cap) : '';
}

/** סכום/מספר-טופס: סופי ≥ 0 (שלם כשמבוקש) — אחרת 0 (כמו `+value` במקור, בלי NaN/שלילי). */
function hostNum(v: unknown, int = false): number {
  const x = Number(v);
  if (!Number.isFinite(x) || x <= 0) return 0;
  return int ? Math.round(x) : Math.round(x * 100) / 100;
}

/** upsert ששומר את סדר-ההוספה (חדש בסוף — כמו push במקור; מפת-היחידות/התפריט/הצוות לפי סדר). */
function upsertTail<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i < 0) return [...list, item];
  const out = list.slice();
  out[i] = item;
  return out;
}

/** שם-האורח (לוג/טוסט). */
function hostGuestName(id: string): string {
  const g = get().db.hostRecords.find((r) => r.id === id && r.kind === 'guest');
  return g && g.kind === 'guest' ? g.name : '';
}

/* ═══════════════ הפעולות ═══════════════ */

/** 29 הפעולות — הטיפוס HostingActions (מה-store) אוכף שלמות וחתימות. */
export function hostingActions(): HostingActions {
  return {
    upsertHostUnit(u) {
      const prev = (u.id && get().db.hostUnits.find((x) => x.id === u.id)) || null;
      const id = prev ? prev.id : hostNewId('hu');
      const nowIso = new Date().toISOString();
      const unit: HostUnit = {
        ...(prev ?? { status: 'free' as const, subRooms: [], createdAt: nowIso }),
        id,
        name: hostText(u.name, 80) || hostWord('unit'),
        // סוג = הצעה, לא אכיפה (כמו במקור ובריפוי) — ריק ⇒ צימר
        type: hostText(u.type, 40) || 'צימר',
        beds: hostNum(u.beds, true),
        cap: hostNum(u.cap, true),
        rate: hostNum(u.rate),
        updatedAt: nowIso,
      };
      hostWrite((db) => ({ hostUnits: upsertTail(db.hostUnits, unit) }));
      return { ok: true, unit };
    },
    deleteHostUnit(id) {
      if (!hostCanNow('hosting.delete')) {
        hostNoPerm('hosting.delete');
        return false;
      }
      const db0 = get().db;
      const u = db0.hostUnits.find((x) => x.id === id);
      if (!u) return false;
      // כמו המקור: חסום כשיש הזמנה שלא בוטלה (בוטלות = היסטוריה; נשארות ומציגות "—")
      if (db0.hostBookings.some((b) => b.unitId === id && hostIsActive(b))) {
        get().toast('לא ניתן למחוק — יש ' + hostWord('bookings') + ' ל' + hostWord('unit'));
        return false;
      }
      hostWrite((db) => ({ hostUnits: db.hostUnits.filter((x) => x.id !== id) }));
      logAudit('🗑 מחיקת ' + hostWord('unit'), u.name);
      return true;
    },
    setHostUnitStatus(id, status) {
      if (!(HOST_UNIT_STATUSES as readonly string[]).includes(status)) return false;
      const u = get().db.hostUnits.find((x) => x.id === id);
      if (!u) return false;
      if (u.status === status) return true;
      const nowIso = new Date().toISOString();
      hostWrite((db) => {
        const cur = db.hostUnits.find((x) => x.id === id);
        if (!cur) return {};
        let next: HostUnitStatus = status;
        let records: HostRecord[] | undefined;
        if (cur.status === 'dirty' && status === 'free') {
          // F11: "🧹 נקייה" סוגר גם את משימות "ניקיון אחרי עזיבה" הפתוחות (במקור נשארו פתוחות לנצח)
          const close = new Set(checkoutTasksToClose(id, db.hostRecords));
          if (close.size) records = db.hostRecords.map((r) => (close.has(r.id) && r.kind === 'clean' ? { ...r, status: 'done' as const, doneAt: nowIso, updatedAt: nowIso } : r));
        } else if (cur.status === 'blocked' && status === 'free') {
          // F12: שחרור-חסימה ⇒ "לניקיון" כשממתינה משימת-עזיבה (צ׳ק-אאוט שקרה בזמן החסימה)
          next = releasedUnitStatus(id, db.hostRecords);
        }
        return {
          hostUnits: db.hostUnits.map((x) => (x.id === id ? { ...x, status: next, updatedAt: nowIso } : x)),
          ...(records ? { hostRecords: records } : {}),
        };
      });
      return true;
    },
    addHostRoom(unitId, room) {
      const name = hostText(room.name, 60);
      if (!name) {
        get().toast('שם חדר חסר');
        return false;
      }
      if (!get().db.hostUnits.some((x) => x.id === unitId)) return false;
      const nowIso = new Date().toISOString();
      hostWrite((db) => ({
        hostUnits: db.hostUnits.map((x) =>
          x.id === unitId ? { ...x, subRooms: [...x.subRooms, { id: nextLocalId('r', x.subRooms), name, beds: hostNum(room.beds, true), rate: hostNum(room.rate) }], updatedAt: nowIso } : x,
        ),
      }));
      return true;
    },
    deleteHostRoom(unitId, roomId) {
      const db0 = get().db;
      const u = db0.hostUnits.find((x) => x.id === unitId);
      if (!u || !u.subRooms.some((r) => r.id === roomId)) return false;
      // כמו המקור: חסום כשהחדר בהזמנה שלא בוטלה
      if (db0.hostBookings.some((b) => b.unitId === unitId && hostIsActive(b) && b.roomIds.includes(roomId))) {
        get().toast('לא ניתן למחוק — יש ' + hostWord('booking') + ' לחדר');
        return false;
      }
      const nowIso = new Date().toISOString();
      hostWrite((db) => ({
        hostUnits: db.hostUnits.map((x) => (x.id === unitId ? { ...x, subRooms: x.subRooms.filter((r) => r.id !== roomId), updatedAt: nowIso } : x)),
      }));
      return true;
    },
    upsertHostBooking(b) {
      const s = get();
      const prev = (b.id && s.db.hostBookings.find((x) => x.id === b.id)) || null;
      // עריכה: היחידה והחדרים נעולים (כמו במקור — לשינוי: ביטול והזמנה חדשה)
      const unitId = prev ? prev.unitId : String(b.unitId ?? '');
      const u = s.db.hostUnits.find((x) => x.id === unitId);
      if (!u) {
        s.toast('בחרו ' + hostWord('unit'));
        return { ok: false };
      }
      const guestId = String(b.guestId ?? '');
      if (!s.db.hostRecords.some((r) => r.id === guestId && r.kind === 'guest')) {
        s.toast('בחרו ' + hostWord('guest'));
        return { ok: false };
      }
      const checkIn = String(b.checkIn ?? '');
      const checkOut = String(b.checkOut ?? '');
      const roomed = unitHasRooms(u);
      const roomIds = prev ? prev.roomIds : roomed ? (Array.isArray(b.roomIds) ? b.roomIds : []).filter((rid) => u.subRooms.some((r) => r.id === rid)) : [];
      // הזמנה-ישנה שכוסתה כ"יחידה שלמה" לפני שהוגדרו חדרים ⇒ בדיקה מול כל החדרים (כמו `isAvailableRooms` במקור)
      const wanted = roomed && !roomIds.length && prev ? u.subRooms.map((r) => r.id) : roomIds;
      // F1 חל על **תביעה חדשה** ביחידה חסומה; עריכת הערות/נפשות בלי שינוי תאריכים — לא נחסמת
      const sameDates = !!prev && prev.checkIn === checkIn && prev.checkOut === checkOut;
      const avail = checkAvailability(s.db.hostBookings, sameDates && u.status === 'blocked' ? { ...u, status: 'free' } : u, checkIn, checkOut, wanted, prev?.id ?? null);
      if (!avail.ok) {
        s.toast(
          avail.reason === 'dates'
            ? 'תאריכים לא תקינים'
            : avail.reason === 'rooms'
              ? 'בחרו לפחות חדר אחד'
              : avail.reason === 'blocked'
                ? 'ה' + hostWord('unit') + ' חסומה (תקלה או חסימה ידנית) — שחררו אותה לפני הזמנה'
                : 'התנגשות — ' + (roomed ? 'החדרים תפוסים' : 'ה' + hostWord('unit') + ' תפוסה') + ' בתאריכים אלה',
        );
        return { ok: false };
      }
      const id = prev ? prev.id : hostNewId('hb');
      const nowIso = new Date().toISOString();
      const quote = priceQuote(u, roomIds, checkIn, checkOut, hostSettings(s.db.ui.hosting));
      let booking: HostBooking = {
        ...(prev ?? { status: 'pending' as const, payments: [], shabbat: false, createdAt: nowIso, charges: [] }),
        id,
        guestId,
        unitId,
        roomIds,
        checkIn,
        checkOut,
        adults: hostNum(b.adults, true),
        kids: hostNum(b.kids, true),
        notes: hostText(b.notes, 500),
        // F3: מוחלפים רק לינה/ניקיון/מע״מ; ארוחות, חבילת-שבת וחיובים ידניים — נשמרים
        charges: withSystemCharges(prev ? prev.charges : [], quote),
        updatedAt: nowIso,
      };
      let mealsSynced = 0;
      hostWrite((db) => {
        // סנכרון הארוחות המשויכות לגודל-ההזמנה + חיוב-המטבח (`syncMealsToRes` במקור) — מול ה-db החי
        const meals = db.hostRecords.filter((r): r is HostMeal => r.kind === 'meal');
        const sync = prev ? syncMealsToParty(meals, booking, nowIso) : null;
        if (sync) {
          booking = { ...booking, charges: sync.charges };
          mealsSynced = sync.meals.length;
        }
        const byId = new Map((sync?.meals ?? []).map((m) => [m.id, m] as const));
        return {
          hostBookings: upsertTail(db.hostBookings, booking),
          ...(byId.size ? { hostRecords: db.hostRecords.map((r) => byId.get(r.id) ?? r) } : {}),
        };
      });
      if (!prev) logAudit('➕ ' + hostWord('booking'), hostGuestName(guestId) + ' · ' + checkIn);
      return { ok: true, booking, mealsSynced };
    },
    setHostBookingStatus(id, status) {
      const s = get();
      const b = s.db.hostBookings.find((x) => x.id === id);
      if (!b) return false;
      if (!canSetBookingStatus(b.status, status)) {
        s.toast('ה' + hostWord('booking') + ' כבר עודכנה — המעבר לא בוצע');
        return false;
      }
      const nowIso = new Date().toISOString();
      const taskId = status === 'done' ? hostNewId('hr') : '';
      let keptBlocked = false as boolean;
      hostWrite((db) => {
        const cur = db.hostBookings.find((x) => x.id === id);
        if (!cur) return {};
        const stamp = status === 'in' ? { checkedInAt: nowIso } : status === 'done' ? { checkedOutAt: nowIso } : status === 'cancelled' ? { cancelledAt: nowIso } : {};
        const patch: HostPatch = { hostBookings: db.hostBookings.map((x) => (x.id === id ? { ...x, ...stamp, status, updatedAt: nowIso } : x)) };
        if (status === 'done') {
          // צ׳ק-אאוט ⇒ היחידה "לניקיון" + משימת "ניקיון אחרי עזיבה" (כמו המקור). F12: יחידה **חסומה** (תקלה P0/P1)
          // נשארת חסומה — במקור הפכה ל"מלוכלכת" ⇒ ניקיון ⇒ פנויה ⇒ ניתנת להזמנה למרות התקלה הפתוחה.
          keptBlocked = db.hostUnits.some((u) => u.id === cur.unitId && u.status === 'blocked');
          patch.hostUnits = db.hostUnits.map((u) => (u.id === cur.unitId && u.status !== 'blocked' ? { ...u, status: 'dirty' as const, updatedAt: nowIso } : u));
          const task: HostCleanTask = { id: taskId, kind: 'clean', unitId: cur.unitId, type: AFTER_CHECKOUT_CLEAN, status: 'open', date: isoTodayLocal(), bookingId: id, createdAt: nowIso, updatedAt: nowIso };
          patch.hostRecords = [...db.hostRecords, task];
        }
        return patch;
      });
      const who = hostGuestName(b.guestId);
      if (status === 'confirmed') logAudit('✓ אישור ' + hostWord('booking'), who);
      if (status === 'in') {
        s.toast('צ׳ק-אין בוצע ✓');
        logAudit('🛬 צ׳ק-אין', who);
      }
      if (status === 'done') {
        s.toast('צ׳ק-אאוט ✓ · נוצרה משימת ניקיון' + (keptBlocked ? ' · ה' + hostWord('unit') + ' נשארת חסומה (תקלה פתוחה)' : ''));
        logAudit('🛫 צ׳ק-אאוט', who);
      }
      if (status === 'cancelled') {
        s.toast('ה' + hostWord('booking') + ' בוטלה (ההיסטוריה נשמרה)');
        logAudit('✕ ביטול ' + hostWord('booking'), who);
      }
      return true;
    },
    addHostPayment(bookingId, p) {
      const s = get();
      const b = s.db.hostBookings.find((x) => x.id === bookingId);
      if (!b) return false;
      if (!canAddPayment(b)) {
        s.toast('ה' + hostWord('booking') + ' בוטלה — לא נרשם תשלום');
        return false;
      }
      const amount = hostNum(p.amount);
      if (amount <= 0) {
        s.toast('סכום לא תקין');
        return false;
      }
      const nowIso = new Date().toISOString();
      const note = hostText(p.note, 120);
      const date = isoTodayLocal();
      hostWrite((db) => ({
        hostBookings: db.hostBookings.map((x) => (x.id === bookingId ? { ...x, payments: [...x.payments, { id: nextLocalId('p', x.payments), amount, date, note }], updatedAt: nowIso } : x)),
      }));
      s.toast('תשלום נרשם ✓');
      // רישום-פנקס בלבד (לא קבלה) — ללוג
      logAudit('💳 תשלום בתיק-השהייה', hostGuestName(b.guestId) + ' · ₪' + amount);
      return true;
    },
    deleteHostBooking(id) {
      if (!hostCanNow('hosting.delete')) {
        hostNoPerm('hosting.delete');
        return false;
      }
      const b = get().db.hostBookings.find((x) => x.id === id);
      if (!b) return false;
      const nowIso = new Date().toISOString();
      hostWrite((db) => ({
        hostBookings: db.hostBookings.filter((x) => x.id !== id),
        // F5: ארוחות משויכות נשמרות ומתנתקות (במקור נשארו מצביעות להזמנה שאינה)
        hostRecords: unlinkBookingRecords(db.hostRecords, id, nowIso),
      }));
      logAudit('🗑 מחיקת ' + hostWord('booking'), hostGuestName(b.guestId) + ' · ' + b.checkIn);
      return true;
    },
    addHostShabbatPackage(bookingId) {
      const s = get();
      const b = s.db.hostBookings.find((x) => x.id === bookingId);
      if (!b) return false;
      // F9: אידמפוטנטי — במקור לחיצה-כפולה הכפילה חיוב והזמנת-מטבח
      if (b.shabbat) {
        s.toast('חבילת שבת כבר הופעלה ל' + hostWord('booking') + ' ✓');
        return false;
      }
      if (!blocksAvailability(b)) {
        s.toast('ה' + hostWord('booking') + ' ' + (b.status === 'cancelled' ? 'בוטלה' : 'הושלמה') + ' — לא נוספה חבילת שבת');
        return false;
      }
      const kitchen = featureOn(s.config, 'hosting.kitchen');
      const mealId = kitchen ? hostNewId('hr') : '';
      const settings = hostSettings(s.db.ui.hosting);
      const nowIso = new Date().toISOString();
      let done = false as boolean;
      hostWrite((db) => {
        const cur = db.hostBookings.find((x) => x.id === bookingId);
        if (!cur || cur.shabbat) return {};
        done = true;
        const charge: HostCharge = {
          id: cur.charges.some((c) => c.id === 'shabbat') ? nextLocalId('c', cur.charges) : 'shabbat',
          kind: 'shabbat',
          label: 'חבילת שבת',
          amount: SHABBAT_PACKAGE_PRICE,
        };
        const next: HostBooking = { ...cur, shabbat: true, charges: [...cur.charges, charge], updatedAt: nowIso };
        return {
          hostBookings: db.hostBookings.map((x) => (x.id === bookingId ? next : x)),
          // הסועדים מההזמנה (F9 — במקור מכרטיס-האורח)
          ...(kitchen ? { hostRecords: [...db.hostRecords, shabbatPackageMeal(next, settings, mealId, nowIso)] } : {}),
        };
      });
      if (!done) return false;
      s.toast('חבילת שבת הופעלה ✓ · חיוב' + (kitchen ? ' + הזמנת-מטבח' : ''));
      logAudit('🕯️ חבילת שבת', hostGuestName(b.guestId) + ' · ₪' + SHABBAT_PACKAGE_PRICE);
      return true;
    },
    upsertHostRecord(r) {
      const kind = r && typeof r === 'object' ? (r as { kind?: unknown }).kind : undefined;
      if (!isPlainKind(kind)) return { ok: false };
      const s = get();
      const prev = (r.id && s.db.hostRecords.find((x) => x.id === r.id && x.kind === kind)) || null;
      // ריפוי-טופס (מספרים/מחרוזות/רשימות) לפני כל בדיקה — מזהה-זמני; המזהה האמיתי רק אחרי שעבר
      const draft = healHostRecord({ ...prev, ...r, kind, id: prev ? prev.id : 'hr-draft' }, 'hr-draft');
      if (!draft) return { ok: false };
      const clean = cleanPlainRecord(draft);
      if (!clean.ok) {
        if (clean.error) s.toast(clean.error);
        return { ok: false };
      }
      const nowIso = new Date().toISOString();
      const record = { ...clean.record, id: prev ? prev.id : hostNewId('hr'), createdAt: prev?.createdAt || nowIso, updatedAt: nowIso } as HostRecord;
      hostWrite((db) => ({ hostRecords: upsertTail(db.hostRecords, record) }));
      return { ok: true, record };
    },
    deleteHostRecord(id) {
      const s = get();
      const r = s.db.hostRecords.find((x) => x.id === id);
      if (!r) return false;
      if (r.kind === 'meal') return s.deleteHostMeal(id);
      // רשימת-הקניות (נלווה/פריט-שולחן) — פתוחה לצוות כמו במקור; שאר המחיקות — hosting.delete
      if (r.kind !== 'supply' && r.kind !== 'tableItem' && !hostCanNow('hosting.delete')) {
        hostNoPerm('hosting.delete');
        return false;
      }
      if (r.kind === 'guest' && s.db.hostBookings.some((b) => b.guestId === id)) {
        s.toast('יש ' + hostWord('bookings') + ' ל' + hostWord('guest') + ' — לא ניתן למחוק');
        return false;
      }
      const nowIso = new Date().toISOString();
      hostWrite((db) => {
        let records = db.hostRecords.filter((x) => x.id !== id);
        if (r.kind === 'staff') records = clearStaffRefs(records, id, nowIso);
        if (r.kind === 'asset') records = clearAssetRefs(records, id, nowIso);
        const patch: HostPatch = { hostRecords: records };
        if (r.kind === 'supply') {
          // כמו המקור: גם סימון "לקחתי" והאמוג׳י של המוצר יורדים
          const cur = db.ui.hosting ?? {};
          const key = 'sup:' + id;
          if (cur.shopGot?.[key] || cur.shopEmoji?.[key]) {
            const shopGot = { ...cur.shopGot };
            const shopEmoji = { ...cur.shopEmoji };
            delete shopGot[key];
            delete shopEmoji[key];
            patch.prefs = healHostingPrefs({ ...cur, shopGot, shopEmoji });
          }
        }
        return patch;
      });
      if (r.kind === 'guest' || r.kind === 'staff' || r.kind === 'dish' || r.kind === 'asset') logAudit('🗑 מחיקה ב' + hostWord('nav'), r.name);
      return true;
    },
    setHostTableItems(items) {
      const list = (Array.isArray(items) ? items : [])
        .map((x) => ({ name: hostText(x?.name, 60), perGuest: hostNum(x?.perGuest) }))
        .filter((x) => x.name);
      if (!list.length) {
        get().toast('שם חסר');
        return false;
      }
      const db0 = get().db;
      const nowIso = new Date().toISOString();
      // מזהים מוקצים מראש (nextId כותב ל-db — לא בתוך ה-updater)
      const fresh = new Map<string, string>();
      for (const x of list) if (!fresh.has(x.name) && !db0.hostRecords.some((r) => r.kind === 'tableItem' && r.name === x.name)) fresh.set(x.name, hostNewId('hr'));
      hostWrite((db) => {
        let records = db.hostRecords;
        for (const x of list) {
          const ex = records.find((r) => r.kind === 'tableItem' && r.name === x.name);
          if (ex) {
            records = records.map((r) => (r.id === ex.id && r.kind === 'tableItem' ? { ...r, perGuest: x.perGuest, updatedAt: nowIso } : r));
            continue;
          }
          const nid = fresh.get(x.name);
          if (nid) records = [...records, { id: nid, kind: 'tableItem', name: x.name, perGuest: x.perGuest, createdAt: nowIso, updatedAt: nowIso }];
        }
        return { hostRecords: records };
      });
      return true;
    },
    upsertHostMeal(m) {
      const s = get();
      const prev = ((m.id && s.db.hostRecords.find((x) => x.id === m.id && x.kind === 'meal')) || null) as HostMeal | null;
      const draft = healHostRecord({ ...prev, ...m, kind: 'meal', id: prev ? prev.id : 'hr-draft' }, 'hr-draft') as HostMeal | null;
      if (!draft) return { ok: false };
      const items = draft.items.filter((it) => it.name.trim());
      if (!items.length) {
        s.toast('בחרו לפחות מנה אחת');
        return { ok: false };
      }
      const bookingId = draft.bookingId;
      const b = bookingId ? s.db.hostBookings.find((x) => x.id === bookingId) : undefined;
      if (bookingId && !b) {
        s.toast('ה' + hostWord('booking') + ' המשויכת לא נמצאה — הארוחה לא נשמרה');
        return { ok: false };
      }
      if (b && b.status === 'cancelled' && prev?.bookingId !== bookingId) {
        s.toast('ה' + hostWord('booking') + ' בוטלה — לא ניתן לשייך אליה ארוחה');
        return { ok: false };
      }
      const nowIso = new Date().toISOString();
      const meal: HostMeal = {
        ...draft,
        id: prev ? prev.id : hostNewId('hr'),
        items,
        mealName: draft.mealName.trim(),
        // משויכת ⇒ היחידה והאורח מההזמנה (כמו במקור); לא-משויכת ⇒ בלי "היחידה הראשונה" השרירותית של המקור
        unitId: b ? b.unitId : draft.unitId,
        guestId: b ? b.guestId : draft.guestId,
        createdAt: prev?.createdAt || nowIso,
        updatedAt: nowIso,
      };
      const oldB = prev?.bookingId ?? '';
      hostWrite((db) => ({
        hostRecords: upsertTail(db.hostRecords, meal),
        // חיוב-המטבח בתיק (`koTotal`, "הזמנת מטבח (N מנות)") מתחדש בכל שמירה; שיוך שהוחלף ⇒ יורד מהתיק הקודם
        ...(oldB || bookingId
          ? {
              hostBookings: db.hostBookings.map((x) =>
                x.id === bookingId
                  ? { ...x, charges: withMealCharge(x.charges, meal), updatedAt: nowIso }
                  : x.id === oldB
                    ? { ...x, charges: x.charges.filter((c) => c.mealId !== meal.id), updatedAt: nowIso }
                    : x,
              ),
            }
          : {}),
      }));
      return { ok: true, meal };
    },
    setHostMealStatus(id, status) {
      if (!(HOST_MEAL_STATUSES as readonly string[]).includes(status)) return false;
      const m = get().db.hostRecords.find((x): x is HostMeal => x.id === id && x.kind === 'meal');
      if (!m || m.status === status) return false;
      if (m.status === 'cancelled') {
        get().toast('הארוחה בוטלה — אפשר ליצור הזמנת-מטבח חדשה');
        return false;
      }
      const nowIso = new Date().toISOString();
      hostWrite((db) => {
        const cur = db.hostRecords.find((x): x is HostMeal => x.id === id && x.kind === 'meal');
        if (!cur) return {};
        const next: HostMeal = { ...cur, status, updatedAt: nowIso };
        return {
          hostRecords: db.hostRecords.map((x) => (x.id === id ? next : x)),
          // F4: ביטול מסיר את חיוב-הארוחה מהתיק (במקור נשאר — והארוחה נעלמה מרשימת-הארוחות של ההזמנה)
          ...(status === 'cancelled' && cur.bookingId
            ? { hostBookings: db.hostBookings.map((x) => (x.id === cur.bookingId ? { ...x, charges: withMealCharge(x.charges, next), updatedAt: nowIso } : x)) }
            : {}),
        };
      });
      return true;
    },
    deleteHostMeal(id) {
      if (!hostCanNow('hosting.delete')) {
        hostNoPerm('hosting.delete');
        return false;
      }
      const m = get().db.hostRecords.find((x): x is HostMeal => x.id === id && x.kind === 'meal');
      if (!m) return false;
      const nowIso = new Date().toISOString();
      hostWrite((db) => ({
        hostRecords: db.hostRecords.filter((x) => x.id !== id),
        // כמו המקור: גם החיוב יורד מהתיק
        hostBookings: db.hostBookings.some((b) => b.charges.some((c) => c.mealId === id))
          ? db.hostBookings.map((b) => (b.charges.some((c) => c.mealId === id) ? { ...b, charges: b.charges.filter((c) => c.mealId !== id), updatedAt: nowIso } : b))
          : db.hostBookings,
      }));
      return true;
    },
    syncHostKitchen() {
      const nowIso = new Date().toISOString();
      const res = { meals: 0, dishes: 0 };
      hostWrite((db) => {
        const meals = db.hostRecords.filter((r): r is HostMeal => r.kind === 'meal');
        const dishes = db.hostRecords.filter((r): r is HostDish => r.kind === 'dish');
        const out = syncAllKitchen(meals, db.hostBookings, dishes, nowIso);
        res.meals = out.mealsSynced;
        res.dishes = out.dishesAssigned;
        const mealById = new Map(out.meals.map((x) => [x.id, x] as const));
        const bookingById = new Map(out.bookings.map((x) => [x.id, x] as const));
        return {
          ...(mealById.size ? { hostRecords: db.hostRecords.map((r) => mealById.get(r.id) ?? r) } : {}),
          ...(bookingById.size ? { hostBookings: db.hostBookings.map((b) => bookingById.get(b.id) ?? b) } : {}),
        };
      });
      get().toast('סונכרן: ' + res.meals + ' ארוחות למשתתפים · ' + res.dishes + ' מנות לטבח');
      return res;
    },
    updateHostSeatPlan(mealId, f) {
      let found = false as boolean;
      const nowIso = new Date().toISOString();
      hostWrite((db) => {
        const cur = db.hostRecords.find((x): x is HostMeal => x.id === mealId && x.kind === 'meal');
        if (!cur) return {};
        found = true;
        const seatPlan = f(cur.seatPlan);
        if (seatPlan === cur.seatPlan) return {};
        return { hostRecords: db.hostRecords.map((x) => (x.id === mealId ? { ...cur, seatPlan, updatedAt: nowIso } : x)) };
      });
      return found;
    },
    addHostCleanTask(unitId, type) {
      if (!get().db.hostUnits.some((u) => u.id === unitId)) {
        get().toast('בחרו ' + hostWord('unit'));
        return false;
      }
      const nowIso = new Date().toISOString();
      const task: HostCleanTask = { id: hostNewId('hr'), kind: 'clean', unitId, type: hostText(type, 60) || AFTER_CHECKOUT_CLEAN, status: 'open', date: isoTodayLocal(), createdAt: nowIso, updatedAt: nowIso };
      hostWrite((db) => ({ hostRecords: [...db.hostRecords, task] }));
      return true;
    },
    finishHostCleanTask(id) {
      const t = get().db.hostRecords.find((x): x is HostCleanTask => x.id === id && x.kind === 'clean');
      if (!t || t.status === 'done') return { ok: false, freed: false };
      const nowIso = new Date().toISOString();
      let freed = false as boolean;
      let othersOpen = false as boolean;
      hostWrite((db) => {
        const u = db.hostUnits.find((x) => x.id === t.unitId);
        // F10: היחידה משתחררת רק כשאין לה משימה פתוחה נוספת
        freed = !!u && unitFreeAfter(u, db.hostRecords, id);
        othersOpen = !!u && u.status === 'dirty' && !freed;
        return {
          hostRecords: db.hostRecords.map((r) => (r.id === id && r.kind === 'clean' ? { ...r, status: 'done' as const, doneAt: nowIso, updatedAt: nowIso } : r)),
          ...(freed ? { hostUnits: db.hostUnits.map((x) => (x.id === t.unitId ? { ...x, status: 'free' as const, updatedAt: nowIso } : x)) } : {}),
        };
      });
      get().toast(
        freed ? 'ה' + hostWord('unit') + ' נקייה וזמינה ✓' : 'המשימה הושלמה ✓' + (othersOpen ? ' · ל' + hostWord('unit') + ' נותרו משימות ניקיון פתוחות' : ''),
      );
      return { ok: true, freed };
    },
    addHostFault(f) {
      const s = get();
      const pr = Number(f.priority);
      const priority = Number.isInteger(pr) && pr >= 0 && pr <= 4 ? pr : 3;
      const unitId = f.unitId && s.db.hostUnits.some((u) => u.id === f.unitId) ? f.unitId : '';
      const assetId = f.assetId && s.db.hostRecords.some((r) => r.id === f.assetId && r.kind === 'asset') ? f.assetId : '';
      // P0/P1 חוסמות את היחידה (כמו המקור) — קריאה כללית (בלי יחידה) לא חוסמת דבר
      const block = faultBlocksUnit(priority) && !!unitId;
      const nowIso = new Date().toISOString();
      const fault: HostFault = {
        id: hostNewId('hr'),
        kind: 'fault',
        unitId,
        assetId,
        category: hostText(f.category, 40) || 'אחר',
        priority,
        desc: hostText(f.desc, 200) || 'תקלה',
        status: 'open',
        safety: f.safety === true,
        blocked: block,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      hostWrite((db) => ({
        hostRecords: [...db.hostRecords, fault],
        ...(block ? { hostUnits: db.hostUnits.map((u) => (u.id === unitId ? { ...u, status: 'blocked' as const, updatedAt: nowIso } : u)) } : {}),
      }));
      // המקור הוסיף "ונשלחה התראה" — אין שליחה (לא שם ולא כאן); ההודעה אומרת רק מה שקרה
      s.toast(faultBlocksUnit(priority) ? (block ? '🚨 חירום! ה' + hostWord('unit') + ' נחסמה' : '🚨 קריאת-חירום נפתחה') : 'קריאה נפתחה');
      logAudit('🔧 קריאת תחזוקה P' + priority, fault.desc);
      return { ok: true, blocked: block };
    },
    advanceHostFault(id) {
      const r = get().db.hostRecords.find((x): x is HostFault => x.id === id && x.kind === 'fault');
      if (!r) return false;
      const nx = nextFaultStatus(r.status);
      if (!nx) return false;
      const nowIso = new Date().toISOString();
      let released = '' as HostUnitStatus | '';
      let stillBlocked = false as boolean;
      hostWrite((db) => {
        const cur = db.hostRecords.find((x): x is HostFault => x.id === id && x.kind === 'fault');
        if (!cur) return {};
        const closing = nx === 'done' && cur.blocked;
        const next: HostFault = { ...cur, status: nx, ...(closing ? { blocked: false } : {}), updatedAt: nowIso };
        let units: HostUnit[] | undefined;
        if (closing) {
          // F13: היחידה משתחררת רק כשאין עליה קריאה חוסמת פתוחה נוספת; F12: ממתינה-לניקיון ⇒ "לניקיון"
          stillBlocked = otherBlockingFault(db.hostRecords, cur.unitId, id);
          const u = db.hostUnits.find((x) => x.id === cur.unitId);
          if (u && u.status === 'blocked' && !stillBlocked) {
            released = releasedUnitStatus(u.id, db.hostRecords);
            units = db.hostUnits.map((x) => (x.id === u.id ? { ...x, status: released as HostUnitStatus, updatedAt: nowIso } : x));
          }
        }
        return { hostRecords: db.hostRecords.map((x) => (x.id === id ? next : x)), ...(units ? { hostUnits: units } : {}) };
      });
      get().toast(
        released
          ? 'טופל · ה' + hostWord('unit') + ' שוחררה' + (released === 'dirty' ? ' (ממתינה לניקיון)' : '')
          : stillBlocked
            ? 'טופל · ה' + hostWord('unit') + ' נשארת חסומה — קריאת-חירום נוספת פתוחה'
            : 'עודכן',
      );
      return true;
    },
    releaseHostFaultUnit(id) {
      const r = get().db.hostRecords.find((x): x is HostFault => x.id === id && x.kind === 'fault');
      if (!r) return false;
      const nowIso = new Date().toISOString();
      let released = '' as HostUnitStatus | '';
      hostWrite((db) => {
        const u = db.hostUnits.find((x) => x.id === r.unitId);
        // שחרור ידני (החלטת-אדם) גובר על קריאות נוספות — כמו במקור; יחידה שלא חסומה (לניקיון) — לא נוגעים
        if (u && u.status === 'blocked') released = releasedUnitStatus(u.id, db.hostRecords);
        return {
          hostRecords: db.hostRecords.map((x) => (x.id === id && x.kind === 'fault' ? { ...x, blocked: false, updatedAt: nowIso } : x)),
          ...(released ? { hostUnits: db.hostUnits.map((x) => (x.id === r.unitId ? { ...x, status: released as HostUnitStatus, updatedAt: nowIso } : x)) } : {}),
        };
      });
      get().toast('ה' + hostWord('unit') + ' שוחררה' + (released === 'dirty' ? ' (ממתינה לניקיון)' : ''));
      logAudit('🔓 שחרור ' + hostWord('unit'), r.desc);
      return true;
    },
    addHostTempReading(device, temp) {
      const s = get();
      if (!(HOST_TEMP_DEVICES as readonly string[]).includes(device)) return { ok: false, breach: false };
      const t = Number(temp);
      if (!Number.isFinite(t)) {
        s.toast('טמפרטורה לא תקינה');
        return { ok: false, breach: false };
      }
      const ok = tempOk(device, t);
      // כמו המקור: חריגה פותחת קריאה רק כשצוות-התחזוקה פעיל (F7 — קריאה כללית, לא על "היחידה הראשונה")
      const maint = featureOn(s.config, 'hosting.maint');
      const nowIso = new Date().toISOString();
      const log: HostTempLog = { id: hostNewId('hr'), kind: 'temp', device, temp: t, ok, at: nowIso, createdAt: nowIso, updatedAt: nowIso };
      const fault = !ok && maint ? tempBreachFault(device, t, hostNewId('hr'), nowIso) : null;
      hostWrite((db) => ({ hostRecords: [...db.hostRecords, log, ...(fault ? [fault] : [])] }));
      s.toast(ok ? 'נרשם ✓' : maint ? '⚠ חריגה! נפתחה קריאת-תחזוקה' : '⚠ חריגה!');
      if (fault) logAudit('🌡️ חריגת טמפרטורה', fault.desc);
      return { ok: true, breach: !ok };
    },
    setHostingPrefs(patch) {
      if (!hostCanNow('hosting.manage')) {
        hostNoPerm('hosting.manage');
        return false;
      }
      // רק שדות-ההגדרות; מצב-שבת ועגלת-הקניות — בפעולות-הצוות שלהן
      const KEYS = ['businessName', 'checkin', 'checkout', 'cleaningFee', 'taxPct', 'orderLeadDays', 'familyTerm'] as const;
      const keys = Object.keys(patch).filter((k): k is (typeof KEYS)[number] => (KEYS as readonly string[]).includes(k));
      if (!keys.length) return false;
      hostWrite((db) => {
        const merged: Record<string, unknown> = { ...db.ui.hosting };
        for (const k of keys) {
          const v = patch[k];
          if (v === undefined) delete merged[k];
          else merged[k] = v;
        }
        return { prefs: healHostingPrefs(merged) };
      });
      logAudit('⚙ הגדרות ' + hostWord('nav'), keys.join(', '));
      return true;
    },
    setHostShabbat(patch) {
      hostWrite((db) => {
        const cur = db.ui.hosting ?? {};
        const sb: Record<string, unknown> = { ...cur.shabbat };
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined) delete sb[k];
          else sb[k] = v;
        }
        return { prefs: healHostingPrefs({ ...cur, shabbat: sb }) };
      });
    },
    setHostShop(patch) {
      const nowIso = new Date().toISOString();
      hostWrite((db) => {
        const cur = db.ui.hosting ?? {};
        const shopGot: Record<string, true> = { ...cur.shopGot };
        const shopEmoji: Record<string, string> = { ...cur.shopEmoji };
        let records: HostRecord[] | undefined;
        if (patch.got) {
          const [key, on] = patch.got;
          if (on) shopGot[key] = true;
          else delete shopGot[key];
          // כמו המקור: מוצר-נלווה — גם "נקנה" ברשומה
          if (key.startsWith('sup:')) {
            const sid = key.slice(4);
            records = db.hostRecords.map((r) => (r.id === sid && r.kind === 'supply' ? { ...r, bought: on, updatedAt: nowIso } : r));
          }
        }
        if (patch.emoji) {
          const [key, emoji] = patch.emoji;
          if (emoji) shopEmoji[key] = emoji;
          else delete shopEmoji[key];
        }
        return { prefs: healHostingPrefs({ ...cur, shopGot, shopEmoji }), ...(records ? { hostRecords: records } : {}) };
      });
    },
    restoreHosting(data) {
      if (!hostCanNow('hosting.manage')) {
        hostNoPerm('hosting.manage');
        return false;
      }
      const units = healHostCollection('hostUnits', Array.isArray(data?.units) ? data.units : []);
      const bookings = healHostCollection('hostBookings', Array.isArray(data?.bookings) ? data.bookings : []);
      const records = healHostCollection('hostRecords', Array.isArray(data?.records) ? data.records : []);
      const prefs = healHostingPrefs(data?.prefs);
      // מחליף את נתוני-המודול בלבד — שאר אורביט לא זז; מה שנגרע מקבל מצבה (בצינור-הכתיבה של ה-store)
      hostWrite(() => ({ hostUnits: units, hostBookings: bookings, hostRecords: records, prefs }));
      logAudit('⤵️ שחזור ' + hostWord('nav'), units.length + ' ' + hostWord('units') + ' · ' + bookings.length + ' ' + hostWord('bookings'));
      return true;
    },
    resetHosting() {
      if (!hostCanNow('hosting.delete')) {
        hostNoPerm('hosting.delete');
        return false;
      }
      // "🗑 אפס הכל" של המקור — כאן נתוני-המודול בלבד (לא שאר אורביט)
      hostWrite(() => ({ hostUnits: [], hostBookings: [], hostRecords: [], prefs: {} }));
      logAudit('🗑 איפוס ' + hostWord('nav'), 'כל נתוני-המודול');
      return true;
    },
  };
}

/** מתקין את הפעולות ב-store (אידמפוטנטי — אפשר לקרוא שוב; HostingView קורא בטעינת הצ'אנק). */
export function installHostingActions(): void {
  useApp.setState(hostingActions());
}
