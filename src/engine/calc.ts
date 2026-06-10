import type {
  CalcContext, CalcInput, DigitBet, DigitContribution, DigitTicketBet, DigitTicketResult,
  GameId, Kl8BetResult, Kl8Ticket, Kl8TicketResult,
  PlayContribution, Rule, TicketResult, TierResult,
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

  // 合计:互斥组(如组三/组六不同时中奖)只计该组较高者,其余相加
  const naiveSum = contributions.reduce((s, c) => s + c.amount, 0)
  const groupMax = new Map<string, number>()
  let summed = 0
  for (const c of contributions) {
    const group = getPlay(gameId, c.playId).exclusiveGroup
    if (group) groupMax.set(group, Math.max(groupMax.get(group) ?? 0, c.amount))
    else summed += c.amount
  }
  for (const v of groupMax.values()) summed += v
  const total = round2(summed)
  const tax = round2(computeTax(total))
  return {
    contributions, total, tax, netAmount: round2(total - tax),
    needTax: needTax(total), needRealname: needRealname(total),
    exclusiveNote: round2(naiveSum) > total,
  }
}

// 数字彩(3D/排列3)一张票:最多 5 注,各注独立相加(§14.4)。
export function computeDigitMultiTicket(
  gameId: GameId, bets: DigitTicketBet[], rules: Rule[], nowMs: number = Date.now(),
): DigitTicketResult {
  const bought = bets.filter(b => b.multiplier > 0)
  const ticketBet = bought.reduce((s, b) => s + getPlay(gameId, b.playId).betUnit * b.multiplier, 0)

  const contributions: DigitContribution[] = bought.map((b): DigitContribution => {
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
      playId: b.playId, label: play.label, digits: b.digits, base, multiplier: b.multiplier,
      applied, amount, needTax: needTax(amount), needRealname: needRealname(amount),
    }
  })

  const total = round2(contributions.reduce((s, c) => s + c.amount, 0))
  const tax = round2(computeTax(total))
  return {
    contributions, total, tax, netAmount: round2(total - tax),
    needTax: needTax(total), needRealname: needRealname(total),
  }
}

// 快乐8 一张票:单一玩法(选N),多注;可能性分析 + 锁定场景(§14.4)。
export function computeKl8Ticket(
  ticket: Kl8Ticket, rules: Rule[], nowMs: number = Date.now(),
): Kl8TicketResult {
  const play = getPlay('kl8', ticket.playId)
  // 倍数全票一致 → 各注档位表相同,算一次复用
  const tierTable = computeTiers({ gameId: 'kl8', playId: ticket.playId, multiplier: ticket.multiplier }, rules, nowMs)
  const top = tierTable[0]   // 数据中各档位按顶档在前排列

  const betResults: Kl8BetResult[] = ticket.bets.map((b): Kl8BetResult => {
    const lockedLine = b.lockedTierId ? tierTable.find(l => l.tierId === b.lockedTierId) : undefined
    return {
      numbers: b.numbers,
      topAmount: top ? top.amount : null, topFloating: top ? top.floating : false,
      lockedTierId: b.lockedTierId, lockedLine,
    }
  })

  const maxFloating = betResults.some(r => r.topFloating)
  const maxTotal = round2(betResults.reduce((s, r) => s + (r.topAmount ?? 0), 0))
  const existsTax = maxFloating || needTax(maxTotal)
  const existsRealname = maxFloating || needRealname(maxTotal)

  const lockedBets = betResults.filter(r => r.lockedLine)
  const hasLocked = lockedBets.length > 0
  const lockedFloating = lockedBets.some(r => r.lockedLine!.floating)
  const lockedTotal = round2(lockedBets.reduce((s, r) => s + (r.lockedLine!.amount ?? 0), 0))
  const lockedTax = round2(computeTax(lockedTotal))
  return {
    playId: ticket.playId, playLabel: play.label, multiplier: ticket.multiplier, tierTable, bets: betResults,
    maxTotal, maxFloating, existsTax, existsRealname,
    hasLocked, lockedTotal, lockedFloating,
    lockedTax, lockedNetAmount: round2(lockedTotal - lockedTax),
    lockedNeedTax: lockedFloating || needTax(lockedTotal),
    lockedNeedRealname: lockedFloating || needRealname(lockedTotal),
  }
}
