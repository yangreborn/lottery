import type { DigitBet, GameId, Rule } from '../data/types'
import { getPlay } from '../data/games'
import { computeDigitTicket } from './calc'
import { TAX_THRESHOLD, REALNAME_THRESHOLD, computeTax, needRealname } from '../data/tax'

const round2 = (n: number): number => Math.round(n * 100) / 100

export type SplitMode = 'separate' | 'mixed'
export interface SplitTicketItem { playId: string; label: string; multiplier: number }
export interface PhysicalTicket { items: SplitTicketItem[]; win: number; needRealname: boolean }

export interface SplitPlan {
  feasible: boolean
  reason?: string
  mode: SplitMode
  tickets: PhysicalTicket[]
  totalWin: number            // 拆分后合计最高奖金(免税,故到手=totalWin)
  realnameCount: number
  // 对比"整买一张"(规则按这张大票判定)
  originalWin: number
  originalTax: number
  originalNeedRealname: boolean
  originalNet: number         // 不拆分到手 = originalWin - originalTax
  taxSaved: number
}

// 该玩法单注最高固定奖金(浮动奖按0忽略)
export function topFixedPrize(gameId: GameId, playId: string): number {
  return Math.max(0, ...getPlay(gameId, playId).tiers.map(t => t.prize ?? 0))
}

// 一张票(可含多玩法)的最高中奖额(规则按这张票的投注额判定)
function ticketWin(gameId: GameId, bets: DigitBet[], rules: Rule[], nowMs: number): number {
  return computeDigitTicket(gameId, bets, rules, nowMs).total
}

function makeTicket(gameId: GameId, items: SplitTicketItem[], rules: Rule[], nowMs: number): PhysicalTicket {
  const win = ticketWin(gameId, items.map(i => ({ playId: i.playId, multiplier: i.multiplier })), rules, nowMs)
  return { items, win, needRealname: needRealname(win) }
}

// 单玩法在某金额上限下每票最大倍数(规则感知;奖金随倍数单调不减)
function maxMultUnderCap(gameId: GameId, playId: string, rules: Rule[], cap: number, nowMs: number): number {
  let t = 0
  while (t < 300 && ticketWin(gameId, [{ playId, multiplier: t + 1 }], rules, nowMs) <= cap) t++
  return t
}

// 模式一:各玩法分开拆(每票只含一种玩法);实名额度全局共享
function packSeparate(gameId: GameId, bought: DigitBet[], rules: Rule[], maxRealname: number, nowMs: number): PhysicalTicket[] {
  const tickets: PhysicalTicket[] = []
  let realnameBudget = maxRealname
  for (const b of bought) {
    const label = getPlay(gameId, b.playId).label
    const taxFreeCap = maxMultUnderCap(gameId, b.playId, rules, TAX_THRESHOLD, nowMs)
    const noNameCap = maxMultUnderCap(gameId, b.playId, rules, REALNAME_THRESHOLD, nowMs)
    let remaining = b.multiplier
    while (remaining > 0 && realnameBudget > 0 && taxFreeCap > noNameCap) {
      const t = Math.min(taxFreeCap, remaining)
      if (t <= noNameCap) break
      tickets.push(makeTicket(gameId, [{ playId: b.playId, label, multiplier: t }], rules, nowMs))
      remaining -= t; realnameBudget--
    }
    const cap = noNameCap >= 1 ? noNameCap : taxFreeCap
    while (remaining > 0) {
      const t = Math.min(cap, remaining)
      tickets.push(makeTicket(gameId, [{ playId: b.playId, label, multiplier: t }], rules, nowMs))
      remaining -= t
    }
  }
  return tickets
}

// 在金额上限内贪心填满一张票,返回各玩法倍数(扣减 remaining)
function fillUnderCap(gameId: GameId, remaining: Record<string, number>, order: string[], cap: number, rules: Rule[], nowMs: number): Record<string, number> {
  const ticket: Record<string, number> = {}
  let improved = true
  while (improved) {
    improved = false
    for (const id of order) {
      if ((remaining[id] ?? 0) <= 0) continue
      const bets = order
        .filter(x => (ticket[x] ?? 0) > 0 || x === id)
        .map(x => ({ playId: x, multiplier: (ticket[x] ?? 0) + (x === id ? 1 : 0) }))
      if (ticketWin(gameId, bets, rules, nowMs) <= cap) {
        ticket[id] = (ticket[id] ?? 0) + 1; remaining[id]--; improved = true
      }
    }
  }
  return ticket
}

// 模式二:混合打包(一张票可含多玩法,尽量少张)
function packMixed(gameId: GameId, bought: DigitBet[], rules: Rule[], maxRealname: number, nowMs: number): PhysicalTicket[] {
  const remaining: Record<string, number> = {}
  for (const b of bought) remaining[b.playId] = b.multiplier
  const order = [...bought]
    .sort((a, b) => topFixedPrize(gameId, b.playId) - topFixedPrize(gameId, a.playId))
    .map(b => b.playId)
  const labelOf = (id: string) => getPlay(gameId, id).label
  const totalRemaining = () => order.reduce((s, id) => s + (remaining[id] ?? 0), 0)

  const tickets: PhysicalTicket[] = []
  let realnameBudget = maxRealname
  let guard = 0
  while (totalRemaining() > 0 && guard++ < 1000) {
    const cap = realnameBudget > 0 ? TAX_THRESHOLD : REALNAME_THRESHOLD
    let ticket = fillUnderCap(gameId, remaining, order, cap, rules, nowMs)
    if (!order.some(id => (ticket[id] ?? 0) > 0)) {
      // 免实名上限装不下 → 强制用一张实名票(免税上限)
      ticket = fillUnderCap(gameId, remaining, order, TAX_THRESHOLD, rules, nowMs)
      if (!order.some(id => (ticket[id] ?? 0) > 0)) break // 理论不达(已保证单玩法1倍≤1万)
    }
    const items = order.filter(id => (ticket[id] ?? 0) > 0).map(id => ({ playId: id, label: labelOf(id), multiplier: ticket[id] }))
    const t = makeTicket(gameId, items, rules, nowMs)
    if (t.needRealname && realnameBudget > 0) realnameBudget--
    tickets.push(t)
  }
  return tickets
}

export function splitCombination(
  gameId: GameId, bets: DigitBet[], rules: Rule[], maxRealnameTickets: number, mode: SplitMode, nowMs: number = Date.now(),
): SplitPlan {
  const bought = bets.filter(b => b.multiplier > 0).map(b => ({ playId: b.playId, multiplier: Math.floor(b.multiplier) }))
  const originalWin = round2(ticketWin(gameId, bought, rules, nowMs))
  const originalTax = round2(computeTax(originalWin))
  const base = {
    mode, originalWin, originalTax,
    originalNeedRealname: needRealname(originalWin),
    originalNet: round2(originalWin - originalTax),
    taxSaved: originalTax,
  }
  if (bought.length === 0) {
    return { ...base, feasible: true, tickets: [], totalWin: 0, realnameCount: 0 }
  }
  for (const b of bought) {
    if (ticketWin(gameId, [{ playId: b.playId, multiplier: 1 }], rules, nowMs) > TAX_THRESHOLD) {
      return {
        ...base, feasible: false,
        reason: `「${getPlay(gameId, b.playId).label}」单注最高奖金已超1万元,无法通过拆分避免缴税`,
        tickets: [], totalWin: 0, realnameCount: 0,
      }
    }
  }
  const tickets = mode === 'mixed'
    ? packMixed(gameId, bought, rules, maxRealnameTickets, nowMs)
    : packSeparate(gameId, bought, rules, maxRealnameTickets, nowMs)
  return {
    ...base, feasible: true, tickets,
    totalWin: round2(tickets.reduce((s, t) => s + t.win, 0)),
    realnameCount: tickets.filter(t => t.needRealname).length,
  }
}
