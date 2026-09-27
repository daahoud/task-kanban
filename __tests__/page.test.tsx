import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from '@/app/page'

test('Page renders the getting-started heading', () => {
  render(<Page />)
  expect(
    screen.getByRole('heading', { level: 1, name: /To get started/ }),
  ).toBeDefined()
})
