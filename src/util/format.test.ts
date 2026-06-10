import { describe, it, expect } from 'vitest'
import { formatYuan } from './format'

describe('formatYuan', () => {
  it('整数千分位', () => expect(formatYuan(42500)).toBe('¥42,500'))
  it('小数保留', () => expect(formatYuan(4.5)).toBe('¥4.5'))
  it('去掉多余0', () => expect(formatYuan(8320)).toBe('¥8,320'))
  it('零', () => expect(formatYuan(0)).toBe('¥0'))
})
