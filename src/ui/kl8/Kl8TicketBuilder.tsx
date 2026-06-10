import { useState } from 'react'
import type { Kl8Bet, Kl8Ticket, Kl8TicketResult } from '../../data/types'
import { getGame, getPlay } from '../../data/games'
import { MultiplierStepper } from '../MultiplierStepper'
import { validateKl8Numbers, derivePlayFromKl8, parseKl8Pairs, formatKl8Pairs } from '../../engine/derive'
import { Kl8TicketResultView } from './Kl8TicketResultView'

interface Props {
  ticket: Kl8Ticket
  onChange: (ticket: Kl8Ticket) => void
  result: Kl8TicketResult
}

const KL8_PLAYS = getGame('kl8').plays
const KL8_MAX_MULT = 15   // 福彩倍数上限

export function Kl8TicketBuilder({ ticket, onChange, result }: Props) {
  const [numOpen, setNumOpen] = useState<number | null>(null)
  const [numRaw, setNumRaw] = useState('')   // 正在输入的连续数字(每2位一个号)

  const play = getPlay('kl8', ticket.playId)

  function setPlay(playId: string) {
    onChange({ ...ticket, playId, bets: ticket.bets.map(b => ({ ...b, lockedTierId: undefined })) })
  }
  function setMultiplier(multiplier: number) {
    onChange({ ...ticket, multiplier })
  }
  function updateBet(i: number, patch: Partial<Kl8Bet>) {
    onChange({ ...ticket, bets: ticket.bets.map((b, j) => (j === i ? { ...b, ...patch } : b)) })
  }
  function addBet() {
    onChange({ ...ticket, bets: [...ticket.bets, {}] })
  }
  function removeBet(i: number) {
    onChange({ ...ticket, bets: ticket.bets.filter((_, j) => j !== i) })
  }
  function applyNumbers(i: number) {
    const nums = parseKl8Pairs(numRaw)
    if (numRaw.replace(/\D/g, '').length % 2 !== 0 || !validateKl8Numbers(nums).ok) return
    const derivedPlay = derivePlayFromKl8(nums)!
    // 号码个数决定玩法:整票锁定为该玩法,并清各注锁定档
    onChange({
      ...ticket,
      playId: derivedPlay,
      bets: ticket.bets.map((b, j) =>
        j === i ? { ...b, numbers: nums, lockedTierId: undefined } : { ...b, lockedTierId: undefined }),
    })
    setNumOpen(null)
    setNumRaw('')
  }

  return (
    <div>
      {/* 整票玩法 + 倍数(全票一致) */}
      <div className="flex items-center justify-between mb-2">
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
      <div className="border border-gray-200 rounded-2xl px-4 py-3 mb-3">
        <MultiplierStepper value={ticket.multiplier} min={1} max={KL8_MAX_MULT} onChange={setMultiplier} label={`倍数(全票一致,≤${KL8_MAX_MULT})`} />
      </div>

      <div className="text-sm text-gray-400 mb-2">各注(号码不同,可中不同档)</div>
      <div className="space-y-2.5 mb-2">
        {ticket.bets.map((b, i) => (
          <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="text-base font-bold">第 {i + 1} 注</div>
              {ticket.bets.length > 1 && (
                <button onClick={() => removeBet(i)} className="text-gray-400 text-sm">删除</button>
              )}
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
              <button className="text-indigo-500" onClick={() => { setNumOpen(numOpen === i ? null : i); setNumRaw('') }}>
                ✎ 输入号码
              </button>
            </div>

            {b.numbers && (
              <div className="mt-1 text-xs text-gray-400">已输号码:{b.numbers.map(n => String(n).padStart(2, '0')).join(' ')}(自动识别为{play.label})</div>
            )}

            {numOpen === i && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    aria-label={`第${i + 1}注号码输入`}
                    inputMode="numeric"
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-base tracking-widest"
                    placeholder="连续输入数字,每2位一个号(个位补0)"
                    value={formatKl8Pairs(numRaw)}
                    onChange={e => setNumRaw(e.target.value.replace(/\D/g, '').slice(0, 20))}
                  />
                  <button className="text-indigo-500 font-semibold text-sm" onClick={() => applyNumbers(i)}>确定</button>
                </div>
                <div className="text-xs text-amber-700 mt-1">每个号 2 位(如 3 输 03)、1–80、不重复;号码个数决定整票玩法。</div>
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
