import { describe, it, expect } from 'vitest'
import { computeTiers } from './calc'
import type { Rule } from '../data/types'

const NOW = Date.parse('2026-10-03')

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
