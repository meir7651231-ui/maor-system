// ─────────────────────────────────────────────────────────────────────────────
// telephony · index — התזמור: קונפיג-לקוח גולמי → קבצים מוכנים-להתקנה.
// זו הפונקציה שהמוצר קורא לה בכל onboarding: אין הרכבה-ידנית, רק נתונים→מרכזייה.
// ─────────────────────────────────────────────────────────────────────────────

import { validateTenant } from './validate.mjs';
import { generateConfig } from './generate.mjs';

/**
 * לוקח קונפיג-לקוח גולמי ומחזיר את התוצאה המלאה.
 * @param {object} raw
 * @returns {{ok:boolean, errors:string[], warnings:string[], files?:Record<string,string>, manifest?:object}}
 */
export function buildTenant(raw) {
  const { ok, errors, warnings, tenant } = validateTenant(raw);
  if (!ok) return { ok: false, errors, warnings };
  const { files, manifest } = generateConfig(tenant, warnings);
  return { ok: true, errors: [], warnings, files, manifest };
}

export { validateTenant } from './validate.mjs';
export { generateConfig } from './generate.mjs';
export { toE164, sameNumber } from './normalize.mjs';
export { buildDirectory, lookupCaller, lookupInDirectory } from './cti.mjs';
export { tenantFromIntake, INTAKE_STEPS } from './onboard.mjs';
export { planApply, rollbackPlan, planTenants, summarize } from './apply.mjs';
export { channelPlan, isPureDownstream } from './channels.mjs';
export {
  flagOn, featureOn, termOf, expandTerms, applyVertical, VERTICAL_PACKS,
  capabilities, migrateConfig, effectiveConfig, diffConfig, isBaselineConfig,
  sanitizeConfigFields, FLAG_DEFAULTS, TERM_DEFS, SCHEMA_VERSION,
} from './config.mjs';
