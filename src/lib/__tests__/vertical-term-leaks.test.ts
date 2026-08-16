/**
 * רצ'ט — דליפות-מונח בורטיקל מסחרי (16.8, בעקבות דיווח "מי מתקשר מופיע לי תורם").
 * סורק-הוורטיקלים (e2e) בודק מסכי-ניווט בלבד; מודאלים, טוסטים, tooltips וכותרות-
 * עמודה חמקו והציגו מונחי-עמותה ("תורם"/"משפחה"/"מתנדב") גם בורטיקל מסחרי.
 * כאן הגנות-מקור: המחרוזות הקשיחות שהוסרו לא חוזרות, והתחליף עובר termOf.
 */
import { describe, expect, it } from 'vitest';
import storeSrc from '../../store/useApp.ts?raw';
import shop7Src from '../../components/shop7/Shop7View.tsx?raw';
import dedupSrc from '../../components/supporters/SupDedupModal.tsx?raw';
import supViewSrc from '../../components/supporters/SupportersView.tsx?raw';
import donationSrc from '../../components/supporters/DonationModal.tsx?raw';
import supDetailSrc from '../../components/supporters/SupporterDetail.tsx?raw';
import widgetsSrc from '../../components/home/widgets.tsx?raw';
import boardSrc from '../../components/home/BoardEdit.tsx?raw';

describe('☢️ ratchet — דליפות-מונח קשיחות (store toasts)', () => {
  it('טוסטי-ה-store לא מכילים מונחי-ישות קשיחים — עברו ל-termOf(get().config, …)', () => {
    const gone = [
      'לא נבחרו משפחות לשיוך',
      'המשפחה כבר ברשימת ההמתנה',
      'למתנדב יש מסירות משויכות',
      'התומך/ת לא נמצא/ה — התרומה לא נשמרה',
      'השיבוץ לא נמצא — התשלום לא נרשם',
      'כל התרומות והקבלות נשמרו',
      'אל המשפחה שנבחרה',
    ];
    for (const s of gone) expect(storeSrc, `טוסט קשיח חזר: "${s}"`).not.toContain(s);
    // התחליף עובר מילון-המונחים
    expect(storeSrc).toContain("termOf(get().config, 'entity.volunteer'");
    expect(storeSrc).toContain("termOf(get().config, 'entity.family'");
  });
});

describe('☢️ ratchet — shop7 (מתנדב דרך volWord/termOf)', () => {
  it('אין "מתנדב" קשיח במחרוזות-התצוגה של החלוקה', () => {
    for (const s of ['שם המתנדב', 'בחרו מתנדב', '<th>מתנדב</th>', 'שייך למתנדב', "label=\"מתנדב *\""])
      expect(shop7Src, `דליפת-מתנדב חזרה: "${s}"`).not.toContain(s);
    expect(shop7Src).toContain('volWord');
  });
});

describe('☢️ ratchet — supporters (מודאל/כותרות/טוסטים דרך termOf)', () => {
  it('מודאל-המיזוג: כותרת+גוף עוברים termOf (לא "כפולי-תורמים"/"כל התרומות" קשיחים)', () => {
    expect(dedupSrc).not.toContain("title=\"🔗 איחוד כפולי-תורמים\"");
    expect(dedupSrc).not.toContain('כל התרומות והקבלות של האחרים');
    expect(dedupSrc).toContain("termOf(config, 'nav.supporters'");
  });
  it('SupportersView: כותרות-עמודה עוברות headLabel(termOf)', () => {
    expect(supViewSrc).toContain('const headLabel =');
    expect(supViewSrc).toContain('headLabel(h)');
    expect(supViewSrc).toContain("termOf(config, 'entity.donations'");
  });
  it('DonationModal/SupporterDetail: טוסט/tooltip עברו termOf (לא "התורם" קשיח)', () => {
    expect(donationSrc).not.toContain('של התורם/ת');
    expect(donationSrc).toContain("termOf(config, 'entity.supporter'");
    expect(supDetailSrc).not.toContain('למייל התורם');
    expect(supDetailSrc).toContain("termOf(config, 'entity.supporter'");
  });
});

describe('☢️ ratchet — עורך-הלוח (שמות-ווידג\'ט מונחיים)', () => {
  it('ווידג\'טי-הישות נושאים labelTerm; העורך מרנדר דרך wLabel(termOf)', () => {
    expect(widgetsSrc).toContain("labelTerm: ['nav.families'");
    expect(widgetsSrc).toContain("labelTerm: ['nav.supporters'");
    expect(widgetsSrc).toContain("labelTerm: ['nav.courses'");
    expect(boardSrc).toContain('const wLabel =');
    expect(boardSrc).toContain('wLabel(w)');
    expect(boardSrc).toContain('wLabel(HOME_WIDGETS[id])');
  });
});
