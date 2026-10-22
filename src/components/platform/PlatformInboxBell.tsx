/**
 * 🔔 התראה חיה על הרשמות ולידים (22.10 — "ברגע שאדם נרשם אני מקבל הודעה גם
 * באתר"). למיילי-על בלבד (ה-caller מגדר). onSnapshot על platformRequests +
 * platformLeads; פריט שלא נראה קודם ⇒ טוסט + צליל קצר + התראת-מערכת (אם הותרה).
 * גלולה צפה "🔔 N חדשים" ⇒ פותחת את לוח-הבקרה ומסמנת כנצפה. פתיחת הלוח (open)
 * מסמנת הכול כנצפה. "נצפה" = חותמת-at אחרונה, מקומית-למכשיר.
 */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { countNewSince, latestAt } from '../../lib/signupNotify';

const SEEN_KEY = 'orbit_inbox_seen';
type Item = { at?: string; key: string; label: string };

function readSeen(): string {
  try {
    return localStorage.getItem(SEEN_KEY) || '';
  } catch {
    return '';
  }
}
function writeSeen(at: string) {
  try {
    if (at) localStorage.setItem(SEEN_KEY, at);
  } catch {
    /* חסום — הגלולה פשוט תחזור ברענון */
  }
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.35);
    o.onended = () => void ctx.close();
  } catch {
    /* דפדפן חוסם צליל בלי מחווה — הטוסט מספיק */
  }
}

export function PlatformInboxBell({ open }: { open: boolean }) {
  const toast = useApp((s) => s.toast);
  const [items, setItems] = useState<Item[]>([]);
  const [seen, setSeen] = useState(readSeen);
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    let off: (() => void) | null = null;
    let alive = true;
    void import('../../store/cloudSync').then((m) => {
      if (!alive) return;
      off = m.watchPlatformInbox(({ requests, leads }) => {
        const next: Item[] = [
          ...requests.map((r) => ({ at: r.at, key: 'r:' + r.uid, label: '🪐 הרשמה חדשה: ' + (r.orgName || r.contactName || r.email || '') })),
          ...leads.map((l) => ({ at: l.at, key: 'l:' + l.id, label: '📞 ליד חדש: ' + (l.contactName || '') + (l.phone ? ' · ' + l.phone : '') })),
        ];
        // הצילום הראשון = מצב קיים (בלי טוסטים); אחריו כל מפתח חדש מתריע
        if (known.current) {
          const fresh = next.filter((x) => !known.current!.has(x.key));
          if (fresh.length) {
            fresh.forEach((x) => toast(x.label));
            beep();
            try {
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('אורביט', { body: fresh.map((x) => x.label).join('\n') });
              }
            } catch {
              /* התראת-מערכת אופציונלית */
            }
          }
        }
        known.current = new Set(next.map((x) => x.key));
        setItems(next);
      });
    });
    return () => {
      alive = false;
      off?.();
    };
  }, [toast]);

  // לוח-הבקרה פתוח ⇒ הכול נצפה
  useEffect(() => {
    if (!open) return;
    const at = latestAt(items);
    if (at && at > seen) {
      writeSeen(at);
      setSeen(at);
    }
  }, [open, items, seen]);

  const n = countNewSince(items, seen);
  if (open || n === 0) return null;
  return (
    <button
      type="button"
      onClick={() => {
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'default') void Notification.requestPermission();
        } catch {
          /* לא נתמך */
        }
        window.location.hash = '#platform';
      }}
      aria-label={n + ' פניות חדשות — פתיחת לוח הבקרה'}
      style={{
        position: 'fixed',
        insetInlineStart: 16,
        bottom: 88,
        zIndex: 250,
        background: '#25D366',
        color: '#06301a',
        border: 'none',
        borderRadius: 999,
        padding: '10px 16px',
        fontWeight: 800,
        fontSize: 14,
        boxShadow: '0 6px 20px rgba(0,0,0,.25)',
        cursor: 'pointer',
      }}
    >
      🔔 {n} {n === 1 ? 'פנייה חדשה' : 'פניות חדשות'}
    </button>
  );
}
