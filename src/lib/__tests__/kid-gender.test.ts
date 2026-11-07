/**
 * ratchet — W2-S3 (7.11.2026): עמודת "מין" עם ז/נ בייבוא-ילדים.
 * 🐛 "נ" לבד לא זוהה ⇒ בריצת-ההקמה (knowledge/PLAYBOOK-SETUP-WEEK.md §4 #1) 153/153 בנות נקלטו כבנים.
 */
import { describe, expect, it } from 'vitest';
import { kidGenderOf } from '../familiesImport';
import importSrc from '../../components/settings/ImportSection.tsx?raw';

describe('🛡 kidGenderOf — מגדר מעמודת-הייבוא', () => {
  it('"נ" (וקיצוריו) ⇒ בת', () => {
    for (const g of ['נ', ' נ ', "נ'", 'נ׳', 'נ.', 'נ"']) expect(kidGenderOf(g), g).toBe('f');
  });
  it('הכלל הישן נשמר ביט-זהה', () => {
    for (const g of ['בת', 'נקבה', 'F', 'female', 'ילדה']) expect(kidGenderOf(g), g).toBe('f');
    for (const g of ['', 'ז', 'זכר', 'בן', 'M', 'male', 'ילד']) expect(kidGenderOf(g), g).toBe('m');
  });
  it('"נ" רק כתא-שלם — מילים שמכילות נ אינן "בת"', () => {
    for (const g of ['נער', 'בנים', 'נ ז']) expect(kidGenderOf(g), g).toBe('m');
  });
  it('הגנת-מקור: ייבוא-הילדים משתמש ב-kidGenderOf', () => {
    expect(importSrc).toContain('gender: kidGenderOf(gr),');
    expect(importSrc).not.toContain("/בת|נק|f|ילדה/i.test(gr)");
  });
});
