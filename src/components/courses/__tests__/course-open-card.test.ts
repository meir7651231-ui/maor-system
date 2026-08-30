/**
 * 👤 ratchet — כניסה-לכרטיס-התלמיד מתוך החוג (בקשת-בעלים 25.8).
 * שם-התלמיד בטבלת-החוג וברשימת-ההמתנה הפך ללחיץ ⇒ selectFamily(famId)
 * קופץ לכרטיס-המשפחה. גזור מ-memberById.famId; בלי famId ⇒ טקסט רגיל.
 */
import { describe, expect, it } from 'vitest';
import src from '../CourseDetail.tsx?raw';

describe('👤 course-open-card — קפיצה לכרטיס מהחוג', () => {
  it('נגזר selectFamily מה-store + helper openCard לפי famId', () => {
    expect(src).toContain('const selectFamily = useApp((s) => s.selectFamily)');
    expect(src).toContain('const fid = memberById.get(memberId)?.famId;');
    expect(src).toContain('if (fid) selectFamily(fid);');
  });
  it('שם-התלמיד בטבלה לחיץ (onClick openCard) עם famId', () => {
    expect(src).toContain('onClick={() => openCard(e.memberId)}');
    // fallback לטקסט רגיל כשאין famId (אין כפתור-מת)
    expect(src).toContain("m?.famId ? (");
  });
});
