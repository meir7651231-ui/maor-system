# Changelog · יומן שינויים

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project deploys continuously from `main` and **has no version tags yet**. The version numbers below are a **SemVer proposal** for the history (no tag was created). Entries are dated from `git log` on `main`; references are PR numbers or close-out reports in [`knowledge/`](knowledge/).

הפורמט לפי Keep a Changelog. אין עדיין תגיות-גרסה. המספרים הם **הצעת SemVer** בלבד, והתאריכים מ-`git log`.

> **SemVer proposal:** tag the current production `main` (`0f33b41`, 2026-11-06) as **`v1.0.0`**. From then on: PATCH for fixes, MINOR for additive features behind flags, MAJOR only for a breaking data or config change (for example a `DB_VERSION` bump that needs a one-way migration).

## [Unreleased]
### Added
- Repository presentation: bilingual README with light/dark images, a demo GIF, real screenshots, `docs/ARCHITECTURE`, `docs/GUIDE.he.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `SECURITY.md`, issue and PR templates. No product code changed.

## [0.7.0] — 2026-11-06 (proposed)
### Added
- Live public site per organization, payment links with full details (`CLOSED-SITE-LIVE`, `CLOSED-PAYLINK-FULL-DETAILS`).
- Public-site editor, Spanish and French translations, domain and polish (`CLOSED-SITE-EDITOR`, `CLOSED-SITE-ES-FR-SOLA`, `CLOSED-PUBLIC-SITE-*`).
- Charity boxes: buttons and reminders; sign-up notifications (`CLOSED-TZEDAKA-*`, `CLOSED-SIGNUP-NOTIFY`).
### Fixed
- The server's nightly backup now includes organizations stored at root paths (#519, `CLOSED-G1-ROOT-BACKUP`).

## [0.6.0] — 2026-10-13 (proposed)
### Added
- Multiple phones per family, duplicate detection across all phones, Hebrew/Gregorian reminder tracks (`CLOSED-OWNER-LIST-2026-10-13`).
- Donor-card layout editor (`CLOSED-CARDLAYOUT`).
### Changed
- Donors screen performance at large scale, with identical output (`CLOSED-PERF-SUPPORTERS-A`).
### Fixed
- Cloud config writes are field-by-field patches, so a flag switched on can no longer be switched back off by a stale full snapshot (`CLOSED-SEGULA-CLOUDCFG-MERGE`).

## [0.5.0] — 2026-09-14 (proposed)
### Added
- Selective removal of demo data (#492); filters remembered across screens (#490); recurring reminders.
### Fixed
- About 45 fixes from deep audits of sync, permissions, performance and accessibility (`CLOSED-E2E-AUDIT`, `CLOSED-DEEP-AUDIT`, `CLOSED-SWARM-B`).

## [0.4.0] — 2026-08-24 (proposed)
### Added
- Donor work window, intelligence layer, 3D universe and photo gallery (#237–#255, #318–#330).
- Eight operations upgrades for classes, plus the teacher app (#281–#301).
- Studio vertical (digital/construction), vCard import, per-vertical visual identity (#158–#164).
### Security
- Trust loop: personal data sealed in exports, PBKDF2 for the PIN lock, deletion tombstones in sync, outbox health, Rules red-team in CI, per-manager cloud encryption (#402–#420, `CLOSED-TRUST`).

## [0.3.0] — 2026-08-06 (proposed)
### Added
- Installable PWA with offline support for hashed assets.
- Standing orders, editable message templates, receipt verification code, duplicate merge (#81–#84).
- Integrations: WhatsApp, maps, ICS calendar, payment links; optional server Functions (nightly backup, mail/SMS outboxes).
### Changed
- The interface simplified in seven rounds (#86–#100, `CLOSED-UX-SIMPLE`).

## [0.2.0] — 2026-07-30 (proposed)
### Added
- SaaS platform: sign-up ⇒ approval ⇒ a site per organization; `firestore.rules` in the repo (`CLOSED-PLATFORM`, `CLOSED-CLOUD2`).
- Isolated modules: charity boxes and service shop (`CLOSED-TZEDAKA`, `CLOSED-SHOP` … `CLOSED-SHOP6`); distribution module and public demo `?org=demo` (2026-08-01).
- Capability-gap closure against the previous single-file version (`CLOSED-P0` … `CLOSED-P3`).

## [0.1.0] — 2026-07-22 (proposed)
### Added
- First commit: the full system as a standalone repository (React 19 + TypeScript + Vite) with automatic deployment.

[Unreleased]: https://github.com/meir7651231-ui/maor-system/compare/0f33b41...HEAD
