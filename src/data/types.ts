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
  exclusiveGroup?: string // 同组的玩法不会同时中奖(如组三/组六);合计时同组只计较高者
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
  | { kind: 'setPerBetPrize'; value: number }  // 把每注奖金设为 value(总额 = value × 倍数)

export interface Rule {
  id: string
  name: string
  enabled: boolean
  games: GameId[] | 'all'
  plays?: string[]       // 可选:仅适用的玩法 id(与 games、condition 取与);为空=不限玩法
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
  betAmount: number   // 单票投注金额(组合投注时为整票合计)
  tierAmount: number  // base × 倍数(用于 tierAmountRange)
  multiplier: number  // 该注倍数(用于 setPerBetPrize)
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

// 数字彩(3D/排列3)组合投注
export interface DigitBet { playId: string; multiplier: number }

export interface PlayContribution {
  playId: string
  label: string
  base: number
  multiplier: number
  applied: AppliedRule[]
  amount: number          // 该玩法中奖额(含规则)
  needTax: boolean        // 该玩法单独是否过税线
  needRealname: boolean
}

export interface TicketResult {
  contributions: PlayContribution[]  // 已买(倍数>0)的玩法
  total: number                      // 合计中奖额(互斥组只计较高者)
  tax: number
  netAmount: number
  needTax: boolean                   // 按 total 判定
  needRealname: boolean
  exclusiveNote: boolean             // 是否因互斥(如组三/组六)而未全额相加
}

// —— 快乐8 多注票(§14)——
export interface Kl8Entry {
  playId: string
  multiplier: number
  lockedTierId?: string   // 锁定"中几个"场景;缺省=不锁,仅参与可能性分析
  numbers?: number[]      // 可选:输入的真实号码(1-80)
}

export interface Kl8EntryResult {
  playId: string
  label: string
  multiplier: number
  lines: TierResult[]            // 该注各档位(复用 computeTiers)
  topAmount: number | null       // 顶档金额(null = 浮动头奖)
  topFloating: boolean
  lockedTierId?: string
  lockedLine?: TierResult        // 锁定档位的结果(未锁则 undefined)
}

export interface Kl8TicketResult {
  entries: Kl8EntryResult[]
  maxTotal: number               // Σ 各注顶档金额(浮动注不计入数值,另以 maxFloating 标记)
  maxFloating: boolean           // 是否含浮动头奖
  existsTax: boolean             // 是否存在需缴税(>1万)的中奖可能
  existsRealname: boolean        // 是否存在需实名(>3千)的中奖可能
  // 锁定场景(至少一注 lockedTierId 时有效)
  hasLocked: boolean
  lockedTotal: number
  lockedFloating: boolean
  lockedTax: number
  lockedNetAmount: number
  lockedNeedTax: boolean
  lockedNeedRealname: boolean
}
