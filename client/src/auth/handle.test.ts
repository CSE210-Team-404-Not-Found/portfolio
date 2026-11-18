import { describe, expect, it } from 'vitest'
import { isValidHandle, normalizeHandle } from './handle'

describe('normalizeHandle', () => {
  it('trims spaces, drops a leading @ and lowercases', () => {
    expect(normalizeHandle('  @Maya.Bsky.Social ')).toBe('maya.bsky.social')
  })
})

describe('isValidHandle', () => {
  it.each(['maya.bsky.social', 'maya.dev', 'a-b.c-d.example.com'])('accepts %s', (handle) => {
    expect(isValidHandle(handle)).toBe(true)
  })

  it.each([
    ['no domain', 'maya'],
    ['empty', ''],
    ['leading hyphen', '-maya.dev'],
    ['last segment starts with a digit', 'maya.123'],
    ['contains a space', 'maya bsky.social'],
    ['too long', `${'a'.repeat(250)}.dev`],
  ])('rejects a handle with %s', (_reason, handle) => {
    expect(isValidHandle(handle)).toBe(false)
  })
})
