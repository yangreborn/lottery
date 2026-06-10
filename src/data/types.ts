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

// —— 数字彩(3D/排列3)一张票:最多 5 注,每注一组号码 + 玩法(§14.4)——
export interface DigitTicketBet {
  digits?: number[]      // 3 位号码,可选
  playId: string         // zhixuan / zu3 / zu6
  multiplier: number
}

export interface DigitContribution {
  playId: string
  label: string
  digits?: number[]
  base: number
  multiplier: number
  applied: AppliedRule[]
  amount: number
  needTax: boolean
  needRealname: boolean
}

export interface DigitTicketResult {
  contributions: DigitContribution[]  // 各注(倍数>0)
  total: number                       // 整票合计(各注相加)
  tax: number
  netAmount: number
  needTax: boolean
  needRealname: boolean
}

// —— 快乐8 一张票:单一玩法(选N),倍数全票一致,多注(§14.4 / §14.5)——
export interface Kl8Bet {
  numbers?: number[]      // 可选:该注真实号码(1-80)
  lockedTierId?: string   // 锁定"中几个"场景;缺省=仅参与可能性分析
}

export interface Kl8Ticket {
  playId: string          // 选N,全票共享
  multiplier: number      // 倍数,全票一致
  bets: Kl8Bet[]
}

export interface Kl8BetResult {
  numbers?: number[]
  topAmount: number | null
  topFloating: boolean
  lockedTierId?: string
  lockedLine?: TierResult
}

export interface Kl8TicketResult {
  playId: string
  playLabel: string
  multiplier: number
  tierTable: TierResult[]        // 该玩法各档(按整票倍数,参考表)
  bets: Kl8BetResult[]
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
