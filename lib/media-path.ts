export const PRODUCT_MEDIA_PREFIX = "/media/products/";

export const productMediaFilePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;

/** Returns the stored file name when the URL points at an uploaded product image. */
export function productMediaFile(url: string) {
  if (!url.startsWith(PRODUCT_MEDIA_PREFIX)) return null;
  const file = url.slice(PRODUCT_MEDIA_PREFIX.length);
  return productMediaFilePattern.test(file) ? file : null;
}
