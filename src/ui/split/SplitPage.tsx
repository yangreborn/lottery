import { useMemo, useState } from 'react'
import type { DigitBet, GameId, Rule } from '../../data/types'
import { getGame } from '../../data/games'
import { isDigitGame } from '../../engine/calc'
import { splitCombination, type SplitMode } from '../../engine/split'
import { formatYuan } from '../../util/format'
import { GameSelector } from '../GameSelector'
import { PlaySelector } from '../PlaySelector'
import { MultiplierStepper } from '../MultiplierStepper'
import { SplitPlanView } from './SplitPlanView'

const initialDigitBets = (): DigitBet[] =>
  getGame('fc3d').plays.map((p, i) => ({ playId: p.id, multiplier: i === 0 ? 10 : 0 }))

export function SplitPage({ rules }: { rules: Rule[] }) {
  const [gameId, setGameId] = useState<GameId>('fc3d')
  const [digitBets, setDigitBets] = useState<DigitBet[]>(initialDigitBets)
  const [klPlay, setKlPlay] = useState<string>('kl8-7')
  const [klMult, setKlMult] = useState(2)
  const [maxRealname, setMaxRealname] = useState(0)
  const [mode, setMode] = useState<SplitMode>('separate')

  const digit = isDigitGame(gameId)

  function changeGame(id: GameId) { setGameId(id) }
  function setDigitMult(playId: string, m: number) {
    setDigitBets(bs => bs.map(b => (b.playId === playId ? { ...b, multiplier: m } : b)))
  }

  const bets: DigitBet[] = digit ? digitBets : [{ playId: klPlay, multiplier: klMult }]
  const plan = useMemo(
    () => splitCombination(gameId, bets, rules, maxRealname, mode),
    [gameId, digit, digitBets, klPlay, klMult, rules, maxRealname, mode],
  )

  const digitPlays = digit ? getGame(gameId).plays : []
  const multOf = (playId: string) => digitBets.find(b => b.playId === playId)?.multiplier ?? 0
  const modeChip = (on: boolean) => `flex-1 rounded-xl py-2 text-base font-bold ${on ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`

  return (
    <div className="space-y-4">
      <div className="text-lg font-bold">省税拆票</div>
      <div className="text-sm text-gray-400 -mt-2">把会缴税/实名的高倍票,拆成多张都不过线的票来合法避税。</div>

      <GameSelector value={gameId} onChange={changeGame} />

      {digit ? (
        <>
          <div className="text-sm text-gray-400">想买的组合(0 = 不买)</div>
          {digitPlays.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="text-base font-bold">{p.label}</div>
                <div className="text-xs text-gray-400">单注 {formatYuan(p.tiers[0].prize ?? 0)}</div>
              </div>
              <div className="mt-1">
                <MultiplierStepper value={multOf(p.id)} min={0} onChange={m => setDigitMult(p.id, m)} />
              </div>
            </div>
          ))}
          <div>
            <div className="text-sm text-gray-400 mb-1.5">多玩法怎么放到票上</div>
            <div className="flex gap-2">
              <button className={modeChip(mode === 'separate')} onClick={() => setMode('separate')}>分开拆</button>
              <button className={modeChip(mode === 'mixed')} onClick={() => setMode('mixed')}>混合打包</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <PlaySelector gameId={gameId} value={klPlay} onChange={setKlPlay} />
          <MultiplierStepper label="想买总倍数" value={klMult} onChange={setKlMult} />
        </>
      )}

      <MultiplierStepper label="实名张数上限(0=全免实名)" value={maxRealname} min={0} onChange={setMaxRealname} />
      <div className="border-t border-dashed border-gray-200 my-2" />
      <SplitPlanView plan={plan} />
    </div>
  )
}
