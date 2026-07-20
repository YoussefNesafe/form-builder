"use client";

import { Component, type ReactNode } from "react";

type Props = {
  resetKey: string;
  children: ReactNode;
  fallback: (message: string) => ReactNode;
};

type State = { message: string | null };

export class BuilderPreviewBoundary extends Component<Props, State> {
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
