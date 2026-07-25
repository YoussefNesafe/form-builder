import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

// The mark geometry is deliberately hand-copied across surfaces (a .svg file, an
// inline React SVG, and a raster-build script) because Satori and standalone .svg
// can't import a shared TS constant. This test pins that duplication: extract the
// two brace `d` paths and the three field-row (y,width) tuples from each source and
// assert they are byte-identical. If you intentionally change the mark, update all
// three — this test tells you which drifted.
function markGeometry(src: string) {
  const braces = [...src.matchAll(/d="(M[\d.]+ 4\.5C[^"]+)"/g)].map((m) => m[1]);
  const rows = [
    ...src.matchAll(/x="9"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="1\.7"\s+rx="0\.85"/g),
  ].map((m) => `${m[1]}:${m[2]}`);
  return { braces, rows };
}

describe("brand mark geometry stays consistent across surfaces", () => {
  const svg = markGeometry(read("public/brand/logo-mark.svg"));
  const component = markGeometry(read("components/brand/Logo.tsx"));
  const script = markGeometry(read("scripts/build-brand-assets.mjs"));

  it("the master svg has the expected two braces + three rows", () => {
    expect(svg.braces).toHaveLength(2);
    expect(svg.rows).toEqual(["7.6:6", "11.15:3.9", "14.7:4.9"]);
  });

  it("Logo.tsx matches the master svg", () => {
    expect(component).toEqual(svg);
  });

  it("build-brand-assets.mjs matches the master svg", () => {
    expect(script).toEqual(svg);
  });
});
