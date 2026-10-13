/**
 * 📒 פרנסה׳לע — "בקשות בתחום" של עסק (renderMeReqs/availBtn/qReplyUI של המקור), משותף לדף-העסק ול"העסק שלי":
 * הבקשות הפתוחות שמנותבות לעסק (requestsForListing — התצוגה המוגנת: בקשה בשקט בלי שם/טלפון), דחופות ראשונות.
 * "אני זמין" (בשקט: "שליחת תשובה") רושם תשובה בשם העסק — המבקש/ת רואה אותה; כבר ענה ⇒ "סימנת שאתה זמין"
 * (בשקט: "שלחת תשובה."). הגבאי עונה בשם העסק ובהסכמתו — ולכן החלון דרך המודאל של אורביט.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Btn, Field, Modal } from '../ui';
import type { PrListing, PrRequest } from '../../types/domain';
import { inMinsText, requestsForListing, routeRequest, type PrRequestView } from './lib';
import { agoText } from './labels';
import { cx, Ic, OrbitLayer } from './skin';

export interface PnTradeRow extends PrRequestView {
  /** העסק כבר ענה (availBtn "done" של המקור). */
  done: boolean;
  /** עוד כמה זמן הבקשה רק אצל העסקים (לפני שעוברת לקהילה); 0 = לא רלוונטי. */
  bizLeftMs: number;
}

/** הבקשות שהעסק מקבל, עם "כבר ענה" (בלי זהות-מבקש בבקשה שקטה — businessView). */
export function inTradeOf(l: PrListing, requests: readonly PrRequest[], listings: readonly PrListing[], nowMs: number): PnTradeRow[] {
  const byId = new Map(requests.map((r) => [r.id, r]));
  return requestsForListing(l, requests, listings, nowMs).map((v) => {
    const r = byId.get(v.id);
    const done = !!r && Array.isArray(r.responses) && r.responses.some((x) => x.listingId === l.id);
    const route = r ? routeRequest(r, listings, nowMs) : null;
    return { ...v, done, bizLeftMs: route && route.stage === 'biz' && !v.quiet && !v.responseCount ? route.msLeft : 0 };
  });
}

export function TradeRows(props: { rows: readonly PnTradeRow[]; nowMs: number; onRespond: (id: string, quiet: boolean) => void }) {
  return (
    <div className="pn-rqs">
      {props.rows.map((v) => (
        <div key={v.id} className={cx('pn-rq', v.urgent && 'pn-urgent')}>
          <div className="pn-rq-tx">
            {v.urgent ? (
              <span className="pn-badge pn-urg">
                <i />
                דחוף
              </span>
            ) : null}
            <p style={{ whiteSpace: 'pre-line' }}>{v.text}</p>
            <span className="pn-rq-m">
              {agoText(v.createdAt, props.nowMs)}
              {v.quiet ? (
                <>
                  {' · '}
                  <b className="pn-q-m">
                    <Ic n="shield" />
                    בשקט, לא יודעים מי ביקש
                  </b>
                </>
              ) : (
                <>
                  {v.bizLeftMs > 0 ? ' · עוד ' + inMinsText(v.bizLeftMs) + ' רק אצל העסקים' : null}
                  {v.contact && (v.contact.name || v.contact.phone) ? (
                    <>
                      {' · ' + v.contact.name + ' '}
                      <bdi dir="ltr">{v.contact.phone}</bdi>
                    </>
                  ) : null}
                </>
              )}
            </span>
          </div>
          {v.done ? (
            v.quiet ? (
              <div className="pn-qr-sent">
                <Ic n="check" />
                <span>
                  <b>שלחת תשובה.</b> אתה לא יודע מי ביקש. אם התשובה מתאימה לו, הוא יפנה אליך.
                </span>
              </div>
            ) : (
              <span className="pn-rq-done">
                <Ic n="check" />
                סימנת שאתה זמין
              </span>
            )
          ) : (
            <button className="pn-rq-b pn-bd" type="button" data-act="imAvail" onClick={() => props.onRespond(v.id, v.quiet)}>
              <Ic n={v.quiet ? 'send' : 'hand'} />
              {v.quiet ? 'שליחת תשובה' : 'אני זמין'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** "אני זמין" / "שליחת תשובה" — תשובה בשם העסק (בשקט: תשובה כתובה חובה). */
export function RespondModal(props: { l: PrListing; target: { id: string; quiet: boolean }; toast: (m: string) => void; onClose: () => void }) {
  const config = useApp((s) => s.config);
  const addPrResponse = useApp((s) => s.addPrResponse);
  const [text, setText] = useState('');
  const { l, target } = props;
  const word = termOf(config, 'entity.prListing', 'עסק');
  function send(): void {
    if (target.quiet && !text.trim()) return props.toast('לבקשה בשקט — כתבו תשובה (המבקש יראה אותה, ואתם לא תדעו מי הוא)');
    if (addPrResponse(target.id, { listingId: l.id, text: text.trim() || 'זמין' })) {
      props.toast(target.quiet ? 'שלחת תשובה. אתה לא יודע מי ביקש…' : 'נרשם שה' + word + ' זמין/ה');
      props.onClose();
    }
  }
  return (
    <OrbitLayer>
      <Modal title={target.quiet ? 'שליחת תשובה (בשקט)' : '✋ סימון זמין'} onClose={props.onClose}>
        {target.quiet ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>המבקש יראה את התשובה ואת הדף שלך. אתה לא תדע מי הוא, עד שהוא יבחר לפנות.</div>
        ) : null}
        <Field label={target.quiet ? 'התשובה *' : 'הערה (רשות)'}>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            placeholder={target.quiet ? 'למשל: אני מטפלת רגשית מוסמכת, מקבלת בבית, הפגישה הראשונה בחינם. אפשר להתקשר בכל ערב.' : 'זמין מחר בבוקר'}
          />
        </Field>
        <div className="modal-actions">
          <Btn kind="primary" onClick={send}>
            שליחה
          </Btn>
          <Btn onClick={props.onClose}>ביטול</Btn>
        </div>
      </Modal>
    </OrbitLayer>
  );
}
