import { describe, it, expect } from 'vitest'
import { topFixedPrize, splitCombination } from './split'
import type { Rule } from '../data/types'

describe('topFixedPrize', () => {
  it('排列3 直选 = 1040', () => expect(topFixedPrize('pl3', 'zhixuan')).toBe(1040))
  it('快乐8 选七 = 8500', () => expect(topFixedPrize('kl8', 'kl8-7')).toBe(8500))
  it('快乐8 选十(浮动忽略)= 8000', () => expect(topFixedPrize('kl8', 'kl8-10')).toBe(8000))
})

const bet = (playId: string, multiplier: number) => ({ playId, multiplier })

describe('splitCombination 单玩法 separate', () => {
  it('3D直选10倍 不限实名 → 2张(1张实名),省税2080', () => {
    const p = splitCombination('pl3', [bet('zhixuan', 10)], [], 99, 'separate', 0)
    expect(p.feasible).toBe(true)
    expect(p.tickets).toHaveLength(2)
    expect(p.realnameCount).toBe(1)
    expect(p.totalWin).toBe(10400)
    expect(p.originalTax).toBe(2080)
  })
  it('3D直选10倍 要求0实名 → 5张全免实名', () => {
    const p = splitCombination('pl3', [bet('zhixuan', 10)], [], 0, 'separate', 0)
    expect(p.tickets).toHaveLength(5)
    expect(p.realnameCount).toBe(0)
  })
  it('快乐8选八(单注5万)→ 无法避税', () => {
    const p = splitCombination('kl8', [bet('kl8-8', 1)], [], 99, 'separate', 0)
    expect(p.feasible).toBe(false)
    expect(p.reason).toContain('无法通过拆分避免缴税')
    expect(p.originalTax).toBe(10000)
  })
})

describe('splitCombination 组合', () => {
  it('separate:直选10+组六10 → 3张,1张实名,合计12130', () => {
    const p = splitCombination('pl3', [bet('zhixuan', 10), bet('zu6', 10)], [], 99, 'separate', 0)
    expect(p.tickets).toHaveLength(3)
    expect(p.realnameCount).toBe(1)
    expect(p.totalWin).toBe(12130)
    expect(p.originalWin).toBe(12130)
    expect(p.originalTax).toBe(2426)
  })
  it('mixed:直选10+组六10 → 混合打包成更少张(2张)', () => {
    const p = splitCombination('pl3', [bet('zhixuan', 10), bet('zu6', 10)], [], 99, 'mixed', 0)
    expect(p.tickets).toHaveLength(2)
    expect(p.realnameCount).toBe(1)
    expect(p.totalWin).toBe(12130)
    expect(p.tickets[0].items.length).toBeGreaterThan(1) // 一张票上含多种玩法
  })
  it('mixed:组三10+组六10 同票按较高者(3460)算,1张', () => {
    const p = splitCombination('pl3', [bet('zu3', 10), bet('zu6', 10)], [], 99, 'mixed', 0)
    expect(p.tickets).toHaveLength(1)            // 互斥,合计仅3460,一张装下
    expect(p.tickets[0].win).toBe(3460)
    expect(p.realnameCount).toBe(1)
  })
})

describe('splitCombination 规则感知(直选满20元加至1500)', () => {
  const rule: Rule = {
    id: 'r', name: '直选加奖', enabled: true, games: ['pl3'], plays: ['zhixuan'],
    condition: { kind: 'betAmountGte', value: 20 }, effect: { kind: 'setPerBetPrize', value: 1500 },
  }
  it('拆分会丢掉加奖(每票<满20元):整买30000/到手24000,拆分仅20800', () => {
    const p = splitCombination('pl3', [bet('zhixuan', 20)], [rule], 99, 'separate', 0)
    expect(p.originalWin).toBe(30000)       // 满20元享加奖 1500×20
    expect(p.originalTax).toBe(6000)
    expect(p.originalNet).toBe(24000)       // 不拆到手
    expect(p.totalWin).toBe(20800)          // 拆后每票<20元无加奖,免税到手
    expect(p.tickets).toHaveLength(3)
    expect(p.realnameCount).toBe(2)
  })
})
