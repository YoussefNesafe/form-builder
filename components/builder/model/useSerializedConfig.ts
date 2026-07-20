"use client";

import { useMemo } from "react";
import { validateFormConfig, type FormConfig } from "@/form-builder";
import { useBuilderStore } from "./store";
import { serialize } from "./serialize";

export function useSerializedConfig(): { config: FormConfig; error: string | null } {
  const title = useBuilderStore((s) => s.title);
  const description = useBuilderStore((s) => s.description);
  const nodes = useBuilderStore((s) => s.nodes);
  const multiStep = useBuilderStore((s) => s.multiStep);
  const steps = useBuilderStore((s) => s.steps);

  const config = useMemo(
    () => serialize({ title, description, nodes, multiStep, steps }),
    [title, description, nodes, multiStep, steps],
  );

  const error = useMemo<string | null>(() => {
    if (nodes.length === 0) return null;
    try {
      validateFormConfig(config);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [config, nodes.length]);

  return { config, error };
}
