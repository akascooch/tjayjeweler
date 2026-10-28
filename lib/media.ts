import { randomUUID } from "node:crypto";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { prisma } from "@/lib/db";
import { productMediaFile, productMediaFilePattern } from "@/lib/media-path";

const PRODUCTION_MEDIA_ROOT = "/var/lib/tjayjeweler/media";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2500;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

sharp.cache(false);

export class ImageRejected extends Error {}

export function mediaRoot() {
  const configured = process.env.MEDIA_ROOT?.trim();
  if (configured) return path.resolve(configured);
  return process.env.NODE_ENV === "production" ? PRODUCTION_MEDIA_ROOT : path.resolve(process.cwd(), ".media");
}

function productMediaDir() {
  return path.join(mediaRoot(), "products");
}

function requestMediaDir() {
  return path.join(mediaRoot(), "requests");
}

export function productMediaPath(file: string) {
  if (!productMediaFilePattern.test(file)) {
    throw new Error("Invalid media file name");
  }
  return path.join(productMediaDir(), file);
}

/** Decodes untrusted bytes and re-encodes them as a metadata-free WebP. */
export async function encodeProductImage(input: Buffer) {
  const options = { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" as const };

  let metadata: Metadata;
  try {
    metadata = await sharp(input, options).metadata();
  } catch {
    throw new ImageRejected("The file is not a readable image.");
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new ImageRejected("Upload a JPEG, PNG, or WebP image.");
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new ImageRejected("Animated images are not supported.");
  }
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new ImageRejected("Images can be at most 40 megapixels.");
  }

  try {
    const { data, info } = await sharp(input, options)
      .rotate()
      .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new ImageRejected("The image could not be processed.");
  }
}

/** Writes to a temp file in the target directory, then renames so readers never see partial files. */
export async function storeProductImage(data: Buffer) {
  const dir = productMediaDir();
  await mkdir(dir, { recursive: true, mode: 0o755 });

  const file = `${randomUUID()}.webp`;
  const temp = path.join(dir, `.upload-${randomUUID()}.tmp`);
  try {
    await writeFile(temp, data, { flag: "wx", mode: 0o644 });
    await rename(temp, path.join(dir, file));
  } catch (error) {
    await unlink(temp).catch(() => undefined);
    throw error;
  }
  return file;
}

export function requestMediaPath(file: string) {
  if (!productMediaFilePattern.test(file)) {
    throw new Error("Invalid media file name");
  }
  return path.join(requestMediaDir(), file);
}

/** Stores a customer reference image outside the release tree, under a random name. */
export async function storeRequestImage(data: Buffer) {
  const dir = requestMediaDir();
  await mkdir(dir, { recursive: true, mode: 0o755 });

  const file = `${randomUUID()}.webp`;
  const temp = path.join(dir, `.upload-${randomUUID()}.tmp`);
  try {
    await writeFile(temp, data, { flag: "wx", mode: 0o644 });
    await rename(temp, path.join(dir, file));
  } catch (error) {
    await unlink(temp).catch(() => undefined);
    throw error;
  }
  return file;
}

export async function removeRequestImageFile(file: string) {
  try {
    await unlink(requestMediaPath(file));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function removeProductImageFile(file: string) {
  try {
    await unlink(productMediaPath(file));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

/** Deletes an uploaded file once no image row references its URL. Call after the row change commits. */
export async function releaseProductMedia(url: string) {
  const file = productMediaFile(url);
  if (!file) return;
  const stillUsed = await prisma.productImage.count({ where: { url } });
  if (stillUsed > 0) return;
  try {
    await removeProductImageFile(file);
  } catch (error) {
    console.error(error instanceof Error ? error.name : "media cleanup failed");
  }
}
