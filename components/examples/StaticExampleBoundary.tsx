"use client";

import { Component, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { examples } from "@/locales/en/examples";

type State = { message: string | null };

/**
 * Minimal render-error boundary for example forms. Unlike the builder's
 * BuilderPreviewBoundary, these configs are static (not edited live), so there is
 * no resetKey to recover on — a render error here means the example itself
 * is broken.
 */
export class StaticExampleBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.message) {
      return (
        <Alert
          role="alert"
          className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] p-[16px] tablet:p-[16px] desktop:p-[16px]"
        >
          <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium text-destructive">
            {examples.boundary.failedTitle}
          </span>
          <p className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
            {this.state.message}
          </p>
        </Alert>
      );
    }
    return this.props.children;
  }
}
