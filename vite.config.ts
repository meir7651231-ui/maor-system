import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
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
  return {
    name: 'maor-version-file',
    // ביקורת-e2e 1.9: בלי apply:'build' ההוק רץ גם תחת vitest ודרס את dist/version.json
    // בחותמת חדשה ⇒ אי-התאמה ל-__BUILD_ID__ המוטבע ⇒ באנר-"גרסה-חדשה" כוזב ב-e2e.
    apply: 'build',
    closeBundle() {
      writeFileSync(join(__dirname, 'dist', 'version.json'), JSON.stringify({ id: BUILD_ID }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react(), versionFile()],
  build: {
    rolldownOptions: {
      output: {
        /**
         * משקל-ההפעלה (W, 14.10.2026): ה-chunks העצלים של ארגז-המנועים (מתאם-המסלול, מנוע-ההשפעה) צורכים את
         * `lib/config` בלי persist ⇒ rolldown פיצל את config ל-chunk-הפעלה משלו (+494B gzip ובקשה נוספת לכל ארגון).
         * הקבוצה מצמידה את persist+config (ותלויותיהם) ל-chunk אחד — ביט-זהה ל-persist של b063a79.
         * linkShape נשאר נפרד (ואיתו `atoms/capShape` — ריפוי-צורת היכולות, ATOMS 14.10; אותו chunk ⇒ אין בקשה נוספת), בעדיפות גבוהה יותר. נעול: src/lib/__tests__/startup-chunks.test.ts + scripts/bundle-budget.mjs.
         */
        codeSplitting: {
          groups: [
            { name: 'linkShape', test: /[\\/]src[\\/]lib[\\/](enginebox[\\/]linkShape|atoms[\\/]capShape)\.ts$/, priority: 2 },
            { name: 'persist', test: /[\\/]src[\\/](store[\\/]persist|lib[\\/]config)\.ts$/, priority: 1 },
          ],
        },
      },
    },
  },
})
