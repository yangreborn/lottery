import { useMemo, useState } from 'react'
import type { GameId } from '../../data/types'
import { getGame } from '../../data/games'
import { splitTicket } from '../../engine/split'
import { GameSelector } from '../GameSelector'
import { PlaySelector } from '../PlaySelector'
import { MultiplierStepper } from '../MultiplierStepper'
import { SplitPlanView } from './SplitPlanView'

export function SplitPage() {
  const [gameId, setGameId] = useState<GameId>('fc3d')
  const [playId, setPlayId] = useState<string>(getGame('fc3d').plays[0].id)
  const [totalMult, setTotalMult] = useState(10)
  const [maxRealname, setMaxRealname] = useState(0)

  function changeGame(id: GameId) {
    setGameId(id)
    setPlayId(getGame(id).plays[0].id)
  }

  const plan = useMemo(
    () => splitTicket(gameId, playId, totalMult, maxRealname),
    [gameId, playId, totalMult, maxRealname],
  )

  return (
    <div className="space-y-4">
      <div className="text-lg font-bold">省税拆票</div>
      <div className="text-sm text-gray-400 -mt-2">把会缴税/实名的高倍票,拆成多张都不过线的票来合法避税。</div>
      <GameSelector value={gameId} onChange={changeGame} />
      <PlaySelector gameId={gameId} value={playId} onChange={setPlayId} />
      <MultiplierStepper label="想买总倍数" value={totalMult} onChange={setTotalMult} />
      <MultiplierStepper label="实名张数上限(0=全免实名)" value={maxRealname} min={0} onChange={setMaxRealname} />
      <div className="border-t border-dashed border-gray-200 my-2" />
      <SplitPlanView plan={plan} />
    </div>
  )
}
