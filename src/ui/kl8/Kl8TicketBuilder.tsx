import { useState } from 'react'
import type { Kl8Bet, Kl8Ticket, Kl8TicketResult } from '../../data/types'
import { getGame, getPlay } from '../../data/games'
import { MultiplierStepper } from '../MultiplierStepper'
import { validateKl8Numbers, derivePlayFromKl8 } from '../../engine/derive'
import { Kl8TicketResultView } from './Kl8TicketResultView'

interface Props {
  ticket: Kl8Ticket
  onChange: (ticket: Kl8Ticket) => void
  result: Kl8TicketResult
}

const KL8_PLAYS = getGame('kl8').plays

export function Kl8TicketBuilder({ ticket, onChange, result }: Props) {
  const [numOpen, setNumOpen] = useState<number | null>(null)
  const [numText, setNumText] = useState('')

  const play = getPlay('kl8', ticket.playId)

  function setPlay(playId: string) {
    // 换玩法:清掉各注锁定档(档位随玩法变),保留号码/倍数
    onChange({ playId, bets: ticket.bets.map(b => ({ ...b, lockedTierId: undefined })) })
  }
  function updateBet(i: number, patch: Partial<Kl8Bet>) {
    onChange({ ...ticket, bets: ticket.bets.map((b, j) => (j === i ? { ...b, ...patch } : b)) })
  }
  function addBet() {
    onChange({ ...ticket, bets: [...ticket.bets, { multiplier: 1 }] })
  }
  function removeBet(i: number) {
    onChange({ ...ticket, bets: ticket.bets.filter((_, j) => j !== i) })
  }
  function applyNumbers(i: number) {
    const nums = numText.split(/[\s,，]+/).filter(Boolean).map(Number)
    if (!validateKl8Numbers(nums).ok) return
    const derivedPlay = derivePlayFromKl8(nums)!
    // 号码个数决定玩法:整票锁定为该玩法
    onChange({
      playId: derivedPlay,
      bets: ticket.bets.map((b, j) =>
        j === i ? { ...b, numbers: nums, lockedTierId: undefined } : { ...b, lockedTierId: undefined }),
    })
    setNumOpen(null)
    setNumText('')
  }

  return (
    <div>
      {/* 整票玩法(单一选N) */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-base font-bold">
          玩法
          <select
            aria-label="快乐8玩法"
            className="ml-2 bg-transparent border border-gray-200 rounded-lg px-2 py-1"
            value={ticket.playId}
            onChange={e => setPlay(e.target.value)}
          >
            {KL8_PLAYS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <span className="text-xs text-gray-400">一张票同一玩法</span>
      </div>

      <div className="text-sm text-gray-400 mb-2">各注(号码不同,可中不同档;倍数 0 = 不计)</div>
      <div className="space-y-2.5 mb-2">
        {ticket.bets.map((b, i) => (
          <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="text-base font-bold">第 {i + 1} 注</div>
              {ticket.bets.length > 1 && (
                <button onClick={() => removeBet(i)} className="text-gray-400 text-sm">删除</button>
              )}
            </div>

            <div className="mt-2">
              <MultiplierStepper value={b.multiplier} min={0} onChange={m => updateBet(i, { multiplier: m })} />
            </div>

            <div className="mt-2 flex items-center gap-3 text-sm">
              <label className="text-gray-500">
                锁定中几个:
                <select
                  aria-label={`第${i + 1}注锁定档位`}
                  className="ml-1 bg-transparent border border-gray-200 rounded-lg px-1.5 py-0.5"
                  value={b.lockedTierId ?? ''}
                  onChange={e => updateBet(i, { lockedTierId: e.target.value || undefined })}
                >
                  <option value="">不锁(看可能)</option>
                  {play.tiers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <button className="text-indigo-500" onClick={() => { setNumOpen(numOpen === i ? null : i); setNumText('') }}>
                ✎ 输入号码
              </button>
            </div>

            {b.numbers && (
              <div className="mt-1 text-xs text-gray-400">已输号码:{b.numbers.join(' ')}(自动识别为{play.label})</div>
            )}

            {numOpen === i && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    aria-label={`第${i + 1}注号码输入`}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                    placeholder="如 3 7 9 12(空格/逗号分隔,1–80)"
                    value={numText}
                    onChange={e => setNumText(e.target.value)}
                  />
                  <button className="text-indigo-500 font-semibold text-sm" onClick={() => applyNumbers(i)}>确定</button>
                </div>
                <div className="text-xs text-amber-700 mt-1">注:号码个数决定玩法,会把整票设为对应的选N。</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addBet} className="w-full border border-dashed border-gray-300 rounded-2xl py-2 text-gray-500 text-sm">
        ＋ 添加一注
      </button>

      <div className="border-t border-dashed border-gray-200 my-3" />
      <Kl8TicketResultView result={result} />
    </div>
  )
}
