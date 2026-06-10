import type { Rule } from './types'

// 内置规则:首次启动播种进规则列表,默认停用,用户可一键启用/编辑/删除。
// 依据 2026 年多省体彩排列3 派奖(直选加奖至 1500 元/注,单票满 20 元)。
export const BUILTIN_RULES: Rule[] = [
  {
    id: 'builtin-pl3-zhixuan-1500',
    name: '排列3 直选派奖·每注加至1500元(单票满20元)',
    enabled: false,
    games: ['pl3'],
    plays: ['zhixuan'],
    condition: { kind: 'betAmountGte', value: 20 },
    effect: { kind: 'setPerBetPrize', value: 1500 },
  },
]
