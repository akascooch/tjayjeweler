import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

const root = process.cwd();
const source = path.join(root, "public/images/brand/logo.png");
const iconDir = path.join(root, "public/icons");
const background = "#0a0a0a";
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function trimmedLogo() {
  return sharp(source).trim().toBuffer();
}

async function encode(image: Sharp) {
  return image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

// Full-bleed square for launchers. Logo height stays within the maskable safe zone
// (a centered circle with 40% radius), so Android can crop to any shape.
async function appIcon(logo: Buffer, size: number, logoHeight: number) {
  const height = Math.round(size * logoHeight);
  const mark = await sharp(logo).resize({ height, fit: "inside" }).toBuffer();
  const composed = await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
  return encode(sharp(composed).removeAlpha());
}

// Rounded dark tile so the mid-grey chrome mark stays legible on both light and dark tab bars.
async function faviconTile(logo: Buffer, size: number) {
  const inner = Math.round(size * 0.86);
  const mark = await sharp(logo)
    .resize(inner, inner, { fit: "contain", background: transparent })
    .linear([1.7, 1.7, 1.7, 1], [20, 20, 20, 0])
    .sharpen({ sigma: 0.6 })
    .png()
    .toBuffer();
  const radius = Math.round(size * 0.22);
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/></svg>`,
  );
  return encode(sharp(tile).composite([{ input: mark, gravity: "center" }]));
}

// ICO container with PNG-encoded frames (supported by every current browser).
function icoFromPngs(frames: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + frames.length * 16;
  for (const frame of frames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 0);
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(frame.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += frame.data.length;
  }

  return Buffer.concat([header, ...entries, ...frames.map((frame) => frame.data)]);
}

async function main() {
  await mkdir(iconDir, { recursive: true });
  const logo = await trimmedLogo();

  const outputs: [string, Buffer][] = [
    ["public/icons/icon-192x192.png", await appIcon(logo, 192, 0.6)],
    ["public/icons/icon-512x512.png", await appIcon(logo, 512, 0.6)],
    ["public/icons/apple-touch-icon.png", await appIcon(logo, 180, 0.7)],
    ["public/icons/favicon-32x32.png", await faviconTile(logo, 32)],
    ["public/icons/favicon-16x16.png", await faviconTile(logo, 16)],
  ];

  const icoFrames = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, data: await faviconTile(logo, size) })),
  );
  outputs.push(["public/favicon.ico", icoFromPngs(icoFrames)]);

  for (const [file, data] of outputs) {
    await writeFile(path.join(root, file), data);
    console.log(`${file} ${data.length} bytes`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
