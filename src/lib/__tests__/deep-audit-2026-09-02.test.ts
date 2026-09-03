/**
 * ratchet — ביקורת-עומק 6-עדשות (2.9.2026, "תבדוק עמוק יותר הכי עמוק שאתה יכול").
 * נועל את התיקונים המערכתיים: סנכרון-ענן (דילוג-snapshot · איחוד-rid · מצבות),
 * מחלקת-הקריסה (לוקאפים חסינים + ריפוי-במיזוג-חי), כסף (שערי-סכום · $-ניתוב · עיגול),
 * חוזה-דגלים (false מפורש · GRANTABLE), אבטחת-שרת (התאמת-מייל-מלאה · שער-slug · cooldown).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sanitizeIncoming, mergeDonationsPreserving } from '../cloud-merge';
import { evMeta, EV_META } from '../eventMeta';
import cloudSrc from '../cloud.ts?raw';
import cloudSyncSrc from '../../store/cloudSync.ts?raw';
import useAppSrc from '../../store/useApp.ts?raw';
import configSrc from '../config.ts?raw';
import persistSrc from '../../store/persist.ts?raw';
import appSrc from '../../App.tsx?raw';

const fn = readFileSync('functions/gcontactsSync.js', 'utf8');

describe('☁️ סנכרון-ענן — נכונות', () => {
  it('מאזין-ישויות מסנן פר-מסמך (לא מדלג על snapshot שלם); meta מוחל תמיד', () => {
    expect(cloudSrc).toContain("snap.docChanges().filter((ch) => !ch.doc.metadata.hasPendingWrites)");
    expect(cloudSrc).not.toContain('if (snap.metadata.hasPendingWrites) return;');
    expect(cloudSrc).not.toContain('if (snap.metadata.hasPendingWrites || !snap.exists()) return;');
  });
  it('איחוד-rid חל גם על enrollments.payments (תשלום-R- לא נדרס)', () => {
    const local = { id: 'e1', payments: [{ rid: 'R-1' }, { rid: 'R-2' }] };
    const inc = { id: 'e1', payments: [{ rid: 'R-1' }] };
    const m = mergeDonationsPreserving('enrollments', local, inc) as { payments: { rid: string }[] };
    expect(m.payments.map((p) => p.rid).sort()).toEqual(['R-1', 'R-2']);
    // אוסף ללא rid-union ⇒ המסמך המרוחק כמות-שהוא
    expect(mergeDonationsPreserving('rooms', { id: 'r', x: 1 }, { id: 'r', x: 2 })).toEqual({ id: 'r', x: 2 });
  });
  it('handshake: id בשני הצדדים ⇒ mergeDonationsPreserving; מצבה-מקומית ⇒ העתק-הענן יורד', () => {
    expect(cloudSyncSrc).toContain('mergeDonationsPreserving(col, l as unknown as Record<string, unknown>');
    expect(cloudSyncSrc).toMatch(/local\.delLog \?\? \[\]\)\.some\(\(e\) => e\.col === col && e\.id === c\.id && !localIds\.has\(c\.id\)\)/);
  });
  it('restoreDb/resetAll מטביעים מצבות (לא עוקפים את הטבעת)', () => {
    expect(useAppSrc).toContain('function withRemovalTombstones(prev: Db, next: Db): Db');
    expect((useAppSrc.match(/set\(\{ db: withRemovalTombstones\(prev, db\) \}\)/g) ?? []).length).toBe(2);
  });
});

describe('💥 מחלקת-הקריסה — לוקאפים חסינים + ריפוי במיזוג-חי', () => {
  it('sanitizeIncoming מרפא status/cred/type/pri/sessions כמו migrate', () => {
    expect(sanitizeIncoming('families', { id: 'f', status: 'bogus' }).status).toBe('active');
    expect((sanitizeIncoming('families', { id: 'f' }).cred as { score: number }).score).toBe(700);
    expect(sanitizeIncoming('events', { id: 'e', type: 'weird' }).type).toBe('custom');
    expect(sanitizeIncoming('events', { id: 'e', type: 'bday' }).type).toBe('bday'); // תקין ביט-זהה
    expect(sanitizeIncoming('tasks', { id: 't', pri: 9 }).pri).toBe(2);
    expect(Array.isArray(sanitizeIncoming('courses', { id: 'c' }).sessions)).toBe(true);
  });
  it('evMeta: סוג לא-מוכר ⇒ custom (לא undefined.bg)', () => {
    expect(evMeta({ type: 'nope' as never })).toEqual(EV_META.custom);
    expect(evMeta({ type: 'call' })).toEqual(EV_META.call);
  });
  it('migrate מרפא events.type + tasks.pri; App מפענח hash בבטחה', () => {
    expect(persistSrc).toMatch(/merged\.events = [\s\S]{0,200}EVT\.has\(String\(e\.type\)\) \? e : \{ \.\.\.e, type: 'custom' \}/);
    expect(persistSrc).toMatch(/\[1, 2, 3\]\.includes\(t\.pri as number\) \? t : \{ \.\.\.t, pri: 2 \}/);
    expect(appSrc).toContain('function safeDecode(s: string): string');
    expect(appSrc).not.toMatch(/[^e]decodeURIComponent\(window/);
  });
});

describe('💰 כסף — שערים בליבה', () => {
  it('addDonation/addPayment דוחים סכום לא-סופי/לא-חיובי לפני צריכת-המונה', () => {
    expect(useAppSrc).toContain("if (!Number.isFinite(payment.amount) || payment.amount <= 0) { get().toast('סכום לא-תקין — התשלום לא נרשם'); return { ok: false }; }");
    expect(useAppSrc).toContain("if (!Number.isFinite(donation.amount) || donation.amount <= 0) { get().toast('סכום לא-תקין — התרומה לא נרשמה'); return { ok: false }; }");
  });
});

describe('🚩 חוזה-הדגלים', () => {
  it('canGrantedAction: false מפורש מכבה גם למנהל/מייל-על', () => {
    expect(configSrc).toContain("return config.features?.[key] !== false && (isManager || isAdminUser(config, email) || config.features?.[key] === true);");
  });
});

describe('🔐 שרת gcontactsSync — הקשחה', () => {
  it('מייל-על = התאמה-מלאה (Set), לא substring; slug מאומת; cooldown; שגיאה קבועה', () => {
    expect(fn).toContain("const superSet = () => new Set(['meir7651231@gmail.com'");
    expect(fn).not.toContain('supers.includes(el)');
    expect(fn).toContain("if (!(ORG_RE.test(slug) || slug === 'root')) { res.status(400).json({ error: 'bad-org' }); return; }");
    expect(fn).toContain("res.status(429).json({ error: 'cooldown' })");
    expect(fn).toContain("res.status(500).json({ error: 'sync-failed' })");
    // לקוח-השורש קורא אוספי-שורש (לא orgs/root/*)
    expect(fn).toContain("org === 'root' ? db.collection(name) : db.collection('orgs').doc(org).collection(name)");
  });
});
