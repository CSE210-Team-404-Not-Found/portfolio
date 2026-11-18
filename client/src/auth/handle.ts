// AT Protocol handle syntax: dot-separated segments of letters, digits and hyphens,
// at least two segments, and a last segment that doesn't start with a digit.
const HANDLE_PATTERN =
  /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/

export const INVALID_HANDLE_MESSAGE = 'Enter a full handle, like alice.bsky.social.'

/** Trims spaces, drops a leading "@" and lowercases, so " @Maya.bsky.social" works. */
export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase()
}

/** Checks a normalized handle's syntax. It doesn't check that the account exists. */
export function isValidHandle(handle: string): boolean {
  return handle.length <= 253 && HANDLE_PATTERN.test(handle)
}
