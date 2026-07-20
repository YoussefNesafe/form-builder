// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandBlock } from "./CommandBlock";
import { __resetPackageManagerStoreForTests } from "./packageManagerStore";

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

function selectTab(name: string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  __resetPackageManagerStoreForTests();
  // @ts-expect-error -- test-only cleanup of the stub installed by stubClipboard
  delete navigator.clipboard;
});

describe("CommandBlock", () => {
  it("defaults to the pnpm tab and shows the pnpm variant of the command", () => {
    render(<CommandBlock kind="execute" args="shadcn@latest add button" />);

    expect(screen.getByRole("tab", { name: "pnpm" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("pnpm dlx shadcn@latest add button")).toBeTruthy();
  });

  it("switches the visible command when a different tab is clicked", () => {
    render(<CommandBlock kind="execute" args="shadcn@latest add button" />);

    selectTab("npm");

    expect(screen.getByText("npx shadcn@latest add button")).toBeTruthy();
    expect(screen.queryByText("pnpm dlx shadcn@latest add button")).toBeNull();
  });

  it("copies the ACTIVE variant's exact text after switching tabs, not the default", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CommandBlock kind="install" args="zod react-hook-form" copyLabel="command" />);

    selectTab("yarn");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy command" }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledExactlyOnceWith("yarn add zod react-hook-form");
  });

  it("persists the selection to localStorage under the docs:package-manager key", () => {
    render(<CommandBlock kind="execute" args="shadcn@latest add button" />);

    selectTab("bun");

    expect(window.localStorage.getItem("docs:package-manager")).toBe("bun");
  });

  it("keeps two CommandBlocks on the same page in sync", () => {
    render(
      <>
        <CommandBlock kind="execute" args="shadcn@latest add button" />
        <CommandBlock kind="install" args="zod" />
      </>,
    );

    const [firstNpmTab, secondNpmTab] = screen.getAllByRole("tab", { name: "npm" });
    fireEvent.mouseDown(firstNpmTab);

    expect(secondNpmTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("npx shadcn@latest add button")).toBeTruthy();
    expect(screen.getByText("npm install zod")).toBeTruthy();
  });

  it("adopts a previously stored package manager after mount instead of staying on the default", async () => {
    window.localStorage.setItem("docs:package-manager", "yarn");

    render(<CommandBlock kind="execute" args="shadcn@latest add button" />);

    expect(await screen.findByText("yarn dlx shadcn@latest add button")).toBeTruthy();
  });

  it("ignores a corrupt/unknown stored value and keeps the deterministic default", async () => {
    window.localStorage.setItem("docs:package-manager", "npm7");

    render(<CommandBlock kind="execute" args="shadcn@latest add button" />);

    expect(await screen.findByText("pnpm dlx shadcn@latest add button")).toBeTruthy();
  });
});
