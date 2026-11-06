<p align="right"><a href="README.md">עברית</a> · <b>English</b></p>

<p align="center"><img src="assets/hero.en.png" alt="Orbit — one management system for any organization; a real screenshot of the Hebrew calendar in the demo" width="100%"></p>

<p align="center">
<img src="https://img.shields.io/badge/React%2019-TypeScript-47bfff?style=for-the-badge&labelColor=0d1120" alt="React 19 + TypeScript">
<img src="https://img.shields.io/badge/data-local--first-f3c76b?style=for-the-badge&labelColor=0d1120" alt="local-first">
<img src="https://img.shields.io/badge/PWA-installable-b9a7ff?style=for-the-badge&labelColor=0d1120" alt="PWA installable">
<img src="https://img.shields.io/badge/UI-Hebrew%20RTL-f4f6fb?style=for-the-badge&labelColor=0d1120" alt="Hebrew RTL UI">
</p>

<h3 align="center">One management system that adapts to any organization — and your data stays with you.</h3>

<p align="center"><a href="#the-problem"><b>The problem</b></a> · <a href="#how-it-works">How it works</a> · <a href="#whats-inside">What's inside</a> · <a href="#see-it">See it</a> · <a href="#run-locally">Run locally</a> · <a href="#what-it-does-not-do">What it does not do</a> · <a href="#code-layout">Code layout</a> · <a href="#faq">FAQ</a> · <a href="#status">Status</a></p>

---

<p align="center"><img src="assets/demo.gif" alt="A short tour of the demo: families, a family card, classes, the Hebrew calendar and the room diary" width="88%"></p>
<p align="center"><sub>Demo tour — <code>?org=demo</code>, made-up data only</sub></p>

> The product UI is in Hebrew (right-to-left). This page is an English summary of the [Hebrew README](README.md).

## The problem

Small organizations — non-profits, after-school programs, clinics, small businesses — run their day across spreadsheets, WhatsApp and notebooks.
"Big" management software needs a server, a monthly subscription and a long setup, and rarely handles the Hebrew calendar, Israeli §46 donation receipts or a right-to-left interface.

**Orbit** is a single static site: the same code, a different configuration per organization, and data kept on the organization's own device — with a cloud only for those who opt in.

<p align="center"><img src="assets/beforeafter.en.svg" alt="Before and after: without Orbit the organization is scattered across tools; with Orbit everything is in one place" width="100%"></p>

## How it works

<p align="center"><img src="assets/how.en.svg" alt="Per-organization config dresses the app; data is kept in three local layers; cloud and encryption are optional" width="100%"></p>

1. **Who you are** — the URL `?org=<slug>` loads `public/c/<slug>/config.json`: feature flags (a missing key means on, only `false` turns off), terms (what you call a "family", "class" or "donor"), a theme and a vertical pack.
2. **Where data lives** — three browser layers: `localStorage` (auto-save half a second after each change) → `IndexedDB` (second copy + a ring of 30 daily snapshots) → JSON backup files (manual + end-of-day). Restore from any layer in Settings.
3. **Optional** — per-organization Firebase sync, and encryption at rest (AES-GCM 256, a data key wrapped by a PBKDF2 password and by a recovery key).

## What's inside

<p align="center"><img src="assets/modules.en.svg" alt="Orbit module grid" width="100%"></p>

<details><summary>As a table, with code locations</summary>

| Area | What it does | Code |
|---|---|---|
| 👪 Contacts (CRM) | Families/clients and members, multiple phones, duplicate detection and merge | `src/components/families` |
| 🎓 Classes & enrollment | Punch cards and payments, inverted attendance (record only absences), waiting list | `src/components/courses` |
| 📅 Calendar | Hebrew–Gregorian, holidays, recurrence by Hebrew date — built on `Intl` only | `src/components/calendar` · `src/lib/hebrew.ts` |
| 🚪 Room diary | Room booking, holiday and fast-day blocking | `src/components/diary` |
| 💛 Donors & receipts | Donations, standing orders, sequentially numbered receipts (§46) | `src/components/supporters` |
| 📊 Reports | Printing and CSV export | `src/components/reports` |
| 🛍 Isolated modules | Service shop, distribution days & volunteers, charity boxes — each in its own column | `shop` · `shop7` · `tzedaka` |
| 🧩 Builder wizard | Pick a vertical ⇒ modules, terms, theme and icon | `src/components/builder` · `src/lib/verticalPacks.ts` |
| ☁ Platform | Sign-up ⇒ approval ⇒ a site per organization; org-manager and staff hierarchy | `src/components/platform` |
| 🔒 Lock & encryption | PIN lock, encryption at rest, privacy mode | `src/components/lock` · `src/lib/crypto.ts` |

</details>

**13 ready-made vertical packs** and **4 themes**.

<p align="center"><img src="assets/numbers.en.svg" alt="The numbers: 3,173 tests, 434 test files, 328 flags, 46 terms, 13 vertical packs, 4 themes, 23 entity types, 3 storage layers" width="100%"></p>

## See it

Real screenshots of the app running the demo (`?org=demo` — made-up data, no cloud):

<table>
<tr><td width="50%"><img src="assets/screens/calendar.png" alt="Hebrew–Gregorian calendar, month view"><br><sub>📅 Hebrew–Gregorian calendar</sub></td><td width="50%"><img src="assets/screens/families.png" alt="Families list with filters and search"><br><sub>👪 Contacts — list, filters, search</sub></td></tr>
<tr><td><img src="assets/screens/courses.png" alt="Classes as cards"><br><sub>🎓 Classes — capacity, teacher, room</sub></td><td><img src="assets/screens/diary.png" alt="Room diary by hour"><br><sub>🚪 Room diary — with holiday blocking</sub></td></tr>
</table>

## Run locally

<p align="center"><img src="assets/install.en.svg" alt="Run locally: npm ci, npm run dev, then open localhost:5173/?org=demo" width="100%"></p>

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
npm run dev          # dev server — open http://localhost:5173/?org=demo for a demo with sample data
npm run verify:fast  # typecheck → lint → unit tests (no build)
npm run verify       # full gate: + build
npm run e2e          # browser matrix (needs a build first)
```

`npm run build` outputs a static `dist/` folder (relative paths) that can be served from any static host.
Git hooks live in `.githooks/` (pre-commit = typecheck+lint+test; pre-push = full build and a block on pushing to `main`).

## What it does not do

So there are no surprises:

- **It does not process card payments.** Payment links lead to the organization's own payment page; the server webhook only records an "incoming payment" for approval and never issues a receipt by itself.
- **It is not accounting software** and does not report to tax authorities. It produces sequentially numbered receipts, nothing more.
- **Without the cloud there is no multi-device sync.** In local mode data lives in one browser; backups (daily JSON files) are the organization's responsibility.
- **It does not send SMS or email without a server.** Those queues need Firebase Functions deployed and each organization's own sending credentials in its vault.
- **There is no two-factor authentication (MFA).** Cloud sign-in is email + password only.
- **The management UI is built for Hebrew (RTL).** The app itself has no language switch.

## Code layout

```
├── src/
│   ├── App.tsx            # shell: navigation, gate chain (decrypt → cloud → lock)
│   ├── types/             # data model (domain.ts), flags & terms (features.ts), config
│   ├── store/             # Zustand: useApp.ts (actions), persist.ts (persistence + migration), cloudSync.ts
│   ├── lib/               # pure logic: Hebrew calendar, crypto, receipts, import/export, config
│   ├── components/        # one module per area — pure lib.ts + components + __tests__
│   └── styles/            # themes, RTL, accessibility, print
├── public/                # PWA (manifest, sw.js), icons, sample configs (c/<slug>/)
├── functions/             # optional Firebase Functions (nightly backup, mail/SMS outboxes, …)
├── telephony/             # config-as-data PBX routing engine
├── e2e/                   # Playwright scripts (user journeys, matrices, Rules red-team)
├── scripts/               # build tools (bundle budget, icons, screenshots)
├── knowledge/             # planning docs, audits and close-out reports (Hebrew)
├── firestore.rules        # cloud security rules
└── assets/                # README assets
```

Each module is a pure `lib.ts` (no store/DOM) with unit tests, plus components on top. Every fixed bug gets a "ratchet" test that keeps it fixed.

## FAQ

<details><summary><b>Does it need a server?</b></summary>

No. Without the cloud the site is fully static. Firebase (sync, sign-up, Functions) is opt-in per organization via `config.json`, and is loaded dynamically only when configured.
</details>

<details><summary><b>Where is data stored, and how do I not lose it?</b></summary>

In the device's browser, in three layers. In local-only mode: use the same computer and browser, keep the daily backup files in a synced folder, avoid private browsing and don't clear site data. Moving computers = export a backup ⇒ import it in Settings.
</details>

<details><summary><b>Can it be installed as an app?</b></summary>

Yes. It's a PWA (manifest + service worker), installable to the home screen and usable offline after the first load.
</details>

## Status

In active development and used in production. History: [`CHANGELOG.md`](CHANGELOG.md) · Reporting vulnerabilities: [`SECURITY.md`](SECURITY.md).
There is currently no license file in this repository, so no rights are granted beyond viewing the code.
