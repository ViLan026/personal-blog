/** Lowercase ASCII words separated by single hyphens. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return SLUG_REGEX.test(value);
}

/**
 * Turns any text (including Vietnamese) into a URL slug.
 * "Quản lý bộ nhớ" → "quan-ly-bo-nho", "TCP/IP" → "tcp-ip".
 */
export function slugify(input: string, maxLength = 120): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}
