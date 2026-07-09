# Security Policy

## Supported Versions

This project is under active development; only the latest commit on `master` is supported with security fixes.

| Version         | Supported |
| --------------- | --------- |
| latest `master` | ✅        |
| older commits   | ❌        |

## Reporting a Vulnerability

Please do **not** open a public issue for security vulnerabilities.

Instead, use GitHub's private vulnerability reporting: go to the
[Security tab](https://github.com/YoussefNesafe/form-builder/security) →
**Report a vulnerability**. This opens a private advisory visible only to the
maintainer.

Include where possible:

- A description of the vulnerability and its impact
- Steps to reproduce (a minimal form config is ideal — this is a config-driven
  form engine, so most issues are reachable through a `FormConfig`)
- Affected files/areas if known

You can expect an initial response within a few days. Confirmed
vulnerabilities will be fixed on `master` and disclosed via a GitHub security
advisory once patched.

## Scope notes

- Form configs are treated as trusted-author input, but `validateFormConfig`
  intentionally runs in production and defends against config-borne issues
  (e.g. ReDoS via `pattern`/`allow` rules). Bypasses of these guards are in
  scope and especially welcome.
- Dependency vulnerabilities are tracked automatically via Dependabot; no need
  to report those unless you found an exploitable path through this codebase.
