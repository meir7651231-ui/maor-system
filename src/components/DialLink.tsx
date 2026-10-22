/**
 * 🔒 קישור-חיוג (tel:) שעובר בנעילת-הדמו (ביקורת 22.10.2026).
 *
 * הדרישה: «בדמו זה צריך חסום ללא כל אפשרות להורדת מידע». WaBtn כבר נוטרל בדמו כי קישור-וואטסאפ
 * מוציא את הרשומה החוצה (גם בלי טקסט ממולא) — `tel:` הוא אותו ערוץ בלי הטקסט: מספר-הטלפון של
 * הרשומה עובר לאפליקציה חיצונית (חייגן/FaceTime/Skype). לכן בדמו אין href; הקשה/Enter מציגים את
 * הודעת-השער («בדמו אי אפשר…» — guardExport חסום תמיד בדמו).
 *
 * locked=false (כל מקום מחוץ לדמו) ⇒ אותו `<a href="tel:…">` בדיוק כמו קודם — הלקוח-החי ביט-זהה
 * (הקורא מחשב locked פעם אחת דרך isDemoSession(config); בטבלת-התורמים — פעם לרינדור, לא פר-שורה).
 */
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { guardExport } from '../lib/exportGate';

export function DialLink(props: {
  href: string;
  locked: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
  style?: CSSProperties;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  if (!props.locked) {
    return (
      <a className={props.className} href={props.href} title={props.title} aria-label={props.ariaLabel} style={props.style} onClick={props.onClick}>
        {props.children}
      </a>
    );
  }
  return (
    <a
      className={props.className}
      role="link"
      tabIndex={0}
      title={props.title}
      aria-label={props.ariaLabel}
      style={{ cursor: 'pointer', ...props.style }}
      onClick={(e) => {
        e.preventDefault();
        props.onClick?.(e);
        guardExport(); // חסום בדמו ⇒ הודעת-הדמו
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        guardExport();
      }}
    >
      {props.children}
    </a>
  );
}
