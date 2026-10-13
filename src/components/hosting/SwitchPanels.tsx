/**
 * 🏡 אירוח ⇄ 🔌 המרכזייה — החיבורים במסכי-האירוח (BUILD-ORDER-SWITCHBOARD-2026-10-13), בסקין "Aurora Glass".
 *
 * כל רכיב מגודר פעמיים: הצרכן (תת-דגל של האירוח) **וגם** יכולת-הספק זמינה (`ask` ⇒ ok). אחרת — `null`: המסך ביט-זהה
 * (זהב: ui-golden.test). הנתונים מכלים אחרים — רק דרך `ask`; קריאה-בלבד, אפס כתיבה לנתוני פרנסה׳לע.
 *   א׳ StayShabbat (כרטיס-הזמנה) · BoardShabbatPanel + ShabbatSendLink (לשונית 🕯️ שבת) ⇐ parnasa.shabbat + parnasa.minyanim,
 *      ו"📤 שליחה למשפחה" — וואטסאפ ממולא (הרחבת-וואטסאפ + טלפון-אורח תקין).
 *   ב׳ FindProDialog ⇐ parnasa.findPro (+ parnasa.emergency בחירום) — "🔧 מצא בעל מקצוע" מקריאה/משימת-ניקיון; 📞 בטלפוניה,
 *      💬 בהרחבת-וואטסאפ.
 *   ד׳ TodayPanel (לוח-הבקרה) ⇐ todaySummary — רק כשכלי נוסף זמין; ⧉ העתקה / 💬 שיתוף — hosting.export + שער-הייצוא.
 *   📅 (ENGINEBOX-SOCKETS 13.10) ⇐ calendar.dayInfo — הלוח העברי של אורביט: ShabbatGuard (טופס-ההזמנה, prop `shabbatGuard`)
 *      ו-StayHebDates (כרטיס-השהייה במרכז-ההזמנות, prop `hebDates`). **כבויים כברירת-מחדל** — המסך ביט-זהה עד שמחברים.
 *   🧰 (ENGINEBOX-B 13.10) כל רכיב חוצה-כלים מציית גם לחיבור שלו בארגז-המנועים (`useEngineLink` ⇐ db.ui.engineLinks):
 *      מנותק ⇒ לא מחושב (היכולת לא נטענת/נשאלת) ולא מרונדר; הכלי ממשיך בהתנהגות המקומית שלו. חסר ⇒ ברירת-המחדל ⇒ ביט-זהה.
 */
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { telephonyOn } from '../../lib/config';
import { guardExport } from '../../lib/exportGate';
import { waHref } from '../../lib/wa';
import { ask, isAvailable, listAbilities, type AbilityId, type OutputOf } from '../../lib/switchboard/registry';
import { hasOtherTool, shareWaUrl, summaryHeader, summaryText, todaySummary } from '../../lib/switchboard/summary';
import { hasSummaryLink, linkedSummaryLines } from '../../lib/enginebox/links';
import { useEngineLink, useEngineLinks } from '../switchboard/useEngineLink';
import type { SwitchCtx } from '../../lib/switchboard/contract';
import { NO_ABILITIES, useSwitchCtx } from '../switchboard/useSwitchCtx';
import type { HostBooking } from '../../types/domain';
import { useHostData, useHostEnv, useNowMs, type HostData, type HostEnv } from './hooks';
import { HModal, h, useHostUi } from './hui';
import { blocksAvailability, telHref } from './lib';
import { copyText } from './exportDoc';
import { groupMinyanim, hebRangeText, sacredGuardLines, shabbatFamilyText, shabbatTimeItems, shulDaysText, stayFriday } from './switchLinks';

const SHABBAT_IDS: readonly AbilityId[] = ['parnasa.shabbat', 'parnasa.minyanim'];
const SHABBAT_ONLY: readonly AbilityId[] = ['parnasa.shabbat'];
const MINYANIM_ONLY: readonly AbilityId[] = ['parnasa.minyanim'];

/** היכולות שהמקבל צריך לפי החיבורים שלו: זמני-שבת ⇐ parnasa.shabbat · מניינים ⇐ parnasa.minyanim (מנותק ⇒ לא נטען). */
function shabbatIdsFor(times: boolean, prayers: boolean): readonly AbilityId[] {
  return times && prayers ? SHABBAT_IDS : times ? SHABBAT_ONLY : prayers ? MINYANIM_ONLY : NO_ABILITIES;
}

/** החיבורים של מקבל-שבת (כרטיס-השהייה / לשונית-השבת) בארגז-המנועים. */
function useShabbatLinks(needer: 'host.stay' | 'host.shabbat'): { times: boolean; prayers: boolean } {
  return { times: useEngineLink('pr.zmanim', 'times.shabbat', needer), prayers: useEngineLink('pr.board', 'times.prayers', needer) };
}
const PRO_IDS: readonly AbilityId[] = ['parnasa.findPro', 'parnasa.emergency'];
const CAL_IDS: readonly AbilityId[] = ['calendar.dayInfo'];
const VIOLET: CSSProperties = { color: 'var(--h-violet)', background: 'color-mix(in srgb,var(--h-violet) 12%,transparent)', borderColor: 'var(--h-violet)' };
const DIM: CSSProperties = { color: 'var(--h-dim)', fontSize: 12 };

/** שם-העסק — אותו סדר של כותרת-המודול (הגדרות ⇐ מיתוג ⇐ שם-הארגון ⇐ שם-העמודה). */
function useBizName(): string {
  const d = useHostData();
  const env = useHostEnv();
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  return d.prefs.businessName?.trim() || config.orgName?.trim() || dbOrgName?.trim() || env.terms.nav;
}

/* ═══════════════ א׳ · שבת בשהייה — כרטיס-ההזמנה ═══════════════ */

type MinyanList = OutputOf<'parnasa.minyanim'>['minyanim'];

/** המניינים לשישי-שבת של השבת הזו (ריק כשהיכולת לא זמינה — הלוח כבוי). */
function minyanimOf(ctx: SwitchCtx, friIso: string): MinyanList {
  const r = ask('parnasa.minyanim', ctx, { fromIso: friIso, days: 2 });
  return r.ok ? r.value.minyanim : [];
}

/** הזמנים: התווית בעברית, השעה בספרות (מונו, LTR) — "הדלקת נרות · שישי 16/10 17:46 · צאת השבת 18:47 · ר״ת 19:19". */
function ShabbatTimes(props: { sh: OutputOf<'parnasa.shabbat'> }) {
  const items = shabbatTimeItems(props.sh);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 2 }}>
      {items.map((it) => (
        <span key={it.label}>
          {it.label + ' '}
          <b className="h-mono" dir="ltr">
            {it.time}
          </b>
        </span>
      ))}
    </div>
  );
}

/** מניינים לפי בית-כנסת — שורה לכל אחד: שם · כתובת — שישי: … · שבת: … */
function MinyanRows(props: { list: MinyanList }) {
  const groups = groupMinyanim(props.list);
  if (!groups.length) return null;
  return (
    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {groups.map((g) => (
        <div key={g.shul + '|' + g.place} style={{ fontSize: 12.5 }}>
          🙏 <b>{g.shul}</b>
          {g.place ? <span style={DIM}>{' · ' + g.place}</span> : null}
          {' — ' + shulDaysText(g)}
        </div>
      ))}
    </div>
  );
}

/** קישור "📤 שליחה למשפחה" — וואטסאפ ממולא לטלפון-האורח; null כשאין הרחבת-וואטסאפ / טלפון תקין / זמני-שבת. */
function familyLink(env: HostEnv, d: HostData, b: HostBooking, ctx: SwitchCtx, friIso: string, biz: string): { href: string; app: boolean; who: string } | null {
  const g = d.guestOf(b.guestId);
  const sh = ask('parnasa.shabbat', ctx, { atIso: friIso });
  if (!g || !sh.ok) return null;
  const text = shabbatFamilyText({ guest: g.name, unit: d.unitName(b.unitId), biz, shabbat: sh.value, minyanim: minyanimOf(ctx, sh.value.friIso) });
  const wa = env.wa && g.phone ? waHref(g.phone, text, env.waApp) : null;
  return wa ? { href: wa.href, app: wa.app, who: g.name } : null;
}

function SendLink(props: { link: { href: string; app: boolean; who: string }; sm?: boolean }) {
  const { link } = props;
  return (
    <a
      className={h(props.sm ? 'btn ghost sm' : 'btn sm')}
      href={link.href}
      {...(link.app ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      style={{ textDecoration: 'none', display: 'inline-block', marginTop: props.sm ? 0 : 8, marginInlineStart: props.sm ? 6 : 0 }}
      title={'זמני השבת והמניינים ל' + link.who + ' בוואטסאפ'}
    >
      📤 שליחה למשפחה
    </a>
  );
}

/**
 * כרטיס-הזמנה: השהייה לנה בליל-שבת ⇒ זמני השבת והמניינים מלוח-הקהילה + "📤 שליחה למשפחה".
 * 🧰 זמני-השבת מנותקים ⇒ אין כרטיס; המניינים מנותקים ⇒ בלי שורות-המניין ובלי "📤 שליחה למשפחה" (ההודעה בנויה משניהם).
 */
export function StayShabbat(props: { b: HostBooking }) {
  const d = useHostData();
  const env = useHostEnv();
  const nowMs = useNowMs(60_000);
  const biz = useBizName();
  const lk = useShabbatLinks('host.stay');
  const friIso = blocksAvailability(props.b) ? stayFriday(props.b) : '';
  const on = env.on.shabbat && !!friIso && lk.times;
  const ctx = useSwitchCtx(nowMs, on ? shabbatIdsFor(true, lk.prayers) : NO_ABILITIES);
  if (!on) return null;
  const sh = ask('parnasa.shabbat', ctx, { atIso: friIso });
  if (!sh.ok) return null;
  const link = lk.prayers ? familyLink(env, d, props.b, ctx, friIso, biz) : null;
  return (
    <div className="h-okbox" style={{ ...VIOLET, display: 'block' }} data-switch="stay-shabbat">
      <div style={{ fontWeight: 800 }}>
        {'🕯️ שבת בשהייה · ' + sh.value.hebDate + (sh.value.holiday ? ' · ' + sh.value.holiday : '')}
        <span style={{ ...DIM, fontWeight: 400 }}> · מלוח הקהילה</span>
      </div>
      <ShabbatTimes sh={sh.value} />
      {lk.prayers && <MinyanRows list={minyanimOf(ctx, sh.value.friIso)} />}
      <div style={DIM}>{sh.value.loc + ' · ' + sh.value.brand}</div>
      {link && <SendLink link={link} />}
    </div>
  );
}

/* ═══════════════ א׳ · לשונית 🕯️ שבת ═══════════════ */

/** ההקשר של לשונית-השבת — פעם אחת למסך (הפאנל + כפתורי-השליחה בשורות); טוען רק את מה שמחובר ללשונית. */
export function useShabbatSwitch(): SwitchCtx {
  const nowMs = useNowMs(60_000);
  const lk = useShabbatLinks('host.shabbat');
  return useSwitchCtx(nowMs, shabbatIdsFor(lk.times, lk.prayers));
}

/** "🕯️ זמני השבת מלוח הקהילה" — השבת הקרובה (או הנוכחית) + המניינים לשישי-שבת. 🧰 זמני-השבת מנותקים ⇒ אין פאנל. */
export function BoardShabbatPanel(props: { ctx: SwitchCtx }) {
  const lk = useShabbatLinks('host.shabbat');
  if (!lk.times) return null;
  const sh = ask('parnasa.shabbat', props.ctx, {});
  if (!sh.ok) return null;
  return (
    <div className="h-panel" style={{ marginTop: 16 }} data-switch="board-shabbat">
      <h2>🕯️ זמני השבת מלוח הקהילה</h2>
      <div style={{ fontWeight: 700 }}>{(sh.value.current ? 'השבת · ' : 'השבת הקרובה · ') + sh.value.hebDate + (sh.value.holiday ? ' · ' + sh.value.holiday : '')}</div>
      <ShabbatTimes sh={sh.value} />
      {lk.prayers && <MinyanRows list={minyanimOf(props.ctx, sh.value.friIso)} />}
      <div className="h-hint">{sh.value.loc + ' · ' + sh.value.brand + ' · השדות הידניים למטה נשמרים כמו שהם'}</div>
    </div>
  );
}

/** 📤 בשורת-החבילה — רק להזמנה ששוהה בליל-שבת (השבת של השהייה שלה); אחרת כלום (גם לא עוטף ריק). 🧰 צריך את שני החיבורים. */
export function ShabbatSendLink(props: { ctx: SwitchCtx; b: HostBooking }) {
  const d = useHostData();
  const env = useHostEnv();
  const biz = useBizName();
  const lk = useShabbatLinks('host.shabbat');
  const friIso = lk.times && lk.prayers ? stayFriday(props.b) : '';
  const link = friIso ? familyLink(env, d, props.b, props.ctx, friIso, biz) : null;
  return link ? <SendLink link={link} sm /> : null;
}

/* ═══════════════ ב׳ · 🔧 מצא בעל מקצוע ═══════════════ */

/** שער-הכפתור (סינכרוני, לא טוען דבר): יכולת המדריך זמינה **ו**המדריך מחובר למסך הזה בארגז-המנועים. */
export function useFindProOn(needer: 'host.maint' | 'host.clean'): boolean {
  const config = useApp((s) => s.config);
  const linked = useEngineLink('pr.directory', 'pro.match', needer);
  return linked && isAvailable('parnasa.findPro', config);
}

/** 🧰 מספרי-החירום של לוח-הקהילה מחוברים לקריאות-התחזוקה (מנותק ⇒ גם קריאה דחופה פותחת את החלון בלי שורת-החירום). */
export function useEmergencyLinked(): boolean {
  return useEngineLink('pr.board', 'emergency', 'host.maint');
}

/** הדיאלוג: בעלי-מקצוע פתוחים-עכשיו מהמדריך (אין — הכי מתאימים, עם מצבם); חירום ⇒ גם מספרי-החירום של הלוח. */
export function FindProDialog(props: { text: string; title: string; urgent?: boolean }) {
  const ui = useHostUi();
  const env = useHostEnv();
  const config = useApp((s) => s.config);
  const nowMs = useNowMs(60_000);
  const ctx = useSwitchCtx(nowMs, PRO_IDS);
  const telOn = telephonyOn(config);
  const open = ask('parnasa.findPro', ctx, { text: props.text, limit: 3, openNow: true });
  const any = open.ok && open.value.pros.length === 0 ? ask('parnasa.findPro', ctx, { text: props.text, limit: 3 }) : null;
  const res = any?.ok ? any.value : open.ok ? open.value : null;
  const em = props.urgent ? ask('parnasa.emergency', ctx, {}) : null;
  const closedOnly = !!any?.ok && any.value.pros.length > 0;
  return (
    <HModal
      title="🔧 בעל מקצוע מהמדריך"
      onClose={ui.close}
      footer={
        <button type="button" className={h('btn ghost')} onClick={ui.close}>
          סגור
        </button>
      }
    >
      <div style={{ marginBottom: 8 }}>
        <span style={DIM}>צריך: </span>
        <b>{props.title}</b>
        {res?.concept ? <span style={DIM}>{' · ' + res.concept}</span> : null}
      </div>
      {em?.ok && (
        <div className="h-warnbox" data-switch="emergency">
          {'🚨 סכנה? מספרי חירום: ' + em.value.numbers.map((n) => n.label + ' ' + n.phone).join(' · ')}
        </div>
      )}
      {!open.ok && open.reason === 'loading' && <div className="h-hint">⏳ טוען את המדריך…</div>}
      {!open.ok && open.reason !== 'loading' && <div className="h-warnbox">המדריך לא זמין כרגע.</div>}
      {res && res.pros.length === 0 && <div className="h-empty">{'לא נמצא במדריך בעל מקצוע מתאים ל"' + res.query + '".'}</div>}
      {closedOnly && <div className="h-hint">אין כרגע בעל מקצוע פתוח — הכי מתאימים:</div>}
      {res?.pros.map((p) => {
        const wa = env.wa && p.whatsapp ? waHref(p.whatsapp, res.waIntro, env.waApp) : null;
        return (
          <div key={p.id} className="h-drow" data-switch="pro">
            <div className="h-avat">{p.icon}</div>
            <div className="h-dinfo">
              <b>
                {p.name}
                {p.dialCode ? <span style={{ ...DIM, fontWeight: 400 }}>{' · ☎ ' + p.dialCode}</span> : null}
              </b>
              <span>{[p.trade, p.category, p.area].filter(Boolean).join(' · ')}</span>
              <span style={{ color: p.open ? 'var(--h-good)' : 'var(--h-dim)', fontWeight: 700 }}>{(p.open ? '● ' : '○ ') + (p.status || 'שעות לא ידועות')}</span>
            </div>
            <div className="h-dact" style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {p.phone ? (
                <span dir="ltr" className="h-mono" style={{ fontSize: 12 }}>
                  {p.phone}
                </span>
              ) : (
                <span style={DIM}>אין טלפון</span>
              )}
              {telOn && p.phone && (
                <a className={h('btn ghost sm')} href={telHref(p.phone)} aria-label={'חיוג ל' + p.name} style={{ textDecoration: 'none' }}>
                  📞
                </a>
              )}
              {wa && (
                <a className={h('btn ghost sm')} href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener noreferrer' })} aria-label={'וואטסאפ ל' + p.name} style={{ textDecoration: 'none' }}>
                  💬
                </a>
              )}
            </div>
          </div>
        );
      })}
      {res && <div className="h-hint">{'קריאה בלבד מהמדריך של ' + res.brand + ' — לא נשמר דבר.'}</div>}
    </HModal>
  );
}

/* ═══════════════ ד׳ · ☀ תקציר היום — לוח-הבקרה ═══════════════ */

/**
 * תקציר-הבוקר מכל הכלים — רק כשכלי נוסף זמין (כלי יחיד ⇒ לוח-הבקרה ביט-זהה).
 * 🧰 רק שורות מנותנים שמחוברים ללוח-הבקרה (day.summary); אף נותן לא מחובר ⇒ אין כרטיס. נותן מנותק לא נטען.
 */
export function TodayPanel() {
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const env = useHostEnv();
  const nowMs = useNowMs(60_000);
  const stored = useEngineLinks();
  const other = hasOtherTool(config, 'hosting') && hasSummaryLink(stored, 'host.dash');
  const ids = useMemo(() => (other ? summaryIdsFor(config, stored, 'hosting', 'host.dash') : NO_ABILITIES), [config, other, stored]);
  const ctx = useSwitchCtx(nowMs, ids);
  if (!other) return null;
  const lines = linkedSummaryLines(todaySummary(ctx), stored, 'hosting', 'host.dash');
  if (!lines.length) return null;
  const text = summaryText(lines, summaryHeader(nowMs));
  return (
    <div className="h-panel" style={{ marginBottom: 16 }} data-switch="today">
      <h2>☀ תקציר היום</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5 }}>
        {lines.map((l, i) => (
          <div key={i + ':' + l.ability}>{l.text}</div>
        ))}
      </div>
      {env.on.export && (
        <div className="h-rowbtn" style={{ marginTop: 8 }}>
          <button
            type="button"
            className={h('btn ghost sm')}
            onClick={async () => {
              if (await copyText(text)) toast('התקציר הועתק ✓');
            }}
          >
            ⧉ העתקה
          </button>
          {env.wa && (
            <a
              className={h('btn ghost sm')}
              href={shareWaUrl(text, env.waApp)}
              {...(env.waApp ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              style={{ textDecoration: 'none' }}
              onClick={(e) => {
                if (!guardExport()) e.preventDefault();
              }}
            >
              💬 שיתוף בוואטסאפ
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** רשימת-הטעינה של כרטיס-תקציר: יכולות עם קול (לא-שקטות) של הכלי עצמו + של נותנים מחוברים למקבל. */
export function summaryIdsFor(config: Parameters<typeof listAbilities>[0], stored: readonly string[] | undefined, self: string, needer: string): AbilityId[] {
  const voices = listAbilities(config)
    .filter((a) => !a.quiet)
    .map((a) => ({ ability: a.id, module: a.module as string }));
  return linkedSummaryLines(voices, stored, self, needer).map((v) => v.ability);
}

/* ═══════════════ 📅 הלוח העברי — calendar.dayInfo (ENGINEBOX-SOCKETS) ═══════════════ */

type DayInfo = OutputOf<'calendar.dayInfo'>;

/**
 * שני הימים מהלוח העברי (כניסה · עזיבה), או null כשהיכולת לא זמינה (מודול-הלוח כבוי · הספק עוד נטען · שגיאה) או שתאריך
 * פגום. התאריכים מפורשים ⇒ הרגע לא משמש (nowMs=0, בלי שעון מתקתק).
 */
function useStayDays(checkIn: string, checkOut: string): [DayInfo, DayInfo] | null {
  const ctx = useSwitchCtx(0, CAL_IDS);
  const a = ask('calendar.dayInfo', ctx, { iso: checkIn });
  const b = ask('calendar.dayInfo', ctx, { iso: checkOut });
  if (!a.ok || !b.ok || !a.value.valid || !b.value.valid) return null;
  return [a.value, b.value];
}

/**
 * טופס-ההזמנה (prop `shabbatGuard`): כניסה/עזיבה בשבת או ביו״ט ⇒ "⚠ הכניסה נופלת בשבת · ה׳ חשוון". הלוח לא זמין ⇒
 * `fallback` (האזהרה המקומית הקיימת) — אף פעם לא פחות ממה שהיה.
 */
export function ShabbatGuard(props: { checkIn: string; checkOut: string; fallback: ReactNode }) {
  const days = useStayDays(props.checkIn, props.checkOut);
  if (!days) return <>{props.fallback}</>;
  const lines = sacredGuardLines(days[0], days[1]);
  if (!lines.length) return null;
  return (
    <div className="h-warnbox" data-switch="shabbat-guard">
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
}

/** כרטיס-השהייה (prop `hebDates`): " · ה׳–ז׳ חשוון" לצד התאריכים הרגילים; הלוח לא זמין ⇒ כלום. */
export function StayHebDates(props: { b: Pick<HostBooking, 'checkIn' | 'checkOut'> }) {
  const days = useStayDays(props.b.checkIn, props.b.checkOut);
  const text = days ? hebRangeText(days[0], days[1]) : '';
  if (!text) return null;
  return (
    <span style={{ ...DIM, fontWeight: 600 }} data-switch="stay-hebdates">
      {' · ' + text}
    </span>
  );
}
