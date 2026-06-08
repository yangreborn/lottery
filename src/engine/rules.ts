import type { AppliedRule, CalcContext, GameId, Rule, RuleCondition, RuleEffect } from '../data/types'

const round2 = (n: number): number => Math.round(n * 100) / 100

export function applyEffect(amount: number, e: RuleEffect, multiplier = 1): number {
  switch (e.kind) {
    case 'multiply': return amount * e.factor
    case 'addPercent': return amount * (1 + e.percent / 100)
    case 'addFixed': return amount + e.value
    case 'cap': return Math.min(amount, e.value)
    case 'setPerBetPrize': return e.value * multiplier
  }
}

export function conditionMatches(c: RuleCondition, ctx: CalcContext): boolean {
  switch (c.kind) {
    case 'always': return true
    case 'betAmountGte': return ctx.betAmount >= c.value
    case 'tierAmountRange':
      return (c.min === undefined || ctx.tierAmount >= c.min) && (c.max === undefined || ctx.tierAmount <= c.max)
    case 'specificTiers': return c.tiers.includes(ctx.tierId)
  }
}

export function gameApplies(rule: Rule, gameId: GameId): boolean {
  return rule.games === 'all' || rule.games.includes(gameId)
}

export function playApplies(rule: Rule, playId: string): boolean {
  return !rule.plays || rule.plays.length === 0 || rule.plays.includes(playId)
}

export function isWithinValidity(rule: Rule, nowMs: number): boolean {
  if (rule.validFrom && nowMs < Date.parse(rule.validFrom)) return false
  if (rule.validTo && nowMs > Date.parse(rule.validTo)) return false
  return true
}

export function applyActiveRules(
  afterMult: number,
  ctx: CalcContext,
  rules: Rule[],
  nowMs: number,
): { amount: number; applied: AppliedRule[] } {
  let running = afterMult
  const applied: AppliedRule[] = []
  for (const rule of rules) {
    if (!rule.enabled) continue
    if (!isWithinValidity(rule, nowMs)) continue
    if (!gameApplies(rule, ctx.gameId)) continue
    if (!playApplies(rule, ctx.playId)) continue
    if (!conditionMatches(rule.condition, ctx)) continue
    const next = round2(applyEffect(running, rule.effect, ctx.multiplier))
    const delta = round2(next - running)
    applied.push({ ruleId: rule.id, ruleName: rule.name, delta })
    running = next
  }
  return { amount: running, applied }
}
