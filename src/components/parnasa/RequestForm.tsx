/**
 * 📒 פרנסה׳לע — טופס "בקשה חדשה" של המקור (עיצוב 5, #reqForm): טופס פתוח בתוך הלוח (לא חלון) — "מה אתם מחפשים?",
 * תחום (לא משנה + 15 השערים), טלפון לחזרה, "מי עוד יכול לעזור לך" (relatedFor, תוך כדי הקלדה), "באלפון יש N בעלי
 * מקצוע ב…" + "לראות אותם", דחוף · בשקט · הצעת עבודה, ההערה השקטה ("זיהינו נושא רגיש"), מחיר משרה מקודמת,
 * "פרסום בלוח" / "שליחה בשקט" · "סגירה". אחרי פרסום — הטופס מתאפס ושורת-ההתאמה עוברת ל"הבקשה פורסמה. בינתיים…".
 * באורביט הגבאי/הצוות ממלאים בשם התושב — ולכן גם שם הפונה ואזור (תוספת-הפורט), ועריכה של בקשה קיימת.
 * 🛡 בקשה שקטה: שם וטלפון נשמרים אצל הגבאי בלבד — לעסקים רק הטקסט (businessView, נאכף במנוע).
 */
import { useEffect, useRef, useState } from 'react';
import { useRemembered } from '../../lib/filterMemory';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import type { PrRequest } from '../../types/domain';
import { analyzeQuery, categoryOf, PR_CATEGORIES, PR_CONCEPTS, priceOf, sensitiveTopic } from './lib';
import { matchCount, relatedFor } from './requests';
import { cx, Ic } from './skin';

export function emptyPrRequest(): PrRequest {
  return {
    id: '', text: '', category: '', area: '', urgent: false, quiet: false, job: false,
    requester: { name: '', phone: '' }, status: 'open', responses: [], createdAt: '', updatedAt: '',
  };
}

/** השער של המושג המוביל בטקסט ('' = לא זוהה). */
function suggestedCategory(text: string): string {
  const top = analyzeQuery(text).cons[0]?.k;
  return top ? (PR_CONCEPTS.find((c) => c.k === top)?.c ?? '') : '';
}

const nis = (n: number): string => Math.round(n).toLocaleString('en-US') + ' ₪';

export function RequestForm(props: {
  /** מפתח-הזיכרון של הטופס (במקור הטופס נשאר בדף — מה שהוקלד שורד מעבר-לשונית וסגירה). */
  memKey: string;
  request: PrRequest | null;
  draft?: Partial<PrRequest> | null;
  onClose: () => void;
  toast: (m: string) => void;
  onOpenListing: ((id: string) => void) | null;
  onSeeCat: ((cat: string) => void) | null;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrRequest = useApp((s) => s.upsertPrRequest);
  const base = props.request;
  const init = (): PrRequest => {
    const r: PrRequest = { ...emptyPrRequest(), ...base, ...props.draft };
    // טיוטה מ"לא מצאתי" — אותו זיהוי כמו בהקלדה: שער מהמושג המוביל, נושא רגיש ⇒ בשקט
    if (!base && r.text) {
      if (!r.category) r.category = suggestedCategory(r.text);
      if (!r.job && sensitiveTopic(r.text)) r.quiet = true;
    }
    return r;
  };
  const mk = 'parnasa.req.f.' + props.memKey + '.';
  const [f, setF] = useRemembered<PrRequest>(mk + 'f', init);
  const [catTouched, setCatTouched] = useRemembered<boolean>(mk + 'cat', () => !!base || !!props.draft?.category);
  const [quietTouched, setQuietTouched] = useRemembered<boolean>(mk + 'quiet', !!base);
  // אחרי פרסום: "הבקשה פורסמה. בינתיים, באלפון יש…" לשער של הבקשה שפורסמה
  const [posted, setPosted] = useRemembered<string>(mk + 'posted', '');
  const [relText, setRelText] = useState(f.text);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const word = termOf(config, 'entity.prRequest', 'בקשה');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const sens = f.job ? '' : sensitiveTopic(f.text);
  const set = (patch: Partial<PrRequest>): void => setF((x) => ({ ...x, ...patch }));
  // "מי עוד יכול לעזור" — 250ms אחרי ההקלדה (relSense במקור)
  useEffect(() => {
    const t = setTimeout(() => setRelText(f.text), 250);
    return () => clearTimeout(t);
  }, [f.text]);
  const rel = f.job ? null : relatedFor(relText, listings);
  const relShown = rel && rel.items.some((x) => x.who.length) ? rel : null;
  const matchCat = posted || f.category;
  const n = matchCount(matchCat, listings);
  const contactPhone = (prefs?.contactPhone ?? '').trim();

  // פתיחה: מיקוד בטקסט (טיוטה מ"לא מצאתי" — בטלפון, כמו prefillBoard)
  useEffect(() => {
    const t = setTimeout(() => (props.draft?.text ? phoneRef.current : textRef.current)?.focus({ preventScroll: true }), 40);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- פעם אחת, בפתיחה
  }, []);

  function onText(text: string): void {
    const t = text.slice(0, 600);
    const patch: Partial<PrRequest> = { text: t };
    if (!catTouched) patch.category = suggestedCategory(t);
    // נושא רגיש ⇒ "בשקט" אוטומטית (quietSense), כל עוד לא נגעו בתיבה ולא הצעת-עבודה
    if (!quietTouched && !f.job) patch.quiet = !!sensitiveTopic(t);
    if (posted) setPosted('');
    set(patch);
  }

  function save(): void {
    if (!f.text.trim()) {
      textRef.current?.focus();
      return;
    }
    const res = upsertPrRequest({ ...f, job: f.quiet ? false : f.job });
    if (!res.ok || !res.request) return;
    if (base) {
      props.toast('ה' + word + ' עודכנה');
      props.onClose();
      return;
    }
    props.toast(res.request.quiet ? 'ה' + word + ' נשלחה בשקט, רק לבעלי המקצוע' : 'ה' + word + ' פורסמה בלוח');
    // המקור: הטופס מתאפס ונשאר פתוח, ושורת-ההתאמה מספרת מי כבר באלפון
    setPosted(res.request.category);
    setF(emptyPrRequest());
    setRelText('');
    setCatTouched(false);
    setQuietTouched(false);
  }

  return (
    <form
      className="pn-f pn-reqForm"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="pn-fl">
        <span>{base ? 'עריכת ה' + word + ' · מה מחפשים?' : 'מה אתם מחפשים?'}</span>
        <textarea
          ref={textRef}
          required
          maxLength={600}
          placeholder="למשל: מחפש מלמד פרטי לגמרא לבן כיתה ז׳, פעמיים בשבוע בערב"
          value={f.text}
          onChange={(e) => onText(e.target.value)}
        />
      </label>
      <div className="pn-grid2">
        <label className="pn-fl">
          <span>תחום</span>
          <select
            value={f.category}
            onChange={(e) => {
              setCatTouched(true);
              if (posted) setPosted('');
              set({ category: e.target.value });
            }}
          >
            <option value="">לא משנה</option>
            {PR_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="pn-fl">
          <span>
            טלפון לחזרה <small>{f.quiet ? '(רשות · נשמר אצל ה' + gabbai + ' בלבד)' : '(רשות)'}</small>
          </span>
          <input ref={phoneRef} type="tel" inputMode="tel" maxLength={20} value={f.requester.phone} onChange={(e) => set({ requester: { ...f.requester, phone: e.target.value } })} />
        </label>
        <label className="pn-fl">
          <span>
            שם הפונה <small>{f.quiet ? '(רשות · נשמר אצל ה' + gabbai + ' בלבד)' : '(רשות)'}</small>
          </span>
          <input type="text" maxLength={60} value={f.requester.name} onChange={(e) => set({ requester: { ...f.requester, name: e.target.value } })} />
        </label>
        <label className="pn-fl">
          <span>
            אזור <small>(רשות)</small>
          </span>
          <input type="text" maxLength={60} placeholder="בני ברק" value={f.area} onChange={(e) => set({ area: e.target.value })} />
        </label>
      </div>
      {relShown ? (
        <div className="pn-rel-wrap" role="status" aria-live="polite">
          <div className="pn-rel">
            <div className="pn-rel-h">
              <Ic n="spark" />
              <span>
                <b>מי עוד יכול לעזור לך</b>
                <small>{relShown.k + ': מי שמחפש את זה צריך בדרך כלל גם'}</small>
              </span>
            </div>
            <div className="pn-rel-l">
              {relShown.items.map((x) =>
                x.who.length ? (
                  x.who.map((e) => (
                    <button key={x.l + e.id} className="pn-rel-c" type="button" disabled={!props.onOpenListing} onClick={() => props.onOpenListing?.(e.id)}>
                      <small>{x.l}</small>
                      <b>{e.name}</b>
                    </button>
                  ))
                ) : (
                  <span key={x.l} className="pn-rel-c pn-miss">
                    <small>{x.l}</small>
                    <b>עוד לא באלפון</b>
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      ) : null}
      {n ? (
        <div className={cx('pn-rq-match', posted && 'pn-posted')} role="status" aria-live="polite">
          <span className="pn-rm-ic">
            <Ic n="search" />
          </span>
          <span className="pn-rm-tx">
            <b>{(posted ? 'ה' + word + ' פורסמה. בינתיים, ' : '') + 'באלפון יש ' + (n === 1 ? 'בעל מקצוע אחד' : n + ' בעלי מקצוע') + ' ב' + categoryOf(matchCat).name}</b>
            <small>{posted ? 'אפשר כבר לפנות אליהם ישירות' : 'אולי מישהו מהם מתאים, עוד לפני שמפרסמים'}</small>
          </span>
          {props.onSeeCat ? (
            <button className="pn-btn pn-ghost2" type="button" onClick={() => props.onSeeCat?.(matchCat)}>
              לראות אותם
              <Ic n="chev" />
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="pn-checks">
        <label>
          <input type="checkbox" checked={f.urgent} onChange={(e) => set({ urgent: e.target.checked })} /> דחוף (צריך היום)
        </label>
        <label className="pn-qchk">
          <input
            type="checkbox"
            checked={f.quiet}
            onChange={(e) => {
              setQuietTouched(true);
              set({ quiet: e.target.checked, job: e.target.checked ? false : f.job });
            }}
          />{' '}
          בשקט (לא בלוח, בלי השם)
        </label>
        <label>
          <input type="checkbox" checked={f.job} onChange={(e) => set({ job: e.target.checked, quiet: e.target.checked ? false : f.quiet })} /> זו הצעת עבודה (מחפשים עובד)
        </label>
      </div>
      {f.quiet ? (
        <p className="pn-quiet-hint" role="status" aria-live="polite">
          <Ic n="shield" />
          <span>
            <b>{sens ? 'זיהינו נושא רגיש (' + sens + ').' : word + ' בשקט.'}</b> אף אחד לא יודע מי שלח: בלי שם ובלי טלפון. בעלי מקצוע בתחום ישלחו לך תשובות, ואתה תחליט למי לפנות.
          </span>
        </p>
      ) : null}
      {f.job ? (
        <p className="pn-note" style={{ marginTop: -6 }}>
          {'רוצים שהמשרה תופיע ראשונה בלוח, במסגרת זהב? משרה מקודמת: '}
          <b>{nis(priceOf(prefs, 'job'))}</b>
          {'. אחרי הפרסום פנו ל' + gabbai}
          {contactPhone ? (
            <>
              {' בטלפון '}
              <span className="pn-ltr">{contactPhone}</span>
            </>
          ) : null}
          .
        </p>
      ) : null}
      <div className="pn-actions">
        <button className="pn-btn pn-primary pn-reqSubmit" type="submit">
          <Ic n="send" />
          {base ? 'שמירת ה' + word : f.quiet ? 'שליחה בשקט' : 'פרסום בלוח'}
        </button>
        <button className="pn-btn" type="button" onClick={props.onClose}>
          סגירה
        </button>
      </div>
    </form>
  );
}
