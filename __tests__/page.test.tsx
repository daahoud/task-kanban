import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from '@/app/page'

// Supabase への通信を担うデータアクセス層（外部依存）をモックする
vi.mock('@/lib/tasks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tasks')>()),
  fetchTasks: vi.fn().mockResolvedValue([]),
}))

test('Page renders the kanban heading', async () => {
  render(<Page />)
  expect(
    screen.getByRole('heading', { level: 1, name: /タスクカンバン/ }),
  ).toBeDefined()
  await screen.findByRole('region', { name: 'Todo' })
})
