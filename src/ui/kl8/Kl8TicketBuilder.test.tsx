import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Kl8TicketBuilder } from './Kl8TicketBuilder'
import { computeKl8Ticket } from '../../engine/calc'
import type { Kl8Entry } from '../../data/types'

function setup(entries: Kl8Entry[]) {
  const onChange = vi.fn()
  const result = computeKl8Ticket(entries, [])
  render(<Kl8TicketBuilder entries={entries} onChange={onChange} result={result} />)
  return { onChange }
}

describe('Kl8TicketBuilder', () => {
  it('选七1倍:显示最高可中与存在实名结论', () => {
    setup([{ playId: 'kl8-7', multiplier: 1 }])
    expect(screen.getByText('本票最高可中')).toBeInTheDocument()
    expect(screen.getAllByText('¥8,500').length).toBeGreaterThan(0)
    expect(screen.getByText(/存在需要实名的中奖情况/)).toBeInTheDocument()
  })

  it('点添加一注 回调新增 entry', async () => {
    const { onChange } = setup([{ playId: 'kl8-7', multiplier: 1 }])
    await userEvent.click(screen.getByRole('button', { name: '＋ 添加一注' }))
    expect(onChange).toHaveBeenCalledWith([
      { playId: 'kl8-7', multiplier: 1 },
      { playId: 'kl8-1', multiplier: 1 },
    ])
  })
})
