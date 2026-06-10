import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Kl8TicketBuilder } from './Kl8TicketBuilder'
import { computeKl8Ticket } from '../../engine/calc'
import type { Kl8Ticket } from '../../data/types'

function setup(ticket: Kl8Ticket) {
  const onChange = vi.fn()
  const result = computeKl8Ticket(ticket, [])
  render(<Kl8TicketBuilder ticket={ticket} onChange={onChange} result={result} />)
  return { onChange }
}

describe('Kl8TicketBuilder', () => {
  it('选七单注:显示最高可中与存在实名结论', () => {
    setup({ playId: 'kl8-7', bets: [{ multiplier: 1 }] })
    expect(screen.getByText('本票最高可中')).toBeInTheDocument()
    expect(screen.getByText(/存在需要实名的中奖情况/)).toBeInTheDocument()
  })

  it('点添加一注 回调新增 bet(同玩法)', async () => {
    const { onChange } = setup({ playId: 'kl8-7', bets: [{ multiplier: 1 }] })
    await userEvent.click(screen.getByRole('button', { name: '＋ 添加一注' }))
    expect(onChange).toHaveBeenCalledWith({
      playId: 'kl8-7',
      bets: [{ multiplier: 1 }, { multiplier: 1 }],
    })
  })

  it('改玩法下拉 回调新 playId 并清锁定', async () => {
    const { onChange } = setup({ playId: 'kl8-7', bets: [{ multiplier: 1, lockedTierId: 'hit7' }] })
    await userEvent.selectOptions(screen.getByLabelText('快乐8玩法'), 'kl8-8')
    expect(onChange).toHaveBeenCalledWith({
      playId: 'kl8-8',
      bets: [{ multiplier: 1, lockedTierId: undefined }],
    })
  })
})
