/**
 * 📒 פרנסה׳לע — "המעטפת" כקבוצת-כוכבים (envHTML של המקור, עיצוב 3): העסק באמצע, שלוש טבעות של קהילה סביבו
 * (שותפים · לקוחות ועמיתים · מקצועי/שיווק/תפעול) ומקומות-פנויים; טבעת-זהב לפי האחוז; נגיעה במטבע ⇒ כרטיס
 * (לדף העסק / העתקת הזמנה). רק הגבאי רואה בדף-העסק; "המעטפת שלי" בהעסק שלי (עיצוב 4).
 */
import { useMemo, useState } from 'react';
import type { PrListing } from '../../types/domain';
import { categoryOf } from './lib';
import { envInvite, envLayout } from './envelope';
import { miniCoin } from './coins';
import { TRADE_COIN } from './home';
import { cx, Ic, RawHtml, vars } from './skin';

const clean = (s: string): string => String(s || '').replace(/\s*\(דוגמה\)/, '');

export function EnvMap(props: { b: PrListing; listings: readonly PrListing[]; brand: string; inSheet?: boolean; onOpen: (id: string) => void; onCopy: (text: string) => void }) {
  const { b } = props;
  const L = useMemo(() => envLayout(b, props.listings), [b, props.listings]);
  const [sel, setSel] = useState<number | null>(null);
  const C = 2 * Math.PI * 14.2;
  const n = sel === null ? null : L.nodes[sel];
  return (
    <>
      {props.inSheet ? null : (
        <div className="pn-hs">
          <h2>המעטפת שלי</h2>
          <span className="pn-hk">מי בקהילה עומד מאחוריכם, ולמי אתם עוזרים</span>
        </div>
      )}
      <div className="pn-ev-map" style={vars({ pct: L.pct })}>
        <svg className="pn-ev-lines" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="pn-ev-ring" cx="50" cy="50" r="22" />
          <circle className="pn-ev-ring" cx="50" cy="50" r="32.5" />
          <circle className="pn-ev-ring" cx="50" cy="50" r="41.5" />
          {L.nodes.map((x, i) => (
            <line key={i} className={cx('pn-r' + x.ri, x.m && 'pn-mi')} x1="50" y1="50" x2={x.x.toFixed(2)} y2={x.y.toFixed(2)} style={vars({ d: (0.15 + i * 0.05).toFixed(2) + 's' })} />
          ))}
          <circle className="pn-ev-gt" cx="50" cy="50" r="14.2" />
          <circle className="pn-ev-gv" cx="50" cy="50" r="14.2" style={{ strokeDasharray: ((C * L.pct) / 100).toFixed(2) + ' ' + C.toFixed(2) }} />
        </svg>
        <div className="pn-ev-mid">
          <b>{clean(b.name)}</b>
          <span className="pn-ev-pct">
            <b className="pn-ltr">{L.pct + '%'}</b> מעטפת
          </span>
        </div>
        {L.nodes.map((x, i) =>
          x.m ? (
            <button
              key={i}
              className={cx('pn-ev-n pn-ev-slot pn-r' + x.ri, sel === i && 'pn-sel')}
              type="button"
              style={{ left: x.x.toFixed(2) + '%', top: x.y.toFixed(2) + '%', ...vars({ d: (0.35 + i * 0.05).toFixed(2) + 's' }) }}
              aria-label={'מקום פנוי: ' + x.m.l}
              onClick={() => setSel(i)}
            >
              <span className="pn-ev-hole">+</span>
              <span className="pn-ev-l">{x.m.l}</span>
            </button>
          ) : x.e ? (
            <button
              key={i}
              className={cx('pn-ev-n pn-r' + x.ri, !L.near(x.e) && 'pn-far', sel === i && 'pn-sel')}
              type="button"
              style={{ left: x.x.toFixed(2) + '%', top: x.y.toFixed(2) + '%', ...vars({ d: (0.35 + i * 0.05).toFixed(2) + 's' }) }}
              aria-label={x.e.name + ': ' + (x.why || '')}
              onClick={() => setSel(i)}
            >
              <RawHtml html={miniCoin(TRADE_COIN[categoryOf(x.e.category).key] ?? 'other', 'gold')} />
              <span className="pn-ev-l">{clean(x.e.name)}</span>
            </button>
          ) : null,
        )}
      </div>
      <div className="pn-ev-legend">
        <span>
          <i className="pn-l0" />
          שותפים
        </span>
        <span>
          <i className="pn-l1" />
          לקוחות ועמיתים
        </span>
        <span>
          <i className="pn-l2" />
          מקצועי ושיווק
        </span>
        <span>
          <i className="pn-lm" />
          מקום פנוי
        </span>
      </div>
      <div className="pn-ev-sum">
        <span className="pn-ok">
          <i />
          {L.have + ' קשרים בקהילה'}
        </span>
        {L.miss ? (
          <span className="pn-no">
            <i />
            {L.miss + ' מקומות פנויים'}
          </span>
        ) : null}
      </div>
      <div className="pn-ev-card" hidden={!n}>
        {n?.m ? (
          <>
            <div className="pn-evc-h">
              <span className="pn-ev-hole pn-sm">+</span>
              <div>
                <b>{'מקום פנוי: ' + n.m.l}</b>
                <small>{n.m.why}</small>
              </div>
            </div>
            <p>{'אין עדיין ' + n.m.l + ' באלפון. מי שיצטרף יקבל מיד את כל העסקים בקהילה כלקוחות.'}</p>
            <div className="pn-evc-a">
              <button className="pn-btn pn-primary" type="button" onClick={() => props.onCopy(envInvite(n.m?.l ?? '', props.brand))}>
                <Ic n="copy" />
                העתקת הזמנה
              </button>
            </div>
          </>
        ) : n?.e ? (
          <>
            <div className="pn-evc-h">
              <RawHtml html={miniCoin(TRADE_COIN[categoryOf(n.e.category).key] ?? 'other', 'gold')} />
              <div>
                <b>{n.e.name}</b>
                <small>{(n.e.title || categoryOf(n.e.category).name) + (n.e.city ? ' · ' + n.e.city : '')}</small>
              </div>
            </div>
            <p>{n.why}</p>
            <div className="pn-evc-a">
              <button className="pn-btn pn-primary" type="button" onClick={() => n.e && props.onOpen(n.e.id)}>
                לדף העסק
                <Ic n="chev" />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
