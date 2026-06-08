import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiplierStepper } from './MultiplierStepper'

describe('MultiplierStepper', () => {
  it('点击 + 调用 onChange 增加', async () => {
    const onChange = vi.fn()
    render(<MultiplierStepper value={5} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '增加倍数' }))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('下限 1 不再减', async () => {
    const onChange = vi.fn()
    render(<MultiplierStepper value={1} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '减少倍数' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('上限 99 不再加', async () => {
    const onChange = vi.fn()
    render(<MultiplierStepper value={99} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '增加倍数' }))
    expect(onChange).toHaveBeenCalledWith(99)
  })
})
