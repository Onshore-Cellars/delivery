/**
 * Escapes HTML special characters to prevent XSS when rendering user-provided
 * text. This is intentionally a simple entity-encoding approach — for richer
 * HTML content use a dedicated library like DOMPurify.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Sanitizes specific string fields on a plain object.
 *
 * @param obj    - The source object (shallow-cloned before mutation).
 * @param fields - An array of keys whose string values should be sanitized.
 * @returns A new object with the specified fields HTML-escaped.
 *
 * @example
 * ```ts
 * const safe = sanitizeObject(
 *   { name: '<script>alert(1)</script>', age: 30 },
 *   ['name'],
 * )
 * // safe.name === '&lt;script&gt;alert(1)&lt;/script&gt;'
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
): T {
  const result = { ...obj }
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      ;(result as Record<string, unknown>)[field] = sanitizeHtml(
        result[field] as string,
      )
    }
  }
  return result
}
