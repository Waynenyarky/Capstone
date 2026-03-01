/**
 * Shared validation for person name fields.
 * Allows letters (including Unicode \p{L}), spaces, hyphens, and apostrophes.
 * Intentionally disallows numbers, emoji, and other symbols to improve data
 * quality and prevent injection. This covers all scripts (Latin, CJK, Arabic,
 * Cyrillic, etc.) via the Unicode property escape.
 */
export const NAME_PATTERN = /^[\p{L}\s\-'.]*$/u
export const NAME_PATTERN_MESSAGE = 'Use only letters, spaces, hyphens, and apostrophes'

export const namePatternRule = {
  pattern: NAME_PATTERN,
  message: NAME_PATTERN_MESSAGE,
}
