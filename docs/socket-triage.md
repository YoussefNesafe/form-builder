# Socket PR triage

_Date: 2026-07-20 · Status: Active · Scope: Socket for GitHub app on
`YoussefNesafe/form-builder` — see [`socket.yml`](../socket.yml) and Item 3 of
the [Socket supply-chain hardening plan](plans/2026-07-20-socket-supply-chain-hardening.md)_

## Reading a Socket PR comment

Socket comments on a PR when the dependency tree changes — a new dependency,
a version bump, or a transitive shift. The comment lists one row per alert:
the package, the alert type (e.g. `Install scripts`, `URL strings`,
`Unstable ownership`), and the packages involved.

- **New alert on a newly-added or bumped dependency** → read it. This is the
  entire point of the gate.
- **Alert already present on `master`** (i.e. it also appears in the
  [dependency audit](plans/2026-07-20-dependency-audit.md)) → already
  triaged. Socket reports some alert types project-wide rather than
  diff-only, so the same baseline row can reappear on an unrelated PR. Don't
  re-litigate it — link the audit if a reviewer asks.

## Where block vs. warn is decided

`socket.yml` at the repo root only turns alert *types* on or off for
scanning — it has no block/warn/monitor concept. The actual **block-or-warn
action per alert type** is set in Socket's **org-level Security Policy**
(Socket dashboard → Security Policy), configured by whoever installed the
GitHub App. The day-1 matrix (full rationale in `socket.yml`'s header
comment):

| Action | Alert types |
|---|---|
| **Block** | `installScripts`, `shellAccess`, `hasNativeCode`, `malware`, `didYouMean` (typosquat), `gptMalware`, `telemetry`, `networkAccess` |
| **Warn** | `urlStrings`, `envVars`, `minifiedFile`, `unmaintained`, `gptAnomaly`, `unstableOwnership` |

Block-listed types are cheap to state and rarely false when true of a
*newly added* dependency — "this new package runs an install script" is
either true or false. Warn-listed types are the existing baseline heuristic
noise this repo already carries and has triaged (the dependency audit) —
they surface on every PR that touches the tree but must never fail the check
by themselves.

If a PR is blocked and the action feels wrong for that alert type, that's a
Security Policy change, not a `socket.yml` change — raise it with whoever
administers the Socket GitHub App install (currently the repo owner).

## Accepting or ignoring a known-benign alert

1. **Check the dependency audit first.**
   [`docs/plans/2026-07-20-dependency-audit.md`](plans/2026-07-20-dependency-audit.md)
   already has a verdict for every alert on the baseline tree — `radix-ui`'s
   ownership transfer, the four frozen leaf utilities, and every env/URL/
   minified/network/AI-anomaly flag. If the PR comment matches a row in that
   table, it's already accepted; no action needed.
2. **New package, new alert, and it's a false positive or an accepted
   trade-off** (e.g. a new dep reads `NODE_ENV`, ships a minified prod
   build): use Socket's own triage action on the alert — from the PR check
   or the Socket dashboard, mark the specific alert **Ignore** (this PR
   only) or **Accept** at the package level (future PRs too) with a one-line
   reason. Don't disable a whole alert *type* in `socket.yml` to clear one
   instance — that reopens the type for every future PR and defeats the
   gate.
3. **New package, new alert, and it's real** (an install script on a package
   that shouldn't need one, a typosquat hit, a network call from a package
   with no reason to make one): don't accept it. Swap the dependency, or get
   a second read from `security-engineer` before merging.
4. **An already-accepted package's alert changes shape** — e.g. `radix-ui`
   (currently ACCEPT + WATCH per the audit) shows a *second* ownership
   transfer — treat that as new, not baseline. The audit's WATCH note exists
   precisely so a future change on a watched package isn't waved through as
   "already triaged."

## Excluded paths

`socket.yml`'s `projectIgnorePaths` excludes `cli/vendor/**` (a generated,
byte-for-byte mirror of this repo's own `form-builder/` source — see
[`cli/README.md`](../cli/README.md)) and `public/r/**` (generated registry
build output) from source-level scanning, so alerts aren't double-reported
against generated copies of code already scanned at its real source.

## References

- [`socket.yml`](../socket.yml) — issue-type config and excluded paths
- [Dependency-closure audit](plans/2026-07-20-dependency-audit.md) — the
  baseline verdict table
- [Socket supply-chain hardening plan](plans/2026-07-20-socket-supply-chain-hardening.md) —
  Item 3
