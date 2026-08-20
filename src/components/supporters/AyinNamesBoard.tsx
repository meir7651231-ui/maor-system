/**
 * 📋 מסך השמות המלא (20.8, בקשת-בעלים "מה עם המסך טיפול") — משלים את לוח-הטיפול:
 * הלוח הקיים (AyinBoard) הוא תור פר-תומכ/ת; כאן הרשימה המלאה **פר-שם** מכל
 * הכרטיסים — אותם נתונים בדיוק כמו דוח-השמות (ayinAllRows) שהיה עד היום
 * CSV-להורדה בלבד, כטבלה חיה: חיפוש, סינון סטטוס/שלב, ולחיצה על שורה ⇒
 * כרטיס-התומכ/ת (שם עורכים). קריאה-בלבד במכוון — מקור-אמת יחיד, כמו בחייגן.
 */
import { useMemo, useState } from 'react';
import type { Supporter, AyinStage } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { Btn, Chip, Empty, Modal } from '../ui';
import {
  AYIN_STAGES,
  ayinBoardItems,
  featLabel,
  filterAyinBoard,
  itemLabel,
  stageLabel,
  unitLabel,
} from '../../lib/ayin';

export function AyinNamesBoard(props: {
  config: OrgConfig;
  /** התומכים הגלויים לעובד/ת — כבר מסוננים להרשאת-הייעוד (כמו namesReport). */
  supporters: Supporter[];
  onClose: () => void;
  /** לחיצה על שורה — פותחת את כרטיס-התומכ/ת (שם מטפלים ועורכים). */
  onOpenSupporter: (id: string) => void;
  /** ⬇ CSV — אותו דוח-מנהל קיים (namesReport); null = בלי כפתור (לא-מנהל). */
  onCsv: (() => void) | null;
}) {
  const { config, supporters } = props;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<null | 'wait' | 'done'>(null);
  const [stageF, setStageF] = useState<AyinStage | null>(null);
  const items = useMemo(() => ayinBoardItems(supporters), [supporters]);
  const shown = filterAyinBoard(items, q, status, stageF);
  const waitCount = items.filter((it) => !it.done).length;
  const unit = unitLabel(config);
  const eyesSum = shown.reduce((t, it) => t + (+it.eyes || 0), 0);
  const stagesInUse = AYIN_STAGES.filter((s) => items.some((it) => it.stage === s));
  return (
    <Modal title={'📋 ' + featLabel(config) + ' — הרשימה המלאה'} onClose={props.onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            placeholder={'חיפוש — תומכ/ת, ' + itemLabel(config) + ' או הערה…'}
            aria-label={'חיפוש ב' + featLabel(config)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <Chip on={status === 'wait'} onClick={() => setStatus(status === 'wait' ? null : 'wait')}>
            {'ממתין · ' + waitCount}
          </Chip>
          <Chip on={status === 'done'} onClick={() => setStatus(status === 'done' ? null : 'done')}>
            {'טופל ✓ · ' + (items.length - waitCount)}
          </Chip>
        </div>
        {stagesInUse.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>שלב:</span>
            {stagesInUse.map((s) => (
              <Chip key={s} on={stageF === s} onClick={() => setStageF(stageF === s ? null : s)}>
                {stageLabel(config, s) + ' · ' + items.filter((it) => it.stage === s).length}
              </Chip>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          {(shown.length === items.length ? String(items.length) : shown.length + ' מתוך ' + items.length) +
            ' ' + itemLabel(config) + (eyesSum > 0 ? ' · סה"כ ' + unit + ': ' + eyesSum.toLocaleString('he-IL') : '')}
        </div>
        {items.length === 0 ? (
          <Empty>עדיין אין {itemLabel(config)} בכרטיסים — מוסיפים בכרטיס-התומכ/ת או בחייגן</Empty>
        ) : shown.length === 0 ? (
          <Empty>אין תוצאות לחיפוש/סינון</Empty>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>תורם/ת</th>
                  <th>טלפון</th>
                  <th>{itemLabel(config)}</th>
                  <th>{unit}</th>
                  <th>הערה</th>
                  <th>סטטוס</th>
                  <th>שלב</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((it, i) => (
                  <tr
                    key={it.supporterId + ':' + it.name + ':' + i}
                    onClick={() => props.onOpenSupporter(it.supporterId)}
                    style={{ cursor: 'pointer' }}
                    title={'לכרטיס ' + it.supporter + ' — שם מטפלים ועורכים'}
                  >
                    <td style={{ fontWeight: 600 }}>{it.supporter}</td>
                    <td dir="ltr">{it.phone}</td>
                    <td>{it.name}</td>
                    <td>{it.eyes === '' ? '—' : it.eyes}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.note}</td>
                    <td>{it.done ? 'טופל ✓' : 'ממתין'}</td>
                    <td>{stageLabel(config, it.stage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {props.onCsv && (
            <Btn onClick={props.onCsv} title="אותו דוח-שמות מלא — קובץ CSV">
              ⬇ ייצוא CSV
            </Btn>
          )}
          <Btn onClick={props.onClose}>סגירה</Btn>
        </div>
      </div>
    </Modal>
  );
}
