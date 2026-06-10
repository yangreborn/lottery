import { useState } from 'react'
import type { DigitTicketBet, GameId, DigitTicketResult } from '../../data/types'
import { getPlay } from '../../data/games'
import { MultiplierStepper } from '../MultiplierStepper'
import { DigitTicketResultView } from './DigitTicketResultView'
import { derivePlayFromDigits } from '../../engine/derive'

interface Props {
  gameId: GameId
  bets: DigitTicketBet[]
  onChange: (bets: DigitTicketBet[]) => void
  result: DigitTicketResult
}

const MAX_BETS = 5
// 福彩(3D)倍数上限 15;体彩(排列3)沿用默认
const maxMultOf = (gameId: GameId) => (gameId === 'fc3d' ? 15 : 99)
type PlayId = 'zhixuan' | 'zu3' | 'zu6'
const ALL_PLAYS: PlayId[] = ['zhixuan', 'zu3', 'zu6']

// 一注的有效玩法集合:输了 3 位号码则按重复模式约束
function validPlays(digits?: number[]): PlayId[] {
  if (!digits || digits.length !== 3) return ALL_PLAYS
  const a = derivePlayFromDigits(digits)
  if (!a) return ALL_PLAYS
  const out: PlayId[] = ['zhixuan']
  if (a.zu3) out.push('zu3')
  if (a.zu6) out.push('zu6')
  return out
}

export function DigitTicketBuilder({ gameId, bets, onChange, result }: Props) {
  const [digitText, setDigitText] = useState<Record<number, string>>({})

  function update(i: number, patch: Partial<DigitTicketBet>) {
    onChange(bets.map((b, j) => (j === i ? { ...b, ...patch } : b)))
  }
  function addBet() {
    if (bets.length >= MAX_BETS) return
    onChange([...bets, { playId: 'zhixuan', multiplier: 1 }])
  }
  function removeBet(i: number) {
    onChange(bets.filter((_, j) => j !== i))
  }
  function setDigits(i: number, text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 3)
    setDigitText({ ...digitText, [i]: clean })
    if (clean.length === 3) {
      const digits = clean.split('').map(Number)
      const valid = validPlays(digits)
      // 若当前玩法在该号码下不可投,回退到直选
      const playId = valid.includes(bets[i].playId as PlayId) ? bets[i].playId : 'zhixuan'
      update(i, { digits, playId })
    } else {
      update(i, { digits: undefined })
    }
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">一张票(最多 {MAX_BETS} 注;号码可选,输了自动锁玩法)</div>
      <div className="space-y-2.5 mb-2">
        {bets.map((b, i) => {
          const valid = validPlays(b.digits)
          return (
            <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="text-base font-bold">第 {i + 1} 注</div>
                {bets.length > 1 && (
                  <button onClick={() => removeBet(i)} className="text-gray-400 text-sm">删除</button>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm">
                <label className="text-gray-500">
                  号码
                  <input
                    aria-label={`第${i + 1}注三位号码`}
                    inputMode="numeric"
                    maxLength={3}
                    className="ml-1 w-16 border border-gray-200 rounded-lg px-2 py-1 text-base tracking-widest"
                    placeholder="可选"
                    value={digitText[i] ?? (b.digits ? b.digits.join('') : '')}
                    onChange={e => setDigits(i, e.target.value)}
                  />
                </label>
                <label className="text-gray-500">
                  玩法
                  <select
                    aria-label={`第${i + 1}注玩法`}
                    className="ml-1 bg-transparent border border-gray-200 rounded-lg px-1.5 py-1"
                    value={b.playId}
                    onChange={e => update(i, { playId: e.target.value })}
                  >
                    {ALL_PLAYS.map(pid => (
                      <option key={pid} value={pid} disabled={!valid.includes(pid)}>
                        {getPlay(gameId, pid).label}{!valid.includes(pid) ? '(此号不可)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-2">
                <MultiplierStepper value={b.multiplier} min={0} max={maxMultOf(gameId)} onChange={m => update(i, { multiplier: m })} />
              </div>
            </div>
          )
        })}
      </div>

      {bets.length < MAX_BETS && (
        <button onClick={addBet} className="w-full border border-dashed border-gray-300 rounded-2xl py-2 text-gray-500 text-sm">
          ＋ 添加一注
        </button>
      )}

      <div className="border-t border-dashed border-gray-200 my-3" />
      <DigitTicketResultView result={result} />
    </div>
  )
}
