"use client";

import { useEffect, useSyncExternalStore } from "react";
import { registerBuiltInFields } from "@/form-builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { builder } from "@/locales/en/builder";
import { useBuilderStore } from "./model/store";
import { FieldList } from "./FieldList";
import { StepsPanel } from "./StepsPanel";
import { PreviewPanel } from "./PreviewPanel";
import { PropEditorPanel } from "./PropEditor";
import { BuilderHeaderActions } from "./BuilderHeaderActions";

// Field runtime must be registered before the preview renders any field.
registerBuiltInFields();

/**
 * Root of the form builder: a dark, three-pane workspace (field list · live
 * preview · prop editor). Forces dark mode on <html> because Radix portals
 * (selects, popovers) escape any wrapper and would otherwise render light.
 */
export function FormBuilder() {
  const title = useBuilderStore((s) => s.title);
  const description = useBuilderStore((s) => s.description);
  const setMeta = useBuilderStore((s) => s.setMeta);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!hadDark) root.classList.remove("dark");
    };
  }, []);

  // Gate on persist rehydration so localStorage state doesn't mismatch the
  // server-rendered INITIAL state during hydration (server snapshot = false).
  const hydrated = useSyncExternalStore(
    (cb) => useBuilderStore.persist.onFinishHydration(cb),
    () => useBuilderStore.persist.hasHydrated(),
    () => false,
  );
  if (!hydrated) return <div className="dark min-h-dvh bg-background" />;

  return (
    <div className="dark flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw] border-b border-border px-[4.272vw] tablet:px-[2.5vw] desktop:px-[1.248vw] py-[3.738vw] tablet:py-[1.75vw] desktop:py-[0.728vw] tablet:flex-row tablet:items-end tablet:justify-between">
        <div className="flex flex-col gap-[0.534vw] tablet:gap-[0.25vw] desktop:gap-[0.104vw] tablet:flex-1">
          {/* The route's only h1 (a11y heading outline) — styled as the small kicker on purpose. */}
          <h1 className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-medium uppercase tracking-wide text-muted-foreground">
            {builder.header.kicker}
          </h1>
          <div className="flex flex-col gap-[2.136vw] tablet:flex-row tablet:items-end tablet:gap-[2vw] desktop:gap-[0.832vw]">
            <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
              <Label
                htmlFor="form-title"
                className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground"
              >
                {builder.header.titleLabel}
              </Label>
              <Input
                id="form-title"
                value={title}
                onChange={(e) => setMeta({ title: e.target.value })}
                className="tablet:w-[32.5vw] desktop:w-[13.52vw]"
              />
            </div>
            <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
              <Label
                htmlFor="form-desc"
                className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground"
              >
                {builder.header.descriptionLabel}
              </Label>
              <Input
                id="form-desc"
                value={description}
                onChange={(e) => setMeta({ description: e.target.value })}
                placeholder={builder.header.descriptionPlaceholder}
                className="tablet:w-[40vw] desktop:w-[19.76vw]"
              />
            </div>
          </div>
        </div>
        <BuilderHeaderActions />
      </header>

      <div className="flex min-h-0 flex-1 flex-col desktop:flex-row">
        <aside className="flex flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw] border-b border-border p-[4.272vw] tablet:p-[2vw] desktop:p-[0.832vw] desktop:w-[15.6vw] desktop:border-b-0 desktop:border-r desktop:overflow-y-auto">
          <StepsPanel />
          <div className="flex min-h-0 flex-1 flex-col">
            <FieldList />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-[4.272vw] tablet:p-[2.5vw] desktop:p-[1.248vw] desktop:overflow-y-auto">
          <PreviewPanel />
        </main>
        <aside className="border-t border-border p-[4.272vw] tablet:p-[2vw] desktop:p-[0.832vw] desktop:w-[17.68vw] desktop:border-t-0 desktop:border-l desktop:overflow-y-auto">
          <PropEditorPanel />
        </aside>
      </div>
    </div>
  );
}
