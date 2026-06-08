import type { GameId } from '../data/types'
import { getGame } from '../data/games'

interface Props { gameId: GameId; value: string; onChange: (playId: string) => void }

export function PlaySelector({ gameId, value, onChange }: Props) {
  const plays = getGame(gameId).plays
  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">玩法</div>
      <div className="flex flex-wrap gap-2">
        {plays.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`rounded-full px-4 py-2 text-base ${
              p.id === value ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
