import type { Game, GameId, Play } from './types'

// 福彩3D 与 体彩排列3 奖金相同
const digitPlays: Play[] = [
  { id: 'zhixuan', label: '直选', betUnit: 2, tiers: [{ id: 'hit', label: '直选命中', prize: 1040 }] },
  { id: 'zu3', label: '组选三', betUnit: 2, exclusiveGroup: 'zu', tiers: [{ id: 'hit', label: '组选三命中', prize: 346 }] },
  { id: 'zu6', label: '组选六', betUnit: 2, exclusiveGroup: 'zu', tiers: [{ id: 'hit', label: '组选六命中', prize: 173 }] },
]

const kl8Plays: Play[] = [
  { id: 'kl8-1', label: '选一', betUnit: 2, tiers: [{ id: 'hit1', label: '中1个', prize: 4.5 }] },
  { id: 'kl8-2', label: '选二', betUnit: 2, tiers: [{ id: 'hit2', label: '中2个', prize: 19 }] },
  { id: 'kl8-3', label: '选三', betUnit: 2, tiers: [
    { id: 'hit3', label: '中3个', prize: 52 }, { id: 'hit2', label: '中2个', prize: 3 } ] },
  { id: 'kl8-4', label: '选四', betUnit: 2, tiers: [
    { id: 'hit4', label: '中4个', prize: 93 }, { id: 'hit3', label: '中3个', prize: 5 }, { id: 'hit2', label: '中2个', prize: 3 } ] },
  { id: 'kl8-5', label: '选五', betUnit: 2, tiers: [
    { id: 'hit5', label: '中5个', prize: 1000 }, { id: 'hit4', label: '中4个', prize: 20 }, { id: 'hit3', label: '中3个', prize: 3 } ] },
  { id: 'kl8-6', label: '选六', betUnit: 2, tiers: [
    { id: 'hit6', label: '中6个', prize: 2880 }, { id: 'hit5', label: '中5个', prize: 30 }, { id: 'hit4', label: '中4个', prize: 10 }, { id: 'hit3', label: '中3个', prize: 3 } ] },
  { id: 'kl8-7', label: '选七', betUnit: 2, tiers: [
    { id: 'hit7', label: '中7个', prize: 8500 }, { id: 'hit6', label: '中6个', prize: 300 }, { id: 'hit5', label: '中5个', prize: 30 }, { id: 'hit4', label: '中4个', prize: 4 }, { id: 'hit0', label: '全不中', prize: 2 } ] },
  { id: 'kl8-8', label: '选八', betUnit: 2, tiers: [
    { id: 'hit8', label: '中8个', prize: 50000 }, { id: 'hit7', label: '中7个', prize: 800 }, { id: 'hit6', label: '中6个', prize: 80 }, { id: 'hit5', label: '中5个', prize: 10 }, { id: 'hit4', label: '中4个', prize: 3 }, { id: 'hit0', label: '全不中', prize: 2 } ] },
  { id: 'kl8-9', label: '选九', betUnit: 2, tiers: [
    { id: 'hit9', label: '中9个', prize: null }, { id: 'hit8', label: '中8个', prize: 2000 }, { id: 'hit7', label: '中7个', prize: 225 }, { id: 'hit6', label: '中6个', prize: 22 }, { id: 'hit5', label: '中5个', prize: 5 }, { id: 'hit4', label: '中4个', prize: 3 }, { id: 'hit0', label: '全不中', prize: 2 } ] },
  { id: 'kl8-10', label: '选十', betUnit: 2, tiers: [
    { id: 'hit10', label: '中10个', prize: null }, { id: 'hit9', label: '中9个', prize: 8000 }, { id: 'hit8', label: '中8个', prize: 720 }, { id: 'hit7', label: '中7个', prize: 80 }, { id: 'hit6', label: '中6个', prize: 5 }, { id: 'hit5', label: '中5个', prize: 3 }, { id: 'hit0', label: '全不中', prize: 2 } ] },
]

export const GAMES: Game[] = [
  { id: 'kl8', label: '快乐8', plays: kl8Plays },
  { id: 'fc3d', label: '福彩3D', plays: digitPlays },
  { id: 'pl3', label: '排列3', plays: digitPlays },
]

export function getGame(id: GameId): Game {
  const g = GAMES.find(x => x.id === id)
  if (!g) throw new Error(`未知彩种: ${id}`)
  return g
}

export function getPlay(gameId: GameId, playId: string): Play {
  const p = getGame(gameId).plays.find(x => x.id === playId)
  if (!p) throw new Error(`未知玩法: ${gameId}/${playId}`)
  return p
}
