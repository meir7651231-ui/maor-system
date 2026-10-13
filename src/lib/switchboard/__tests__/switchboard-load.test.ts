/**
 * ratchet — 🔌 המרכזייה 1: טעינת-ספק שנכשלה (chunk שלא ירד — רשת, פריסה שהחליפה קבצים).
 * ask ⇒ 'error' (לא loading לנצח, לא חריגה); loadProviders לא נדחה; הקריאה הבאה מנסה שוב ומצליחה.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ask, loadProviders, providerLoaded, resetSwitchboard } from '../registry';
import { cfgWith, fixtureDb, NOW_MS } from './fixture';

afterEach(() => {
  vi.doUnmock('../../../components/hosting/abilities');
  resetSwitchboard();
});

describe('🔌 ספק שלא נטען', () => {
  it('כשל-טעינה ⇒ error; לא נדחה; ניסיון חוזר מצליח', async () => {
    vi.doMock('../../../components/hosting/abilities', () => {
      throw new Error('chunk נפל');
    });
    const cfg = cfgWith({ hosting: true });
    const ctx = { db: fixtureDb(), config: cfg, nowMs: NOW_MS };
    await expect(loadProviders(cfg)).resolves.toBeUndefined();
    expect(providerLoaded('hosting')).toBe(false);
    expect(ask('hosting.today', ctx, {})).toMatchObject({ ok: false, unavailable: true, reason: 'error' });
    vi.doUnmock('../../../components/hosting/abilities');
    vi.resetModules();
    await loadProviders(cfg);
    expect(providerLoaded('hosting')).toBe(true);
    expect(ask('hosting.today', ctx, {})).toMatchObject({ ok: true });
  });
});
