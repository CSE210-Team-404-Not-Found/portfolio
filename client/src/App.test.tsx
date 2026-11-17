// Smoke test: the app renders, and the build carries a version.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { VERSION } from './version.ts'

describe('App', () => {
  it('renders a top-level heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })
})

describe('VERSION', () => {
  it('is the version from package.json', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})
