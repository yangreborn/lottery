export function validateKl8Numbers(numbers: number[]): { ok: boolean; error?: string } {
  if (numbers.length < 1 || numbers.length > 10) return { ok: false, error: '请选 1–10 个号码' }
  if (numbers.some(n => !Number.isInteger(n) || n < 1 || n > 80)) return { ok: false, error: '号码需在 1–80' }
  if (new Set(numbers).size !== numbers.length) return { ok: false, error: '号码不可重复' }
  return { ok: true }
}

export function derivePlayFromKl8(numbers: number[]): string | null {
  if (!validateKl8Numbers(numbers).ok) return null
  return `kl8-${numbers.length}`
}

export interface DigitApplicability {
  zhixuan: boolean
  zu3: boolean
  zu6: boolean
}

// 3D/排列3:输 3 位数字,按重复模式判定可投玩法
//   全同(豹子)→ 仅直选;恰一对 → 直选+组三;全不同 → 直选+组六
export function derivePlayFromDigits(digits: number[]): DigitApplicability | null {
  if (digits.length !== 3) return null
  if (digits.some(d => !Number.isInteger(d) || d < 0 || d > 9)) return null
  const counts = new Map<number, number>()
  for (const d of digits) counts.set(d, (counts.get(d) ?? 0) + 1)
  const maxRepeat = Math.max(...counts.values())
  if (maxRepeat === 3) return { zhixuan: true, zu3: false, zu6: false }
  if (maxRepeat === 2) return { zhixuan: true, zu3: true, zu6: false }
  return { zhixuan: true, zu3: false, zu6: true }
}
