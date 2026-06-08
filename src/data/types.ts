export type GameId = 'fc3d' | 'kl8' | 'pl3'

export interface Tier {
  id: string            // play 内唯一,如 'hit7'
  label: string         // 如 '中7个' / '直选命中'
  prize: number | null  // 单注固定奖金;null = 浮动奖
}

export interface Play {
  id: string            // 如 'kl8-7' / 'zhixuan'
  label: string         // 如 '选七' / '直选'
  betUnit: number       // 单注基础投注额(元)
  tiers: Tier[]
}

export interface Game {
  id: GameId
  label: string
  plays: Play[]
}

export type RuleCondition =
  | { kind: 'always' }
  | { kind: 'betAmountGte'; value: number }
  | { kind: 'tierAmountRange'; min?: number; max?: number }
  | { kind: 'specificTiers'; tiers: string[] }

export type RuleEffect =
  | { kind: 'multiply'; factor: number }
  | { kind: 'addPercent'; percent: number }
  | { kind: 'addFixed'; value: number }
  | { kind: 'cap'; value: number }

export interface Rule {
  id: string
  name: string
  enabled: boolean
  games: GameId[] | 'all'
  condition: RuleCondition
  effect: RuleEffect
  validFrom?: string    // ISO 日期,可选
  validTo?: string
}

export type AnnouncementStatus = 'pending' | 'applied' | 'ignored'

export interface Announcement {
  id: string
  title: string
  content: string
  source?: string
  addedAt: string
  status: AnnouncementStatus
  linkedRuleIds?: string[]
}

export interface AppliedRule { ruleId: string; ruleName: string; delta: number }

export interface CalcContext {
  gameId: GameId
  playId: string
  tierId: string
  betAmount: number   // 单票投注金额 = betUnit × 倍数
  tierAmount: number  // base × 倍数(用于 tierAmountRange)
}

export interface CalcInput {
  gameId: GameId
  playId: string
  multiplier: number
}

export interface TierResult {
  tierId: string
  tierLabel: string
  base: number
  multiplier: number
  afterMult: number
  applied: AppliedRule[]
  amount: number | null
  tax: number
  netAmount: number | null
  needTax: boolean
  needRealname: boolean
  floating: boolean
}
