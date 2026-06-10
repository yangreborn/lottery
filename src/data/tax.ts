export const REALNAME_THRESHOLD = 3000
export const TAX_THRESHOLD = 10000
export const TAX_RATE = 0.2

export function needRealname(amount: number): boolean {
  return amount > REALNAME_THRESHOLD
}

export function needTax(amount: number): boolean {
  return amount > TAX_THRESHOLD
}

export function computeTax(amount: number): number {
  return needTax(amount) ? amount * TAX_RATE : 0
}
