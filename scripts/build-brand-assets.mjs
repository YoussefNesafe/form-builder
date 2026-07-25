// scripts/build-brand-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const PERIWINKLE = "#7f98f5";

// Mark as a standalone SVG string, parametrized by row color (no currentColor at raster time).
const mark = (rowColor) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <g stroke="${PERIWINKLE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 4.5C6.8 4.5 6.8 6 6.8 7.8C6.8 10.2 5.6 10.8 4.4 12C5.6 13.2 6.8 13.8 6.8 16.2C6.8 18 6.8 19.5 8.5 19.5"/>
    <path d="M15.5 4.5C17.2 4.5 17.2 6 17.2 7.8C17.2 10.2 18.4 10.8 19.6 12C18.4 13.2 17.2 13.8 17.2 16.2C17.2 18 17.2 19.5 15.5 19.5"/>
  </g>
  <g fill="${rowColor}">
    <rect x="9" y="7.6" width="6" height="1.7" rx="0.85"/>
    <rect x="9" y="11.15" width="3.9" height="1.7" rx="0.85"/>
    <rect x="9" y="14.7" width="4.9" height="1.7" rx="0.85"/>
  </g>
</svg>`;

// Rounded dark tile with a white-row mark centered (app-icon look).
const tile = (px) => {
  const r = Math.round(px * 0.22);
  const inset = Math.round(px * 0.2);
  const inner = px - inset * 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  <rect width="${px}" height="${px}" rx="${r}" fill="#0a0a0a"/>
  <g transform="translate(${inset} ${inset})">
    <svg width="${inner}" height="${inner}" viewBox="0 0 24 24">${mark("#fafafa").replace(/<\/?svg[^>]*>/g, "")}</svg>
  </g>
</svg>`;
};

const wordmark = () => {
  const H = 120, markBox = 96, pad = 12, textX = markBox + 28;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="${H}" viewBox="0 0 520 ${H}">
  <g transform="translate(${pad} ${(H - markBox) / 2})">
    <svg width="${markBox}" height="${markBox}" viewBox="0 0 24 24">${mark("#0a0a0a").replace(/<\/?svg[^>]*>/g, "")}</svg>
  </g>
  <text x="${textX}" y="${H / 2}" dominant-baseline="central"
        font-family="Geist, Inter, Arial, sans-serif" font-weight="600"
        font-size="52" letter-spacing="-1" fill="#0a0a0a">Form Builder</text>
</svg>`;
};

async function png(svg, outRel, size) {
  const out = join(ROOT, outRel);
  await mkdir(dirname(out), { recursive: true });
  let img = sharp(Buffer.from(svg));
  if (size) img = img.resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  await img.png().toFile(out);
  console.log("wrote", outRel);
}

await png(tile(32), "app/icon.png");                        // legacy favicon fallback: white rows on dark tile, contrast-safe at native 32px
await png(tile(180), "app/apple-icon.png");                 // iOS home screen
await png(tile(512), "public/brand/logo-512.png");          // npm org avatar
await png(wordmark(), "public/brand/logo-wordmark.png");    // README / marketing
