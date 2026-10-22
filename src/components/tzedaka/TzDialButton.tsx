/**
 * 📞 כפתור פתיחת חייגן-הקופות (22.10) — אותו מסלול בכל מקום: רשימת-קופות ⇒ tzDialerStart ⇒ TzDialerModal.
 * כשיש חייגן פעיל — "המשך" (לא פותח חדש מעליו). מגודר טלפוניה + tzedaka.dialer, כמו חייגן-התורמים.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, telephonyOn } from '../../lib/config';
import { Btn } from '../ui';
import { TzDialerModal } from './TzDialerModal';

export function TzDialButton(props: { boxIds: string[]; name: string; sm?: boolean }) {
  const config = useApp((s) => s.config);
  const dialer = useApp((s) => s.db.ui.tzDialer);
  const start = useApp((s) => s.tzDialerStart);
  const toast = useApp((s) => s.toast);
  const [open, setOpen] = useState(false);
  if (!telephonyOn(config) || !featureOn(config, 'tzedaka.dialer')) return null;
  return (
    <>
      <Btn
        sm={props.sm}
        title="חייגן-מונחה: עוברים על הקופות, מחייגים למשפחה בלחיצה, מסמנים מה יצא מהשיחה"
        onClick={() => {
          if (!dialer) {
            if (!props.boxIds.length) {
              toast('אין קופות לחייג אליהן ברשימה הזו');
              return;
            }
            if (!start(props.boxIds, props.name)) return; // ה-store כבר הסביר למה
          }
          setOpen(true);
        }}
      >
        {dialer ? '📞 המשך חייגן (' + dialer.queue.length + ')' : '📞 חייגן'}
      </Btn>
      {open && <TzDialerModal onClose={() => setOpen(false)} />}
    </>
  );
}
