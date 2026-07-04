# Phase 1 — Setup

> Part of `docs/plans/2026-07-05-form-builder-implementation.md`. Read overview rules first.

## Task 1.1: Install dependencies

**Step 1:** Run:
```bash
yarn add react-hook-form zod @hookform/resolvers zustand class-variance-authority input-otp react-phone-number-input react-day-picker date-fns
yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react
```

**Step 2:** Verify: `yarn tsc --noEmit` passes; check installed zod major version (`node -e "console.log(require('zod/package.json').version)"`). If zod v4: confirm `zodResolver` import path in `node_modules/@hookform/resolvers/README.md`. Note version in commit message.

**Step 3:** Commit: `chore: add form-builder dependencies`

## Task 1.2: shadcn init + primitives

**Step 1:** Run `npx shadcn@latest init` (accept defaults; Tailwind v4 detected automatically; alias `@/*` already in tsconfig).

**Step 2:** Add primitives (this list is the portability contract — record in design doc if it drifts):
```bash
npx shadcn@latest add button input textarea label select command popover radio-group checkbox switch calendar slider progress separator form input-otp
```
Note: `form` component brings RHF-integrated `FormField/FormItem/FormLabel/FormControl/FormDescription/FormMessage` — fields build on these.

**Step 3:** Verify `components/ui/` populated, `yarn tsc --noEmit` passes, `yarn dev` renders default page clean.

**Step 4:** Commit: `chore: init shadcn with form-builder primitive set`

## Task 1.3: Vitest setup

**Files:** Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", include: ["form-builder/**/*.test.{ts,tsx}"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```
Add script to package.json: `"test": "vitest run"`.

**Steps:** Create throwaway `form-builder/core/smoke.test.ts` (`expect(1).toBe(1)`), run `yarn test` → PASS, delete smoke test, commit `chore: configure vitest`.
