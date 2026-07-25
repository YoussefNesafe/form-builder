import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

afterEach(cleanup);

describe("Logo", () => {
  it("renders an accessible mark by default", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: /form builder/i })).toBeTruthy();
  });

  it("renders the wordmark text when asked", () => {
    render(<Logo withWordmark />);
    expect(screen.getByText("Form Builder")).toBeTruthy();
  });
});
