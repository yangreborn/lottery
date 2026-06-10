import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DigitTicketBuilder } from './DigitTicketBuilder'
import { computeDigitTicket } from '../../engine/calc'
import type { DigitBet } from '../../data/types'

function setup(bets: DigitBet[]) {
  const onChange = vi.fn()
  const result = computeDigitTicket('fc3d', bets, [])
  render(<DigitTicketBuilder gameId="fc3d" bets={bets} onChange={onChange} result={result} />)
  return { onChange }
}

describe('DigitTicketBuilder 号码闸控', () => {
  it('输 112(恰一对)禁用组选六', async () => {
    setup([{ playId: 'zhixuan', multiplier: 1 }])
    await userEvent.type(screen.getByLabelText('三位号码'), '112')
    expect(screen.getByText(/组选六 在此组合不可能中奖/)).toBeInTheDocument()
  })

  it('输 123(全不同)禁用组选三', async () => {
    setup([{ playId: 'zhixuan', multiplier: 1 }])
    await userEvent.type(screen.getByLabelText('三位号码'), '123')
    expect(screen.getByText(/组选三 在此组合不可能中奖/)).toBeInTheDocument()
  })
})
