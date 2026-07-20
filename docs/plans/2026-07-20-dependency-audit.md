# Dependency-closure audit — `form-builder-nextjs` (CLI installer)

_Date: 2026-07-20 · Status: COMPLETE (analysis only, no code changed) · Item 2 of `2026-07-20-socket-supply-chain-hardening.md`_

Maps every **Socket dependency-tab alert** (baseline v0.1.4) to the specific package(s) that trigger it, with a verdict and action per finding. Read the hardening plan's "Ground truth established" section first.

## Scope & method

The published package `form-builder-nextjs` (`cli/`) has **zero runtime dependencies of its own** — it is a vendoring installer that copies first-party source (`cli/vendor/**`) into the consumer. Socket's dependency-tab therefore reflects the **runtime import closure** of the libraries the vendored code imports, i.e. the `dependencies` + `peerDependencies` of `form-builder/package.json`, resolved through `yarn.lock`.

The resolved closure was walked from `yarn.lock` and cross-checked against installed `node_modules`. **102 packages** in the closure (12 top-level runtime deps + 6 peers + transitive). Package metadata (per-version publish dates, publisher accounts, maintainer lists) pulled via `npm view`; trait evidence (env reads, network APIs, minified/URL-bearing dist) grep-confirmed against installed source.

Confidence is marked per finding: **DEFINITIVE** (count + packages match the Socket tally on hard evidence) vs. **CANDIDATE** (best-supported mapping; the exact package set Socket keyed on can't be 100% confirmed without the Socket UI).

---

## Headline findings

- **Unstable ownership x1 (the one "high") = `radix-ui`.** DEFINITIVE. The `radix-ui` npm name was originally published by **`paco`** (pacocoursey) at `1.0.0`/`1.0.1`, then transferred to the **Radix / WorkOS team** (`chancestrickland <hi@chance.dev>`, `mark-workos <mark@workos.com>`) from `1.1.0` onward. `paco` is **no longer in the maintainer list**. This is a genuine human-to-human ownership transfer — exactly the "an upstream dep changed publisher" signal. It is the **only** package in the closure with a real human-to-human handoff; the CI-bot publisher switches below are benign and (correctly) not flagged.
- **Unmaintained (>5yr) x4 = `object-assign`, `loose-envify`, `get-nonce`, `detect-node-es`.** DEFINITIVE. For each, the package's **latest** published version *is* the version in our tree and was published >5 years ago. All four are frozen leaf utilities (complete, not abandoned-risky), pulled deep through `prop-types` and radix's scroll-lock chain.
- Every other category (**network, env access, minified, URL strings, AI anomaly**) is an **inherent benign trait** of a required, maintained library. None is actionable.

### Not the flag: benign CI-publisher switches

These packages switched their *recent* releases from a human account to a trusted CI automation account. Socket reported only **x1** unstable-ownership, so it is correctly **not** flagging CI adoption — do not mistake these for the alert:

| Package | Human publisher | CI account (from version) |
|---|---|---|
| `libphonenumber-js` | catamphetamine | GitLab CI/CD (`1.13.8+`) |
| `tailwind-merge` | dcas | GitHub Actions (`3.6.0`) |
| `zustand` | daishi | GitHub Actions (`5.0.14`) |
| `react-day-picker` | gpbl | GitHub Actions (`10.0.0+`) |
| `radix-ui` | chancestrickland | GitHub Actions (`1.6.0`), then back to chancestrickland (`1.6.4`) |

---

## Alert to package mapping

### 1. Unstable ownership x1 — DEFINITIVE

| Package | Where | Signal | Verdict |
|---|---|---|---|
| **`radix-ui@1.6.4`** | top-level dep | name transferred `paco` to WorkOS team (`chancestrickland`, `mark-workos`); original owner removed | **ACCEPT + WATCH** |

Rationale: the transfer is a **known, legitimate corporate event** — WorkOS acquired Radix (formerly Modulz) and now owns the org and the umbrella `radix-ui` package. Not a compromise. `radix-ui` is load-bearing: it backs all 17 vendored shadcn primitives and multiple field types (Select, RadioGroup, Popover, Dialog, etc.). **Not replaceable.** Action: keep, pin a minor range, and keep it on the Socket watch list (Item 3) so any *future* publisher change is surfaced on a PR.

### 2. Unmaintained (>5yr) x4 — DEFINITIVE

| Package | Ver (=latest) | Last publish | Pulled via | Verdict |
|---|---|---|---|---|
| **`object-assign`** | 4.1.1 | 2017-01-16 (~9.5y) | `prop-types` (react-phone-number-input) | **ACCEPT** |
| **`loose-envify`** | 1.4.0 | 2018-07-10 (~8y) | `prop-types` | **ACCEPT** |
| **`get-nonce`** | 1.0.1 | 2020-04-17 (~6.2y) | radix -> `react-remove-scroll` / `use-sidecar` | **ACCEPT** |
| **`detect-node-es`** | 1.1.0 | 2021-03-18 (~5.3y) | radix -> `use-sidecar` | **ACCEPT** |

Rationale: all four are **tiny, single-purpose leaf utilities that are "done"**, not abandoned-with-open-CVEs. `object-assign` polyfills native `Object.assign`; `loose-envify` is a `NODE_ENV` replacer transform; `get-nonce`/`detect-node-es` are one-function helpers by `kashey` (Anton Korzunov), whose *parent* packages (`use-sidecar`, `aria-hidden`, `react-remove-scroll`) are actively maintained (2024 releases). Zero CVEs on any (Socket Vulnerability score 100). **No REPLACE justified** — see Verdicts.

### 3. Environment variable access x6 — DEFINITIVE (grep-confirmed)

All read `process.env.NODE_ENV` for dev/prod branching: `loose-envify`, `prop-types`, `react`, `react-dom`, `scheduler`, `react-is`.

Verdict: **ACCEPT** (all). Reading `NODE_ENV` is the most common benign pattern in the React ecosystem; none reads secrets or arbitrary env.

### 4. Network access x1 — STRONG (grep-confirmed)

**`react-dom`** — React 19's resource APIs (`preload`, `preconnect`, `prefetchDNS`) and the RSC/streaming paths reference `fetch`/network primitives. Verdict: **ACCEPT.** Inherent to React 19; a peer the host already provides.

### 5. Minified code x6 — CANDIDATE (5 confirmed, 6th uncertain)

Confirmed shipping minified production builds: **`react`, `react-dom`, `scheduler`, `react-is`** (`*.production.js` are terser-minified in React 19), and **`libphonenumber-js`** (`*.min.js`, minified metadata). That is 5. The **6th** is most likely another minified vendor bundle — best candidates: `react-phone-number-input`, `country-flag-icons`, or a specific `@radix-ui/*` bundle. Cannot pin the 6th from CLI metadata alone. Verdict: **ACCEPT** (all). Minified = standard published prod build, not obfuscation; unminified dev builds ship alongside.

### 6. URL strings x13 — CANDIDATE (count matches exactly)

Grep of shipped `.js` for `http(s)://` literals returned exactly **13** packages (homepage/repo/docs/schema URLs, flag-asset paths, phone-metadata references): `libphonenumber-js`, `react-phone-number-input`, `country-flag-icons`, `react-day-picker`, `class-variance-authority`, `tailwind-merge`, `signature_pad`, `react-dom`, `react`, `classnames`, `input-format`, `aria-hidden`, `react-remove-scroll`.

Verdict: **ACCEPT** (all). Static documentation/registry/asset URLs in source, not runtime exfiltration. The count matching x13 strongly corroborates this set (exact membership may differ by a package or two from Socket's).

### 7. AI-detected code anomaly x2 — LOW CONFIDENCE

Heuristic flag; not deterministically reproducible from metadata. Best-supported candidates by dist shape: **`libphonenumber-js`** (massive machine-generated metadata blob) and one of **`input-format`**, **`object-assign`**, or **`country-flag-icons`** (polyfill / generated-data patterns). Cannot confirm the exact two without the Socket UI. Verdict: **ACCEPT** (heuristic; no evidence of malicious behavior; Socket Supply-Chain sub-score is 100, zero malware signals).

---

## Verdicts (accept / replace / pin)

- **REPLACE: none.** No top-level lib is swapped to chase a deep flag (per the plan's non-goal). Crucially, the 4 "unmaintained" leaves have **no low-risk drop-in** worth forcing: they arrive transitively through healthy parents (`prop-types`, `use-sidecar`, `react-remove-scroll`), so "replacing" them means an npm `override`/`resolution` pointing a third-party's dep at a fork or alternate package — which *adds* supply-chain risk (an unvetted override that could itself drift) to silence a benign "stale but complete" flag on a one-function utility. Net-negative. Explicitly rejected.
- **ACCEPT + document: all flagged packages** (tables above). Expected majority outcome for an installer wrapping a rich field library.
- **PIN (optional, low value): proposed for a follow-up PR only** — see below.

## Proposed follow-up PR (NOT applied here)

Optional, defense-in-depth only. None is required — the audit verdict is "accept." Open as its own reviewable PR if desired:

1. **Pin the ownership-transferred + unmaintained set** via a root `resolutions` block (yarn) to reduce silent drift, so a future *unexpected* bump of any is a visible lockfile diff reviewed under `CODEOWNERS` (Item 4):
   - `radix-ui` -> exact `1.6.4` (or a tight `~1.6.x` range)
   - `object-assign` `4.1.1`, `loose-envify` `1.4.0`, `get-nonce` `1.0.1`, `detect-node-es` `1.1.0`
   Trade-off: pinning transitive leaves can fight future dedupe/security bumps; only pair this with the Socket PR gate (Item 3) actively watching them.
2. **Add these five to the Socket watch/ignore config** (`socket.yml`, Item 3) as *known-accepted*, so their baseline alerts don't block PRs while a *new* publisher change on `radix-ui` (or any new install-script/network signal) still trips the gate.

No `package.json` or lockfile change is made by this audit.

## Residual risk (accepted)

- **`radix-ui` ownership (accepted, watched).** The name lives with WorkOS; a future compromise of that org would have wide blast radius (it backs most of our UI). Mitigation is the Socket PR gate (Item 3) + provenance verification (Item 1) + optional pinning, not removal — radix is irreplaceable here. Severity if realized: High; likelihood: Low (reputable, 2FA-org owner).
- **4 unmaintained leaves (accepted).** Risk is future-tense: if a real CVE ever lands in `object-assign`/`loose-envify`/`get-nonce`/`detect-node-es`, no upstream patch will come (they are frozen). Blast radius is tiny (one function each) and today's CVE count is zero. Re-evaluate if Socket ever raises a Vulnerability alert on any.
- **6th "minified" and the 2 "AI-anomaly" packages are not definitively pinned** from CLI data. Does not change any verdict (both categories are ACCEPT-all), but confirm exact identity from the Socket dependency-detail UI if precise attribution is ever needed.

## Verification (how each mapping was established)

- Ownership: `npm view radix-ui@<v> _npmUser.name` across `1.0.0..1.6.4` + `npm view radix-ui maintainers` (paco absent; chancestrickland + mark-workos present).
- Unmaintained: `npm view <pkg> version` (latest == pinned) + `npm view <pkg> time` for that version's date; all four >5y before 2026-07-20.
- Env access / network / URL strings / minified: grep of installed `node_modules/<pkg>` shipped `.js` for `process.env`, network primitives, `https?://` literals, and minified `*.production.js` / `*.min.js`.
