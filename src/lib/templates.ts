/**
 * 📝 תבניות-הודעה עריכות (ROADMAP-100 ‏#12, 5.8.2026) — טהור.
 * המנהל מנסח פר-ארגון את נוסחי-ההודעות (וואטסאפ) דרך האשף; חסר/ריק ⇒
 * נוסח-ברירת-המחדל (זהה ביט-אחר-ביט לנוסחים הקבועים שקדמו למנגנון).
 * משתני-תבנית בסוגריים-מסולסלים ({name}, {org}…) — החלפה טקסטואלית פשוטה,
 * משתנה לא-מוכר נשאר כפי-שהוא (גלוי למנהל ⇒ מתקן באשף).
 */
import type { OrgConfig } from '../types/config';

export interface TemplateDef {
  key: string;
  label: string;
  /** המשתנים הזמינים — מוצגים כרמז באשף. */
  vars: string[];
  /** נוסח ברירת-המחדל — חייב להישאר זהה לנוסח הקבוע ההיסטורי (ratchet). */
  def: string;
}

export const TEMPLATE_DEFS: TemplateDef[] = [
  {
    key: 'wa.delivery',
    label: '🚚 הודעת-מסירה (חלוקה)',
    vars: ['name', 'org'],
    def: 'שלום {name}, משלוח מ{org} בדרך אליכם היום 🚚',
  },
  {
    key: 'wa.payment',
    label: '💳 תזכורת-תשלום (חוגים)',
    vars: ['org', 'what', 'amount'],
    def: 'שלום, תזכורת ידידותית מ{org}: יתרה לתשלום עבור {what} — ₪{amount}. תודה רבה!',
  },
  {
    key: 'wa.birthday',
    label: '🎂 ברכת יום-הולדת',
    vars: ['first', 'org'],
    def: 'מזל טוב ל{first} ליום ההולדת! 🎂 באהבה, {org}',
  },
  {
    // חייגן-מונחה (20.8) — "לא ענה? שלח וואטסאפ" בקמפיין-שיחות; עריך באשף כמו השאר
    key: 'wa.dialer',
    label: '📞 הודעת-חייגן (לא ענה)',
    vars: ['name', 'org'],
    def: 'שלום {name}, ניסינו להשיג אתכם מ{org} ולא הצלחנו — נשמח שתחזרו אלינו 🙏',
  },
  {
    // קישור-תשלום מהחייגן (20.8) — שליחת עמוד-התרומה בוואטסאפ תוך-שיחה (payments)
    key: 'wa.paylink',
    label: '💳 שליחת קישור-תשלום',
    vars: ['name', 'org', 'link'],
    def: 'שלום {name}, תודה על השיחה! לתרומה מקוונת ל{org}: {link} 🙏',
  },
];

export const TEMPLATE_KEYS = TEMPLATE_DEFS.map((d) => d.key);

/** רינדור תבנית: דריסת-הארגון (config.templates) גוברת; ריק ⇒ ברירת-המחדל. */
export function renderTemplate(
  cfg: Pick<OrgConfig, 'templates'> | undefined,
  key: string,
  vars: Record<string, string>,
): string {
  const def = TEMPLATE_DEFS.find((d) => d.key === key)?.def ?? '';
  let t = (cfg?.templates?.[key] ?? '').trim() || def;
  for (const [k, v] of Object.entries(vars)) t = t.split('{' + k + '}').join(v);
  return t;
}
