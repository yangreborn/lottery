import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TicketResultView } from './TicketResultView'
import type { TicketResult } from '../../data/types'

const result: TicketResult = {
  contributions: [
    { playId: 'zhixuan', label: '直选', base: 1040, multiplier: 10, applied: [], amount: 10400, needTax: true, needRealname: true },
    { playId: 'zu6', label: '组选六', base: 173, multiplier: 10, applied: [], amount: 1730, needTax: false, needRealname: false },
  ],
  total: 12130, tax: 2426, netAmount: 9704, needTax: true, needRealname: true,
}

describe('TicketResultView', () => {
  it('显示合计金额与缴税/实名', () => {
    render(<TicketResultView result={result} />)
    expect(screen.getByText('同时命中 · 合计')).toBeInTheDocument()
    expect(screen.getByText('¥12,130')).toBeInTheDocument()
    expect(screen.getAllByText('缴税').length).toBeGreaterThan(0)
    expect(screen.getAllByText('实名').length).toBeGreaterThan(0)
  })

  it('空票提示设置倍数', () => {
    render(<TicketResultView result={{ contributions: [], total: 0, tax: 0, netAmount: 0, needTax: false, needRealname: false }} />)
    expect(screen.getByText(/请至少给一种玩法设置倍数/)).toBeInTheDocument()
  })
})
