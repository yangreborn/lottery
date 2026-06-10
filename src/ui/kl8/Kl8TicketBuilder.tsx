import { useState } from 'react'
import type { Kl8Entry, Kl8TicketResult } from '../../data/types'
import { getGame, getPlay } from '../../data/games'
import { MultiplierStepper } from '../MultiplierStepper'
import { validateKl8Numbers, derivePlayFromKl8 } from '../../engine/derive'
import { Kl8TicketResultView } from './Kl8TicketResultView'

interface Props {
  entries: Kl8Entry[]
  onChange: (entries: Kl8Entry[]) => void
  result: Kl8TicketResult
}

const KL8_PLAYS = getGame('kl8').plays

export function Kl8TicketBuilder({ entries, onChange, result }: Props) {
  const [numOpen, setNumOpen] = useState<number | null>(null)
  const [numText, setNumText] = useState('')

  function update(i: number, patch: Partial<Kl8Entry>) {
    onChange(entries.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  }
  function add() {
    onChange([...entries, { playId: 'kl8-1', multiplier: 1 }])
  }
  function remove(i: number) {
    onChange(entries.filter((_, j) => j !== i))
  }
  function applyNumbers(i: number) {
    const nums = numText.split(/[\s,，]+/).filter(Boolean).map(Number)
    if (!validateKl8Numbers(nums).ok) return
    const playId = derivePlayFromKl8(nums)!
    update(i, { playId, numbers: nums, lockedTierId: undefined })
    setNumOpen(null)
    setNumText('')
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">组合投注(可多注,倍数 0 = 不计)</div>
      <div className="space-y-2.5 mb-2">
        {entries.map((e, i) => {
          const play = getPlay('kl8', e.playId)
          return (
            <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex justify-between items-center gap-2">
                <select
                  aria-label={`第${i + 1}注玩法`}
                  className="text-base font-bold bg-transparent border border-gray-200 rounded-lg px-2 py-1"
                  value={e.playId}
                  onChange={ev => update(i, { playId: ev.target.value, lockedTierId: undefined, numbers: undefined })}
                >
                  {KL8_PLAYS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                {entries.length > 1 && (
                  <button onClick={() => remove(i)} className="text-gray-400 text-sm">删除</button>
                )}
              </div>

              <div className="mt-2">
                <MultiplierStepper value={e.multiplier} min={0} onChange={m => update(i, { multiplier: m })} />
              </div>

              <div className="mt-2 flex items-center gap-3 text-sm">
                <label className="text-gray-500">
                  锁定中几个:
                  <select
                    aria-label={`第${i + 1}注锁定档位`}
                    className="ml-1 bg-transparent border border-gray-200 rounded-lg px-1.5 py-0.5"
                    value={e.lockedTierId ?? ''}
                    onChange={ev => update(i, { lockedTierId: ev.target.value || undefined })}
                  >
                    <option value="">不锁(看可能)</option>
                    {play.tiers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </label>
                <button className="text-indigo-500" onClick={() => { setNumOpen(numOpen === i ? null : i); setNumText('') }}>
                  ✎ 输入号码
                </button>
              </div>

              {e.numbers && (
                <div className="mt-1 text-xs text-gray-400">已输号码:{e.numbers.join(' ')}(自动识别为{play.label})</div>
              )}

              {numOpen === i && (
                <div className="mt-2 flex gap-2">
                  <input
                    aria-label={`第${i + 1}注号码输入`}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                    placeholder="如 3 7 9 12(空格/逗号分隔,1–80)"
                    value={numText}
                    onChange={ev => setNumText(ev.target.value)}
                  />
                  <button className="text-indigo-500 font-semibold text-sm" onClick={() => applyNumbers(i)}>确定</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={add} className="w-full border border-dashed border-gray-300 rounded-2xl py-2 text-gray-500 text-sm">
        ＋ 添加一注
      </button>

      <div className="border-t border-dashed border-gray-200 my-3" />
      <Kl8TicketResultView result={result} />
    </div>
  )
}
