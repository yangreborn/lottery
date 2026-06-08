import { describe, it, expect } from 'vitest'
import { needRealname, needTax, computeTax, REALNAME_THRESHOLD, TAX_THRESHOLD, TAX_RATE } from './tax'

describe('常量', () => {
  it('门槛与税率', () => {
    expect(REALNAME_THRESHOLD).toBe(3000)
    expect(TAX_THRESHOLD).toBe(10000)
    expect(TAX_RATE).toBe(0.2)
  })
})

describe('实名判定(>3000 触发)', () => {
  it('3000 免实名', () => expect(needRealname(3000)).toBe(false))
  it('3001 需实名', () => expect(needRealname(3001)).toBe(true))
})

describe('缴税判定(>10000 触发)', () => {
  it('10000 免税', () => expect(needTax(10000)).toBe(false))
  it('10001 需税', () => expect(needTax(10001)).toBe(true))
})

describe('税额', () => {
  it('10000 不计税', () => expect(computeTax(10000)).toBe(0))
  it('50000 全额20%=10000', () => expect(computeTax(50000)).toBe(10000))
})
