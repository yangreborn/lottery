import { describe, it, expect } from 'vitest'
import { applyEffect, conditionMatches, gameApplies, playApplies, isWithinValidity, applyActiveRules } from './rules'
import type { CalcContext, Rule } from '../data/types'

const ctx: CalcContext = { gameId: 'fc3d', playId: 'zhixuan', tierId: 'hit', betAmount: 20, tierAmount: 10400, multiplier: 10 }

describe('applyEffect', () => {
  it('翻倍', () => expect(applyEffect(100, { kind: 'multiply', factor: 2 })).toBe(200))
  it('加50%', () => expect(applyEffect(100, { kind: 'addPercent', percent: 50 })).toBe(150))
  it('加固定', () => expect(applyEffect(100, { kind: 'addFixed', value: 30 })).toBe(130))
  it('封顶', () => expect(applyEffect(100, { kind: 'cap', value: 80 })).toBe(80))
  it('设为每注X元按倍数', () => expect(applyEffect(0, { kind: 'setPerBetPrize', value: 1500 }, 5)).toBe(7500))
})

describe('playApplies', () => {
  const base: Rule = { id: 'r', name: 'x', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'multiply', factor: 2 } }
  it('无 plays 不限', () => expect(playApplies(base, 'zhixuan')).toBe(true))
  it('plays 命中', () => expect(playApplies({ ...base, plays: ['zhixuan'] }, 'zhixuan')).toBe(true))
  it('plays 不中', () => expect(playApplies({ ...base, plays: ['zu3'] }, 'zhixuan')).toBe(false))
})

describe('conditionMatches', () => {
  it('always', () => expect(conditionMatches({ kind: 'always' }, ctx)).toBe(true))
  it('betAmountGte 命中', () => expect(conditionMatches({ kind: 'betAmountGte', value: 18 }, ctx)).toBe(true))
  it('betAmountGte 不中', () => expect(conditionMatches({ kind: 'betAmountGte', value: 50 }, ctx)).toBe(false))
  it('tierAmountRange 命中', () => expect(conditionMatches({ kind: 'tierAmountRange', min: 10000 }, ctx)).toBe(true))
  it('specificTiers 命中', () => expect(conditionMatches({ kind: 'specificTiers', tiers: ['hit'] }, ctx)).toBe(true))
  it('specificTiers 不中', () => expect(conditionMatches({ kind: 'specificTiers', tiers: ['hit7'] }, ctx)).toBe(false))
})

describe('gameApplies', () => {
  const base: Rule = { id: 'r', name: 'x', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'multiply', factor: 2 } }
  it('all 适用', () => expect(gameApplies(base, 'fc3d')).toBe(true))
  it('列表命中', () => expect(gameApplies({ ...base, games: ['fc3d'] }, 'fc3d')).toBe(true))
  it('列表不中', () => expect(gameApplies({ ...base, games: ['kl8'] }, 'fc3d')).toBe(false))
})

describe('isWithinValidity', () => {
  const r: Rule = { id: 'r', name: 'x', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'multiply', factor: 2 }, validFrom: '2026-10-01', validTo: '2026-10-07' }
  it('期内', () => expect(isWithinValidity(r, Date.parse('2026-10-03'))).toBe(true))
  it('期前', () => expect(isWithinValidity(r, Date.parse('2026-09-30'))).toBe(false))
  it('期后', () => expect(isWithinValidity(r, Date.parse('2026-10-08'))).toBe(false))
  it('无期限始终有效', () => expect(isWithinValidity({ ...r, validFrom: undefined, validTo: undefined }, 0)).toBe(true))
})

describe('applyActiveRules 增量明细', () => {
  const now = Date.parse('2026-10-03')
  const r1: Rule = { id: 'r1', name: '满18翻倍', enabled: true, games: 'all', condition: { kind: 'betAmountGte', value: 18 }, effect: { kind: 'multiply', factor: 2 } }

  it('单规则翻倍并记录 delta', () => {
    const out = applyActiveRules(10400, ctx, [r1], now)
    expect(out.amount).toBe(20800)
    expect(out.applied).toEqual([{ ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 }])
  })

  it('未启用规则跳过', () => {
    const out = applyActiveRules(10400, ctx, [{ ...r1, enabled: false }], now)
    expect(out.amount).toBe(10400)
    expect(out.applied).toEqual([])
  })

  it('条件不中跳过', () => {
    const out = applyActiveRules(10400, ctx, [{ ...r1, condition: { kind: 'betAmountGte', value: 50 } }], now)
    expect(out.amount).toBe(10400)
  })

  it('多规则按顺序叠加(翻倍后加50%后封顶)', () => {
    const r2: Rule = { id: 'r2', name: '加50%', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'addPercent', percent: 50 } }
    const r3: Rule = { id: 'r3', name: '封顶25000', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'cap', value: 25000 } }
    const out = applyActiveRules(10400, ctx, [r1, r2, r3], now)
    // 10400 ->(x2) 20800 ->(+50%) 31200 ->(cap 25000) 25000
    expect(out.amount).toBe(25000)
    expect(out.applied).toEqual([
      { ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 },
      { ruleId: 'r2', ruleName: '加50%', delta: 10400 },
      { ruleId: 'r3', ruleName: '封顶25000', delta: -6200 },
    ])
  })
})
