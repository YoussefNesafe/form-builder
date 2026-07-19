# form-builder-nextjs

[![npm version](https://img.shields.io/npm/v/form-builder-nextjs.svg)](https://www.npmjs.com/package/form-builder-nextjs)
[![npm downloads](https://img.shields.io/npm/dm/form-builder-nextjs.svg)](https://www.npmjs.com/package/form-builder-nextjs)
[![license](https://img.shields.io/npm/l/form-builder-nextjs.svg)](https://github.com/YoussefNesafe/form-builder/blob/master/LICENSE)

One-command installer for the **Form Builder** engine — a config-driven,
conditional, multi-step form engine for React 19 / Next.js, built on
React Hook Form 7 + Zod 4 + Tailwind 4.

It works like `shadcn` CLI: it does **not** add a runtime dependency. It copies
real, editable source into your project as a single self-contained
`form-builder/` folder that you own and can modify freely.

```bash
npx form-builder-nextjs
```

## What it installs

- The form engine (`core/`, `components/`, `hooks/`, `ui/`, `store/`)
- The field components you asked for (24 built-in types available)
- The shadcn primitives those fields depend on, under `components/ui/`
- A managed theme block (breakpoints + `--fb-space-*` sizing tokens) merged
  into your `globals.css`
- The npm leaf dependencies for what it copied (`npm install`, run for you)

Everything lands under `<base>/form-builder/`, where `<base>` is auto-detected:
`src/` wins over `app/`, falling back to the project root with a warning.

## Usage

```bash
form-builder                  # install everything (engine + all fields + primitives + theme)
form-builder add text email   # install only the named fields + their dependency closure
```

### Flags

| Flag | Effect |
| --- | --- |
| `--cwd <dir>` | Target project directory (default: current directory) |
| `--no-install` | Skip `npm install`ing leaf deps; print them instead |
| `--no-theme` | Skip the theme / cssVars injection step |
| `--force` | Overwrite existing files and theme block (default: skip, preserving your edits) |
| `-h`, `--help` | Show help |

Re-running is safe: files that already exist are skipped and listed, so your
edits survive. Use `--force` only when you want the pristine source back.

### Field names for `add`

`text` `select` `checkbox` `radio` `date` `time` `phone` `country` `otp`
`masked` `signature` `rating` `segmented` `slider` `file` `group` `hidden`
`static` `submit`

Each pulls in its transitive engine + primitive closure automatically.

## Requirements

A React 19 project with Tailwind CSS v4. These peer packages must be present
(the CLI reminds you at the end of an install, but does not install them):

```bash
npm install react react-dom react-hook-form zod date-fns lucide-react
```

Node.js >= 18.

## After installing

Register the built-in field renderers once, then render a `FormConfig`:

```tsx
"use client";
import { FormRenderer, registerBuiltInFields, type FormConfig } from "@/form-builder";

registerBuiltInFields();

const config: FormConfig = {
  id: "contact",
  fields: [
    { name: "email", type: "email", label: "Email", required: true },
    { name: "message", type: "textarea", label: "Message" },
  ],
};

export function ContactForm() {
  return <FormRenderer config={config} onSubmit={(values) => console.log(values)} />;
}
```

`form-builder/index.ts` is the only supported entry point — nothing outside it
is public API. The example uses the `@/*` path alias Next.js sets up by
default; a relative import works just as well. The installed tree itself is
alias-free, so it compiles regardless of your `tsconfig` paths.

Some install names cover more than one `type` value — `text` carries `text`,
`email`, `password`, `textarea`, and `number`; `checkbox` also carries
`switch`. 19 install names, 24 field types.

## Notes

- The engine is **client-rendered**; most of its files are `"use client"`.
  It is not an RSC form solution.
- There is no submission backend. You supply `onSubmit`; autosave (opt-in)
  writes only to the visiting browser's `localStorage`.
- The `signature` field is pointer/touch-only and has no keyboard fallback.

## Links

- Docs & visual builder: <https://form-builder.youssefnesafe.com>
- Source: <https://github.com/YoussefNesafe/form-builder>

## Feedback & ideas

- 🐛 Bugs & feature requests → [open an issue](https://github.com/YoussefNesafe/form-builder/issues/new/choose)
- 💡 Ideas, questions, show and tell → [Discussions](https://github.com/YoussefNesafe/form-builder/discussions)

## License

MIT © [YoussefNesafe](https://github.com/YoussefNesafe)
