import type { GameId } from '../data/types'
import { GAMES } from '../data/games'

interface Props { value: GameId; onChange: (id: GameId) => void }

export function GameSelector({ value, onChange }: Props) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">彩种</div>
      <div className="flex gap-2.5">
        {GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`flex-1 rounded-xl py-2.5 text-lg font-bold ${
              g.id === value ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  )
}
