/**
 * 🔗 מודאל מנוי-היומן החי (הרחבת gcal, 9.8) — פותחים, המערכת מפרסמת/מרעננת
 * את הפיד לענן, ומקבלים כתובת-מנוי להדבקה ביומן-גוגל ("מכתובת URL") —
 * מאז היומן מתעדכן לבד. ההגשה עצמה דרך פונקציית icsFeed בשרת; עד שהשרת
 * פרוס — הקישור נשמר אך יחזיר 404 (מוסבר במסך).
 */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { buildIcs } from '../../lib/ics';
import { icsFeedUrl, publishIcsFeed } from '../../lib/icsFeed';
import { Btn, Modal, TextInput } from '../ui';
import { icsWindowEvents, isoOf } from './calLib';

export function IcsFeedModal({ onClose }: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(true);
  // מגן-דאבל-טאפ (מוסכמת UX-SIMPLE) להחלפת-הקישור ההרסנית
  const [rotateArmed, setRotateArmed] = useState(false);
  const armedAt = useRef(0);

  const slug = config.slug || 'default';
  const projectId = config.firebase?.projectId ?? '';

  async function publish(rotate: boolean) {
    setBusy(true);
    setErr('');
    try {
      const ics = buildIcs(
        icsWindowEvents(db, isoOf(new Date()), 385, slug, config),
        config.orgName || 'לוח הארגון',
        new Date(),
      );
      const token = await publishIcsFeed(slug, ics, { rotate });
      setUrl(icsFeedUrl(projectId, slug, token));
      if (rotate) toast('🔗 הופק קישור חדש — הקישור הקודם בוטל');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'הפרסום נכשל — בדקו חיבור ונסו שוב');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // פתיחת המודאל = פרסום/רענון הפיד — הקישור שמוצג תמיד טרי
    void publish(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast('📋 הקישור הועתק');
    } catch {
      toast('⚠ ההעתקה נחסמה — סמנו את הכתובת והעתיקו ידנית');
    }
  }

  return (
    <Modal title="🔗 מנוי-יומן חי" onClose={onClose}>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 0 }}>
        מדביקים את הכתובת פעם אחת ביומן — ומאז הוא מתעדכן לבד (גוגל מרענן
        כל כמה שעות). כולל שנה קדימה: אירועים, יארצייטים, ימי-נישואין וימי-הולדת.
      </p>
      {busy ? (
        <div className="empty">מפרסם את הלוח…</div>
      ) : err ? (
        <div role="alert" style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <TextInput value={url} onChange={() => undefined} dir="ltr" />
            </div>
            <Btn onClick={() => void copy()}>📋 העתקה</Btn>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', lineHeight: 1.7, marginTop: 10 }}>
            <b>הוספה ליומן-גוגל (מחשב):</b> הגדרות ← הוספת יומן ← מכתובת URL ← הדבקה.
            <br />
            <b>אאוטלוק:</b> הוספת יומן ← הרשמה מהאינטרנט. <b>אייפון:</b> הגדרות ← יומן ← חשבונות ← מנוי ליומן.
            <br />
            הקישור סודי — מי שמחזיק בו רואה את הלוח. להחלפתו:
          </div>
          <div className="modal-actions">
            <Btn
              kind={rotateArmed ? 'danger' : 'plain'}
              onClick={() => {
                if (!rotateArmed) {
                  setRotateArmed(true);
                  armedAt.current = Date.now();
                  return;
                }
                if (Date.now() - armedAt.current < 400) return; // מגן-דאבל-טאפ
                setRotateArmed(false);
                void publish(true);
              }}
              disabled={busy}
            >
              {rotateArmed ? 'לחצו שוב להחלפה (מבטל את הישן)' : '♻️ החלפת קישור'}
            </Btn>
            <Btn onClick={onClose}>סגירה</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}
