<p align="right"><b>English</b> · <a href="ARCHITECTURE.he.md">עברית</a></p>

# Architecture

Orbit is a **static, local-first single-page app**. One build serves every organization; who you are is decided by configuration, and where your data lives is decided by you. Everything below is taken from the code; file references point to where each piece lives.

<picture>
  <source media="(prefers-color-scheme: light)" srcset="../assets/how.en.light.svg">
  <img src="../assets/how.en.svg" alt="Per-organization config dresses the app; data is kept in three local layers; cloud and encryption are optional" width="100%">
</picture>

## Stack

React 19 · TypeScript · Vite 8 · Zustand (one store) · `idb` (IndexedDB) · Firebase (loaded with a dynamic `import()` only when an organization configures it) · Three.js (sign-up hero only, in its own lazy chunk).

## Startup and the gate chain

`src/App.tsx` is the shell: navigation lives in the store (no router), and modals are addressed by URL hash. Before any screen renders, the app passes a chain of gates:

```mermaid
flowchart LR
  A[load config] --> B{data encrypted<br/>at rest?}
  B -- yes --> C[EncUnlockScreen]
  B -- no --> D{cloud configured?}
  C --> D
  D -- yes --> E[sign-in / membership<br/>CloudUnlockScreen if the cloud copy is encrypted]
  D -- no --> F{PIN lock set?}
  E --> F
  F -- yes --> G[LockScreen]
  F -- no --> H[app]
  G --> H
```

## Configuration (white-label)

`loadOrgConfig()` in `src/lib/config.ts` resolves the organization in this order:

1. `?org=<slug>` (or a custom domain mapped to a slug) ⇒ the cached cloud config for that slug if one exists, otherwise `public/c/<slug>/config.json` — one deployment serves any number of organizations;
2. a runtime override in `localStorage` (`maor_org_config`, written by the builder wizard) — only when it belongs to the same slug, and never the demo's override at the root;
3. `./config.json` next to the build;
4. `DEFAULT_CONFIG` when nothing loads.

Every loaded config goes through `normalizeConfig`, which sanitizes it with allow-lists (themes, motion, integrations, templates, https-only URLs).

A config carries **feature flags** (`src/types/features.ts`, 328 today), **terms** (46 — what this organization calls a "family", a "class", a "donor"), a **theme** (4) and optionally a **vertical pack** (`src/lib/verticalPacks.ts`, 13) that sets modules, terms, theme, accent and icon together.

## The core: config → termOf / featureOn / moduleOn

Everything that makes one organization look and behave differently from another flows through **three pure functions** in `src/lib/config.ts`. Components never test for an organization; they ask the config:

| Function | Contract | Used on (grep, lines in `src/`) |
|---|---|---|
| `termOf(cfg, key, fallback)` | the organization's word for a concept ("patients" instead of "families"); empty or missing ⇒ the fallback | 925 |
| `featureOn(cfg, key)` | **missing = on, only `false` turns off**; any parent flag set to `false` turns off its children, and so does turning off the module (the first segment of the key) | 634 |
| `moduleOn(cfg, module)` | a navigation module is shown unless `modules[m] === false` | 81 |

A **vertical pack** is just a preset for that config: `applyVerticalPack(config, packId)` (`src/lib/verticalPacks.ts`) replaces `terms`, `modules` and `features` with the pack's values and applies its theme, accent, icon and motion. An accent the organization picked by hand (`accentCustom`) is kept. The vertical a customer picks at sign-up (`lib/signupWizard.ts`, step 1) is seeded as the starting pack when the owner approves the request in the control panel (`PlatformPanel` → `applyVerticalPack`); from there the builder wizard (`#builder`) fine-tunes the same config — so the "fit" for each organization is data, not code.

```mermaid
flowchart LR
  P[vertical pack<br/>VERTICAL_PACKS] -->|applyVerticalPack| C[OrgConfig<br/>terms · modules · features · theme]
  W[builder wizard<br/>switches] --> C
  C --> T[termOf]
  C --> F[featureOn]
  C --> M[moduleOn]
  T --> UI[every screen]
  F --> UI
  M --> UI
```

A browser matrix (`npm run e2e:verticals`) loads the config each pack produces, visits every screen, and fails if a default term leaks through instead of the pack's term.

## Data and persistence

The whole dataset is **one document** (`Db` in `src/types/domain.ts`, `DB_VERSION = 6`) with 23 entity collections plus counters. Receipt numbers come from dedicated, strictly sequential counters (`receiptSeq`, `donationSeq`).

`src/store/persist.ts` writes it through three layers:

| Layer | When | Purpose |
|---|---|---|
| `localStorage` | 500 ms after each change (debounced) | instant restore on reload |
| `IndexedDB` | alongside, plus a ring of **30 daily snapshots** | second copy and self-recovery |
| JSON backup files | manual download, and automatic at end of day | copy outside the browser |

On load, a single cumulative `migrate()` heals older or damaged data (counters, duplicate receipt ids, member ids) before the app sees it. A multi-tab guard listens to `storage` events so two tabs do not overwrite each other.

## Cloud sync (optional)

When `config.firebase` is present, `src/store/cloudSync.ts` connects the store to Firestore (`src/lib/cloud*.ts`):

- **first sign-in:** an empty cloud receives a full upload; a populated cloud replaces the local copy (local layers keep writing — the cloud is an extra layer, not a replacement);
- **live updates:** remote changes are merged into the store without echoing them back;
- **local changes:** debounced 800 ms, diffed (`diffDb`) and pushed per collection;
- **deletions** leave tombstones (`delLog`) so an offline device cannot resurrect them;
- **config writes** to the cloud are field-by-field patches, never full snapshots.

Access is enforced by `firestore.rules` (allow-listed e-mails, org manager, staff), which is red-teamed against the emulator in CI (`npm run test:rules`).

## Key decisions

1. **Local-first, static hosting.** No server is required to run the app; data stays in the organization's browser with three layers of protection. The cloud is opt-in per organization.
2. **White-label by configuration, not by fork.** One codebase, one build; each organization is a `config.json`. Terms go through `termOf`, features through `featureOn`.
3. **Flag contract: a missing key means on, only `false` turns off** (see [the core](#the-core-config--termof--featureon--moduleon)). Turning off a parent flag turns off its children (`featureOn`). Features that must never switch on by default use an explicit `=== true` opt-in instead.
4. **Pure logic, tested.** Each module is a pure `lib.ts` (no store, no DOM) with unit tests beside it; every fixed bug gets a "ratchet" test that keeps it fixed.
5. **Money stays sequential.** Receipt counters only move forward, cloud merges never decrease them, and isolated modules (shop, charity boxes, distribution) never write into donations or receipts.

## Where to look

| Area | Files |
|---|---|
| Shell, gates, navigation | `src/App.tsx` |
| Data model | `src/types/domain.ts` |
| Flags and terms | `src/types/features.ts`, `src/lib/config.ts` |
| Store (all business actions) | `src/store/useApp.ts` |
| Persistence and migration | `src/store/persist.ts` |
| Cloud | `src/store/cloudSync.ts`, `src/lib/cloud*.ts`, `firestore.rules` |
| Hebrew calendar | `src/lib/hebrew.ts`, `src/lib/hebdate.ts` (built on `Intl` only) |
| Encryption and PIN lock | `src/lib/crypto.ts`, `src/lib/lock.ts`, `src/lib/cloudCrypto.ts` |
| Server functions (optional) | `functions/index.js` |
