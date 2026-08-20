/**
 * 📥 יומן קליטות המלאי (SHOP6 חנות 25) — כל קנייה/תרומה-בעין שנרשמה דרך
 * חידוש-המלאי. תצוגה + סה"כ עלויות (intakeLog הטהור); מחיקת קליטה (useArmed)
 * מחזירה את המלאי קטום ב-0 — יומן, לא סדרת מס. source = טקסט חופשי (בידוד —
 * בלי קישור לתורמים).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { Btn } from '../ui';
import { useArmed } from '../useArmed';
import { intakeLog } from './lib';
import { isoToday } from '../../lib/date-util';

export function IntakePanel() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const deleteShopIntake = useApp((s) => s.deleteShopIntake);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [open, setOpen] = useState(false);
  const { rows, totalCost } = intakeLog(db);

  if (db.shopIntakes.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, padding: 0 }}
        aria-expanded={open}
      >
        {(open ? '▼' : '◀') + ' 📥 יומן קליטות (' + rows.length + ') · סה"כ עלויות ' + totalCost.toLocaleString('he-IL') + ' ₪'}
      </button>
      {open && (
        <div style={{ marginTop: 10, overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'right', color: 'var(--ink-faint)' }}>
                <th style={{ padding: '4px 6px' }}>תאריך</th>
                <th style={{ padding: '4px 6px' }}>פריט</th>
                <th style={{ padding: '4px 6px' }}>כמות</th>
                <th style={{ padding: '4px 6px' }}>סוג</th>
                <th style={{ padding: '4px 6px' }}>מקור</th>
                <th style={{ padding: '4px 6px' }}>עלות</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ intake, itemName }) => (
                <tr key={intake.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '4px 6px' }}>{intake.date}</td>
                  <td style={{ padding: '4px 6px', fontWeight: 700 }}>
                    {itemName}
                    {intake.expiry && (
                      <span style={{ marginInlineStart: 6, fontSize: 11, fontWeight: 700, color: intake.expiry < isoToday() ? '#dc2626' : '#d97706' }}>
                        ⏳ {intake.expiry < isoToday() ? 'פג ' : 'עד '}{intake.expiry}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '4px 6px' }}>{intake.qty}</td>
                  <td style={{ padding: '4px 6px' }}>{intake.kind === 'donation' ? '🎗 תרומה בעין' : '🛒 קנייה'}</td>
                  <td style={{ padding: '4px 6px' }}>{intake.source || '—'}</td>
                  <td style={{ padding: '4px 6px' }}>{intake.cost ? intake.cost.toLocaleString('he-IL') + ' ₪' : '—'}</td>
                  <td style={{ padding: '4px 6px' }}>
                    {featureOn(config, 'shop.intake.delete') && (
                      <Btn
                        sm
                        kind="danger"
                        onClick={() => {
                          if (!confirmTwice('shn-' + intake.id, 'למחוק את הקליטה? המלאי יוחזר בהתאם (קטום ב-0)')) return;
                          deleteShopIntake(intake.id);
                          toast('הקליטה נמחקה והמלאי הוחזר');
                        }}
                      >
                        {armed === 'shn-' + intake.id ? 'שוב למחיקה' : '🗑'}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
