import { describe, it, expect } from 'vitest'
import { topFixedPrize, splitTicket } from './split'

describe('topFixedPrize', () => {
  it('排列3 直选 = 1040', () => expect(topFixedPrize('pl3', 'zhixuan')).toBe(1040))
  it('快乐8 选七 = 8500', () => expect(topFixedPrize('kl8', 'kl8-7')).toBe(8500))
  it('快乐8 选十(浮动忽略)= 8000', () => expect(topFixedPrize('kl8', 'kl8-10')).toBe(8000))
})

describe('splitTicket', () => {
  it('3D直选10倍 不限实名 → 2张(1张实名),省税2080', () => {
    const p = splitTicket('pl3', 'zhixuan', 10, 99)
    expect(p.feasible).toBe(true)
    expect(p.tickets).toHaveLength(2)          // 9倍 + 1倍
    expect(p.realnameCount).toBe(1)
    expect(p.totalWin).toBe(10400)
    expect(p.originalTax).toBe(2080)
    expect(p.taxSaved).toBe(2080)
    expect(p.tickets[0]).toEqual({ multiplier: 9, win: 9360, needRealname: true })
  })

  it('3D直选10倍 要求0实名 → 5张全免实名', () => {
    const p = splitTicket('pl3', 'zhixuan', 10, 0)
    expect(p.tickets).toHaveLength(5)          // 每张2倍
    expect(p.realnameCount).toBe(0)
    expect(p.tickets.every(t => t.multiplier === 2 && !t.needRealname)).toBe(true)
    expect(p.totalWin).toBe(10400)
  })

  it('快乐8选八(单注5万)→ 无法避税', () => {
    const p = splitTicket('kl8', 'kl8-8', 1, 99)
    expect(p.feasible).toBe(false)
    expect(p.reason).toContain('无法通过拆分避免缴税')
    expect(p.originalTax).toBe(10000)
  })

  it('快乐8选七2倍 → 免税但实名不可避(每票均实名)', () => {
    const p = splitTicket('kl8', 'kl8-7', 2, 99)
    expect(p.feasible).toBe(true)
    expect(p.tickets).toHaveLength(2)          // 每张1倍=8500
    expect(p.realnameCount).toBe(2)
    expect(p.taxSaved).toBe(3400)              // 原 17000 → 税3400
  })
})
