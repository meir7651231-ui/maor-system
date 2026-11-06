// סבב קונספטים ללוגו גבי — מקור יחיד לחמשת הכיוונים. הסיפור: «הכסף שלך חוזר. בלי שתצטרך לרדוף.»
// כל קונספט = פונקציה (fg, accent, bg) ⇒ תוכן SVG ב-viewBox 64. fg = נייבי בבהיר / קרם בכהה.
export const C = { green: '#10B981', navy: '#0F172A', cream: '#FBF8F1' };

export const CONCEPTS = [
  {
    id: 'boomerang', name: 'בומרנג', story: 'שולחים תזכורת אחת — והיא חוזרת עם הכסף. תנועה החוצה ובחזרה, בלי ריצה אחריה.',
    svg: (fg, ac) => `
      <path d="M10 30 Q22 22 30 10 Q34 6 38 10 Q44 22 54 30 Q56 34 52 36 Q40 30 34 20 Q28 30 14 36 Q8 36 10 30 Z" fill="${ac}"/>
      <path d="M54 44 Q46 56 32 56 Q20 56 13 49" fill="none" stroke="${fg}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M19 45 L12 49 L16 56" fill="none" stroke="${fg}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: 'palm', name: 'כף יד פתוחה', story: 'לא רודפים — מקבלים. המטבע נוחת בכף יד פתוחה ורגועה.',
    svg: (fg, ac) => `
      <path d="M8 34 Q10 54 32 54 Q50 54 54 40 L58 30" fill="none" stroke="${ac}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 44 L52 32" fill="none" stroke="${ac}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="30" cy="22" r="11" fill="${fg}"/>
      <circle cx="30" cy="22" r="6.5" fill="none" stroke="${ac}" stroke-width="3"/>`,
  },
  {
    id: 'bell', name: 'פעמון מנומס', story: 'תזכורת עדינה, בזמן הנכון. הלב של הפעמון הוא מטבע — הצלצול הוא הכסף שמגיע.',
    svg: (fg, ac) => `
      <path d="M18 44 V30 a14 14 0 0 1 28 0 V44 l5 5 H13 Z" fill="${ac}" stroke="${ac}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="32" cy="55" r="6" fill="${fg}"/>
      <path d="M32 10 v6" stroke="${ac}" stroke-width="5" stroke-linecap="round"/>
      <path d="M8 22 q-3 6 0 12 M56 22 q3 6 0 12" fill="none" stroke="${fg}" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  {
    id: 'magnet', name: 'מגנט', story: 'הכסף נמשך אליך. אתה לא זז — הוא בא.',
    svg: (fg, ac) => `
      <g transform="rotate(-45 30 34)">
        <path d="M16 14 V34 a14 14 0 0 0 28 0 V14" fill="none" stroke="${ac}" stroke-width="10"/>
        <rect x="11" y="8" width="10" height="8" rx="2" fill="${fg}"/>
        <rect x="39" y="8" width="10" height="8" rx="2" fill="${fg}"/>
      </g>
      <circle cx="51" cy="13" r="7" fill="${fg}"/>
      <path d="M41 19 l-3 3 M45 24 l-3 3" stroke="${fg}" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    id: 'loop', name: 'מעגל שנסגר', story: 'חשבונית יוצאת — התשלום חוזר והמעגל נסגר. הווי באמצע: שולם.',
    svg: (fg, ac) => `
      <path d="M50 22 A22 22 0 1 0 54 36" fill="none" stroke="${ac}" stroke-width="7" stroke-linecap="round"/>
      <path d="M43 20 L51 21 L52 13" fill="none" stroke="${ac}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 33 l7 7 l13 -14" fill="none" stroke="${fg}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
];

export const svgFor = (c, theme, px) => {
  const dark = theme === 'dark';
  const fg = dark ? C.cream : C.navy;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי — ${c.name}">${c.svg(fg, C.green).trim()}</svg>`;
};
