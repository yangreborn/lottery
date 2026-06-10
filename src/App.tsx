import { useEffect, useMemo, useState } from 'react'
import type { Announcement, DigitBet, GameId, Rule } from './data/types'
import { getGame } from './data/games'
import { BUILTIN_RULES } from './data/builtinRules'
import { computeTiers, computeDigitTicket, isDigitGame } from './engine/calc'
import { loadRules, saveRules, hasStoredRules } from './store/rulesStore'
import { loadAnnouncements, saveAnnouncements, pendingCount } from './store/announcementsStore'
import { GameSelector } from './ui/GameSelector'
import { PlaySelector } from './ui/PlaySelector'
import { MultiplierStepper } from './ui/MultiplierStepper'
import { ResultList } from './ui/ResultList'
import { PendingBanner } from './ui/PendingBanner'
import { DigitTicketBuilder } from './ui/digit/DigitTicketBuilder'
import { RulesPage } from './ui/rules/RulesPage'
import { InboxPage } from './ui/inbox/InboxPage'
import { SplitPage } from './ui/split/SplitPage'

type Tab = 'calc' | 'split' | 'rules' | 'inbox'

// 数字彩默认组合:直选=1,其余=0
const initialDigitBets = (): DigitBet[] =>
  getGame('fc3d').plays.map((p, i) => ({ playId: p.id, multiplier: i === 0 ? 1 : 0 }))

export default function App() {
  const [tab, setTab] = useState<Tab>('calc')
  const [gameId, setGameId] = useState<GameId>('kl8')
  const [playId, setPlayId] = useState<string>(getGame('kl8').plays[0].id)
  const [multiplier, setMultiplier] = useState(1)
  const [digitBets, setDigitBets] = useState<DigitBet[]>(initialDigitBets)
  // 首次启动播种内置规则;之后读已存的
  const [rules, setRules] = useState<Rule[]>(() => (hasStoredRules() ? loadRules() : BUILTIN_RULES))
  const [anns, setAnns] = useState<Announcement[]>(() => loadAnnouncements())
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => { if (!saveRules(rules)) setStorageOk(false) }, [rules])
  useEffect(() => { if (!saveAnnouncements(anns)) setStorageOk(false) }, [anns])

  function changeGame(id: GameId) {
    setGameId(id)
    setPlayId(getGame(id).plays[0].id)
  }

  const digit = isDigitGame(gameId)
  const tierResults = useMemo(
    () => computeTiers({ gameId, playId, multiplier }, rules),
    [gameId, playId, multiplier, rules],
  )
  const ticketResult = useMemo(
    () => (digit ? computeDigitTicket(gameId, digitBets, rules) : null),
    [digit, gameId, digitBets, rules],
  )
  const pending = pendingCount(anns)

  const tabBtn = (t: Tab, label: string) =>
    <button onClick={() => setTab(t)} className={`flex-1 py-2 ${tab === t ? 'text-indigo-500 font-bold' : 'text-gray-400'}`}>{label}</button>

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col">
      {!storageOk && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-2 text-center">
          存储不可用,本次的规则与公告不会被保存
        </div>
      )}
      <div className="flex-1 p-5">
        {tab === 'calc' && (
          <div className="space-y-4">
            <PendingBanner count={pending} onClick={() => setTab('inbox')} />
            <GameSelector value={gameId} onChange={changeGame} />
            {digit ? (
              <DigitTicketBuilder gameId={gameId} bets={digitBets} onChange={setDigitBets} result={ticketResult!} />
            ) : (
              <>
                <PlaySelector gameId={gameId} value={playId} onChange={setPlayId} />
                <MultiplierStepper value={multiplier} onChange={setMultiplier} />
                <div className="border-t border-dashed border-gray-200 my-2" />
                <ResultList results={tierResults} />
              </>
            )}
          </div>
        )}
        {tab === 'split' && <SplitPage rules={rules} />}
        {tab === 'rules' && <RulesPage rules={rules} onChange={setRules} />}
        {tab === 'inbox' && <InboxPage announcements={anns} onChange={setAnns} />}
      </div>
      <nav className="flex border-t border-gray-200 text-sm sticky bottom-0 bg-white">
        {tabBtn('calc', '速查')}
        {tabBtn('split', '拆票')}
        {tabBtn('rules', '规则')}
        {tabBtn('inbox', pending > 0 ? `公告 ●` : '公告')}
      </nav>
    </div>
  )
}
