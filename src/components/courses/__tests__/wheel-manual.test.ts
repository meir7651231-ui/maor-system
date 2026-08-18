/**
 * ratchet — 🎡 גלגל-החוגים · מצב-ידני (17.8): "לסובב את הגלגל ידני ולבחור קורס".
 * wheelIndexUnderPointer טהור — עקבי עם חישוב-המנצח של הסיבוב-האקראי.
 */
import { describe, expect, it } from 'vitest';
import { wheelIndexUnderPointer } from '../lib';
import wheelSrc from '../../wheel/CourseWheel.tsx?raw';

describe('🎡 ratchet — גלגל ידני', () => {
  it('הקטע-מתחת-למחוג: rot=0 ⇒ קטע 0; n=1 ⇒ 0', () => {
    expect(wheelIndexUnderPointer(0, 4)).toBe(0);
    expect(wheelIndexUnderPointer(0, 1)).toBe(0);
    expect(wheelIndexUnderPointer(123, 1)).toBe(0);
    expect(wheelIndexUnderPointer(0, 0)).toBe(0);
  });

  it('עקבי עם חישוב-המנצח האקראי: rot=targetMod(idx) ⇒ idx', () => {
    const n = 5;
    const step = 360 / n;
    for (let idx = 0; idx < n; idx++) {
      const jitter = 0.5 * step; // מרכז-הקטע (כמו הסיבוב)
      const targetMod = (((360 - (idx * step + jitter)) % 360) + 360) % 360;
      expect(wheelIndexUnderPointer(targetMod, n)).toBe(idx);
    }
  });

  it('עמיד לזוויות שליליות / מעל 360 (סיבוב-ידני מצטבר)', () => {
    // n=4, step=90. rot=-90 ⇒ off=90 ⇒ idx=1
    expect(wheelIndexUnderPointer(-90, 4)).toBe(1);
    // rot=720+45 (2 סיבובים) שקול ל-45 ⇒ off=315 ⇒ idx=3
    expect(wheelIndexUnderPointer(765, 4)).toBe(3);
  });

  it('🛡 הגנת-מקור: הגלגל תומך במצב-ידני — גרירה + בחירת-מה-שמתחת-למחוג', () => {
    expect(wheelSrc).toContain("const [manual, setManual]");
    expect(wheelSrc).toContain('onPointerDown={onDragStart}');
    expect(wheelSrc).toContain('pickUnderPointer');
    expect(wheelSrc).toContain('✋ ידני');
    expect(wheelSrc).toContain('בחר את שמתחת למחוג');
  });
});
