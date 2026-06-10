import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PendingBanner } from './PendingBanner'

describe('PendingBanner', () => {
  it('count 为 0 时不渲染', () => {
    const { container } = render(<PendingBanner count={0} onClick={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('count>0 显示数量并可点击', async () => {
    const onClick = vi.fn()
    render(<PendingBanner count={2} onClick={onClick} />)
    expect(screen.getByText(/有 2 条公告未应用为规则/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
