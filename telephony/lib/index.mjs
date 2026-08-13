// ─────────────────────────────────────────────────────────────────────────────
// telephony · index — התזמור: קונפיג-לקוח גולמי → קבצים מוכנים-להתקנה.
// זו הפונקציה שהמוצר קורא לה בכל onboarding: אין הרכבה-ידנית, רק נתונים→מרכזייה.
// ─────────────────────────────────────────────────────────────────────────────

import { validateTenant } from './validate.mjs';
import { generateConfig } from './generate.mjs';
import { effectiveConfig } from './config.mjs';

/**
 * לוקח קונפיג-לקוח גולמי ומחזיר את התוצאה המלאה.
 * @param {object} raw
 * @returns {{ok:boolean, errors:string[], warnings:string[], files?:Record<string,string>, manifest?:object}}
 */
export function buildTenant(raw, opts = {}) {
  // שכבות-הרשאה (מפעיל→לקוח→עובד) — נמזגות לפני הוולידציה. בלי layers = ביט-זהה.
  let cfg = raw;
  if (opts.layers && (opts.layers.base || opts.layers.member)) {
    const eff = effectiveConfig(opts.layers.base || {}, raw, opts.layers.member || null);
    cfg = { ...raw, features: eff.features, terms: eff.terms };
  }
  const { ok, errors, warnings, tenant } = validateTenant(cfg);
  if (!ok) return { ok: false, errors, warnings };
  const { files, manifest } = generateConfig(tenant, warnings, opts);
  return { ok: true, errors: [], warnings, files, manifest };
}

export { validateTenant } from './validate.mjs';
export { generateConfig } from './generate.mjs';
export { toE164, sameNumber } from './normalize.mjs';
export {
  buildDirectory, lookupCaller, lookupInDirectory, enrichContact, screenPop,
  callEvent, dialString, callHistoryFor, maskNumber, popPriorityFor, SCREENPOP_VERSION,
} from './cti.mjs';
export {
  tenantFromIntake, INTAKE_STEPS, numbersFromCsv, detectNumberType, stepsFor,
  provisioningQr, seedVertical, routingPreview, preflight, exportConfig, cloneTenant,
} from './onboard.mjs';
export {
  planApply, rollbackPlan, planTenants, summarize, snapshot, pushSnapshot, restoreFrom,
  detectDrift, reloadPlan, healthReport, pushAudit, applyWithRollback, lineDiff,
  detailedDiff, changelogEntry, planApplyRespectingFreeze, batchSummary,
} from './apply.mjs';
export {
  channelPlan, isPureDownstream, templateOf, sanitizeTemplates, renderTemplate, TEMPLATE_DEFS,
  unifiedInboxOf, normalizeMessage, autoReply, applyConsent, canMessage, assignMessage,
  reminderMessage, senderIdentity, conversationTimeline, channelUsage, matchMessageContact,
} from './channels.mjs';
export {
  flagOn, featureOn, termOf, expandTerms, applyVertical, VERTICAL_PACKS,
  capabilities, migrateConfig, effectiveConfig, diffConfig, isBaselineConfig,
  sanitizeConfigFields, FLAG_DEFAULTS, TERM_DEFS, SCHEMA_VERSION,
} from './config.mjs';
export { hebParts, classifyDay, hebrewClosedDates } from './hebcal.mjs';
export {
  secretsFor, secretsIsolated, can, ROLES, hardeningChecklist, recordingEncryption,
  failsafeRoute, complianceReport,
} from './security.mjs';
export { normalizeCdr, meterUsage, computeInvoice, checkQuota, planQuota, PLANS } from './billing.mjs';
export { normalizeRouting, numbersAlternation } from './routing.mjs';
export { promptDir, requiredPrompts, promptCapabilities } from './prompts.mjs';
