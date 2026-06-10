import { describe, it, expect } from 'vitest'
import { validateKl8Numbers, derivePlayFromKl8, derivePlayFromDigits } from './derive'

describe('validateKl8Numbers', () => {
  it('个数 1–10、1–80、不重复 通过', () => {
    expect(validateKl8Numbers([3, 7, 9]).ok).toBe(true)
  })
  it('个数为 0 或 >10 报错', () => {
    expect(validateKl8Numbers([]).ok).toBe(false)
    expect(validateKl8Numbers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).ok).toBe(false)
  })
  it('越界或重复 报错', () => {
    expect(validateKl8Numbers([0, 5]).ok).toBe(false)
    expect(validateKl8Numbers([81]).ok).toBe(false)
    expect(validateKl8Numbers([5, 5]).ok).toBe(false)
  })
})

describe('derivePlayFromKl8', () => {
  it('选 7 个号 → kl8-7', () => {
    expect(derivePlayFromKl8([1, 2, 3, 4, 5, 6, 7])).toBe('kl8-7')
  })
  it('非法输入 → null', () => {
    expect(derivePlayFromKl8([5, 5])).toBeNull()
  })
})

describe('derivePlayFromDigits', () => {
  it('全同(豹子)仅直选', () => {
    expect(derivePlayFromDigits([1, 1, 1])).toEqual({ zhixuan: true, zu3: false, zu6: false })
  })
  it('恰一对 → 直选 + 组三', () => {
    expect(derivePlayFromDigits([1, 1, 2])).toEqual({ zhixuan: true, zu3: true, zu6: false })
  })
  it('全不同 → 直选 + 组六', () => {
    expect(derivePlayFromDigits([1, 2, 3])).toEqual({ zhixuan: true, zu3: false, zu6: true })
  })
  it('非 3 位或越界 → null', () => {
    expect(derivePlayFromDigits([1, 2])).toBeNull()
    expect(derivePlayFromDigits([1, 2, 10])).toBeNull()
  })
})
