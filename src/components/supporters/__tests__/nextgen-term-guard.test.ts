/**
 * ratchet — דליפות-מונח במסכי-הדור-הבא (swarm-audit 21.8).
 *
 * 🐛 הבאג: "תורמים"/"תורם/ת" ישבו קשיחים בקוקפיט/ריברנד/גלקסיה/מודיעין — עקפו
 * את termOf ⇒ ורטיקל ששינה את המונח (חברים/לקוחות/פרויקטים) ראה את מונח-העמותה
 * דולף. התיקון: דרך termOf(config, 'nav.supporters'/'entity.supporter', ...)
 * עם הנוסח-ההיסטורי כ-fallback (ביט-זהה לקונפיג בלי terms).
 */
import { describe, expect, it } from 'vitest';
import cockpitSrc from '../SupportersCockpit.tsx?raw';
import kpiSrc from '../SupportersKpiStrip.tsx?raw';
import galaxySrc from '../SupportersGalaxy.tsx?raw';
import intelViewSrc from '../SupportersIntel.tsx?raw';

describe('🛡 ratchet — מחרוזות-תורמים דרך termOf, לא קשיח', () => {
  it('קוקפיט + ריברנד: "סה״כ תורמים" דרך termOf', () => {
    for (const src of [cockpitSrc, kpiSrc]) {
      expect(src).not.toContain('label="סה״כ תורמים"');
      expect(src).toContain("'סה״כ ' + termOf(props.config, 'nav.supporters', 'תורמים')");
    }
  });

  it('גלקסיה: כותרת ומצב-ריק דרך termOf', () => {
    expect(galaxySrc).not.toContain('>גלקסיית התורמים<');
    expect(galaxySrc).toContain("'גלקסיית ה' + termOf(props.config, 'nav.supporters', 'תורמים')");
    expect(galaxySrc).not.toContain('>אין תורמים להצגה.<');
    expect(galaxySrc).toContain("'אין ' + termOf(props.config, 'nav.supporters', 'תורמים') + ' להצגה.'");
  });

  it('מודיעין: מוני-האריחים וכותרת-הטבלה "תורם/ת" דרך termOf', () => {
    expect(intelViewSrc).toContain("termOf(props.config, 'nav.supporters', 'תורמים')");
    // שני אריחי-התיק (LTV · ₪-בסכנה) — לא חוזרים למחרוזת הקשיחה
    expect(intelViewSrc).not.toContain("note={portfolio.count + ' תורמים'}");
    expect(intelViewSrc).not.toContain("note={portfolio.atRiskCount + ' תורמים'}");
    expect(intelViewSrc).toContain("' ' + supPlural");
    expect(intelViewSrc).not.toContain('<span>תורם/ת</span>');
    expect(intelViewSrc).toContain("termOf(props.config, 'entity.supporter', 'תורם/ת')");
  });
});
