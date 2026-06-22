export const SUPPORTED_SHOPEE_DOMAINS = [
  "shopee.vn",
  "www.shopee.vn",
  "s.shopee.vn",
] as const;

export type SupportedShopeeDomain = (typeof SUPPORTED_SHOPEE_DOMAINS)[number];

export function parseShopeeUrl(value: string): URL | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

export function isSupportedShopeeDomain(hostname: string): hostname is SupportedShopeeDomain {
  return SUPPORTED_SHOPEE_DOMAINS.includes(hostname.toLowerCase() as SupportedShopeeDomain);
}
