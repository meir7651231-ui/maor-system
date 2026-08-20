/**
 * ratchet — אינטראקטיביות המסכים החדשים (ביקורת-בעלים "בנוי חצי / איפה ללחוץ").
 * מקבע שהמשטחים שהיו קריאה-בלבד הפכו לשערי-פעולה, כדי שלא יחזרו להיות "תמונה".
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import cockpitSrc from '../SupportersCockpit.tsx?raw';
import galaxySrc from '../SupportersGalaxy.tsx?raw';
import cardSrc from '../SupporterCard.tsx?raw';
import intelSrc from '../SupportersIntel.tsx?raw';

describe('💛 ratchet — אינטראקטיביות המסכים החדשים', () => {
  it('🛡 סגמנטי-הקוקפיט מסננים באמת (onSegment→segF), לא רק onExit זהה', () => {
    // הבאג: כל צ׳יפ קרא props.onExit בלי מפתח ⇒ כפתורים זהים מחופשים לסינון.
    expect(cockpitSrc).toContain('props.onSegment ? props.onSegment(s.key)');
    expect(viewSrc).toContain('onSegment={(k) => { setSegF(k); setWorkMode(false); }}');
    expect(viewSrc).toContain('matchSegment(sp, segF, visibleBase, today, rate)');
  });

  it('🛡 הגלקסיה כוללת רשימת-נתונים לחיצה (לא רק canvas)', () => {
    expect(galaxySrc).toContain('רשימת-הכוכבים');
    expect(galaxySrc).toContain('onClick={() => props.onOpen(n.id)}');
  });

  it('🛡 לשונית-המודיעין בכרטיס מובילה לפעולה (עריכה/חיוג/וואטסאפ)', () => {
    expect(cardSrc).toContain('עריכה ופעולות בכרטיס');
    expect(cardSrc).toContain('onGoCard');
    expect(cardSrc).toContain('CallBtn');
    expect(cardSrc).toContain('WaBtn');
  });

  it('🛡 כרטיס-הצלילה במרכז-המודיעין פותח את הכרטיס המלא', () => {
    expect(intelSrc).toContain('onOpen={props.onOpen}');
    expect(intelSrc).toContain('פתח כרטיס');
  });

  it('🛡 אריחי-הסיכון (מודיעין/רצועת-KPI/קוקפיט) מובילים לרשימת-הבסיכון', () => {
    // ₪ בסכנה במודיעין
    expect(intelSrc).toContain("props.onSegment!('atrisk')");
    // רצועת-KPI — אריח-הסיכון
    expect(viewSrc).toContain("onRisk={() => setSegF(segF === 'atrisk' ? null : 'atrisk')}");
    // קוקפיט KPI — אריח-הסיכון
    expect(cockpitSrc).toContain("props.onSegment!('atrisk')");
  });

  it('🛡 מפת-העונתיות + קוהורטת-הגיוס מסננות (חודש/שנת-גיוס)', () => {
    expect(intelSrc).toContain('onMonth={props.onMonth}');
    expect(intelSrc).toContain('onYear={props.onYear}');
    expect(intelSrc).toContain("props.onMonth!(m.month)");
    expect(intelSrc).toContain("props.onYear!(c.year)");
    // מסך-הנתונים מקבל את הדריל-אין ומסנן
    expect(viewSrc).toContain('supGaveInMonth(sp, monthF)');
    expect(viewSrc).toContain('supAcqYear(sp) !== acqYearF');
  });

  it('🛡 מקרא-הגלקסיה מסנן דרגה + הפוטר האינרטי הפך לכפתור', () => {
    expect(galaxySrc).toContain('setTierHi(tierHi === k ? null : k)');
    expect(galaxySrc).toContain('n.tier === tierHi');
    expect(intelSrc).toContain('למסך-הנתונים המלא ↗');
  });
});
