import { describe, it, expect } from 'vitest'
import { computeTiers, computeDigitTicket, computeDigitMultiTicket, computeKl8Ticket, isDigitGame } from './calc'
import type { Rule } from '../data/types'

const NOW = Date.parse('2026-10-03')

describe('computeDigitTicket 组合投注', () => {
  it('isDigitGame', () => {
    expect(isDigitGame('fc3d')).toBe(true)
    expect(isDigitGame('pl3')).toBe(true)
    expect(isDigitGame('kl8')).toBe(false)
  })
  it('直选10倍+组六10倍 同时命中 → 合计 12130 缴税+实名', () => {
    const t = computeDigitTicket('pl3', [{ playId: 'zhixuan', multiplier: 10 }, { playId: 'zu6', multiplier: 10 }], [], NOW)
    expect(t.total).toBe(12130) // 1040*10 + 173*10
    expect(t.needTax).toBe(true)
    expect(t.needRealname).toBe(true)
    expect(t.contributions).toHaveLength(2)
  })
  it('倍数0的玩法不计入', () => {
    const t = computeDigitTicket('pl3', [{ playId: 'zhixuan', multiplier: 1 }, { playId: 'zu3', multiplier: 0 }], [], NOW)
    expect(t.contributions).toHaveLength(1)
    expect(t.total).toBe(1040)
  })
  it('组三+组六互斥:合计=直选+max(组三,组六),不全额相加', () => {
    const t = computeDigitTicket('pl3', [
      { playId: 'zhixuan', multiplier: 10 }, { playId: 'zu3', multiplier: 10 }, { playId: 'zu6', multiplier: 10 },
    ], [], NOW)
    // 直选10400 + max(组三3460, 组六1730) = 13860(而非 15590)
    expect(t.total).toBe(13860)
    expect(t.exclusiveNote).toBe(true)
  })
  it('只买组三+组六 → 合计取较高者', () => {
    const t = computeDigitTicket('pl3', [{ playId: 'zu3', multiplier: 10 }, { playId: 'zu6', multiplier: 10 }], [], NOW)
    expect(t.total).toBe(3460)
    expect(t.exclusiveNote).toBe(true)
  })
  it('内置加奖规则:直选满20元加至1500/注', () => {
    const rule: Rule = {
      id: 'r', name: '加奖', enabled: true, games: ['pl3'], plays: ['zhixuan'],
      condition: { kind: 'betAmountGte', value: 20 }, effect: { kind: 'setPerBetPrize', value: 1500 },
    }
    const t = computeDigitTicket('pl3', [{ playId: 'zhixuan', multiplier: 10 }], [rule], NOW)
    expect(t.contributions[0].amount).toBe(15000) // 1500 * 10
    expect(t.contributions[0].applied[0].ruleId).toBe('r')
  })
  it('投注未达门槛规则不触发', () => {
    const rule: Rule = {
      id: 'r', name: '加奖', enabled: true, games: ['pl3'], plays: ['zhixuan'],
      condition: { kind: 'betAmountGte', value: 20 }, effect: { kind: 'setPerBetPrize', value: 1500 },
    }
    // 只买直选 1 倍 = 投注 2 元 < 20
    const t = computeDigitTicket('pl3', [{ playId: 'zhixuan', multiplier: 1 }], [rule], NOW)
    expect(t.contributions[0].amount).toBe(1040)
    expect(t.contributions[0].applied).toEqual([])
  })
})

describe('computeTiers 无规则', () => {
  it('3D 直选 10倍 = 10400 → 缴税+实名,税后8320', () => {
    const [r] = computeTiers({ gameId: 'fc3d', playId: 'zhixuan', multiplier: 10 }, [], NOW)
    expect(r.amount).toBe(10400)
    expect(r.needTax).toBe(true)
    expect(r.needRealname).toBe(true)
    expect(r.tax).toBe(2080)
    expect(r.netAmount).toBe(8320)
  })

  it('快乐8 选八中八 50000 → 税后40000', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-8', multiplier: 1 }, [], NOW)
    const hit8 = res.find(t => t.tierId === 'hit8')!
    expect(hit8.amount).toBe(50000)
    expect(hit8.netAmount).toBe(40000)
    expect(hit8.needTax).toBe(true)
  })

  it('快乐8 选七中七 8500 → 免税但需实名', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-7', multiplier: 1 }, [], NOW)
    const hit7 = res.find(t => t.tierId === 'hit7')!
    expect(hit7.needTax).toBe(false)
    expect(hit7.needRealname).toBe(true)
  })

  it('选十中十为浮动奖 → amount=null, floating=true', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-10', multiplier: 1 }, [], NOW)
    const hit10 = res.find(t => t.tierId === 'hit10')!
    expect(hit10.floating).toBe(true)
    expect(hit10.amount).toBeNull()
    expect(hit10.netAmount).toBeNull()
  })
})

describe('computeTiers 带规则(满18元翻倍)', () => {
  const rule: Rule = { id: 'r1', name: '满18翻倍', enabled: true, games: 'all', condition: { kind: 'betAmountGte', value: 18 }, effect: { kind: 'multiply', factor: 2 } }

  it('3D 直选 10倍(投注20元)触发翻倍 → 20800,applied 记录', () => {
    const [r] = computeTiers({ gameId: 'fc3d', playId: 'zhixuan', multiplier: 10 }, [rule], NOW)
    expect(r.amount).toBe(20800)
    expect(r.applied).toEqual([{ ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 }])
  })

  it('3D 直选 5倍(投注10元)不触发 → 仍 5200', () => {
    const [r] = computeTiers({ gameId: 'fc3d', playId: 'zhixuan', multiplier: 5 }, [rule], NOW)
    expect(r.amount).toBe(5200)
    expect(r.applied).toEqual([])
  })

  it('浮动奖档位不套用规则', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-10', multiplier: 10 }, [rule], NOW)
    const hit10 = res.find(t => t.tierId === 'hit10')!
    expect(hit10.applied).toEqual([])
    expect(hit10.amount).toBeNull()
  })
})

describe('computeDigitMultiTicket', () => {
  it('两注相加:直选(1040)+组六(173)=1213,整票合计判定', () => {
    const r = computeDigitMultiTicket('fc3d', [
      { digits: [1, 2, 3], playId: 'zhixuan', multiplier: 1 },
      { digits: [1, 2, 3], playId: 'zu6', multiplier: 1 },
    ], [])
    expect(r.total).toBe(1213)
    expect(r.needRealname).toBe(false)
    expect(r.needTax).toBe(false)
    expect(r.contributions).toHaveLength(2)
  })

  it('整票合计过3千 → 需实名', () => {
    // 直选 1040 × 3倍 = 3120 > 3000
    const r = computeDigitMultiTicket('fc3d', [
      { playId: 'zhixuan', multiplier: 3 },
    ], [])
    expect(r.total).toBe(3120)
    expect(r.needRealname).toBe(true)
    expect(r.needTax).toBe(false)
  })

  it('倍数>0 才计入', () => {
    const r = computeDigitMultiTicket('fc3d', [
      { playId: 'zhixuan', multiplier: 0 },
      { playId: 'zu3', multiplier: 1 },
    ], [])
    expect(r.contributions).toHaveLength(1)
    expect(r.total).toBe(346)
  })
})

describe('computeKl8Ticket', () => {
  it('单注选七1倍:最高可中8500 → 存在实名、不存在缴税', () => {
    const r = computeKl8Ticket({ playId: 'kl8-7', bets: [{ multiplier: 1 }] }, [])
    expect(r.maxTotal).toBe(8500)
    expect(r.existsRealname).toBe(true)
    expect(r.existsTax).toBe(false)
    expect(r.maxFloating).toBe(false)
    expect(r.playLabel).toBe('选七')
  })

  it('选七两注顶档求和17000 → 存在缴税', () => {
    const r = computeKl8Ticket(
      { playId: 'kl8-7', bets: [{ multiplier: 1 }, { multiplier: 1 }] }, [])
    expect(r.maxTotal).toBe(17000)
    expect(r.existsTax).toBe(true)
    expect(r.existsRealname).toBe(true)
  })

  it('选十含浮动头奖 → maxFloating,必然缴税+实名', () => {
    const r = computeKl8Ticket({ playId: 'kl8-10', bets: [{ multiplier: 1 }] }, [])
    expect(r.maxFloating).toBe(true)
    expect(r.existsTax).toBe(true)
    expect(r.existsRealname).toBe(true)
  })

  it('锁定档位:选八票,一注锁中八(50000)、一注锁中七(800)=50800 精确合计', () => {
    const r = computeKl8Ticket({
      playId: 'kl8-8',
      bets: [
        { multiplier: 1, lockedTierId: 'hit8' },
        { multiplier: 1, lockedTierId: 'hit7' },
      ],
    }, [])
    expect(r.hasLocked).toBe(true)
    expect(r.lockedTotal).toBe(50800)
    expect(r.lockedNeedTax).toBe(true)
    expect(r.lockedTax).toBe(10160)   // 50800 × 20%
  })

  it('倍数>0 才计入', () => {
    const r = computeKl8Ticket(
      { playId: 'kl8-7', bets: [{ multiplier: 0 }, { multiplier: 1 }] }, [])
    expect(r.bets).toHaveLength(1)
    expect(r.maxTotal).toBe(8500)
  })
})
