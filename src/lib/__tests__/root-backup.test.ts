/**
 * ratchet — G1 (6.11.2026): גיבוי-הלילה בשרת לא גיבה את הלקוח-החי.
 * 🐛 backupNightly עבר רק על platformOrgs וקרא רק orgs/{slug}/… — אבל הלקוח-החי רץ
 * ב-cloudRoot:true = נתיבי-שורש ואינו ב-platformOrgs ⇒ אפס צילומי-לילה ללקוח המשלם.
 * התיקון: יעד-שורש קבוע 'root' ⇒ backups/root/{date}.json, אותה טבעת-30.
 * הנתיבים נגזרים כאן מהלקוח עצמו (cloud-diff) — סחף-נתיב בצד-אחד ייתפס.
 * הוכחה-חיה מול אמולטור: functions/backup-root.emu.mjs.
 */
import { describe, expect, it } from 'vitest';
import { ENTITY_COLLECTIONS, colPath, metaPath, envPath, donationsPath } from '../cloud-diff';
import functionsSrc from '../../../functions/index.js?raw';

const sec = functionsSrc.slice(functionsSrc.indexOf('function backupTargets'), functionsSrc.indexOf("Object.assign(exports, require('./nedarimPull'))"));

describe('🛡 G1 — גיבוי-לילה כולל את הלקוח-החי (שורש)', () => {
  it('יעד-השורש משתמש בדיוק בנתיבי-השורש של הלקוח (meta/env/אוספים/donations)', () => {
    expect(metaPath('x', true)).toBe('meta/org');
    expect(envPath('x', true)).toBe('_enc/envelope');
    expect(colPath('x', true, 'families')).toBe('families');
    expect(donationsPath('x', true)).toBe('donations');
    expect(sec).toContain("slug: 'root', isRoot: true, col: (c) => db.collection(c), meta: '" + metaPath('x', true) + "', env: '" + envPath('x', true) + "'");
  });

  it('ארגוני-הפלטפורמה ללא-שינוי: orgs/{slug}/… ו-slug "root" שמור (לא נדרס)', () => {
    expect(colPath('abc', false, 'families')).toBe('orgs/abc/families');
    expect(sec).toContain("col: (c) => db.collection('orgs').doc(id).collection(c)");
    expect(sec).toContain("meta: 'orgs/' + id + '/meta/org', env: 'orgs/' + id + '/_enc/envelope'");
    expect(sec).toContain(".filter((id) => id !== 'root')");
  });

  it('הריצה עוברת על השורש + כל platformOrgs, אותה טבעת ואותם אוספים', () => {
    expect(sec).toContain("backupTargets(db, orgs.docs.map((d) => d.id))");
    expect(sec).toContain("'backups/' + t.slug + '/' + today + '.json'");
    expect(sec).toContain("prefix: 'backups/' + t.slug + '/'");
    expect(sec).toContain('[...BACKUP_COLLECTIONS, ...EXTRA_BACKUP]');
    expect(functionsSrc).toContain('BACKUP_KEEP = 30');
    // אין נתיב orgs/ קשיח בלולאה (זה היה הבאג)
    const loop = sec.slice(sec.indexOf('exports.backupNightly'));
    expect(loop).not.toContain("db.collection('orgs').doc(org.id)");
  });

  it('BACKUP_COLLECTIONS ≡ ENTITY_COLLECTIONS (אותו סט, בלי עודף)', () => {
    const m = functionsSrc.match(/const BACKUP_COLLECTIONS = \[([\s\S]*?)\];/);
    expect(m).toBeTruthy();
    const list = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    expect([...list].sort()).toEqual([...ENTITY_COLLECTIONS].sort());
  });

  it('השורש בלי meta/org מדולג (פרויקט בלי לקוח-שורש) — ארגונים לא מושפעים', () => {
    expect(sec).toContain('if (t.isRoot && !metaDoc.exists) continue;');
  });
});
