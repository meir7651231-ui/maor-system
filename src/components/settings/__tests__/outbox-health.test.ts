/**
 * 📤 ratchet — בריאות תור-השליחות + חיווי-"ממתין" (ביקורת-האמון 24.8, לולאה 4).
 *
 * הבאגים: (א) ה-Functions כותבות status:'error' על כשל-SMS/מייל ואף מסך לא
 * קרא אותו — כשל-שליחה היה בלתי-נראה למנהל, ההודעה אבדה בשקט; (ב) בזמן
 * ה-debounce/דחיפה הסטטוס נשאר 'synced' — לא היה שום חיווי שיש שינויים
 * מקומיים שטרם הגיעו לענן.
 */
import { describe, expect, it } from 'vitest';
import cloudSrc from '../../../lib/cloud.ts?raw';
import syncSrc from '../../../store/cloudSync.ts?raw';
import sectionSrc from '../OutboxSection.tsx?raw';
import viewSrc from '../SettingsView.tsx?raw';
import appSrc from '../../../App.tsx?raw';

describe('📤 outbox-health — כשלי-שליחה גלויים', () => {
  it('שכבת-הענן: קריאת-כשלים + שליחה-חוזרת (pending + מחיקת error)', () => {
    expect(cloudSrc).toContain('export async function fetchOutboxIssues');
    expect(cloudSrc).toContain("where('status', '==', 'error')");
    expect(cloudSrc).toContain("{ status: 'pending', error: deleteField() }");
  });
  it('המסך רשום בהגדרות ומגודר ענן+מנהל (מחזיר null בלעדיהם)', () => {
    expect(viewSrc).toContain('<OutboxSection />');
    expect(sectionSrc).toContain('cloud.isManager || isSuperAdmin');
    expect(sectionSrc).toContain('if (!canSee) return null');
    // bundle-light: מודול-הענן נטען דינמית בלבד
    expect(sectionSrc).toContain("import('../../store/cloudSync')");
  });
});

describe("🔵 חיווי-'ממתין' — שינוי מקומי שטרם נדחף גלוי למשתמש", () => {
  it("cloudOnDbChange מעביר synced⇒pending; flush מחזיר ל-synced", () => {
    expect(syncSrc).toContain("'idle' | 'connecting' | 'pending' | 'synced' | 'error'");
    expect(syncSrc).toContain("if (statusCache === 'synced') setStat(hooks, 'pending')");
  });
  it('לנקודת-הסטטוס יש מצב pending בשלד', () => {
    expect(appSrc).toContain("pending: { color: '#5b8def'");
  });
});
