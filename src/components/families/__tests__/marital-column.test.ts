/**
 * ratchet — הצגת מצב-משפחתי בכרטיס-החיצוני (בקשת-בעלים 16.8): הסטטוס
 * (נשואים/גרושים/…) יופיע ברשימת-המשפחות — עמודה ייעודית בטבלה **בין** עמודת-
 * המשפחה לעמודת-ההורים, ושבב בכרטיס-הרשת. גם סינון-עמודה למצב-המשפחתי.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../FamiliesView.tsx?raw';
import { maritalChipStyle, MARITAL_OPTIONS } from '../lib';

describe('מצב-משפחתי בכרטיס-החיצוני', () => {
  it('הטבלה: עמודת "מצב משפחתי" בין המשפחה (name) להורים', () => {
    const nameIdx = viewSrc.indexOf("thSort('name'");
    const marIdx = viewSrc.indexOf('<th>מצב משפחתי</th>');
    const parentsIdx = viewSrc.indexOf('<th>הורים</th>');
    expect(marIdx).toBeGreaterThan(nameIdx);
    expect(parentsIdx).toBeGreaterThan(marIdx); // הסדר: משפחה → מצב → הורים
  });

  it('התא מציג שבב-מצב מ-maritalStatus (או — כשריק)', () => {
    // flag-max 2 (20.8): התג מגודר families.marital — הגידור עצמו ננעל כאן
    expect(viewSrc).toContain('maritalOn && f.maritalStatus ? <span style={maritalChipStyle(f.maritalStatus)}>{f.maritalStatus}</span> : ');
  });

  it('כרטיס-הרשת מציג את המצב כשבב', () => {
    expect(viewSrc).toContain('{maritalOn && f.maritalStatus && <span style={maritalChipStyle(f.maritalStatus)}>{f.maritalStatus}</span>}');
  });

  it('סינון-עמודה: colF.marital מחריג מצב לא-תואם', () => {
    expect(viewSrc).toContain("colF.marital !== 'all' && (f.maritalStatus || '') !== colF.marital");
    expect(viewSrc).toContain("marital: 'all'"); // EMPTY_COLF
  });

  it('maritalChipStyle — צבע לכל מצב מוכר; ערך זר ⇒ שבב ניטרלי (לא קורס)', () => {
    for (const m of MARITAL_OPTIONS) {
      const s = maritalChipStyle(m);
      expect(typeof s.background).toBe('string');
      expect(s.background).toBeTruthy();
    }
    expect(maritalChipStyle('ערך-לא-מוכר').background).toBe('#eef1f5');
  });
});
