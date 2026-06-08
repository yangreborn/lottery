import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
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

  it('可以清空输入框并手动输入多位倍数(修复删不掉最前面1的问题)', async () => {
    function Harness() {
      const [v, setV] = useState(1)
      return <MultiplierStepper value={v} onChange={setV} />
    }
    render(<Harness />)
    const input = screen.getByLabelText('倍数输入') as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.type(input, '25')
    expect(input.value).toBe('25')
  })

  it('清空后失焦回落为 1', async () => {
    function Harness() {
      const [v, setV] = useState(5)
      return <MultiplierStepper value={v} onChange={setV} />
    }
    render(<Harness />)
    const input = screen.getByLabelText('倍数输入') as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.tab()
    expect(input.value).toBe('1')
  })
})
