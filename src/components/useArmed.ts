/**
 * מחיקה מדורגת בשני קליקים (P3 פריט 19; לגאסי armDel) — אותו רעיון כמו
 * punchConfirm: לחיצה ראשונה "חומשת" ל-3.5 שניות, שנייה בתוך החלון מבצעת.
 * feature shell.armdel: חסר/true = הדפוס פעיל; false = window.confirm
 * (ההתנהגות הקודמת של ה-React, ליתר ביטחון).
 */
import { useEffect, useRef, useState } from 'react';

/** חלון החימוש — כמו armDel בלגאסי. */
export const ARM_DEL_MS = 3500;

export function useArmed(enabled: boolean) {
  const [armed, setArmed] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /**
   * true = מותר לבצע (לחיצה שנייה בחלון, או אישור confirm כשהדגל כבוי);
   * false = הלחיצה הראשונה — חומשת ופוקעת אחרי 3.5ש׳.
   */
  function confirmTwice(key: string, fallbackMsg: string): boolean {
    if (!enabled) return window.confirm(fallbackMsg);
    if (armed === key) {
      if (timer.current) clearTimeout(timer.current);
      setArmed(null);
      return true;
    }
    setArmed(key);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(null), ARM_DEL_MS);
    return false;
  }

  return { armed, confirmTwice };
}
