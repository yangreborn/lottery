import type { Rule } from '../data/types'

const RULES_KEY = 'lottery.rules.v1'

export function genId(): string {
  return crypto.randomUUID()
}

export function loadRules(): Rule[] {
  try {
    const raw = localStorage.getItem(RULES_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as Rule[]) : []
  } catch {
    return []
  }
}

export function saveRules(rules: Rule[]): void {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules))
  } catch {
    /* localStorage 不可用时降级为不持久化 */
  }
}

export function validateRuleDraft(rule: Rule): string[] {
  const errors: string[] = []
  if (!rule.name.trim()) errors.push('请填写规则名称')

  const e = rule.effect
  if (e.kind === 'multiply' && e.factor <= 0) errors.push('倍数必须大于0')
  if (e.kind === 'addPercent' && e.percent < 0) errors.push('百分比不能为负')
  if (e.kind === 'addFixed' && e.value < 0) errors.push('加奖金额不能为负')
  if (e.kind === 'cap' && e.value < 0) errors.push('封顶金额不能为负')

  const c = rule.condition
  if (c.kind === 'betAmountGte' && c.value < 0) errors.push('金额阈值不能为负')

  return errors
}
