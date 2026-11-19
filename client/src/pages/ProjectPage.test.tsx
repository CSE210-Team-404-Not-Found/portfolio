import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderAt } from '../test/render-at.tsx'

// these use the projects in mock-data.ts
describe('ProjectPage', () => {
  it('shows the project title and a link back to the profile', async () => {
    renderAt('/profile/alice.test/project/3lbmockproj01')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'OpenShowcase' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to @alice\.test/ })).toHaveAttribute(
      'href',
      '/profile/alice.test',
    )
  })

  it('says so when the project does not exist', async () => {
    renderAt('/profile/alice.test/project/nothinghere')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Project not found' }),
    ).toBeInTheDocument()
  })
})
