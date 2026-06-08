import type {
  CalcContext, CalcInput, DigitBet, GameId, PlayContribution, Rule, TicketResult, TierResult,
} from '../data/types'
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
      multiplier: input.multiplier,
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

// 数字彩(3D/排列3):每玩法单档,一张票可同时投多种玩法
export function isDigitGame(gameId: GameId): boolean {
  return gameId === 'fc3d' || gameId === 'pl3'
}

export function computeDigitTicket(
  gameId: GameId, bets: DigitBet[], rules: Rule[], nowMs: number = Date.now(),
): TicketResult {
  const bought = bets.filter(b => b.multiplier > 0)
  const ticketBet = bought.reduce((s, b) => s + getPlay(gameId, b.playId).betUnit * b.multiplier, 0)

  const contributions: PlayContribution[] = bought.map((b): PlayContribution => {
    const play = getPlay(gameId, b.playId)
    const tier = play.tiers[0]            // 数字彩每玩法单档
    const base = tier.prize ?? 0
    const afterMult = round2(base * b.multiplier)
    const ctx: CalcContext = {
      gameId, playId: b.playId, tierId: tier.id,
      betAmount: ticketBet, tierAmount: afterMult, multiplier: b.multiplier,
    }
    const { amount, applied } = applyActiveRules(afterMult, ctx, rules, nowMs)
    return {
      playId: b.playId, label: play.label, base, multiplier: b.multiplier, applied,
      amount, needTax: needTax(amount), needRealname: needRealname(amount),
    }
  })

  const total = round2(contributions.reduce((s, c) => s + c.amount, 0))
  const tax = round2(computeTax(total))
  return {
    contributions, total, tax, netAmount: round2(total - tax),
    needTax: needTax(total), needRealname: needRealname(total),
  }
}
