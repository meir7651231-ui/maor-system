// מייצר את קובצי הלוגו הציבוריים מהמקור היחיד src/brand/logo.ts. הרצה: npm run logo
import { writeFileSync } from 'node:fs';
import { PUBLIC_FILES } from '../src/brand/logo.ts';
for (const [name, svg] of Object.entries(PUBLIC_FILES)) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), svg);
  console.log(`✓ public/${name}`);
}
