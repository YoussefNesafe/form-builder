import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { generateThemeCss } from "./themeCss";

function token(css: string, name: string): string | undefined {
  const m = css.match(new RegExp(`^\\s*--${name}:\\s*(.+);`, "m"));
  return m?.[1];
}

function read(path: string): string {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function vwTokenMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of generateThemeCss({ unit: "vw" }).split("\n")) {
    const m = line.match(/--(fb-space-[\w-]+):\s*([\d.]+vw);/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("generateThemeCss", () => {
  it("vw output matches the shipped tokens.css", () => {
    const shipped = read("form-builder/theme/tokens.css");
    expect(generateThemeCss({ unit: "vw" })).toBe(shipped);
  });

  it("every engine fallback matches the generator's vw scale (no silent desync)", () => {
    const map = vwTokenMap();
    const re = /var\(--(fb-space-[\w-]+),\s*([\d.]+vw)\)/g;
    let checked = 0;
    for (const file of walk("form-builder")) {
      const src = read(file);
      for (const m of src.matchAll(re)) {
        const [, name, literal] = m;
        expect(map.get(name), `${name} in ${file}`).toBe(literal);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(300);
  });

  it("vw values match the engine's baked-in defaults", () => {
    const css = generateThemeCss({ unit: "vw" });
    expect(token(css, "fb-space-3")).toBe("1.602vw");
    expect(token(css, "fb-space-3-tablet")).toBe("0.75vw");
    expect(token(css, "fb-space-3-desktop")).toBe("0.312vw");
    expect(token(css, "fb-space-8-tablet")).toBe("2vw");
    expect(token(css, "fb-space-144-desktop")).toBe("14.976vw");
  });

  it("px at the default reference widths regenerates the 2px-per-step design", () => {
    const css = generateThemeCss({ unit: "px" });
    expect(token(css, "fb-space-8")).toBe("16px");
    expect(token(css, "fb-space-8-tablet")).toBe("16px");
    expect(token(css, "fb-space-8-desktop")).toBe("16px");
    expect(token(css, "fb-space-7-desktop")).toBe("14px");
    expect(token(css, "fb-space-3-desktop")).toBe("6px");
    expect(token(css, "fb-space-144-desktop")).toBe("288px");
  });

  it("rem/em divide px by base (default 16)", () => {
    const rem = generateThemeCss({ unit: "rem" });
    expect(token(rem, "fb-space-8-desktop")).toBe("1rem");
    expect(token(rem, "fb-space-7-desktop")).toBe("0.875rem");

    const em = generateThemeCss({ unit: "em" });
    expect(token(em, "fb-space-8-desktop")).toBe("1em");

    const rem8 = generateThemeCss({ unit: "rem", base: 8 });
    expect(token(rem8, "fb-space-8-desktop")).toBe("2rem");
  });

  it("honors custom per-tier reference widths", () => {
    const css = generateThemeCss({ unit: "px", refDesktop: 1440 });
    expect(token(css, "fb-space-8-desktop")).toBe("12px");
    expect(token(css, "fb-space-8-tablet")).toBe("16px");
  });

  it("emits every step on all three tiers", () => {
    const css = generateThemeCss({ unit: "vw" });
    const count = (css.match(/--fb-space-\d+(-tablet|-desktop)?:/g) ?? []).length;
    expect(count).toBe(17 * 3);
  });
});
