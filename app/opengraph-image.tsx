import { ImageResponse } from "next/og";

export const alt = "Form Builder — Design forms visually, ship real React code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default ImageResponse font (network fetch is disallowed at build time here
// — see AGENTS.md/spec). No `fonts` array passed: Next/Satori falls back to
// its bundled font, which is sufficient for this flat, single-weight layout.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0a0a0a",
          padding: "80px",
        }}
      >
        <div style={{ width: "12px", height: "64px", backgroundColor: "#7f98f5", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: "40px", justifyContent: "center" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              color: "#fafafa",
              letterSpacing: "-1px",
              display: "flex",
            }}
          >
            Form Builder
          </div>
          <div
            style={{
              marginTop: "20px",
              fontSize: 30,
              color: "#a3a3a3",
              width: "760px",
              display: "flex",
            }}
          >
            Design forms visually, ship real React code.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
