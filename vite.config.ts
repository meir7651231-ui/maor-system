import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * מזהה-גרסה לריפוי-לשוניות-תקועות (5.8.2026): לקוחות משאירים לשונית פתוחה
 * ימים — היא לעולם לא נטענת מחדש ומציגה גרסה עתיקה (נצפה בשטח: מסך-Passkey
 * מאיטרציה שנמחקה). ה-build מטביע מזהה בקוד וכותב version.json ל-dist;
 * האפליקציה משווה ברגע-חזרה-ללשונית ומרעננת את עצמה. ראה App.tsx.
 */
const BUILD_ID = new Date().toISOString()

function versionFile(): Plugin {
  // 22.10.2026: נכתב לתיקיית-הפלט האמיתית של ה-build (build.outDir), לא ל-dist קשיח — build
  // מקביל ל-outDir אחר (בדיקות-e2e) דרס את dist/version.json של ה-build המוגש ⇒ באנר-"גרסה-חדשה"
  // כוזב שכיסה את הניווט. ב-build הרגיל (root=הפרויקט, outDir='dist') — אותו נתיב בדיוק.
  let outDir = join(__dirname, 'dist')
  return {
    name: 'maor-version-file',
    // ביקורת-e2e 1.9: בלי apply:'build' ההוק רץ גם תחת vitest ודרס את dist/version.json
    // בחותמת חדשה ⇒ אי-התאמה ל-__BUILD_ID__ המוטבע ⇒ באנר-"גרסה-חדשה" כוזב ב-e2e.
    apply: 'build',
    configResolved(cfg) {
      outDir = resolve(cfg.root, cfg.build.outDir)
    },
    closeBundle() {
      writeFileSync(join(outDir, 'version.json'), JSON.stringify({ id: BUILD_ID }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react(), versionFile()],
})
