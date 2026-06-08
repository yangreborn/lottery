import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultCard } from './ResultCard'
import type { TierResult } from '../data/types'

const withRule: TierResult = {
  tierId: 'hit', tierLabel: '直选命中', base: 1040, multiplier: 10, afterMult: 10400,
  applied: [{ ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 }],
  amount: 20800, tax: 4160, netAmount: 16640, needTax: true, needRealname: true, floating: false,
}

const floating: TierResult = {
  tierId: 'hit10', tierLabel: '中10个', base: 0, multiplier: 1, afterMult: 0,
  applied: [], amount: null, tax: 0, netAmount: null, needTax: false, needRealname: false, floating: true,
}

describe('ResultCard', () => {
  it('显示金额与缴税/实名文字', () => {
    render(<ResultCard result={withRule} />)
    // 金额同时出现在主显示与明细"= 最终"中,故用 getAllByText
    expect(screen.getAllByText('¥20,800').length).toBeGreaterThan(0)
    expect(screen.getByText('缴税')).toBeInTheDocument()
    expect(screen.getByText('实名')).toBeInTheDocument()
  })

  it('展示规则增量明细(规则名 + 增量)', () => {
    render(<ResultCard result={withRule} />)
    expect(screen.getByText(/满18翻倍/)).toBeInTheDocument()
    expect(screen.getByText(/\+¥10,400/)).toBeInTheDocument()
  })

  it('应税档位即使没有规则也显示税后金额', () => {
    render(<ResultCard result={{ ...withRule, applied: [] }} />)
    expect(screen.getByText(/税后 ¥16,640/)).toBeInTheDocument()
  })

  it('免税档显示 免税/免实名', () => {
    render(<ResultCard result={{ ...withRule, amount: 1500, applied: [], tax: 0, netAmount: 1500, needTax: false, needRealname: false }} />)
    expect(screen.getByText('免税')).toBeInTheDocument()
    expect(screen.getByText('免实名')).toBeInTheDocument()
  })

  it('浮动奖显示提示,不显示金额', () => {
    render(<ResultCard result={floating} />)
    expect(screen.getByText(/浮动/)).toBeInTheDocument()
  })
})
