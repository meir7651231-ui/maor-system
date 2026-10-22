/**
 * קישור לקובץ שמור (data: של מסמך/תמונה, או קישור https) — נעול בדמו.
 *
 * למה רכיב (22.10.2026, נעילת-הדמו): בכרטיס-החוג «📎 קבצים מצורפים» היה קישור גולמי לקובץ-השמור
 * (file.data) — מבקר בדמו פתח/שמר את הקובץ. onClick לבד לא מספיק: לחיצה-אמצעית ו«שמירת קישור בשם»
 * עוקפים אותו. לכן בדמו (demoLocked — מנעול-הדמו, lib/exportGate) אין href בכלל, והקשה/Enter מציגים את
 * הודעת-הדמו (guardDemo).
 *
 * מחוץ לדמו — אותו `<a href target="_blank" rel>` בדיוק כמו קודם, עם ה-onClick של הקורא (אם יש) ותו לא:
 * ביקורת 22.10 — גם עובד/ת שהמנהל חסם לה ייצוא (core.export) רואה את הקישור כמו לפני נעילת-הדמו
 * (בכרטיס-החוג פתוח; בטופס-החוג — ה-guardExport שהיה שם, מועבר כ-onClick). מצב-הדמו נקבע ב-App לפני
 * שאפשר לפתוח כרטיס-חוג/טופס (אלה נפתחים בפעולת-משתמש), ולכן קריאתו ברינדור יציבה.
 */
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { demoLocked, guardDemo } from '../lib/exportGate';

export function ExportLink(props: {
  href: string;
  style?: CSSProperties;
  title?: string;
  /** מחוץ לדמו בלבד — ה-onClick ההיסטורי של הקורא (CourseFilesField: שער core.export). */
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  if (!demoLocked()) {
    return (
      <a href={props.href} target="_blank" rel="noopener noreferrer" title={props.title} onClick={props.onClick} style={props.style}>
        {props.children}
      </a>
    );
  }
  return (
    <a
      role="link"
      tabIndex={0}
      title={props.title}
      style={{ cursor: 'pointer', ...props.style }}
      onClick={(e) => {
        e.preventDefault();
        guardDemo(); // בדמו ⇒ הודעת-הדמו
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        guardDemo();
      }}
    >
      {props.children}
    </a>
  );
}
