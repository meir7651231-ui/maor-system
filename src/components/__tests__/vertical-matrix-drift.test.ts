/**
 * ratchet-סחף — מטריצת-הוורטיקלים (e2e/vertical-matrix.mjs) רצה על נתונים
 * מחוללים (vertical-matrix-data.json). אם VERTICAL_PACKS או TERM_DEFS השתנו
 * והקובץ לא חולל מחדש — הטסט הזה אדום, והמטריצה לא בודקת מציאות מיושנת.
 * ריענון: ראו ההוראה בתחתית הקובץ.
 */
import { describe, expect, it } from 'vitest';
import { VERTICAL_PACKS } from '../../lib/verticalPacks';
import { TERM_DEFS } from '../../types/features';
import RAW from '../../../e2e/vertical-matrix-data.json?raw';

const DATA = JSON.parse(RAW) as {
  packs: Array<{ id: string; label: string; terms: Record<string, string>; modules: Record<string, boolean>; features: Record<string, boolean> }>;
  termFallbacks: Record<string, string>;
};

describe('🧪 ratchet-סחף — נתוני מטריצת-הוורטיקלים ≡ המקור', () => {
  it('החבילות בקובץ ≡ VERTICAL_PACKS (id/label/terms/modules/features)', () => {
    expect(DATA.packs.map((p) => p.id)).toEqual(VERTICAL_PACKS.map((p) => p.id));
    for (const p of VERTICAL_PACKS) {
      const d = DATA.packs.find((x) => x.id === p.id)!;
      expect(d.label, p.id).toBe(p.label);
      expect(d.terms, p.id).toEqual(p.terms);
      expect(d.modules, p.id).toEqual(p.modules);
      expect(d.features, p.id).toEqual(p.features ?? {});
    }
  });

  it('מילון-הנפילות בקובץ ≡ TERM_DEFS', () => {
    expect(DATA.termFallbacks).toEqual(Object.fromEntries(TERM_DEFS.map((t) => [t.key, t.fallback])));
  });
});

/* ריענון הקובץ אחרי שינוי חבילות/מונחים:
 * node --input-type=module -e "..." — או פשוט: להריץ את קטע-החילוץ מ-
 * knowledge/BUILD-ORDER-INTEGRATIONS (טסט-dump זמני) ולהעתיק ל-e2e/vertical-matrix-data.json */
