import type { DigitBet, GameId, TicketResult } from '../../data/types'
import { getGame } from '../../data/games'
import { formatYuan } from '../../util/format'
import { MultiplierStepper } from '../MultiplierStepper'
import { TicketResultView } from './TicketResultView'

interface Props {
  gameId: GameId
  bets: DigitBet[]
  onChange: (bets: DigitBet[]) => void
  result: TicketResult
}

export function DigitTicketBuilder({ gameId, bets, onChange, result }: Props) {
  const plays = getGame(gameId).plays
  const multOf = (playId: string) => bets.find(b => b.playId === playId)?.multiplier ?? 0
  function setMult(playId: string, m: number) {
    const exists = bets.some(b => b.playId === playId)
    onChange(exists
      ? bets.map(b => (b.playId === playId ? { ...b, multiplier: m } : b))
      : [...bets, { playId, multiplier: m }])
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">组合投注(可同时下注,0 = 不买)</div>
      <div className="space-y-2.5 mb-2">
        {plays.map(p => (
          <div key={p.id} className="border border-gray-200 rounded-2xl px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="text-base font-bold">{p.label}</div>
              <div className="text-xs text-gray-400">单注 {formatYuan(p.tiers[0].prize ?? 0)}</div>
            </div>
            <div className="mt-1">
              <MultiplierStepper value={multOf(p.id)} min={0} onChange={m => setMult(p.id, m)} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-dashed border-gray-200 my-3" />
      <TicketResultView result={result} />
    </div>
  )
}
