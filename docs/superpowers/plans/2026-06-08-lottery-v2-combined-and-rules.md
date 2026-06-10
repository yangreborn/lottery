# 彩票速查 v2:数字彩组合投注 + 按玩法定向规则 实现计划

> 执行方式:同会话 TDD,逐任务提交。基于 v1(branch feat/lottery-checker,77 测试通过)。

**Goal:** 数字彩(3D/排列3)支持一张票同时投多种玩法并按合计判税/实名;规则可按玩法定向并支持"设为每注X元"效果;内置一条体彩排列3加奖规则可一键启用。

**Architecture:** 引擎层加 `plays` 过滤、`setPerBetPrize` 效果、`computeDigitTicket`;UI 按彩种类型分流(数字彩=组合投注 / 快乐8=原全档位);内置规则首次启动播种。

---

## Task v1:类型扩展

`src/data/types.ts`:
- `RuleEffect` 增加 `| { kind: 'setPerBetPrize'; value: number }`
- `Rule` 增加可选 `plays?: string[]`
- `CalcContext` 增加 `multiplier: number`
- 新增:
```ts
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
  total: number                      // 合计中奖额
  tax: number
  netAmount: number
  needTax: boolean                   // 按 total 判定
  needRealname: boolean
}
export interface DigitBet { playId: string; multiplier: number }
```
提交:`feat(data): v2 类型(setPerBetPrize/plays/multiplier/TicketResult)`

## Task v2:规则引擎扩展(TDD)

`src/engine/rules.ts`:
- `applyEffect(amount, e, multiplier = 1)`:新增 `case 'setPerBetPrize': return e.value * multiplier`
- 新增 `export function playApplies(rule: Rule, playId: string): boolean { return !rule.plays || rule.plays.length === 0 || rule.plays.includes(playId) }`
- `applyActiveRules`:循环内增加 `if (!playApplies(rule, ctx.playId)) continue`;调用改为 `applyEffect(running, rule.effect, ctx.multiplier)`

测试 `src/engine/rules.test.ts` 增补:
```ts
it('setPerBetPrize 按倍数', () => expect(applyEffect(0, { kind: 'setPerBetPrize', value: 1500 }, 5)).toBe(7500))
describe('playApplies', () => {
  const base = { id:'r', name:'x', enabled:true, games:'all', condition:{kind:'always'}, effect:{kind:'multiply',factor:2} } as const
  it('无 plays 不限', () => expect(playApplies(base as any, 'zhixuan')).toBe(true))
  it('plays 命中', () => expect(playApplies({...base, plays:['zhixuan']} as any, 'zhixuan')).toBe(true))
  it('plays 不中', () => expect(playApplies({...base, plays:['zu3']} as any, 'zhixuan')).toBe(false))
})
```
(注:已有 applyEffect 测试不传 multiplier 仍通过,因默认 1。)
提交:`feat(engine): 规则按玩法定向 + setPerBetPrize 效果`

## Task v3:内置规则 + 播种探测(TDD)

`src/data/builtinRules.ts`(新):
```ts
import type { Rule } from './types'
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
```
`src/store/rulesStore.ts`:新增 `export function hasStoredRules(): boolean { try { return localStorage.getItem(RULES_KEY) !== null } catch { return false } }`

测试 `rulesStore.test.ts` 增补:
```ts
it('hasStoredRules 反映是否写过', () => {
  expect(hasStoredRules()).toBe(false)
  saveRules([])
  expect(hasStoredRules()).toBe(true)
})
```
提交:`feat(data): 内置体彩排列3加奖规则 + hasStoredRules`

## Task v4:数字彩组合计算(TDD)

`src/engine/calc.ts`:
```ts
export function isDigitGame(gameId: GameId): boolean {
  return gameId === 'fc3d' || gameId === 'pl3'
}

export function computeDigitTicket(
  gameId: GameId, bets: DigitBet[], rules: Rule[], nowMs: number = Date.now(),
): TicketResult {
  const bought = bets.filter(b => b.multiplier > 0)
  const ticketBet = bought.reduce((s, b) => s + getPlay(gameId, b.playId).betUnit * b.multiplier, 0)
  const contributions: PlayContribution[] = bought.map(b => {
    const play = getPlay(gameId, b.playId)
    const tier = play.tiers[0]                 // 数字彩每玩法单档
    const base = tier.prize ?? 0
    const afterMult = round2(base * b.multiplier)
    const ctx: CalcContext = {
      gameId, playId: b.playId, tierId: tier.id,
      betAmount: ticketBet, tierAmount: afterMult, multiplier: b.multiplier,
    }
    const { amount, applied } = applyActiveRules(afterMult, ctx, rules, nowMs)
    return { playId: b.playId, label: play.label, base, multiplier: b.multiplier, applied,
      amount, needTax: needTax(amount), needRealname: needRealname(amount) }
  })
  const total = round2(contributions.reduce((s, c) => s + c.amount, 0))
  const tax = round2(computeTax(total))
  return { contributions, total, tax, netAmount: round2(total - tax),
    needTax: needTax(total), needRealname: needRealname(total) }
}
```
(`round2` 已在文件内;补充 import `DigitBet, PlayContribution, TicketResult`。)

测试 `src/engine/calc.test.ts` 增补:
```ts
describe('computeDigitTicket 组合投注', () => {
  it('直选10倍+组六10倍 同时命中 → 合计 12130 缴税+实名', () => {
    const t = computeDigitTicket('pl3', [{ playId:'zhixuan', multiplier:10 }, { playId:'zu6', multiplier:10 }], [], NOW)
    // 直选 1040*10=10400, 组六 173*10=1730, 合计 12130
    expect(t.total).toBe(12130)
    expect(t.needTax).toBe(true)
    expect(t.needRealname).toBe(true)
    expect(t.contributions).toHaveLength(2)
  })
  it('倍数0的玩法不计入', () => {
    const t = computeDigitTicket('pl3', [{ playId:'zhixuan', multiplier:1 }, { playId:'zu3', multiplier:0 }], [], NOW)
    expect(t.contributions).toHaveLength(1)
    expect(t.total).toBe(1040)
  })
  it('内置加奖规则:直选满20元加至1500/注', () => {
    const rule = { id:'r', name:'加奖', enabled:true, games:['pl3'] as const, plays:['zhixuan'],
      condition:{kind:'betAmountGte', value:20} as const, effect:{kind:'setPerBetPrize', value:1500} as const }
    const t = computeDigitTicket('pl3', [{ playId:'zhixuan', multiplier:10 }], [rule], NOW)
    // 投注 20 元达标 → 直选每注 1500 ×10 = 15000
    expect(t.contributions[0].amount).toBe(15000)
    expect(t.contributions[0].applied[0].ruleId).toBe('r')
  })
})
```
提交:`feat(engine): computeDigitTicket 组合投注合计 + 测试`

## Task v5:MultiplierStepper 支持 min=0(TDD)

`src/ui/MultiplierStepper.tsx`:加可选 `min?: number`(默认 1);`clamp` 用 `Math.max(min, Math.min(99, Math.floor(n)))`;空值失焦回落为 `min`;按钮下限用 `min`。
测试增补:
```ts
it('min=0 时可减到0', async () => {
  const onChange = vi.fn()
  render(<MultiplierStepper value={1} min={0} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: '减少倍数' }))
  expect(onChange).toHaveBeenCalledWith(0)
})
```
提交:`feat(ui): MultiplierStepper 支持 min 下限`

## Task v6:数字彩组合投注 UI

`src/ui/digit/DigitTicketBuilder.tsx`(新):props `{ gameId, bets, onChange(bets), result: TicketResult }`。
- 标题"组合投注(可同时下注)";对 `getGame(gameId).plays` 每个玩法一行:玩法名 + 单注奖金 + `MultiplierStepper(min=0)`,改某行倍数→`onChange` 新 bets。
- `<TicketResultView result={result} />`。

`src/ui/digit/TicketResultView.tsx`(新):
- 若 `contributions` 为空:提示"请至少给一种玩法设置倍数"。
- 每个 contribution 一张卡:玩法名、`base × 倍数`、`amount`、缴税/实名标签(用各自 needTax/needRealname);若 `applied` 非空显示规则增量(复用 ResultCard 的 delta 文案风格)。
- 末尾一张高亮"同时命中 · 合计"卡:`total`、缴税/实名(按合计)、`needTax` 时显示税后与税额、列出各玩法贡献 `玩法名 +金额`。
测试 `TicketResultView.test.tsx`:给 `needTax:true,total:12130,needRealname:true` 的结果,断言显示 `¥12,130`、`缴税`、`实名`、"合计"。
提交:`feat(ui): 数字彩组合投注构建器与合计结果视图 + 测试`

## Task v7:RuleForm v2(适用彩种/玩法 + setPerBetPrize)

`src/ui/rules/RuleForm.tsx`:
- 增加"适用彩种"多选(`GAMES`,可全选=`'all'`);默认沿用 `initial.games`,新建默认 `'all'`。
- 增加"适用玩法"多选:基于已选彩种的玩法并集(`all` 时取全部彩种玩法去重 by id+label);为空=不限。写入 `rule.plays`(空数组则不设)。
- 效果选项增加"设为每注X元"(`setPerBetPrize`)。`buildEffect` 增加该分支。
- `validateRuleDraft` 增补:`setPerBetPrize` value≤0 报错"每注金额必须大于0"(在 rulesStore.ts 内加)。
测试 `RuleForm.test.tsx` 增补:选择"设为每注X元"并填 1500、勾选某玩法后保存,断言回传 `effect.kind==='setPerBetPrize'`、`plays` 含该玩法。
提交:`feat(ui): 规则编辑器支持彩种/玩法定向与每注定额效果`

## Task v8:App 集成(TDD)

`src/App.tsx`:
- 初始 rules:`useState(() => hasStoredRules() ? loadRules() : BUILTIN_RULES)`(首次播种内置规则;持久化 effect 会写入)。
- 数字彩 bets 状态:`const [digitBets, setDigitBets] = useState<DigitBet[]>(...)`,按当前数字彩玩法初始化(直选=1,其余=0);切换数字彩种时保持同结构。
- 渲染分流:`isDigitGame(gameId)` → `DigitTicketBuilder`(用 `computeDigitTicket`);否则原 `PlaySelector + MultiplierStepper + ResultList`(用 `computeTiers`)。
- 切换彩种 `changeGame`:数字彩↔快乐8 切换时分别重置对应状态。
集成测试 `App.test.tsx` 增补:切到"排列3" → 出现"组合投注";给直选设 10 倍、组六设 10 倍 → 出现"合计"且显示 `¥12,130`(或断言"缴税"出现)。
提交:`feat(app): 数字彩组合投注分流 + 内置规则播种`

## Task v9:全量验证

`npm run test`(全绿)+ `npm run build`(通过)。手动冒烟:排列3 组合投注、启用内置加奖规则看直选变 1500/注、合计过万显示缴税+实名;快乐8 不受影响;倍数可手输。
提交:`chore: v2 全量测试与构建通过`

## 自检(需求→任务)
- #1 数字彩组合投注 → v1/v4/v6/v8
- #2 倍数输入修复 → 已在前序提交(本计划外)
- #3 体彩加奖 + 按玩法定向 → v1/v2/v3/v7,内置规则 v3,一键启用 v8
