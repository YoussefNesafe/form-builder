"use client";

import { useEffect, useSyncExternalStore } from "react";
import { registerBuiltInFields } from "@/form-builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBuilderStore } from "./model/store";
import { FieldList } from "./FieldList";
import { PreviewPanel } from "./Preview";
import { PropEditorPanel } from "./PropEditor";

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
      <header className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px] border-b border-border px-[16px] tablet:px-[20px] desktop:px-[24px] py-[14px] tablet:py-[14px] desktop:py-[14px] tablet:flex-row tablet:items-end tablet:justify-between">
        <div className="flex flex-col gap-[2px] tablet:gap-[2px] desktop:gap-[2px]">
          <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Form Builder
          </span>
          <div className="flex flex-col gap-[8px] tablet:flex-row tablet:items-end tablet:gap-[16px] desktop:gap-[16px]">
            <div className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
              <Label htmlFor="form-title" className="text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                Title
              </Label>
              <Input
                id="form-title"
                value={title}
                onChange={(e) => setMeta({ title: e.target.value })}
                className="tablet:w-[260px] desktop:w-[260px]"
              />
            </div>
            <div className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
              <Label htmlFor="form-desc" className="text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                Description
              </Label>
              <Input
                id="form-desc"
                value={description}
                onChange={(e) => setMeta({ description: e.target.value })}
                placeholder="Optional"
                className="tablet:w-[320px] desktop:w-[380px]"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col desktop:flex-row">
        <aside className="border-b border-border p-[16px] tablet:p-[16px] desktop:p-[16px] desktop:w-[300px] desktop:border-b-0 desktop:border-r desktop:overflow-y-auto">
          <FieldList />
        </aside>
        <main className="min-w-0 flex-1 p-[16px] tablet:p-[20px] desktop:p-[24px] desktop:overflow-y-auto">
          <PreviewPanel />
        </main>
        <aside className="border-t border-border p-[16px] tablet:p-[16px] desktop:p-[16px] desktop:w-[340px] desktop:border-t-0 desktop:border-l desktop:overflow-y-auto">
          <PropEditorPanel />
        </aside>
      </div>
    </div>
  );
}
