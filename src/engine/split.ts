import type { GameId } from '../data/types'
import { getPlay } from '../data/games'
import { TAX_THRESHOLD, REALNAME_THRESHOLD, computeTax, needRealname } from '../data/tax'

const round2 = (n: number): number => Math.round(n * 100) / 100

export interface SplitTicket { multiplier: number; win: number; needRealname: boolean }

export interface SplitPlan {
  feasible: boolean
  reason?: string
  topPrize: number            // 用于拆分判定的单注最高奖金
  totalMultiplier: number
  tickets: SplitTicket[]
  totalWin: number
  realnameCount: number       // 实际需实名的张数
  // 对比"不拆分"(整买一张)
  originalWin: number
  originalTax: number
  originalNeedRealname: boolean
  taxSaved: number            // 拆分后税为0,故 = originalTax
}

// 该玩法的单注最高固定奖金(浮动奖按0忽略)
export function topFixedPrize(gameId: GameId, playId: string): number {
  const play = getPlay(gameId, playId)
  return Math.max(0, ...play.tiers.map(t => t.prize ?? 0))
}

export function splitTicket(
  gameId: GameId, playId: string, totalMultiplier: number, maxRealnameTickets: number,
): SplitPlan {
  const P = topFixedPrize(gameId, playId)
  const M = Math.max(0, Math.floor(totalMultiplier))
  const originalWin = round2(P * M)
  const base = {
    topPrize: P, totalMultiplier: M, originalWin,
    originalTax: round2(computeTax(originalWin)),
    originalNeedRealname: needRealname(originalWin),
  }

  const taxFreeCap = Math.floor(TAX_THRESHOLD / P)      // 每票最大倍数(免税)
  const noNameCap = Math.floor(REALNAME_THRESHOLD / P)  // 每票最大倍数(免实名)

  if (P <= 0 || taxFreeCap < 1) {
    return {
      ...base, feasible: false,
      reason: '单注最高奖金已超过1万元,无法通过拆分避免缴税',
      tickets: [], totalWin: 0, realnameCount: 0, taxSaved: 0,
    }
  }

  const tickets: SplitTicket[] = []
  let remaining = M
  let realnameUsed = 0
  // 第一步:在实名额度内,用满 taxFreeCap 的票打包以减少总张数
  while (remaining > 0 && realnameUsed < maxRealnameTickets && taxFreeCap > noNameCap) {
    const t = Math.min(taxFreeCap, remaining)
    if (t <= noNameCap) break // 剩余可塞进免实名票,不必占用实名额度
    tickets.push({ multiplier: t, win: round2(P * t), needRealname: true })
    remaining -= t
    realnameUsed++
  }
  // 第二步:剩余装进免实名票;若 noNameCap=0(免实名不可能)则仍用 taxFree 票(均需实名)
  const cap = noNameCap >= 1 ? noNameCap : taxFreeCap
  const rn = noNameCap < 1
  while (remaining > 0) {
    const t = Math.min(cap, remaining)
    tickets.push({ multiplier: t, win: round2(P * t), needRealname: rn })
    remaining -= t
  }

  return {
    ...base, feasible: true, tickets,
    totalWin: round2(tickets.reduce((s, x) => s + x.win, 0)),
    realnameCount: tickets.filter(x => x.needRealname).length,
    taxSaved: base.originalTax,
  }
}
