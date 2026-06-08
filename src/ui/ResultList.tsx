import type { TierResult } from '../data/types'
import { ResultCard } from './ResultCard'

export function ResultList({ results }: { results: TierResult[] }) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-3">所有中奖档位</div>
      {results.map(r => <ResultCard key={r.tierId} result={r} />)}
    </div>
  )
}
