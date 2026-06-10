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
    setup({ playId: 'kl8-7', multiplier: 1, bets: [{}] })
    expect(screen.getByText('本票最高可中')).toBeInTheDocument()
    expect(screen.getByText(/存在需要实名的中奖情况/)).toBeInTheDocument()
  })

  it('点添加一注 回调新增 bet(无独立倍数)', async () => {
    const { onChange } = setup({ playId: 'kl8-7', multiplier: 1, bets: [{}] })
    await userEvent.click(screen.getByRole('button', { name: '＋ 添加一注' }))
    expect(onChange).toHaveBeenCalledWith({ playId: 'kl8-7', multiplier: 1, bets: [{}, {}] })
  })

  it('整票倍数加到上限 15 后不再增长', async () => {
    const { onChange } = setup({ playId: 'kl8-7', multiplier: 15, bets: [{}] })
    await userEvent.click(screen.getByRole('button', { name: '增加倍数' }))
    expect(onChange).toHaveBeenCalledWith({ playId: 'kl8-7', multiplier: 15, bets: [{}] })
  })

  it('输入号码:连续数字按每2位识别,定整票玩法', async () => {
    const { onChange } = setup({ playId: 'kl8-1', multiplier: 1, bets: [{}] })
    await userEvent.click(screen.getByRole('button', { name: '✎ 输入号码' }))
    await userEvent.type(screen.getByLabelText('第1注号码输入'), '030711') // 03 07 11 → 选三
    await userEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(onChange).toHaveBeenCalledWith({
      playId: 'kl8-3',
      multiplier: 1,
      bets: [{ numbers: [3, 7, 11], lockedTierId: undefined }],
    })
  })

  it('一票只能一种选N:已有7个号,另一注输3个号被拒绝', async () => {
    const { onChange } = setup({ playId: 'kl8-7', multiplier: 1, bets: [{ numbers: [1, 2, 3, 4, 5, 6, 7] }, {}] })
    await userEvent.click(screen.getAllByRole('button', { name: '✎ 输入号码' })[1]) // 第2注
    await userEvent.type(screen.getByLabelText('第2注号码输入'), '030711')          // 仅3个号
    await userEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(screen.getByText(/本票为选七/)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('改玩法下拉 清空已输号码', async () => {
    const { onChange } = setup({ playId: 'kl8-7', multiplier: 1, bets: [{ numbers: [1, 2, 3, 4, 5, 6, 7] }] })
    await userEvent.selectOptions(screen.getByLabelText('快乐8玩法'), 'kl8-3')
    expect(onChange).toHaveBeenCalledWith({ playId: 'kl8-3', multiplier: 1, bets: [{}] })
  })
})
