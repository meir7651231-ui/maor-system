// ─────────────────────────────────────────────────────────────────────────────
// Bridge: the maor React app → the pure telephony engine (telephony/lib, browser-safe ESM).
//
// The engine is authored + hardened as .mjs under telephony/ (677 tests, 5 golden sets).
// TypeScript resolves those real .mjs files on disk, so an ambient `declare module` never
// wins over them (a wildcard only fills in for *unresolved* specifiers). The robust seam is
// therefore right here: import the untyped functions (one @ts-expect-error per specifier to
// swallow the "no declaration file" TS7016), then re-export them through explicit typed
// signatures. Downstream (components/telephony/lib.ts + the wizard) sees real types.
//
// The engine invariant (the moat) is unchanged: pure-downstream, no provider/API/trunk,
// no tax-receipt issuance. This file only bridges — it adds no behavior.
// ─────────────────────────────────────────────────────────────────────────────

// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { validateTenant as rawValidateTenant, buildTenant as rawBuildTenant } from '../../../telephony/lib/index.mjs';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { simulateCall as rawSimulateCall, explainCall as rawExplainCall } from '../../../telephony/lib/simulate.mjs';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { trustReport as rawTrustReport } from '../../../telephony/lib/report.mjs';

/** תוצאת אימות-דייר — ok + שגיאות/אזהרות + הדייר המנורמל (עובר לסימולטור). */
export interface ValidateResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  tenant: unknown;
}

/** תוצאת בניית-קונפיג — קבצי-ה-PBX (path→תוכן) + manifest, כשה-ok. */
export interface BuildResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  files?: Record<string, string>;
  manifest?: Record<string, unknown>;
  tenant?: unknown;
}

/** תוצאת סימולציית-שיחה — המסלול שהמנוע יבחר + התוצאה. */
export interface SimResult {
  path: string[];
  outcome: string;
  reason?: string;
}

/** תיאור-שיחה קריא-לאדם (סיכום עברי + שורות-הסבר). */
export interface ExplainResult {
  outcome: string;
  reason: string;
  summary: string;
  lines: string[];
  sim: unknown;
}

/** בדיקה בודדת בדוח-האמון. */
export interface TrustCheck {
  key: string;
  label: string;
  pass: boolean;
  severity: string;
  detail: string;
}

/** דוח-אמון — ציון A–F, מוכנות-להפעלה, ורשימת-הכשלים. */
export interface TrustResult {
  tenantId: string;
  checks: TrustCheck[];
  failing: TrustCheck[];
  score: number;
  grade: string;
  ready: boolean;
}

export const validateTenant = rawValidateTenant as (raw: unknown) => ValidateResult;
export const buildTenant = rawBuildTenant as (
  raw: unknown,
  opts?: { anchorDate?: string; calendarWindow?: number },
) => BuildResult;
export const simulateCall = rawSimulateCall as (
  tenant: unknown,
  call?: Record<string, unknown>,
  opts?: Record<string, unknown>,
) => SimResult;
export const explainCall = rawExplainCall as (
  tenant: unknown,
  call?: Record<string, unknown>,
  opts?: Record<string, unknown>,
) => ExplainResult;
export const trustReport = rawTrustReport as (bundle: unknown, opt?: Record<string, unknown>) => TrustResult;
