import { useState } from 'react'
import type { DigitBet, GameId, TicketResult } from '../../data/types'
import { getGame } from '../../data/games'
import { formatYuan } from '../../util/format'
import { MultiplierStepper } from '../MultiplierStepper'
import { TicketResultView } from './TicketResultView'
import { derivePlayFromDigits } from '../../engine/derive'

interface Props {
  gameId: GameId
  bets: DigitBet[]
  onChange: (bets: DigitBet[]) => void
  result: TicketResult
}

// 玩法 id → 可投性字段
const APPLIES_KEY: Record<string, 'zhixuan' | 'zu3' | 'zu6'> = {
  zhixuan: 'zhixuan', zu3: 'zu3', zu6: 'zu6',
}
const PLAY_LABEL: Record<string, string> = { zu3: '组选三', zu6: '组选六' }

export function DigitTicketBuilder({ gameId, bets, onChange, result }: Props) {
  const plays = getGame(gameId).plays
  const [digitText, setDigitText] = useState('')

  const digits = digitText.split('').filter(c => /\d/.test(c)).map(Number)
  const applicability = digits.length === 3 ? derivePlayFromDigits(digits) : null

  const multOf = (playId: string) => bets.find(b => b.playId === playId)?.multiplier ?? 0
  function setMult(playId: string, m: number) {
    const exists = bets.some(b => b.playId === playId)
    onChange(exists
      ? bets.map(b => (b.playId === playId ? { ...b, multiplier: m } : b))
      : [...bets, { playId, multiplier: m }])
  }
  function isDisabled(playId: string): boolean {
    if (!applicability) return false
    return !applicability[APPLIES_KEY[playId]]
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">组合投注(可同时下注,0 = 不买)</div>

      <div className="mb-3">
        <label className="text-sm text-gray-500">
          输入三位号码(可选,自动锁定可投玩法):
          <input
            aria-label="三位号码"
            inputMode="numeric"
            maxLength={3}
            className="ml-2 w-20 border border-gray-200 rounded-lg px-2 py-1 text-base tracking-widest"
            placeholder="如 112"
            value={digitText}
            onChange={e => setDigitText(e.target.value.replace(/\D/g, '').slice(0, 3))}
          />
        </label>
        {applicability && (['zu3', 'zu6'] as const).map(pid =>
          !applicability[pid] ? (
            <div key={pid} className="text-xs text-amber-700 mt-1">
              输入号码后,{PLAY_LABEL[pid]} 在此组合不可能中奖,已禁用。
            </div>
          ) : null,
        )}
      </div>

      <div className="space-y-2.5 mb-2">
        {plays.map(p => {
          const disabled = isDisabled(p.id)
          return (
            <div key={p.id} className={`border rounded-2xl px-4 py-3 ${disabled ? 'border-gray-100 bg-gray-50 opacity-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <div className="text-base font-bold">{p.label}</div>
                <div className="text-xs text-gray-400">单注 {formatYuan(p.tiers[0].prize ?? 0)}</div>
              </div>
              <div className="mt-1">
                <MultiplierStepper
                  value={disabled ? 0 : multOf(p.id)}
                  min={0}
                  onChange={m => { if (!disabled) setMult(p.id, m) }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t border-dashed border-gray-200 my-3" />
      <TicketResultView result={result} />
    </div>
  )
}
