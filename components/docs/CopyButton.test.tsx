// @vitest-environment jsdom
//
// jsdom doesn't implement the Clipboard API, so navigator.clipboard is
// stubbed per test (writeText is the only method CopyButton calls). Style
// follows CopyPackageFolderSection.test.tsx (jsdom, testing-library).
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton";

afterEach(cleanup);

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("CopyButton", () => {
  afterEach(() => {
    // @ts-expect-error -- test-only cleanup of the stub installed by stubClipboard
    delete navigator.clipboard;
  });

  it("writes the exact `text` prop to the clipboard on click — no derived/re-typed copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CopyButton text="yarn add react-hook-form zod" label="command" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledExactlyOnceWith("yarn add react-hook-form zod");
  });

  it("swaps the accessible name to the copied state, then reverts after the timeout", async () => {
    vi.useFakeTimers();
    try {
      const writeText = vi.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      render(<CopyButton text="npx shadcn@latest add button" label="command" />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
        await Promise.resolve();
      });
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole("button", { name: "Copy command" })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not throw when the Clipboard API is unavailable (e.g. non-secure context)", () => {
    // navigator.clipboard left undefined — simulates http:// / unsupported browsers.
    render(<CopyButton text="whatever" label="command" />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Copy command" }))).not.toThrow();
  });

  it("does not throw and never flips to Copied when the clipboard write is rejected (e.g. permission denied)", async () => {
    const writeText = vi.fn(() => Promise.reject(new Error("blocked")));
    stubClipboard(writeText);
    render(<CopyButton text="whatever" label="command" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
      // Two microtask flushes: one for the awaited writeText rejection, one for the catch continuation.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledExactlyOnceWith("whatever");
    expect(screen.getByRole("button", { name: "Copy command" })).toBeTruthy();
  });

  it("collapses rapid re-clicks into a single revert timer, timed from the last click", async () => {
    vi.useFakeTimers();
    try {
      const writeText = vi.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      render(<CopyButton text="cmd" label="command" />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
        await Promise.resolve();
      });
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();

      // Second click lands inside the first click's 2s window.
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copied" }));
        await Promise.resolve();
      });
      expect(writeText).toHaveBeenCalledTimes(2);

      // 1900ms after the SECOND click == 2900ms after the first — past the first
      // click's original 2000ms mark. Still "Copied" proves that timer was cleared,
      // not left to fire independently.
      await act(async () => {
        vi.advanceTimersByTime(1900);
      });
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();

      // The remaining 100ms completes exactly 2000ms since the SECOND click.
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.getByRole("button", { name: "Copy command" })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the pending revert timer on unmount — no update-after-unmount warning", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const writeText = vi.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      const { unmount } = render(<CopyButton text="cmd" label="command" />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
        await Promise.resolve();
      });
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();

      unmount();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      vi.useRealTimers();
    }
  });
});
