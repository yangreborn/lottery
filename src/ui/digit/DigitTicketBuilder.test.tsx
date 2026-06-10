import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DigitTicketBuilder } from './DigitTicketBuilder'
import { computeDigitMultiTicket } from '../../engine/calc'
import type { DigitTicketBet } from '../../data/types'

function setup(bets: DigitTicketBet[]) {
  const onChange = vi.fn()
  const result = computeDigitMultiTicket('fc3d', bets, [])
  const utils = render(<DigitTicketBuilder gameId="fc3d" bets={bets} onChange={onChange} result={result} />)
  return { onChange, utils }
}

describe('DigitTicketBuilder 多注 + 号码闸控', () => {
  it('输 112(恰一对)→ 回调带 digits [1,1,2]', async () => {
    const { onChange } = setup([{ playId: 'zhixuan', multiplier: 1 }])
    await userEvent.type(screen.getByLabelText('第1注三位号码'), '112')
    expect(onChange).toHaveBeenLastCalledWith([{ playId: 'zhixuan', multiplier: 1, digits: [1, 1, 2] }])
  })

  it('号码 112(恰一对)→ 组选六选项禁用;123(全不同)→ 组选三禁用', () => {
    const { utils } = setup([{ playId: 'zhixuan', multiplier: 1, digits: [1, 1, 2] }])
    expect((screen.getByRole('option', { name: /组选六/ }) as HTMLOptionElement).disabled).toBe(true)
    expect((screen.getByRole('option', { name: /组选三/ }) as HTMLOptionElement).disabled).toBe(false)
    utils.rerender(
      <DigitTicketBuilder gameId="fc3d" bets={[{ playId: 'zhixuan', multiplier: 1, digits: [1, 2, 3] }]}
        onChange={() => {}} result={computeDigitMultiTicket('fc3d', [{ playId: 'zhixuan', multiplier: 1, digits: [1, 2, 3] }], [])} />,
    )
    expect((screen.getByRole('option', { name: /组选三/ }) as HTMLOptionElement).disabled).toBe(true)
    expect((screen.getByRole('option', { name: /组选六/ }) as HTMLOptionElement).disabled).toBe(false)
  })

  it('点添加一注 回调新增直选注', async () => {
    const { onChange } = setup([{ playId: 'zhixuan', multiplier: 1 }])
    await userEvent.click(screen.getByRole('button', { name: '＋ 添加一注' }))
    expect(onChange).toHaveBeenCalledWith([
      { playId: 'zhixuan', multiplier: 1 },
      { playId: 'zhixuan', multiplier: 1 },
    ])
  })

  it('满 5 注后不再显示添加按钮', () => {
    setup(Array.from({ length: 5 }, () => ({ playId: 'zhixuan', multiplier: 1 })))
    expect(screen.queryByRole('button', { name: '＋ 添加一注' })).toBeNull()
  })
})
