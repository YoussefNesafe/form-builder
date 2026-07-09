"use client";

import { Component, type ReactNode } from "react";

type Props = {
  /** When this changes (e.g. the config was edited), the boundary clears its error and retries. */
  resetKey: string;
  children: ReactNode;
  fallback: (message: string) => ReactNode;
};

type State = { message: string | null };

/**
 * Catches render errors from the preview form (a mid-edit config can be invalid
 * in ways `validateFormConfig` doesn't cover) and shows a fallback instead of
 * crashing the whole builder. Recovers automatically when the config changes.
 */
export class PreviewBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.message) {
      this.setState({ message: null });
    }
  }

  render() {
    if (this.state.message) return this.props.fallback(this.state.message);
    return this.props.children;
  }
}
