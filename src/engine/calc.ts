import type { CalcContext, CalcInput, Rule, TierResult } from '../data/types'
import { getPlay } from '../data/games'
import { computeTax, needRealname, needTax } from '../data/tax'
import { applyActiveRules } from './rules'

const round2 = (n: number): number => Math.round(n * 100) / 100

export function computeTiers(input: CalcInput, rules: Rule[], nowMs: number = Date.now()): TierResult[] {
  const play = getPlay(input.gameId, input.playId)
  const betAmount = play.betUnit * input.multiplier

  return play.tiers.map((tier): TierResult => {
    if (tier.prize === null) {
      return {
        tierId: tier.id, tierLabel: tier.label, base: 0, multiplier: input.multiplier,
        afterMult: 0, applied: [], amount: null, tax: 0, netAmount: null,
        needTax: false, needRealname: false, floating: true,
      }
    }
    const base = tier.prize
    const afterMult = round2(base * input.multiplier)
    const ctx: CalcContext = {
      gameId: input.gameId, playId: input.playId, tierId: tier.id, betAmount, tierAmount: afterMult,
    }
    const { amount, applied } = applyActiveRules(afterMult, ctx, rules, nowMs)
    const tax = round2(computeTax(amount))
    return {
      tierId: tier.id, tierLabel: tier.label, base, multiplier: input.multiplier,
      afterMult, applied, amount, tax, netAmount: round2(amount - tax),
      needTax: needTax(amount), needRealname: needRealname(amount), floating: false,
    }
  })
}
