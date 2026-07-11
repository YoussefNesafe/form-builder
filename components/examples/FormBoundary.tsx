"use client";

import { Component, type ReactNode } from "react";

type State = { message: string | null };

/**
 * Minimal render-error boundary for example forms. Unlike the builder's
 * PreviewBoundary, these configs are static (not edited live), so there is
 * no resetKey to recover on — a render error here means the example itself
 * is broken.
 */
export class FormBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.message) {
      return (
        <div
          role="alert"
          className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-destructive/40 bg-destructive/10 p-[16px] tablet:p-[16px] desktop:p-[16px]"
        >
          <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium text-destructive">
            This example failed to render
          </span>
          <p className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
            {this.state.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
