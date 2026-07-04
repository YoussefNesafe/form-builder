# Dynamic Form Builder Implementation Plan — Overview

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Config-driven, portable form-builder package (`form-builder/` folder) rendering validated dynamic forms from a `FormConfig` object.

**Architecture:** Registry pattern maps field `type` → component. RHF + zod own field state/validation (schema derived from config). Zustand store factory owns stepper index. CVA variants only in `ui/`. Single public export surface `form-builder/index.ts`. All strings arrive translated in config (i18n approach A); validation messages overridable via `messages` prop.

**Tech Stack:** Next.js 16.2.10 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, shadcn/ui, react-hook-form, zod, @hookform/resolvers, zustand, CVA, input-otp, react-phone-number-input, react-day-picker, Vitest.

**Reference:** `docs/plans/2026-07-05-form-builder-design.md` — all design decisions. `form-builder-spec.md` — original spec.

## Rules for executor (apply to every phase)

- AGENTS.md: this Next.js version differs from training data. Docs at `node_modules/next/dist/docs/`. Verified already: `"use client"` composition unchanged, Turbopack default, Tailwind v4 via `@tailwindcss/postcss` already configured, no dynamic-segment routes needed.
- **Follow official docs, not memory:** Next.js (`node_modules/next/dist/docs/`), Tailwind v4 (v4 syntax — CSS-first config, `@import "tailwindcss"`, logical utilities), shadcn/ui (current CLI + component APIs; context7 or shadcn skill for lookups). When code in this plan conflicts with installed-version docs, docs win — adjust and note deviation in commit message.
- External lib APIs (input-otp, react-phone-number-input, react-day-picker, zod version, shadcn CLI): VERIFY against installed package docs/types before coding those tasks. Do not trust memory.
- **Clean Code (Robert C. Martin) best practices apply to all code:** intention-revealing names, small single-responsibility functions, no duplication (DRY), minimal function arguments, no side-effect surprises, boy-scout rule on touched files.
- **Comments: none for small/obvious code.** Only comment where logic is complicated or a non-obvious constraint/workaround exists (e.g. Tailwind static class maps, RSC serialization limits). Names carry the intent, not comments.
- TDD for `core/`, `hooks/`, `store/`. Field components: no unit tests (design decision) — verify in demo page.
- Commit after every task. RTL: only logical Tailwind utilities (`ms-*`, `me-*`, `text-start`, `ps-*`, `pe-*`) in all new code. Dark mode: only shadcn token classes (`bg-background`, `text-muted-foreground`, …).

## Phases

Execute strictly in order; each phase file is self-contained.

| Phase | File | Contents |
|---|---|---|
| 1 | `form-builder/phase-1-setup.md` | Dependencies, shadcn init + primitives, Vitest |
| 2 | `form-builder/phase-2-core-foundation.md` | `core/types.ts`, `core/schema.ts`, `core/registry.ts` |
| 3 | `form-builder/phase-3-ui-simple-fields.md` | CVA variants, `FieldWrapper`, `FieldRuntimeContext`, simple fields, `fields/index.ts` |
| 4 | `form-builder/phase-4-validation-engine.md` | `core/messages.ts`, `core/validation.ts`, `core/conditions.ts`, `useDynamicForm` |
| 5 | `form-builder/phase-5-renderer.md` | `FieldGate`, `FormRenderer`, `FormSection`, smoke demo |
| 6 | `form-builder/phase-6-complex-fields.md` | Select, Otp, Phone, Date, Slider, File, Group |
| 7 | `form-builder/phase-7-stepper-and-demo.md` | Stepper store + component, public `index.ts`, kitchen-sink demo, final pass |

## Dependency graph

Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 (strictly linear).
Within phases, tasks in listed order. Conditions engine (4.3) intentionally precedes renderer — `FieldGate` (5.1) imports `evaluateCondition`. `FieldRuntimeContext` created in Phase 3 so simple fields compile before the renderer exists.
