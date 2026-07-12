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
          className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] p-[4.272vw] tablet:p-[2vw] desktop:p-[0.832vw]"
        >
          <span className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] font-medium text-destructive">
            {examples.boundary.failedTitle}
          </span>
          <p className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
            {this.state.message}
          </p>
        </Alert>
      );
    }
    return this.props.children;
  }
}
