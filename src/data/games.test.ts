import { describe, it, expect } from 'vitest'
import { GAMES, getGame, getPlay } from './games'

describe('彩种数据', () => {
  it('三个彩种', () => {
    expect(GAMES.map(g => g.id).sort()).toEqual(['fc3d', 'kl8', 'pl3'])
  })
  it('3D 直选 1040', () => {
    expect(getPlay('fc3d', 'zhixuan').tiers[0].prize).toBe(1040)
  })
  it('排列3 组六 173', () => {
    expect(getPlay('pl3', 'zu6').tiers[0].prize).toBe(173)
  })
  it('快乐8 选七中七 8500', () => {
    const play = getPlay('kl8', 'kl8-7')
    expect(play.tiers.find(t => t.id === 'hit7')!.prize).toBe(8500)
  })
  it('快乐8 选十中十为浮动奖(null)', () => {
    const play = getPlay('kl8', 'kl8-10')
    expect(play.tiers.find(t => t.id === 'hit10')!.prize).toBeNull()
  })
  it('所有 betUnit 均为 2', () => {
    for (const g of GAMES) for (const p of g.plays) expect(p.betUnit).toBe(2)
  })
  it('getGame 找不到抛错', () => {
    // @ts-expect-error 故意传错
    expect(() => getGame('xxx')).toThrow()
  })
})
