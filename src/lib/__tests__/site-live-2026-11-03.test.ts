/**
 * רצ'ט — 📡 «שידור חי» באתר-הציבורי (3.11.2026, בקשת-בעלים «תכין לו בעריכת-אתר · בפעם הראשונה שליטה מלאה
 * על המספרים»).
 *
 * ננעל:
 *  1. ההצעה מנתוני-המשרד = סכומים כוללים בלבד — **אף שם** של משפחה/ילד/תורם לא נכנס (בשונה מקיר-ההשפעה).
 *  2. המערכת מציעה ולא מפרסמת: ההצעה לא מדליקה (enabled), «גויסו השנה» מוסתר כברירת-מחדל.
 *  3. חיטוי: allowlist + תקרות; src רק תווים בטוחים; asOf רק ISO.
 *  4. האתר מציג רק מה שגלוי ומופעל; עורך-האתר והאשף מקבלים את ההצעה בלי מנוי-DB.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { emptyDb, type Db } from '../../types/domain';
import { siteLiveFromDb } from '../siteLive';
import { normalizeConfig } from '../config';
import { liveVisible } from '../../components/public/PublicLive';
import type { OrgConfig } from '../../types/config';
import siteSrc from '../../components/public/PublicSite.tsx?raw';
import liveSrc from '../../components/public/PublicLive.tsx?raw';
import editorPage from '../../components/site/SiteEditorPage.tsx?raw';
import wizard from '../../components/builder/BuilderWizard.tsx?raw';
import contentEditor from '../../components/builder/SiteContentEditor.tsx?raw';

const demo = { ...emptyDb(), ...JSON.parse(readFileSync(new URL('../../../public/demo.json', import.meta.url), 'utf8')) } as Db;
const NOW = new Date('2026-11-03T12:00:00');

describe('📡 הצעת-המספרים מנתוני-המשרד', () => {
  const live = siteLiveFromDb(demo, NOW);
  it('ערכים מהנתונים: משפחות פעילות, תורמים, סכום-השנה, תאריך', () => {
    const fams = live.cards!.find((c) => c.src === 'families')!;
    expect(fams.value).toBe(String(demo.families.filter((f) => f.status === 'active').length));
    expect(live.cards!.find((c) => c.src === 'donors')!.value).toBe(String(demo.supporters.length));
    expect(live.raised?.value).toBeGreaterThan(0);
    expect(live.asOf).toBe('2026-11-03');
  });
  it('🔒 אף שם של משפחה/ילד/תורם לא נכנס להצעה', () => {
    const txt = JSON.stringify(live);
    const names = [
      ...demo.families.map((f) => f.name),
      ...demo.families.flatMap((f) => f.members.map((m) => m.first)),
      ...demo.supporters.map((s) => s.name),
    ].filter((n) => n && n.trim().length >= 3);
    const leaked = names.filter((n) => txt.includes(n));
    expect(leaked).toEqual([]);
  });
  it('מציעה ולא מפרסמת: בלי enabled, «גויסו השנה» לא מוצג עד שהמנהל מסמן', () => {
    expect(live.enabled).toBeUndefined();
    expect(live.raised?.show).toBeUndefined();
  });
  it('בלי «גבייה היום» (כסף יומי) ובלי אירועי-לוח פרטיים', () => {
    expect(JSON.stringify(live)).not.toContain('גבייה');
    const evTitles = demo.events.map((e) => e.title).filter((t) => t && t.length >= 3);
    expect(evTitles.filter((t) => JSON.stringify(live.week).includes(t))).toEqual([]);
  });
  it('DB ריק ⇒ לא נופל, מספרים 0', () => {
    const e = siteLiveFromDb(emptyDb(), NOW);
    expect(e.cards!.find((c) => c.src === 'families')!.value).toBe('0');
  });
});

describe('🧹 חיטוי site.live', () => {
  const norm = (live: unknown) => (normalizeConfig({ slug: 'x', orgName: 'א', theme: 'or-rishon', site: { live } }) as OrgConfig).site?.live;
  it('allowlist + תקרות + src/asOf בטוחים', () => {
    const n = norm({
      enabled: true, evil: 1,
      cards: [{ value: '612', label: 'משפחות', src: 'families', hidden: true, x: 1 }, { value: '', label: 'ריק' }, { value: '1', label: 'ב', src: 'a b<script>' }],
      raised: { show: true, value: -5, goal: 1000 },
      today: Array.from({ length: 9 }, (_, i) => ({ value: String(i), label: 'x' })),
      ticker: ['א', '', 'ב'],
      asOf: '3/11/2026',
    })!;
    expect(n.enabled).toBe(true);
    expect((n as Record<string, unknown>).evil).toBeUndefined();
    expect(n.cards).toEqual([{ value: '612', label: 'משפחות', src: 'families', hidden: true }, { value: '1', label: 'ב' }]);
    expect(n.raised).toEqual({ show: true, goal: 1000 });
    expect(n.today).toHaveLength(4);
    expect(n.ticker).toEqual(['א', 'ב']);
    expect(n.asOf).toBeUndefined();
  });
  it('enabled רק true מפורש', () => {
    expect(norm({ enabled: 'yes', ticker: ['א'] })?.enabled).toBeUndefined();
  });
});

describe('🌐 תצוגה באתר', () => {
  it('liveVisible: כבוי/ריק/הכול-מוסתר ⇒ לא מוצג', () => {
    expect(liveVisible(undefined)).toBe(false);
    expect(liveVisible({ cards: [{ value: '1', label: 'א' }] })).toBe(false);
    expect(liveVisible({ enabled: true, cards: [{ value: '1', label: 'א', hidden: true }] })).toBe(false);
    expect(liveVisible({ enabled: true, raised: { value: 100 } })).toBe(false); // סכום בלי «מוצג»
    expect(liveVisible({ enabled: true, raised: { value: 100, show: true } })).toBe(true);
    expect(liveVisible({ enabled: true, cards: [{ value: '1', label: 'א' }] })).toBe(true);
  });
  it('חיווט: האתר מציג רק כש-liveVisible; האתר לא מייבא את מנוע-הספירה', () => {
    expect(siteSrc).toMatch(/\{liveVisible\(site\.live\) && \(\s*<PublicLive /);
    expect(siteSrc + liveSrc).not.toMatch(/siteLive'|wallData/);
    expect(liveSrc).toContain('.filter((c) => !c.hidden)');
  });
  it('עורך-האתר והאשף: הצעה פעם-אחת בפתיחה, בלי מנוי-DB', () => {
    for (const src of [editorPage, wizard]) {
      expect(src).toContain('useState(() => siteLiveFromDb(useApp.getState().db, new Date(), config))');
      expect(src).toContain('systemLive={() => sysLive}');
    }
    expect(contentEditor).toContain('🔄 מילוי המספרים מהמערכת');
    expect(contentEditor).toContain('🔄 רענון המספרים מהמערכת');
  });
});
