/**
 * 💰 מרכז-גבייה (פאזה 5) — "כל החייבים" חוצה-חוגים במסך-אחד: תזכורת-WhatsApp +
 * קישור-תשלום (כשמוגדר) + ייצוא. נגזרת טהורה (collection.ts). אפס-נגיעה-בקבלות.
 */
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting } from '../../lib/config';
import { payLink } from '../../lib/payLink';
import { Btn, Empty, Modal } from '../ui';
import { WaBtn } from '../WaBtn';
import { downloadCsv } from '../../lib/csvx';
import { collectionCsvRows, collectionList, collectionMessage, collectionTotal } from './collection';
import { isoToday } from './lib';

export function CollectionCenter(props: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);

  const rows = collectionList(db);
  const total = collectionTotal(rows);
  const waOn = integrationOn(config, 'whatsapp');
  const payUrl = integrationOn(config, 'payments') ? integrationSetting(config, 'payments', 'payUrl') || '' : '';
  const exportOn = featureOn(config, 'core.export');
  const orgName = config.orgName || db.orgName || '';

  return (
    <Modal title="💰 מרכז גבייה — כל החייבים" onClose={props.onClose} wide>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c' }}>סה"כ חוב פתוח: ₪{total.toLocaleString('he-IL')}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{rows.length} חייבים</span>
        <div style={{ flex: 1 }} />
        {exportOn && rows.length > 0 && (
          <>
            <Btn sm onClick={() => downloadCsv('collection-' + isoToday() + '.csv', collectionCsvRows(rows))} title="ייצוא רשימת-החייבים ל-CSV">
              ⬇ CSV
            </Btn>
            <Btn
              sm
              onClick={() => {
                void navigator.clipboard?.writeText(collectionCsvRows(rows).map((r) => r.join('\t')).join('\n'));
                toast('רשימת-החייבים הועתקה');
              }}
            >
              📋 העתקה
            </Btn>
          </>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty>אין יתרות-חוב פתוחות 🎉</Empty>
      ) : (
        rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                {r.courseName}
                {r.phone ? ' · ' + r.phone : ''}
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', whiteSpace: 'nowrap' }}>₪{r.bal.toLocaleString('he-IL')}</span>
            {waOn && r.phone && <WaBtn phone={r.phone} text={collectionMessage(r, orgName)} title="תזכורת-תשלום בוואטסאפ" />}
            {payUrl &&
              (() => {
                const href = payLink(payUrl, r.bal, r.name);
                return href ? (
                  <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', fontSize: 15 }} title="קישור-תשלום">
                    💳
                  </a>
                ) : null;
              })()}
          </div>
        ))
      )}

      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
        התזכורת/הקישור אינם מנפיקים קבלה — רק גבייה. הקבלה נרשמת בניהול-השיבוץ (⚙) לאחר התשלום.
      </div>
    </Modal>
  );
}
