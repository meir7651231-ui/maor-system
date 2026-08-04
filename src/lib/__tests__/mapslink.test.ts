/**
 * ratchet — קישורי-מפות (INTEGRATIONS גל א׳, הרחבת maps) + integrationOn.
 * הרחבה = מוצר-נמכר ⇒ **חסר = כבוי** (הפוך מחוזה-הדגלים!) — הראצ'ט המרכזי כאן.
 */
import { describe, expect, it } from 'vitest';
import { mapsRouteUrl, mapsSearchUrl } from '../mapsLink';
import { integrationOn, normalizeConfig } from '../config';
import { DEFAULT_CONFIG } from '../../types/config';

describe('🗺️ ratchet — mapsSearchUrl/mapsRouteUrl (הרחבת maps)', () => {
  it('כתובת+עיר מקודדות; ריק ⇒ null', () => {
    expect(mapsSearchUrl('הרצל 5', 'ביתר עילית')).toBe(
      'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('הרצל 5, ביתר עילית'),
    );
    expect(mapsSearchUrl('', '')).toBeNull();
    expect(mapsSearchUrl('  ', '')).toBeNull();
    expect(mapsSearchUrl('', 'ירושלים')).toContain(encodeURIComponent('ירושלים'));
  });

  it('מסלול: יעד=אחרון, waypoints מופרדים ב-%7C; עצירה אחת ⇒ חיפוש; אפס ⇒ null', () => {
    const url = mapsRouteUrl(['א 1, עיר', 'ב 2, עיר', 'ג 3, עיר'])!;
    expect(url).toContain('/maps/dir/?api=1');
    expect(url).toContain('destination=' + encodeURIComponent('ג 3, עיר'));
    expect(url).toContain('waypoints=' + encodeURIComponent('א 1, עיר') + '%7C' + encodeURIComponent('ב 2, עיר'));
    expect(mapsRouteUrl(['רק אחת'])).toContain('/maps/search/');
    expect(mapsRouteUrl([])).toBeNull();
    expect(mapsRouteUrl(['', '  '])).toBeNull();
  });
});

describe('🔌 ratchet — integrationOn: הרחבה חסרה = כבויה (הפוך מדגלים!)', () => {
  it('חסר ⇒ false; enabled:true ⇒ true; enabled:false ⇒ false', () => {
    // באג-שנמנע: אילו הרחבות היו על חוזה-הדגלים (חסר=דלוק), כל 12 ההרחבות היו
    // "נמכרות" לכל לקוח קיים בחינם. הרחבה = opt-in מפורש בלבד.
    expect(integrationOn(DEFAULT_CONFIG, 'whatsapp')).toBe(false);
    expect(integrationOn({ ...DEFAULT_CONFIG, integrations: { whatsapp: { enabled: true } } }, 'whatsapp')).toBe(true);
    expect(integrationOn({ ...DEFAULT_CONFIG, integrations: { whatsapp: { enabled: false } } }, 'whatsapp')).toBe(false);
  });

  it('normalizeConfig מחטא integrations: רק {enabled:boolean} שורד', () => {
    const cfg = normalizeConfig({
      slug: 't', orgName: 'א', theme: 'tsohar',
      integrations: { whatsapp: { enabled: true }, bad1: 'x', bad2: { enabled: 'yes' }, bad3: null },
    })!;
    expect(cfg.integrations).toEqual({ whatsapp: { enabled: true } });
    const none = normalizeConfig({ slug: 't', orgName: 'א', theme: 'tsohar', integrations: 'oops' })!;
    expect(none.integrations).toBeUndefined();
  });
});
