export function requireText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

type SanitizeOptions = {
  maxLen?: number
  preserveNewlines?: boolean
  toLowerCase?: boolean
}

export function sanitizeText(value: unknown, options: SanitizeOptions = {}): string {
  const { maxLen, preserveNewlines = false, toLowerCase = false } = options

  let text = requireText(value)
  if (!text) return ''

  text = preserveNewlines
    ? text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .join('\n')
        .trim()
    : text.replace(/\s+/g, ' ').trim()

  if (toLowerCase) {
    text = text.toLowerCase()
  }

  if (typeof maxLen === 'number' && maxLen >= 0 && text.length > maxLen) {
    text = text.slice(0, maxLen).trim()
  }

  return text
}

