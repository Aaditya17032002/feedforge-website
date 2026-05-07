export function requireText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

