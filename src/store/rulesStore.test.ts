import { describe, it, expect, beforeEach } from 'vitest'
import { loadRules, saveRules, validateRuleDraft, genId } from './rulesStore'
import type { Rule } from '../data/types'

beforeEach(() => localStorage.clear())

const sample: Rule = { id: 'r1', name: '满18翻倍', enabled: true, games: 'all', condition: { kind: 'betAmountGte', value: 18 }, effect: { kind: 'multiply', factor: 2 } }

describe('load/save', () => {
  it('空时返回空数组', () => expect(loadRules()).toEqual([]))
  it('保存后读取一致', () => {
    saveRules([sample])
    expect(loadRules()).toEqual([sample])
  })
  it('损坏数据返回空数组', () => {
    localStorage.setItem('lottery.rules.v1', '{not json')
    expect(loadRules()).toEqual([])
  })
})

describe('genId', () => {
  it('生成不同 id', () => expect(genId()).not.toBe(genId()))
})

describe('validateRuleDraft', () => {
  it('合法无错误', () => expect(validateRuleDraft(sample)).toEqual([]))
  it('名称为空报错', () => expect(validateRuleDraft({ ...sample, name: ' ' })).toContain('请填写规则名称'))
  it('翻倍 factor<=0 报错', () =>
    expect(validateRuleDraft({ ...sample, effect: { kind: 'multiply', factor: 0 } })).toContain('倍数必须大于0'))
  it('加百分比为负报错', () =>
    expect(validateRuleDraft({ ...sample, effect: { kind: 'addPercent', percent: -5 } })).toContain('百分比不能为负'))
  it('betAmountGte 为负报错', () =>
    expect(validateRuleDraft({ ...sample, condition: { kind: 'betAmountGte', value: -1 } })).toContain('金额阈值不能为负'))
})
