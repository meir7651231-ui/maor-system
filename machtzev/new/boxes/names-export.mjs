/** קופסת-חיבורים · כפתור ייצוא-השמות. חוזה: names-export.contract.md
 *  ההלחמות-לשעבר מ-AyinNamesBoard+SupportersView+csvx — עכשיו חיווט גלוי אחד. */
import { csvEscape } from '../atoms/csv-escape.mjs';
import { toCsv } from '../atoms/to-csv.mjs';
import { isAdmin } from '../atoms/is-admin.mjs';

// ── שקעי-תוכן (מילון הקופסה) ──
const LABEL = '⬇ ייצוא CSV';
const FILENAME = 'names-report.csv';

// ── החיווט ──
export function exportNames({ rows, userEmail, adminEmails }) {
  if (!isAdmin(adminEmails, userEmail)) return { allowed: false };
  return { allowed: true, label: LABEL, filename: FILENAME, content: toCsv(rows, csvEscape) };
}
