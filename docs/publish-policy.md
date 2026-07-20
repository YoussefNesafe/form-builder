# Publish policy — npm packages

_Date: 2026-07-20 · Status: Active · Scope: `form-builder-nextjs` (CLI installer,
Unit B, `cli/`) and `@form-builder/engine` (headless engine, Unit A,
`form-builder/`) · Item 4 of the
[Socket supply-chain hardening plan](plans/2026-07-20-socket-supply-chain-hardening.md)_

## Who may publish

Only the repo owner (`@YoussefNesafe`) can merge changes to release-critical
paths or approve a release run. `.github/CODEOWNERS` requires their review on
`cli/**`, `form-builder/**`, `.github/workflows/release*.yml`, `/socket.yml`,
`/package.json`, and `/yarn.lock` — the paths that can change what gets
published or how.

## How a publish happens

Every publish goes through a tagged, owner-gated GitHub Actions workflow.
**Never `npm publish` from a local machine, for either package, for any
reason (including a hotfix).**

| Package | Workflow | Trigger |
|---|---|---|
| CLI installer (`form-builder-nextjs`, from `cli/`) | `.github/workflows/release-cli.yml` | `cli-v*` tag |
| Headless engine (`@form-builder/engine`, from `form-builder/`) | `.github/workflows/release.yml` | `engine-v*` tag |

Both workflows:

- run behind a `release` GitHub Environment that requires manual reviewer
  approval before any step executes
- attach npm provenance (`--provenance`, a SLSA v1 build attestation)
  automatically on every real publish, since the repo is public
- support a `workflow_dispatch` dry run (`--dry-run`, the default input) to
  validate the pipeline without touching the registry

If CI is unavailable, fix CI — don't hand-publish. A local `npm publish`
skips the environment approval gate, the tag/version guard, and provenance
attestation; it is not an accepted path under any circumstance.

## Why only the workflow

- **Provenance requires it.** `npm publish --provenance` needs the GitHub
  Actions OIDC token (`id-token: write`) issued to that specific workflow
  run — a local publish cannot produce a provenance attestation at all.
- **The environment gate is the human checkpoint.** A required reviewer on
  the `release` environment is the only thing standing between a tag push
  and a live publish.
- **CODEOWNERS only protects the paths that reach CI.** Bypassing the
  workflow bypasses every guard CODEOWNERS was set up to enforce.

## Account security

- npm account 2FA: owner to confirm enabled (pending gate, hardening plan Item 4).
- **Target, once npm Trusted Publishing is live** (see the
  [publish runbook's Trusted Publishing addendum](plans/2026-07-18-packaging-publish-runbook.md)):
  flip the npm package setting that requires 2FA for publishing and
  disallows token-based publishes. This is safe to enable only once Trusted
  Publishing (OIDC) means no long-lived automation token exists for that
  setting to lock out — enabling it today would just block the current
  `NPM_TOKEN`-based CI publish. **Not yet enabled** — owner action, gated on
  the Trusted Publishing migration landing first.

## References

- `.github/CODEOWNERS`
- `.github/workflows/release-cli.yml`, `.github/workflows/release.yml`
- [Publish runbook](plans/2026-07-18-packaging-publish-runbook.md) — the
  mechanics of cutting a release, including the Trusted Publishing migration
- [Socket supply-chain hardening plan](plans/2026-07-20-socket-supply-chain-hardening.md) —
  Item 4 (ownership hygiene) and Item 1 (Trusted Publishing)
