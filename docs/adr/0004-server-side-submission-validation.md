# ADR-0004: `parseSubmission` — a synchronous, fail-closed server-side trust boundary

<!-- File naming: adr-0001-use-postgres.md — zero-padded, kebab-case. -->
<!-- One ADR per decision. Keep it short; link out for detail. -->

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** architect, security-engineer, staff-engineer, documentation-engineer (recorded)
- **Tags:** security, validation, server, api

## Context

Through v1, `form-builder` validated **only on the client** — `useDynamicForm`'s
condition-aware resolver, built from `buildFieldsSchema`. A `FormConfig` is
public by construction (it ships to the browser so `FormRenderer` can read
it), which means it was also always readable by anyone who wanted to see the
field names, `required` flags, and `rules.pattern` a form expected — and
nothing on the server ever re-checked a submission against them. Hosts that
wired a real endpoint behind a `form-builder` form were, without exception,
shipping an unvalidated one: `stripInvisibleValues` (the one existing
condition-aware helper outside the resolver) is explicitly a client-side
convenience, with no `__proto__` scrub, no size bound, and no step-visibility
awareness, and was never intended as a request-body sanitizer.

The team needed a server-side validation primitive that:

- reuses the same schema-building logic the client already has (no forked
  validation path to drift out of sync with it),
- is safe to call from a Route Handler, a Server Action, or a non-Next host,
  without forcing any framework dependency into the engine,
- has an explicit, load-bearing answer for every place a naive port of the
  client resolver would get a security property wrong: prototype pollution
  via config-driven object keys, `otp` verification (which the client
  handles via a live UI flow, not a static schema), `file` values (which
  cannot exist in a JSON body and cannot even be schema-built on every
  runtime), custom registered field types (whose value shape only the host
  that registered them actually knows), and the fact that `hidden` fields
  are legitimate `visibleWhen` sources and therefore cannot be trusted from
  the body without becoming a privilege-escalation vector for which *other*
  fields end up required.

The guiding ruling, from staff-engineer: **a security primitive may have
sharp edges, but never silent ones.** Every deliberate limitation below is
safe only because it is documented, not because it is subtle.

## Decision

We will ship `parseSubmission(config, rawBody, opts?)` in
`form-builder/core/parseSubmission.ts`, exported from both the app-facing
barrel (`form-builder/index.ts`) and the published headless entry
(`form-builder/headless.ts`), with the following pinned properties:

**Synchronous, not async.** `parseSubmission` never awaits anything and
never accepts a promise-returning checker. Real `otp` verification is I/O,
so the documented pattern is two-phase: the host awaits its own store
**once**, builds a plain lookup (e.g. a `Map`) from the result, and passes a
**synchronous closure** over that lookup as `opts.otpVerified`. Rejected the
async alternative (`otpVerified` returning `Promise<boolean>`) because it
would let a single submission trigger an unbounded number of concurrent
store round trips (one per `otp` field, with no way to cap or batch them
inside the library), and because a synchronous contract makes the two-phase
pattern impossible to get wrong by accident — there is nowhere to await
inside the closure even if a host tried.

**Fails closed on `otp`, with no opt-out.** A visible `otp` field with no
`opts.otpVerified` returns `{ ok: false, code: "otp_checker_missing" }` —
always, unconditionally, checked independently of whether the rest of the
body would have parsed. There is no skip flag. A host that verifies `otp`
out-of-band must exclude that field from the `FormConfig` it hands to
`parseSubmission`, not silently bypass the check on a field that is still
declared. The alternative — treating a missing checker as "skip otp
checking" — was rejected outright: it would make the single most
security-sensitive field type in the engine fail *open* by default, which
is exactly backwards for a library whose entire purpose is closing a trust
gap.

**`file` fields are always omitted, unconditionally.** Not validated, not
optionally validated behind a flag — always excluded from the schema and
always named in the returned `unvalidated` array. `z.instanceof(File)`
throws at schema-*build* time on a runtime with no global `File`, a JSON
body can never carry a `File` value regardless, and the host already holds
the authoritative storage record after upload completes. Building a
file-validation escape hatch into the library would validate metadata the
library has no way to trust more than the host's own storage API already
does.

**Custom (registered) field types disclose via `unvalidated`, not a
fail-closed gate.** A field of a type the engine doesn't know about
validates as `z.unknown().optional()` — the same pinned contract
`buildFieldsSchema` already applies at the config-shape level (`AGENTS.md`:
"Custom field types register via `registerField`; validated as BaseField
only, values pass through as `z.unknown().optional()`"). `parseSubmission`
mirrors it rather than rejecting a submission the engine has no basis to
validate: it cannot know what a given custom type's value should look like,
only the host that registered the type does. The sharp edge is real — a
host that ignores `result.unvalidated` ships an unvalidated field without
noticing — but the disclosure-not-rejection choice was made because a
fail-closed gate here would make every custom field type unusable server-
side without a matching engine-level schema registration API that doesn't
exist and wasn't judged worth building for this.

**Default-value seeding for client/server parity (step 5).** Before
`hidden` values are re-injected, `parseSubmission` seeds
`buildDefaultValues(config.fields)` beneath the wire body — body values win
over a seeded default, *except* an explicit `undefined` for a key the
defaults table owns, which is treated as "not provided" rather than
clobbering the seed. This exists because the client's condition-aware
resolver always evaluates `visibleWhen`/`superRefine` conditions against a
**fully-defaulted** RHF value map (`useForm({ defaultValues })`); without
server-side seeding, an omitted optional key reads `undefined` here but
`""` on the client, and a `notEquals: ""` condition **inverts** between the
two — the server ends up requiring a field the UI never rendered, or the
reverse. This forced `buildDefaultValues` out of the `"use client"`
`useDynamicForm` hook and into `core/defaults.ts`, **moved, never copied** —
two drifting default-value tables is the exact bug class this ruling
exists to prevent. The `undefined`-skip asymmetry is deliberate: a Server
Action host can pass RHF's already-**parsed** payload straight into
`parseSubmission`, where an untouched `optionalEmptyable` field is a
present-but-undefined key, not an absent one — skipping it lets the seeded
default survive instead of being clobbered by that explicit `undefined`.

**Sharp edge: the step-5 seeding loop is top-level-only, and its safety is
an intersection of two unrelated limitations, not a designed guarantee.**
Seeding does not recurse into `group` rows. That's safe *today* only
because (a) every row-level `superRefine` rule (`crossRulePasses`,
`optionsFrom` membership) is `isBlank`-guarded — `isBlank` treats `""` and
`undefined` identically, so the exact client/server divergence step 5
exists to close can't be observed inside a row — **and** (b) group-nested
`visibleWhen` is unevaluated per the pinned v1 limitation (`AGENTS.md`:
"conditions on fields inside groups are not skipped by validation"), so no
group-row condition can even see the difference. Neither fact was designed
as a consequence of the other; they simply happen to overlap. If the
group-condition limitation is ever "fixed" — group-nested `visibleWhen`
starts being evaluated — this reopens the identical parity hole step 5
exists to close, silently, scoped to group rows only. Extending
group-condition support must extend the step-5 seeding recursively into
group rows in the same change, or the fix reintroduces the bug it's meant
to be adjacent to.

**File-value re-attachment (step 13).** `file` fields stay out of the
schema — all three original structural reasons above still hold
(`z.instanceof(File)` can throw at schema-*build* time off-browser, a JSON
body can never carry a `File` value, and the host already holds the
authoritative record post-upload) — but their raw values **are**
re-attached to `values` in step 13, for every visible file field the
client actually sent (presence checked against the pre-seeding `scrubbed`
body, never `injected` — step 5 seeds every field's key, file fields
included, to `undefined`, so checking presence against `injected` could
never distinguish "the client sent this key" from "step 5 seeded it").
This exists because `unvalidated[]` must mean exactly one thing at the call
site — "here is the value, you validate it" — for *every* row, custom
registered types included. Custom-type values already pass through in
`values` while being named in `unvalidated`; dropping file values instead
would make `unvalidated` mean two different things depending on the row's
type — a footgun in an API whose entire job is being unambiguous about
what the caller still has to validate.

**`buildFormSchema` is deliberately not part of the public barrel
surface.** `core/validation.ts` exports `buildFormSchema` and
`buildResolverSchema` for internal callers (`useDynamicForm`,
`parseSubmission`'s own parity tests), but neither is re-exported from
`index.ts` or `headless.ts`. `buildFormSchema`'s original JSDoc justified a
public export with two hypotheticals — "hosts that need the raw schema
directly" and "a headless integration with its own request pipeline" —
that describe speculative generality, not an actual caller: there are zero
call sites in this repo outside `useDynamicForm`'s own internal import, and
`parseSubmission` already covers the real server-validation use case, with
trust-boundary steps a raw schema lacks. The asymmetry that decided it:
adding a barrel export later is a minor-version bump and free; removing
one that's already shipped is a major-version bump and breaks every
consumer who took a dependency on it. Not exporting is the reversible
choice — free to add the moment a real caller materializes — so it stays
internal until then.

**`hidden` field values are re-injected from config, unconditionally,
before visibility is computed.** The body's own value for a `hidden` field
is discarded outright, every time. This ordering — re-inject, *then*
compute `visibleFieldsFor` — is itself the security property, not an
implementation detail: `hidden` fields are legal `visibleWhen` sources, so
trusting a body-supplied value even transiently (e.g. only for the
visibility computation) would let an attacker change which *other* fields
the form treats as required for that submission.

**`disabled` fields are not specially handled — this is a documented gap,
not an oversight.** `disabled` is a purely presentational `BaseField` flag
with no config-authored value to re-assert, unlike `hidden`. A submission's
value for a `disabled` field is trusted exactly like any other visible
field's. The rule this forces on config authors: a value the server must
own belongs in a `hidden` field (or nowhere in the form, read from session
state instead) — never in a merely `disabled` one.

**`hidden` re-injection and re-assertion recurse into `group` rows,
unconditionally — recurse, not reject.** A per-row `hidden` field (a
line-item `price`, a `sku`) is re-injected before visibility is computed and
re-asserted after parsing, at every nesting depth, exactly like a top-level
`hidden` field. This closes a HIGH-severity gap: a group-nested `hidden`
value was previously trusted from the body untouched (verified PoC: a
per-row `price` of `100` came back as an attacker-submitted `0`).
Staff-engineer ruled **recurse, not reject**, against the tempting parallel
to the existing `insideGroup` rejections in `core/schema.ts` (`dependsOn`,
`countryFrom`, `otp` wiring): those are rejected because group rows are
runtime-prefixed (`"team.0.code"`) and genuinely *cannot* resolve — an
impossibility, not an oversight. That reasoning does not transfer to
`hidden`: its value is a static config literal with no name resolution
involved, so nothing about group nesting makes it impossible to re-assert,
only unimplemented until now. Rejecting group-nested `hidden` instead of
fixing it would have forced real per-row server-owned values onto
`disabled`, which this ADR already documents as trusted-from-body —
converting a fixable defect into a permanent, ADR-sanctioned footgun.

**Two size limits it owns, not three.** `opts.maxStringLength` (default
10,000, recursive into every `group` row, checked before any `rules.pattern`
regex-bearing refine runs) bounds string content. A second, fixed,
non-configurable structural depth cap (`MAX_STRING_LENGTH_CHECK_DEPTH = 32`)
bounds the recursive check itself: without it, a body nested tens of
thousands of arrays deep threw an uncaught `RangeError` (stack overflow) out
of `parseSubmission` instead of returning `ok: false` — turning
attacker-controlled input into a crash rather than a rejection. Both exist
for the same reason — bounding what this library's *own* string/depth
checking can be hurt by, not general request hygiene — which is why the
"not three" still holds: overall request body size, rate limiting, and
`group` row-count ceilings are left to the host's edge/framework layer
entirely — deliberately not reimplemented inside the library, which would
just be a worse, unconfigurable copy of what a WAF, API gateway, or the
framework's own body-size cap already does. `maxStringLength` specifically
bounds ReDoS amplification from a config-authored `rules.pattern` and caps
oversized `signature` data-URLs; the depth cap specifically bounds the cost
of checking a maliciously-shaped body at all.

**A malformed `config` throws; every other rejection returns `ok: false`.**
`validateFormConfig` always runs unconditionally (configs may be
CMS-sourced — see `AGENTS.md`), and `parseSubmission` does not catch its
throw. A broken config is an authoring/deployment error, not bad user
input; folding it into an `ok: false` / 400 response would make a real
outage indistinguishable from ordinary form-validation noise in logs and
alerting. Every other rejection path — bad body shape, otp missing, size
exceeded, schema mismatch — returns `{ ok: false }` and never throws, since
those are all attacker/user-controlled and must never crash a request
handler.

**Group-nested `otp` is rejected outright, unconditionally
(`code: "otp_in_group"`).** Not length-checked, not silently downgraded —
rejected regardless of the submitted body, because `group` rows are
runtime-prefixed (`"team.0.code"`), a shape a verified-code registry keyed
by field name can never match. This mirrors `core/schema.ts`'s existing
rejection of group-nested `otp` *wiring* (`dependsOn`,
`enabledWhenVerified`), extended to the bare field itself for the server
path, where an unverifiable-by-construction `otp` is worse than useless.

**Group-nested conditions are not evaluated — identically to the client,
not more strictly.** This is the one place `parseSubmission` deliberately
inherits a known limitation rather than fixing it: making the server
stricter than the client here would reject submissions the UI itself
accepted, which is a worse failure mode than the limitation it would
"fix." Tracked as the same pinned v1 limitation `AGENTS.md` already
documents for the client resolver.

**Every non-`validation_failed` failure branch returns the same generic
`formError` copy.** `GENERIC_SUBMISSION_ERROR` is identical text across
`invalid_body`, `otp_checker_missing`, `otp_in_group`, and
`input_too_large` — the specific reason lives only in `code`, which is
never echoed to the client. This closes an enumeration oracle: a client
that could distinguish "otp wrong" from "otp checker missing" from "body
too large" from generic phrasing differences could use the distinction to
probe server configuration or brute-force verification state.
`validation_failed` is the deliberate exception: it returns per-field
messages by design, since a form needs to tell a user which field is
wrong. `otp_checker_missing` also sets `fieldErrors[otpField]` to the
actionable (non-generic) "OTP is not verified" message alongside the
generic `formError` — that placement lands the error on the input itself
via `applyServerErrors`, without reopening the `formError` oracle.

**Prototype-pollution scrubbing runs first, via object spread — not
`Object.assign` or a deep merge.** `__proto__`/`constructor`/`prototype`
keys are deleted from a `{...body}` copy (top level and inside every
`group` row) before `validateFormConfig` or any schema step runs. Object
spread's `CopyDataProperties` semantics (not the exotic `__proto__` literal
setter) make this safe by construction rather than by convention. Mirrors
the identical reserved-name check `core/schema.ts` already runs on
config-authored field names, applied here to the untrusted body instead.

## Consequences

### Positive
- Hosts get a real trust boundary in two lines (`parseSubmission` +
  `result.ok` check), reusing the exact schema the client already
  validates against — no forked, driftable validation logic.
- The failure shape (`ServerErrorResult`) is exactly what
  `applyServerErrors` and a host's `onSubmit`-returns-errors contract
  already expect, so `FormRenderer`'s `onSubmit` can return a 400 body
  verbatim and get field-level error repainting for free.
- Every sharp edge above is a named, tested, documented behavior
  (`core/parseSubmission.test.ts`, `/docs/server-validation`) rather than
  an implicit assumption a host has to discover by reading source.

### Negative
- Three edges require the host to do extra work the library cannot do for
  them: custom field types (`result.unvalidated` + host-side zod), file
  fields (host-side storage validation), and `disabled` fields (host must
  use `hidden` instead if a value needs server-side protection). A host
  that skips any of the three ships a real gap, not a library bug.
- The one-size-limit decision means `parseSubmission` alone does not make
  an endpoint safe against oversized-body or high-rate abuse — a host that
  assumes it does, without adding edge-layer limits, is under-protected.
- Group-nested condition parity with the client means the server inherits
  the same v1 limitation rather than being strictly safer than the UI.

### Neutral
- The synchronous-otp two-phase pattern pushes real complexity (rate
  limiting, timing-safe comparison, single-use consumption) into
  documentation and host code rather than a library API, because none of
  that logic can be generic across arbitrary OTP backends without becoming
  its own I/O abstraction — judged out of scope for this primitive.

## Alternatives considered

- **Async `otpVerified` (`Promise<boolean>`)** — rejected: unbounded
  concurrent store round trips per submission, no natural place to batch or
  cap them, and it would make the two-phase pattern optional rather than
  structurally enforced.
- **A skip flag for missing `otpVerified`** — rejected: makes the most
  security-sensitive field type fail open by default, exactly backwards for
  a trust-boundary primitive.
- **Fail-closed gate for custom field types (reject unless the host
  registers a server-side schema for the type)** — rejected for this
  iteration: would require a new engine-level "server schema registry" API
  that doesn't exist, for a problem the disclosure-via-`unvalidated`
  approach already makes visible and closeable in three lines. Revisit if
  custom types become common enough that the boilerplate is felt broadly.
- **Validating `file` fields against size/MIME metadata carried in the
  body** — rejected: that metadata is client-declared and no more
  trustworthy than any other body field: MIME sniffing and size limits
  belong against the host's actual storage API, not a JSON payload's
  self-reported shape.
- **Reject `hidden` fields nested inside `group` rows** (mirroring the
  `insideGroup` rejections for `otp`/`dependsOn`/`countryFrom`) — rejected:
  those rejections exist because group-row names are runtime-prefixed and
  genuinely can't resolve, an impossibility that doesn't apply to a static
  `hidden` value; rejecting instead of recursing would only push server-owned
  per-row values onto `disabled`, trading a fixable bug for a documented one.
- **A single combined size/rate/row-count limit surface inside the
  library** — rejected: rate limiting and body-size caps are inherently
  request/transport-layer concerns (need access to IP, headers, a request
  store) that don't belong in a framework-agnostic, synchronous, pure
  function; `maxStringLength` stays scoped to what only this library's own
  regex/schema construction can be hurt by.
- **Making the server strictly reject group-nested `visibleWhen`
  (stricter than the client)** — rejected: would reject legitimate
  submissions the client-side UI itself allowed through, trading one
  limitation for a worse one (silent submission failures for real users).

## References

- `form-builder/core/parseSubmission.ts` — implementation, with the 13-step
  ordering comment that is itself the security property
- `form-builder/core/parseSubmission.test.ts` — the pinned behavior this
  ADR describes
- `form-builder/core/validation.ts` — `buildFieldsSchema`/`buildFormSchema`,
  the schema builder shared with the client resolver
- `form-builder/core/serverErrors.ts` — `applyServerErrors`, the client-side
  half of the closed round trip
- `/docs/server-validation` — Route Handler / Server Action / Express
  recipes, the secure two-phase `otp` pattern, and every sharp edge above
  written up for a reader integrating this today
- `form-builder/CHANGELOG.md` — `[Unreleased]` entry for this surface
- AGENTS.md — "Intentional decisions — do NOT fix" (the pre-existing
  `shouldUnregister`, custom-field-as-`z.unknown()`, group-condition, and
  `validateFormConfig`-runs-in-production rulings this ADR extends to the
  server path)
