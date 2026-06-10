import type {
  CalcContext, CalcInput, DigitBet, GameId, Kl8Entry, Kl8EntryResult, Kl8TicketResult,
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

// 快乐8:多注组合票 + 可能性分析(§14)。复用 computeTiers 逐注取各档。
export function computeKl8Ticket(
  entries: Kl8Entry[], rules: Rule[], nowMs: number = Date.now(),
): Kl8TicketResult {
  const active = entries.filter(e => e.multiplier > 0)
  const entryResults: Kl8EntryResult[] = active.map((e): Kl8EntryResult => {
    const play = getPlay('kl8', e.playId)
    const lines = computeTiers({ gameId: 'kl8', playId: e.playId, multiplier: e.multiplier }, rules, nowMs)
    const top = lines[0]   // 数据中各玩法档位按顶档在前排列
    const lockedLine = e.lockedTierId ? lines.find(l => l.tierId === e.lockedTierId) : undefined
    return {
      playId: e.playId, label: play.label, multiplier: e.multiplier, lines,
      topAmount: top ? top.amount : null, topFloating: top ? top.floating : false,
      lockedTierId: e.lockedTierId, lockedLine,
    }
  })

  const maxFloating = entryResults.some(r => r.topFloating)
  const maxTotal = round2(entryResults.reduce((s, r) => s + (r.topAmount ?? 0), 0))
  const existsTax = maxFloating || needTax(maxTotal)
  const existsRealname = maxFloating || needRealname(maxTotal)

  const lockedEntries = entryResults.filter(r => r.lockedLine)
  const hasLocked = lockedEntries.length > 0
  const lockedFloating = lockedEntries.some(r => r.lockedLine!.floating)
  const lockedTotal = round2(lockedEntries.reduce((s, r) => s + (r.lockedLine!.amount ?? 0), 0))
  const lockedTax = round2(computeTax(lockedTotal))
  return {
    entries: entryResults, maxTotal, maxFloating, existsTax, existsRealname,
    hasLocked, lockedTotal, lockedFloating,
    lockedTax, lockedNetAmount: round2(lockedTotal - lockedTax),
    lockedNeedTax: lockedFloating || needTax(lockedTotal),
    lockedNeedRealname: lockedFloating || needRealname(lockedTotal),
  }
}
