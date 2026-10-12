/**
 * 📒 פרנסה׳לע — כרטיס עסק ברשימת-המדריך (אשכול 5): שער (צבע/אייקון), תג פתוח-עכשיו (שעון-הקהילה +
 * סגירת שבת/יו״ט מהמנוע), קוד-חיוג, תגי-אמון, וחיוג/וואטסאפ — **מגודרי-הרחבה** (טלפוניה / וואטסאפ);
 * המספר עצמו תמיד גלוי (לחיוג ידני). הוואטסאפ נפתח עם ההודעה המוכנה של המקור.
 */
import { useApp } from '../../store/useApp';
import { integrationOn, telephonyOn, termOf } from '../../lib/config';
import type { PrListing } from '../../types/domain';
import { Btn } from '../ui';
import { WaBtn } from '../WaBtn';
import { CallBtn } from '../CallBtn';
import { categoryOf, isFeatured, listingStatus, type PrOpenState } from './lib';
import type { PrNow } from './hooks';

const OPEN_STYLE: Record<PrOpenState['k'], { icon: string; color: string }> = {
  open: { icon: '🟢', color: '#12803c' },
  soon: { icon: '🟡', color: '#a16207' },
  closed: { icon: '⚪', color: 'var(--ink-faint)' },
  shab: { icon: '🕯', color: '#7a5b12' },
};

/** תג פתוח-עכשיו (null = אין שעות ⇒ לא מוצג). */
export function OpenBadge(props: { listing: PrListing; now: PrNow }) {
  const st = listingStatus(props.listing, props.now.clock, props.now.closureAt);
  if (!st) return null;
  const s = OPEN_STYLE[st.k];
  return (
    <span style={{ fontSize: 12.5, fontWeight: 700, color: s.color, whiteSpace: 'nowrap' }}>
      {s.icon + ' ' + st.t + (st.sub ? ' · ' + st.sub : '')}
    </span>
  );
}

/**
 * טקסט עם טווחי-שעות: כל "08:00–19:00" בבידוד-LTR — אחרת בפסקה RTL מקף-הטווח (ON) מפצל את המספרים
 * והטווח מוצג הפוך ("19:00–08:00") לצד טבלאות שמוצגות LTR — שתי מוסכמות על אותו מסך.
 */
export function TimeText(props: { text: string }) {
  const parts = props.text.split(/(\d{1,2}:\d{2}\s*[–-]\s*(?:\d{1,2}:\d{2}|חצות))/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <bdi key={i} dir="ltr">
            {p}
          </bdi>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** ההודעה המוכנה (§3.6 במקור): "שלום, הגעתי אליך דרך {מותג}." + צורך מהחיפוש. */
export function waIntro(brand: string, query?: string): string {
  const q = (query ?? '').trim();
  return 'שלום, הגעתי אליך דרך ' + brand + '.' + (q ? ' צריך עזרה: ' + q : '');
}

/** אנשי-קשר לעסק: המספר (LTR) + 📞 (טלפוניה) + 💬 (וואטסאפ) — הגידור כאן, אצל הקורא. */
export function ContactRow(props: { listing: PrListing; brand: string; query?: string }) {
  const config = useApp((s) => s.config);
  const l = props.listing;
  const telOn = telephonyOn(config);
  const waOn = integrationOn(config, 'whatsapp');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13.5 }}>
      <span dir="ltr" style={{ fontWeight: 800 }}>
        {l.phone}
      </span>
      {telOn && l.phone ? <CallBtn phone={l.phone} title={'חיוג ל' + l.name} /> : null}
      {waOn && l.whatsapp ? <WaBtn phone={l.whatsapp} text={waIntro(props.brand, props.query)} title={'וואטסאפ ל' + l.name} /> : null}
      {l.phone2 ? (
        <>
          <span dir="ltr" style={{ color: 'var(--ink-faint)' }}>
            {l.phone2}
          </span>
          {telOn ? <CallBtn phone={l.phone2} title={'חיוג ל' + l.name} /> : null}
        </>
      ) : null}
    </div>
  );
}

export function ListingCard(props: { listing: PrListing; now: PrNow; brand: string; query?: string; onOpen: () => void; via?: string }) {
  const config = useApp((s) => s.config);
  const l = props.listing;
  const cat = categoryOf(l.category);
  const feat = isFeatured(l, props.now.todayIso);
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  return (
    <div
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: 5, borderInlineStart: '4px solid ' + cat.color, ...(feat ? { boxShadow: '0 0 0 2px #d4a72c inset' } : {}) }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span aria-hidden style={{ fontSize: 18 }}>
          {cat.icon}
        </span>
        <button
          type="button"
          onClick={props.onOpen}
          title="לכרטיס המלא"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 800, fontSize: 15, color: 'inherit', textAlign: 'start' }}
        >
          {l.name}
        </button>
        {feat && <span style={{ fontSize: 11.5, fontWeight: 800, color: '#7a5b12' }}>👑 מומלץ</span>}
        {l.status === 'pending' && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#a16207' }}>{'⏳ ממתין לאישור ה' + gabbai}</span>}
        {l.status === 'rejected' && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b91c1c' }}>✕ מוסתר</span>}
        {l.dialCode && (
          <span title="קוד-חיוג (מודפס בחוברת)" style={{ marginInlineStart: 'auto', fontSize: 11.5, border: '1px solid var(--line)', borderRadius: 6, padding: '0 6px' }}>
            {'☎ ' + l.dialCode}
          </span>
        )}
      </div>
      {l.title && <div style={{ fontSize: 13 }}>{l.title}</div>}
      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
        {[cat.short, l.city, l.area].filter((x) => x && x.trim()).join(' · ')}
        {props.via ? ' · ← ' + props.via : ''}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
        <OpenBadge listing={l} now={props.now} />
        {l.disc && <span>🏷 הנחה לקהילה</span>}
        {l.free && <span>🤝 גמ״ח</span>}
        {l.emergency && <span>🚨 חירום 24/7</span>}
        {l.kashrut.trim() && <span>{'השגחה: ' + l.kashrut.trim()}</span>}
        {l.recs.length > 0 && <span>{'💬 ' + (l.recs.length === 1 ? 'ממליץ אחד' : l.recs.length + ' ממליצים')}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ContactRow listing={l} brand={props.brand} query={props.query} />
        <span style={{ marginInlineStart: 'auto' }}>
          <Btn sm onClick={props.onOpen}>
            לכרטיס ←
          </Btn>
        </span>
      </div>
    </div>
  );
}
