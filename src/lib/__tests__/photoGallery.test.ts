/**
 * ratchet — גלריית-תמונות (photoGallery). תקרות · יחס-ממדים · חיטוי + הגנת-מקור.
 */
import { describe, expect, it } from 'vitest';
import { canAddPhoto, fitDimensions, isDataImage, sanitizePhotos, PHOTO_MAX, PHOTO_MAX_LEN } from '../photoGallery';
import detailSrc from '../../components/supporters/SupporterDetail.tsx?raw';
import galSrc from '../../components/supporters/SupporterPhotos.tsx?raw';
import storeSrc from '../../store/useApp.ts?raw';

const DATA = 'data:image/jpeg;base64,' + 'A'.repeat(40);

describe('📷 ratchet — גלריית-תמונות', () => {
  it('canAddPhoto — מתחת/מעל התקרה', () => {
    expect(canAddPhoto(undefined)).toBe(true);
    expect(canAddPhoto(Array(PHOTO_MAX - 1).fill(DATA))).toBe(true);
    expect(canAddPhoto(Array(PHOTO_MAX).fill(DATA))).toBe(false);
  });

  it('isDataImage — מקבל תמונות-data, דוחה זבל', () => {
    expect(isDataImage(DATA)).toBe(true);
    expect(isDataImage('data:image/png;base64,AAAA')).toBe(true);
    expect(isDataImage('http://x/y.png')).toBe(false);
    expect(isDataImage('javascript:alert(1)')).toBe(false);
    expect(isDataImage(42)).toBe(false);
  });

  it('fitDimensions — משמר יחס, לא-מגדיל, צלע-גדולה ל-max', () => {
    expect(fitDimensions(1600, 800, 800)).toEqual({ w: 800, h: 400 });
    expect(fitDimensions(400, 300, 800)).toEqual({ w: 400, h: 300 }); // לא מגדיל
    expect(fitDimensions(0, 0, 800)).toEqual({ w: 0, h: 0 });
  });

  it('sanitizePhotos — סינון זבל/גדול-מדי + חיתוך-לתקרה', () => {
    expect(sanitizePhotos('nope')).toEqual([]);
    expect(sanitizePhotos([DATA, 'bad', 123, DATA])).toEqual([DATA, DATA]);
    expect(sanitizePhotos(Array(PHOTO_MAX + 3).fill(DATA))).toHaveLength(PHOTO_MAX);
    const huge = 'data:image/png;base64,' + 'A'.repeat(PHOTO_MAX_LEN);
    expect(sanitizePhotos([huge])).toEqual([]);
  });

  it('🛡 הגנת-מקור: מגודר opt-in, חיווט-סטור, וחיטוי-persist', () => {
    expect(detailSrc).toContain("config.features?.['supporters.photos'] === true");
    expect(detailSrc).toContain('<SupporterPhotos supporter={sp} />');
    expect(galSrc).toContain('addSupporterPhoto');
    expect(galSrc).toContain('toDataURL');
    expect(storeSrc).toContain('addSupporterPhoto(id, dataUri)');
  });
});
