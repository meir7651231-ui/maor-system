/**
 * ratchet (הגנת-מקור) — מלכודת-גלגלת (בקשת-בעלים 16.8: "בגלילה של החוגים למטה
 * הוא רק נותן במסך מגע ולא בגלילה עם עכבר"). הבאג: מיכל עם `overflow-x: auto`
 * לבדו — חוק-ה-CSS הופך את `overflow-y` ל-`auto`, כך שהמיכל נעשה scroll-container
 * אנכי בלי גלילה-אנכית בפועל; Chrome "בולע" בו את הגלגלת במקום לשרשר לדף (touch
 * ממשיך לעבוד). התיקון: לכל מיכל-גלילה-אופקי מקבעים `overflow-y: hidden` —
 * הפופאפים הם מודאלים (ActionsMenu פותח Modal), כך שאין חיתוך.
 */
import { describe, expect, it } from 'vitest';

const FILES = import.meta.glob(
  [
    '../supporters/SupportersView.tsx',
    '../supporters/SupporterDetail.tsx',
    '../settings/RoomsSection.tsx',
    '../settings/TeachersSection.tsx',
    '../settings/BackupSection.tsx',
    '../courses/CoursesView.tsx',
    '../courses/CourseDetail.tsx',
    '../home/widgets.tsx',
    '../shop/IntakePanel.tsx',
    '../reports/parts.tsx',
    '../families/FamilyPanels.tsx',
    '../families/FamiliesView.tsx',
    '../builder/BuilderWizard.tsx',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

describe('🖱 ratchet — מלכודת-גלגלת: כל מיכל-גלילה-אופקי מקבע overflow-y', () => {
  it('אף מיכל אינו נשאר עם overflowX:auto לבדו (בלי overflowY נלווה)', () => {
    for (const [path, src] of Object.entries(FILES)) {
      // כל שורת overflowX:'auto' חייבת ללוות ב-overflowY (hidden) בקרבתה (אותו style-object)
      const idxs = [...src.matchAll(/overflowX: 'auto'/g)].map((m) => m.index ?? 0);
      for (const i of idxs) {
        const window = src.slice(Math.max(0, i - 200), i + 200);
        expect(window, `${path}: overflowX:'auto' בלי overflowY נלווה`).toContain("overflowY: 'hidden'");
      }
    }
  });
});
