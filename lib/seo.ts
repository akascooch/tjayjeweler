import type { Metadata } from "next";

export const SITE_NAME = "TJAY JEWELER";
export const SITE_URL = "https://tjayjeweler.com";
export const SITE_DESCRIPTION =
  "Hand-finished sterling silver jewelry — rings, chains, and cuffs from TJAY JEWELER.";
export const DEFAULT_OG_IMAGE = "/images/brand/logo.png";

export function publicPageMetadata({
  title,
  description,
  path,
  images,
  index = true,
  absolute = false,
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
  index?: boolean;
  /** Bypass the root `%s · TJAY JEWELER` title template. */
  absolute?: boolean;
}): Metadata {
  const ogImages = (images?.length ? images : [DEFAULT_OG_IMAGE]).map((url) => ({
    url,
    alt: title.includes(SITE_NAME) ? SITE_NAME : `${title} · ${SITE_NAME}`,
  }));
  const displayTitle = absolute || title === SITE_NAME ? SITE_NAME : `${title} · ${SITE_NAME}`;
  const metadataTitle = absolute || title === SITE_NAME ? { absolute: SITE_NAME } : title;

  return {
    title: metadataTitle,
    description,
    alternates: { canonical: path },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: displayTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      images: ogImages.map((image) => image.url),
    },
  };
}
