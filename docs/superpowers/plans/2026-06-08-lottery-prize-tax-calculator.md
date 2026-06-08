# 彩票中奖/缴税/实名速查网页 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一个纯静态网页:选彩种/玩法/倍数即实时列出所有中奖档位的奖金、税后、是否缴税、是否实名;支持手动活动规则(并在结果里展示每条规则的加奖增量)与公告收件箱(粘贴+未应用提示)。

**Architecture:** 纯前端、无后端。纯函数计算引擎(data + engine)与 React UI 分离;规则与公告持久化到 localStorage。引擎输入相同输出相同,先用 Vitest 做 TDD,UI 再消费引擎结果。

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Vitest + @testing-library/react。

设计依据见 `docs/superpowers/specs/2026-06-08-lottery-prize-tax-calculator-design.md`。

---

## 文件结构

```
package.json, vite.config.ts, tsconfig.json, tsconfig.node.json, index.html   # 脚手架
src/
  main.tsx                  # 入口
  index.css                 # Tailwind 引入
  test/setup.ts             # 测试初始化(jest-dom)
  data/
    types.ts                # 全部类型
    tax.ts                  # 税/实名常量 + 纯函数
    games.ts                # 三个彩种奖金表 + 查找函数
  engine/
    rules.ts                # 规则匹配/效果/增量(纯函数)
    calc.ts                 # computeTiers(纯函数)
  store/
    rulesStore.ts           # 规则 localStorage CRUD + 校验
    announcementsStore.ts   # 公告 localStorage CRUD + pending 计数
  util/
    format.ts               # 金额格式化
  ui/
    GameSelector.tsx PlaySelector.tsx MultiplierStepper.tsx
    ResultCard.tsx ResultList.tsx
    PendingBanner.tsx
    rules/RulesPage.tsx rules/RuleForm.tsx
    inbox/InboxPage.tsx inbox/AnnouncementForm.tsx
  App.tsx                   # 组装 + 顶部提示 + 底部 tab
```

每个 `*.test.ts(x)` 与被测文件同目录。

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "lottery-checker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run:
```
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event tailwindcss @tailwindcss/vite
```
Expected: 安装成功,生成 `node_modules` 与 `package-lock.json`。

- [ ] **Step 3: 创建 `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: 创建 `tsconfig.json` 与 `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```
`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 `index.html`、`src/index.css`、`src/test/setup.ts`、`src/main.tsx`、`src/App.tsx`**

`index.html`:
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>彩票中奖速查</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
`src/index.css`:
```css
@import "tailwindcss";

html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #f6f7f9; color: #111; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }
```
`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```
`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
`src/App.tsx` (临时占位,后续 Task 替换):
```tsx
export default function App() {
  return <div className="p-6 text-2xl font-bold">彩票中奖速查</div>
}
```

- [ ] **Step 6: 设置本地 git 身份并验证构建**

Run:
```
git config user.name "lottery-dev"
git config user.email "ma3youyang@outlook.com"
npm run build
```
Expected: TypeScript 编译通过,`dist/` 生成,无报错。

- [ ] **Step 7: 提交**

```
git add -A
git commit -m "chore: 初始化 Vite+React+TS+Tailwind+Vitest 脚手架"
```

---

## Task 2: 类型定义

**Files:**
- Create: `src/data/types.ts`

- [ ] **Step 1: 写类型(无测试,纯声明)**

```ts
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
```

- [ ] **Step 2: 提交**

```
git add -A
git commit -m "feat(data): 定义全部领域类型"
```

---

## Task 3: 税务/实名纯函数

**Files:**
- Create: `src/data/tax.ts`, `src/data/tax.test.ts`

- [ ] **Step 1: 写失败测试 `src/data/tax.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { needRealname, needTax, computeTax, REALNAME_THRESHOLD, TAX_THRESHOLD, TAX_RATE } from './tax'

describe('常量', () => {
  it('门槛与税率', () => {
    expect(REALNAME_THRESHOLD).toBe(3000)
    expect(TAX_THRESHOLD).toBe(10000)
    expect(TAX_RATE).toBe(0.2)
  })
})

describe('实名判定(>3000 触发)', () => {
  it('3000 免实名', () => expect(needRealname(3000)).toBe(false))
  it('3001 需实名', () => expect(needRealname(3001)).toBe(true))
})

describe('缴税判定(>10000 触发)', () => {
  it('10000 免税', () => expect(needTax(10000)).toBe(false))
  it('10001 需税', () => expect(needTax(10001)).toBe(true))
})

describe('税额', () => {
  it('10000 不计税', () => expect(computeTax(10000)).toBe(0))
  it('50000 全额20%=10000', () => expect(computeTax(50000)).toBe(10000))
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/data/tax.test.ts`
Expected: FAIL(模块/导出不存在)。

- [ ] **Step 3: 实现 `src/data/tax.ts`**

```ts
export const REALNAME_THRESHOLD = 3000
export const TAX_THRESHOLD = 10000
export const TAX_RATE = 0.2

export function needRealname(amount: number): boolean {
  return amount > REALNAME_THRESHOLD
}

export function needTax(amount: number): boolean {
  return amount > TAX_THRESHOLD
}

export function computeTax(amount: number): number {
  return needTax(amount) ? amount * TAX_RATE : 0
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/data/tax.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(data): 税务/实名判定纯函数 + 边界测试"
```

---

## Task 4: 奖金数据表

**Files:**
- Create: `src/data/games.ts`, `src/data/games.test.ts`

- [ ] **Step 1: 写失败测试 `src/data/games.test.ts`**

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/data/games.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/data/games.ts`**

```ts
import type { Game, GameId, Play } from './types'

// 福彩3D 与 体彩排列3 奖金相同
const digitPlays: Play[] = [
  { id: 'zhixuan', label: '直选', betUnit: 2, tiers: [{ id: 'hit', label: '直选命中', prize: 1040 }] },
  { id: 'zu3', label: '组选三', betUnit: 2, tiers: [{ id: 'hit', label: '组选三命中', prize: 346 }] },
  { id: 'zu6', label: '组选六', betUnit: 2, tiers: [{ id: 'hit', label: '组选六命中', prize: 173 }] },
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/data/games.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(data): 三彩种官方奖金表 + 查找函数"
```

---

## Task 5: 规则引擎(匹配/效果/增量)

**Files:**
- Create: `src/engine/rules.ts`, `src/engine/rules.test.ts`

- [ ] **Step 1: 写失败测试 `src/engine/rules.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { applyEffect, conditionMatches, gameApplies, isWithinValidity, applyActiveRules } from './rules'
import type { CalcContext, Rule } from '../data/types'

const ctx: CalcContext = { gameId: 'fc3d', playId: 'zhixuan', tierId: 'hit', betAmount: 20, tierAmount: 10400 }

describe('applyEffect', () => {
  it('翻倍', () => expect(applyEffect(100, { kind: 'multiply', factor: 2 })).toBe(200))
  it('加50%', () => expect(applyEffect(100, { kind: 'addPercent', percent: 50 })).toBe(150))
  it('加固定', () => expect(applyEffect(100, { kind: 'addFixed', value: 30 })).toBe(130))
  it('封顶', () => expect(applyEffect(100, { kind: 'cap', value: 80 })).toBe(80))
})

describe('conditionMatches', () => {
  it('always', () => expect(conditionMatches({ kind: 'always' }, ctx)).toBe(true))
  it('betAmountGte 命中', () => expect(conditionMatches({ kind: 'betAmountGte', value: 18 }, ctx)).toBe(true))
  it('betAmountGte 不中', () => expect(conditionMatches({ kind: 'betAmountGte', value: 50 }, ctx)).toBe(false))
  it('tierAmountRange 命中', () => expect(conditionMatches({ kind: 'tierAmountRange', min: 10000 }, ctx)).toBe(true))
  it('specificTiers 命中', () => expect(conditionMatches({ kind: 'specificTiers', tiers: ['hit'] }, ctx)).toBe(true))
  it('specificTiers 不中', () => expect(conditionMatches({ kind: 'specificTiers', tiers: ['hit7'] }, ctx)).toBe(false))
})

describe('gameApplies', () => {
  const base: Rule = { id: 'r', name: 'x', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'multiply', factor: 2 } }
  it('all 适用', () => expect(gameApplies(base, 'fc3d')).toBe(true))
  it('列表命中', () => expect(gameApplies({ ...base, games: ['fc3d'] }, 'fc3d')).toBe(true))
  it('列表不中', () => expect(gameApplies({ ...base, games: ['kl8'] }, 'fc3d')).toBe(false))
})

describe('isWithinValidity', () => {
  const r: Rule = { id: 'r', name: 'x', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'multiply', factor: 2 }, validFrom: '2026-10-01', validTo: '2026-10-07' }
  it('期内', () => expect(isWithinValidity(r, Date.parse('2026-10-03'))).toBe(true))
  it('期前', () => expect(isWithinValidity(r, Date.parse('2026-09-30'))).toBe(false))
  it('期后', () => expect(isWithinValidity(r, Date.parse('2026-10-08'))).toBe(false))
  it('无期限始终有效', () => expect(isWithinValidity({ ...r, validFrom: undefined, validTo: undefined }, 0)).toBe(true))
})

describe('applyActiveRules 增量明细', () => {
  const now = Date.parse('2026-10-03')
  const r1: Rule = { id: 'r1', name: '满18翻倍', enabled: true, games: 'all', condition: { kind: 'betAmountGte', value: 18 }, effect: { kind: 'multiply', factor: 2 } }

  it('单规则翻倍并记录 delta', () => {
    const out = applyActiveRules(10400, ctx, [r1], now)
    expect(out.amount).toBe(20800)
    expect(out.applied).toEqual([{ ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 }])
  })

  it('未启用规则跳过', () => {
    const out = applyActiveRules(10400, ctx, [{ ...r1, enabled: false }], now)
    expect(out.amount).toBe(10400)
    expect(out.applied).toEqual([])
  })

  it('条件不中跳过', () => {
    const out = applyActiveRules(10400, ctx, [{ ...r1, condition: { kind: 'betAmountGte', value: 50 } }], now)
    expect(out.amount).toBe(10400)
  })

  it('多规则按顺序叠加(翻倍后加50%后封顶)', () => {
    const r2: Rule = { id: 'r2', name: '加50%', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'addPercent', percent: 50 } }
    const r3: Rule = { id: 'r3', name: '封顶25000', enabled: true, games: 'all', condition: { kind: 'always' }, effect: { kind: 'cap', value: 25000 } }
    const out = applyActiveRules(10400, ctx, [r1, r2, r3], now)
    // 10400 ->(x2) 20800 ->(+50%) 31200 ->(cap 25000) 25000
    expect(out.amount).toBe(25000)
    expect(out.applied).toEqual([
      { ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 },
      { ruleId: 'r2', ruleName: '加50%', delta: 10400 },
      { ruleId: 'r3', ruleName: '封顶25000', delta: -6200 },
    ])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/engine/rules.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/engine/rules.ts`**

```ts
import type { AppliedRule, CalcContext, GameId, Rule, RuleCondition, RuleEffect } from '../data/types'

const round2 = (n: number): number => Math.round(n * 100) / 100

export function applyEffect(amount: number, e: RuleEffect): number {
  switch (e.kind) {
    case 'multiply': return amount * e.factor
    case 'addPercent': return amount * (1 + e.percent / 100)
    case 'addFixed': return amount + e.value
    case 'cap': return Math.min(amount, e.value)
  }
}

export function conditionMatches(c: RuleCondition, ctx: CalcContext): boolean {
  switch (c.kind) {
    case 'always': return true
    case 'betAmountGte': return ctx.betAmount >= c.value
    case 'tierAmountRange':
      return (c.min === undefined || ctx.tierAmount >= c.min) && (c.max === undefined || ctx.tierAmount <= c.max)
    case 'specificTiers': return c.tiers.includes(ctx.tierId)
  }
}

export function gameApplies(rule: Rule, gameId: GameId): boolean {
  return rule.games === 'all' || rule.games.includes(gameId)
}

export function isWithinValidity(rule: Rule, nowMs: number): boolean {
  if (rule.validFrom && nowMs < Date.parse(rule.validFrom)) return false
  if (rule.validTo && nowMs > Date.parse(rule.validTo)) return false
  return true
}

export function applyActiveRules(
  afterMult: number,
  ctx: CalcContext,
  rules: Rule[],
  nowMs: number,
): { amount: number; applied: AppliedRule[] } {
  let running = afterMult
  const applied: AppliedRule[] = []
  for (const rule of rules) {
    if (!rule.enabled) continue
    if (!isWithinValidity(rule, nowMs)) continue
    if (!gameApplies(rule, ctx.gameId)) continue
    if (!conditionMatches(rule.condition, ctx)) continue
    const next = round2(applyEffect(running, rule.effect))
    const delta = round2(next - running)
    applied.push({ ruleId: rule.id, ruleName: rule.name, delta })
    running = next
  }
  return { amount: running, applied }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/engine/rules.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(engine): 规则匹配/效果/增量明细纯函数 + 测试"
```

---

## Task 6: computeTiers 计算引擎

**Files:**
- Create: `src/engine/calc.ts`, `src/engine/calc.test.ts`

- [ ] **Step 1: 写失败测试 `src/engine/calc.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeTiers } from './calc'
import type { Rule } from '../data/types'

const NOW = Date.parse('2026-10-03')

describe('computeTiers 无规则', () => {
  it('3D 直选 10倍 = 10400 → 缴税+实名,税后8320', () => {
    const [r] = computeTiers({ gameId: 'fc3d', playId: 'zhixuan', multiplier: 10 }, [], NOW)
    expect(r.amount).toBe(10400)
    expect(r.needTax).toBe(true)
    expect(r.needRealname).toBe(true)
    expect(r.tax).toBe(2080)
    expect(r.netAmount).toBe(8320)
  })

  it('快乐8 选八中八 50000 → 税后40000', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-8', multiplier: 1 }, [], NOW)
    const hit8 = res.find(t => t.tierId === 'hit8')!
    expect(hit8.amount).toBe(50000)
    expect(hit8.netAmount).toBe(40000)
    expect(hit8.needTax).toBe(true)
  })

  it('快乐8 选七中七 8500 → 免税但需实名', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-7', multiplier: 1 }, [], NOW)
    const hit7 = res.find(t => t.tierId === 'hit7')!
    expect(hit7.needTax).toBe(false)
    expect(hit7.needRealname).toBe(true)
  })

  it('选十中十为浮动奖 → amount=null, floating=true', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-10', multiplier: 1 }, [], NOW)
    const hit10 = res.find(t => t.tierId === 'hit10')!
    expect(hit10.floating).toBe(true)
    expect(hit10.amount).toBeNull()
    expect(hit10.netAmount).toBeNull()
  })
})

describe('computeTiers 带规则(满18元翻倍)', () => {
  const rule: Rule = { id: 'r1', name: '满18翻倍', enabled: true, games: 'all', condition: { kind: 'betAmountGte', value: 18 }, effect: { kind: 'multiply', factor: 2 } }

  it('3D 直选 10倍(投注20元)触发翻倍 → 20800,applied 记录', () => {
    const [r] = computeTiers({ gameId: 'fc3d', playId: 'zhixuan', multiplier: 10 }, [rule], NOW)
    expect(r.amount).toBe(20800)
    expect(r.applied).toEqual([{ ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 }])
  })

  it('3D 直选 5倍(投注10元)不触发 → 仍 5200', () => {
    const [r] = computeTiers({ gameId: 'fc3d', playId: 'zhixuan', multiplier: 5 }, [rule], NOW)
    expect(r.amount).toBe(5200)
    expect(r.applied).toEqual([])
  })

  it('浮动奖档位不套用规则', () => {
    const res = computeTiers({ gameId: 'kl8', playId: 'kl8-10', multiplier: 10 }, [rule], NOW)
    const hit10 = res.find(t => t.tierId === 'hit10')!
    expect(hit10.applied).toEqual([])
    expect(hit10.amount).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/engine/calc.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/engine/calc.ts`**

```ts
import type { CalcContext, CalcInput, Rule, TierResult } from '../data/types'
import { getPlay } from '../data/games'
import { computeTax, needRealname, needTax } from '../data/tax'
import { applyActiveRules } from './rules'

const round2 = (n: number): number => Math.round(n * 100) / 100

export function computeTiers(input: CalcInput, rules: Rule[], nowMs: number = Date.now()): TierResult[] {
  const play = getPlay(input.gameId, input.playId)
  const betAmount = play.betUnit * input.multiplier

  return play.tiers.map((tier): TierResult => {
    if (tier.prize === null) {
      return {
        tierId: tier.id, tierLabel: tier.label, base: 0, multiplier: input.multiplier,
        afterMult: 0, applied: [], amount: null, tax: 0, netAmount: null,
        needTax: false, needRealname: false, floating: true,
      }
    }
    const base = tier.prize
    const afterMult = round2(base * input.multiplier)
    const ctx: CalcContext = {
      gameId: input.gameId, playId: input.playId, tierId: tier.id, betAmount, tierAmount: afterMult,
    }
    const { amount, applied } = applyActiveRules(afterMult, ctx, rules, nowMs)
    const tax = round2(computeTax(amount))
    return {
      tierId: tier.id, tierLabel: tier.label, base, multiplier: input.multiplier,
      afterMult, applied, amount, tax, netAmount: round2(amount - tax),
      needTax: needTax(amount), needRealname: needRealname(amount), floating: false,
    }
  })
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/engine/calc.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(engine): computeTiers 组合奖金/规则/税务 + 测试"
```

---

## Task 7: 金额格式化工具

**Files:**
- Create: `src/util/format.ts`, `src/util/format.test.ts`

- [ ] **Step 1: 写失败测试 `src/util/format.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { formatYuan } from './format'

describe('formatYuan', () => {
  it('整数千分位', () => expect(formatYuan(42500)).toBe('¥42,500'))
  it('小数保留', () => expect(formatYuan(4.5)).toBe('¥4.5'))
  it('去掉多余0', () => expect(formatYuan(8320)).toBe('¥8,320'))
  it('零', () => expect(formatYuan(0)).toBe('¥0'))
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/util/format.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/util/format.ts`**

```ts
export function formatYuan(n: number): string {
  const fixed = Number.isInteger(n)
    ? n.toString()
    : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  const [int, dec] = fixed.split('.')
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return '¥' + (dec ? `${withSep}.${dec}` : withSep)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/util/format.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(util): 人民币金额格式化 + 测试"
```

---

## Task 8: 规则存储(localStorage)

**Files:**
- Create: `src/store/rulesStore.ts`, `src/store/rulesStore.test.ts`

- [ ] **Step 1: 写失败测试 `src/store/rulesStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { loadRules, saveRules, validateRuleDraft, genId } from './rulesStore'
import type { Rule } from '../data/types'

beforeEach(() => localStorage.clear())

const sample: Rule = { id: 'r1', name: '满18翻倍', enabled: true, games: 'all', condition: { kind: 'betAmountGte', value: 18 }, effect: { kind: 'multiply', factor: 2 } }

describe('load/save', () => {
  it('空时返回空数组', () => expect(loadRules()).toEqual([]))
  it('保存后读取一致', () => {
    saveRules([sample])
    expect(loadRules()).toEqual([sample])
  })
  it('损坏数据返回空数组', () => {
    localStorage.setItem('lottery.rules.v1', '{not json')
    expect(loadRules()).toEqual([])
  })
})

describe('genId', () => {
  it('生成不同 id', () => expect(genId()).not.toBe(genId()))
})

describe('validateRuleDraft', () => {
  it('合法无错误', () => expect(validateRuleDraft(sample)).toEqual([]))
  it('名称为空报错', () => expect(validateRuleDraft({ ...sample, name: ' ' })).toContain('请填写规则名称'))
  it('翻倍 factor<=0 报错', () =>
    expect(validateRuleDraft({ ...sample, effect: { kind: 'multiply', factor: 0 } })).toContain('倍数必须大于0'))
  it('加百分比为负报错', () =>
    expect(validateRuleDraft({ ...sample, effect: { kind: 'addPercent', percent: -5 } })).toContain('百分比不能为负'))
  it('betAmountGte 为负报错', () =>
    expect(validateRuleDraft({ ...sample, condition: { kind: 'betAmountGte', value: -1 } })).toContain('金额阈值不能为负'))
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/store/rulesStore.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/store/rulesStore.ts`**

```ts
import type { Rule } from '../data/types'

const RULES_KEY = 'lottery.rules.v1'

export function genId(): string {
  return crypto.randomUUID()
}

export function loadRules(): Rule[] {
  try {
    const raw = localStorage.getItem(RULES_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as Rule[]) : []
  } catch {
    return []
  }
}

export function saveRules(rules: Rule[]): void {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules))
  } catch {
    /* localStorage 不可用时降级为不持久化 */
  }
}

export function validateRuleDraft(rule: Rule): string[] {
  const errors: string[] = []
  if (!rule.name.trim()) errors.push('请填写规则名称')

  const e = rule.effect
  if (e.kind === 'multiply' && e.factor <= 0) errors.push('倍数必须大于0')
  if (e.kind === 'addPercent' && e.percent < 0) errors.push('百分比不能为负')
  if (e.kind === 'addFixed' && e.value < 0) errors.push('加奖金额不能为负')
  if (e.kind === 'cap' && e.value < 0) errors.push('封顶金额不能为负')

  const c = rule.condition
  if (c.kind === 'betAmountGte' && c.value < 0) errors.push('金额阈值不能为负')

  return errors
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/store/rulesStore.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(store): 规则 localStorage 读写 + 校验 + 测试"
```

---

## Task 9: 公告存储(localStorage)

**Files:**
- Create: `src/store/announcementsStore.ts`, `src/store/announcementsStore.test.ts`

- [ ] **Step 1: 写失败测试 `src/store/announcementsStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { loadAnnouncements, saveAnnouncements, pendingCount } from './announcementsStore'
import type { Announcement } from '../data/types'

beforeEach(() => localStorage.clear())

const a = (id: string, status: Announcement['status']): Announcement => ({
  id, title: 't' + id, content: 'c', addedAt: '2026-10-01', status,
})

describe('load/save', () => {
  it('空时返回空数组', () => expect(loadAnnouncements()).toEqual([]))
  it('保存后读取一致', () => {
    const list = [a('1', 'pending')]
    saveAnnouncements(list)
    expect(loadAnnouncements()).toEqual(list)
  })
  it('损坏数据返回空数组', () => {
    localStorage.setItem('lottery.announcements.v1', 'xxx')
    expect(loadAnnouncements()).toEqual([])
  })
})

describe('pendingCount', () => {
  it('只数 pending', () => {
    expect(pendingCount([a('1', 'pending'), a('2', 'applied'), a('3', 'pending'), a('4', 'ignored')])).toBe(2)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/store/announcementsStore.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/store/announcementsStore.ts`**

```ts
import type { Announcement } from '../data/types'

const ANN_KEY = 'lottery.announcements.v1'

export function loadAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(ANN_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as Announcement[]) : []
  } catch {
    return []
  }
}

export function saveAnnouncements(list: Announcement[]): void {
  try {
    localStorage.setItem(ANN_KEY, JSON.stringify(list))
  } catch {
    /* 降级:不持久化 */
  }
}

export function pendingCount(list: Announcement[]): number {
  return list.filter(x => x.status === 'pending').length
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/store/announcementsStore.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(store): 公告 localStorage 读写 + pending 计数 + 测试"
```

---

## Task 10: 输入组件(彩种/玩法/倍数)

**Files:**
- Create: `src/ui/GameSelector.tsx`, `src/ui/PlaySelector.tsx`, `src/ui/MultiplierStepper.tsx`, `src/ui/MultiplierStepper.test.tsx`

- [ ] **Step 1: 写失败测试 `src/ui/MultiplierStepper.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiplierStepper } from './MultiplierStepper'

describe('MultiplierStepper', () => {
  it('点击 + 调用 onChange 增加', async () => {
    const onChange = vi.fn()
    render(<MultiplierStepper value={5} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '增加倍数' }))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('下限 1 不再减', async () => {
    const onChange = vi.fn()
    render(<MultiplierStepper value={1} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '减少倍数' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('上限 99 不再加', async () => {
    const onChange = vi.fn()
    render(<MultiplierStepper value={99} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '增加倍数' }))
    expect(onChange).toHaveBeenCalledWith(99)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/ui/MultiplierStepper.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现三个组件**

`src/ui/MultiplierStepper.tsx`:
```tsx
interface Props { value: number; onChange: (n: number) => void }

const clamp = (n: number) => Math.max(1, Math.min(99, Math.round(n) || 1))

export function MultiplierStepper({ value, onChange }: Props) {
  const btn = 'w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 text-2xl font-extrabold active:scale-95'
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">倍数</span>
      <div className="flex items-center gap-4">
        <button className={btn} aria-label="减少倍数" onClick={() => onChange(clamp(value - 1))}>−</button>
        <input
          className="w-16 text-center text-3xl font-extrabold outline-none"
          inputMode="numeric"
          value={value}
          aria-label="倍数输入"
          onChange={e => onChange(clamp(Number(e.target.value)))}
        />
        <button className={btn} aria-label="增加倍数" onClick={() => onChange(clamp(value + 1))}>+</button>
      </div>
    </div>
  )
}
```
`src/ui/GameSelector.tsx`:
```tsx
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
```
`src/ui/PlaySelector.tsx`:
```tsx
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/ui/MultiplierStepper.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(ui): 彩种/玩法/倍数 输入组件 + 倍数夹紧测试"
```

---

## Task 11: 结果展示(含规则增量明细)

**Files:**
- Create: `src/ui/ResultCard.tsx`, `src/ui/ResultList.tsx`, `src/ui/ResultCard.test.tsx`

- [ ] **Step 1: 写失败测试 `src/ui/ResultCard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultCard } from './ResultCard'
import type { TierResult } from '../data/types'

const withRule: TierResult = {
  tierId: 'hit', tierLabel: '直选命中', base: 1040, multiplier: 10, afterMult: 10400,
  applied: [{ ruleId: 'r1', ruleName: '满18翻倍', delta: 10400 }],
  amount: 20800, tax: 4160, netAmount: 16640, needTax: true, needRealname: true, floating: false,
}

const floating: TierResult = {
  tierId: 'hit10', tierLabel: '中10个', base: 0, multiplier: 1, afterMult: 0,
  applied: [], amount: null, tax: 0, netAmount: null, needTax: false, needRealname: false, floating: true,
}

describe('ResultCard', () => {
  it('显示金额与缴税/实名文字', () => {
    render(<ResultCard result={withRule} />)
    // 金额同时出现在主显示与明细"= 最终"中,故用 getAllByText
    expect(screen.getAllByText('¥20,800').length).toBeGreaterThan(0)
    expect(screen.getByText('缴税')).toBeInTheDocument()
    expect(screen.getByText('实名')).toBeInTheDocument()
  })

  it('展示规则增量明细(规则名 + 增量)', () => {
    render(<ResultCard result={withRule} />)
    expect(screen.getByText(/满18翻倍/)).toBeInTheDocument()
    expect(screen.getByText(/\+¥10,400/)).toBeInTheDocument()
  })

  it('免税档显示 免税/免实名', () => {
    render(<ResultCard result={{ ...withRule, amount: 1500, applied: [], tax: 0, netAmount: 1500, needTax: false, needRealname: false }} />)
    expect(screen.getByText('免税')).toBeInTheDocument()
    expect(screen.getByText('免实名')).toBeInTheDocument()
  })

  it('浮动奖显示提示,不显示金额', () => {
    render(<ResultCard result={floating} />)
    expect(screen.getByText(/浮动/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/ui/ResultCard.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/ui/ResultCard.tsx` 与 `src/ui/ResultList.tsx`**

`src/ui/ResultCard.tsx`:
```tsx
import type { TierResult } from '../data/types'
import { formatYuan } from '../util/format'

function Tag({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span className={`text-sm font-bold rounded-md px-2.5 py-0.5 ${on ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'}`}>
      {on ? onText : offText}
    </span>
  )
}

export function ResultCard({ result: r }: { result: TierResult }) {
  if (r.floating) {
    return (
      <div className="border border-gray-200 rounded-2xl px-5 py-4 mb-2.5">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">{r.tierLabel}</div>
          <div className="text-base text-gray-400">浮动奖 · 开奖后定</div>
        </div>
      </div>
    )
  }
  const delta = (n: number) => (n >= 0 ? `+${formatYuan(n)}` : `−${formatYuan(-n)}`)
  return (
    <div className="border border-gray-200 rounded-2xl px-5 py-4 mb-2.5">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xl font-bold">{r.tierLabel}</div>
          <div className="text-sm text-gray-400 mt-0.5">{formatYuan(r.base)} × {r.multiplier}倍</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold">{formatYuan(r.amount!)}</div>
          <div className="flex gap-1.5 justify-end mt-1.5">
            <Tag on={r.needTax} onText="缴税" offText="免税" />
            <Tag on={r.needRealname} onText="实名" offText="免实名" />
          </div>
        </div>
      </div>
      {r.applied.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-dashed border-gray-200 text-sm text-gray-600 leading-relaxed">
          基础 {formatYuan(r.base)} ×{r.multiplier} = {formatYuan(r.afterMult)}
          {r.applied.map(a => (
            <div key={a.ruleId}>
              ↳ 触发「{a.ruleName}」 <span className="text-indigo-500 font-semibold">{delta(a.delta)}</span>
            </div>
          ))}
          <div>= 最终 <span className="text-indigo-500 font-semibold">{formatYuan(r.amount!)}</span></div>
          {r.needTax && <div className="text-gray-400">税后到手 {formatYuan(r.netAmount!)}(税 {formatYuan(r.tax)})</div>}
        </div>
      )}
    </div>
  )
}
```
`src/ui/ResultList.tsx`:
```tsx
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/ui/ResultCard.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(ui): 结果卡片/列表 + 规则增量明细展示 + 测试"
```

---

## Task 12: 顶部"未应用公告"提示条

**Files:**
- Create: `src/ui/PendingBanner.tsx`, `src/ui/PendingBanner.test.tsx`

- [ ] **Step 1: 写失败测试 `src/ui/PendingBanner.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PendingBanner } from './PendingBanner'

describe('PendingBanner', () => {
  it('count 为 0 时不渲染', () => {
    const { container } = render(<PendingBanner count={0} onClick={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('count>0 显示数量并可点击', async () => {
    const onClick = vi.fn()
    render(<PendingBanner count={2} onClick={onClick} />)
    expect(screen.getByText(/有 2 条公告未应用为规则/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/ui/PendingBanner.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/ui/PendingBanner.tsx`**

```tsx
interface Props { count: number; onClick: () => void }

export function PendingBanner({ count, onClick }: Props) {
  if (count <= 0) return null
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl px-3.5 py-3 mb-4 text-sm font-semibold text-left"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
      有 {count} 条公告未应用为规则 ›
    </button>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/ui/PendingBanner.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(ui): 顶部未应用公告提示条 + 测试"
```

---

## Task 13: 规则编辑页

**Files:**
- Create: `src/ui/rules/RuleForm.tsx`, `src/ui/rules/RulesPage.tsx`, `src/ui/rules/RuleForm.test.tsx`

- [ ] **Step 1: 写失败测试 `src/ui/rules/RuleForm.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RuleForm } from './RuleForm'

describe('RuleForm', () => {
  it('名称为空时保存被阻止并显示错误', async () => {
    const onSave = vi.fn()
    render(<RuleForm onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: '保存规则' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('请填写规则名称')).toBeInTheDocument()
  })

  it('填写名称后保存,回传带 id 的规则', async () => {
    const onSave = vi.fn()
    render(<RuleForm onSave={onSave} onCancel={() => {}} />)
    await userEvent.type(screen.getByLabelText('规则名称'), '满18翻倍')
    await userEvent.click(screen.getByRole('button', { name: '保存规则' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0]
    expect(saved.name).toBe('满18翻倍')
    expect(saved.id).toBeTruthy()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/ui/rules/RuleForm.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/ui/rules/RuleForm.tsx` 与 `src/ui/rules/RulesPage.tsx`**

`src/ui/rules/RuleForm.tsx`:
```tsx
import { useState } from 'react'
import type { Rule, RuleEffect } from '../../data/types'
import { genId, validateRuleDraft } from '../../store/rulesStore'

interface Props { initial?: Rule; onSave: (rule: Rule) => void; onCancel: () => void }

type EffectKind = RuleEffect['kind']

export function RuleForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [betGte, setBetGte] = useState(
    initial?.condition.kind === 'betAmountGte' ? String(initial.condition.value) : '18',
  )
  const [effectKind, setEffectKind] = useState<EffectKind>(initial?.effect.kind ?? 'multiply')
  const [effectValue, setEffectValue] = useState(() => {
    const e = initial?.effect
    if (!e) return '2'
    if (e.kind === 'multiply') return String(e.factor)
    if (e.kind === 'addPercent') return String(e.percent)
    return String(e.value)
  })
  const [errors, setErrors] = useState<string[]>([])

  function buildEffect(): RuleEffect {
    const v = Number(effectValue) || 0
    switch (effectKind) {
      case 'multiply': return { kind: 'multiply', factor: v }
      case 'addPercent': return { kind: 'addPercent', percent: v }
      case 'addFixed': return { kind: 'addFixed', value: v }
      case 'cap': return { kind: 'cap', value: v }
    }
  }

  function handleSave() {
    const betValue = Number(betGte) || 0
    const rule: Rule = {
      id: initial?.id ?? genId(),
      name,
      enabled: initial?.enabled ?? true,
      games: 'all',
      condition: betValue > 0 ? { kind: 'betAmountGte', value: betValue } : { kind: 'always' },
      effect: buildEffect(),
    }
    const errs = validateRuleDraft(rule)
    if (errs.length) { setErrors(errs); return }
    onSave(rule)
  }

  const effectLabel: Record<EffectKind, string> = { multiply: '翻倍', addPercent: '加百分比', addFixed: '加固定额', cap: '封顶' }
  const field = 'border border-gray-200 rounded-lg px-3 py-2.5 text-base w-full'

  return (
    <div className="space-y-4">
      <div className="text-lg font-bold">{initial ? '编辑规则' : '新增规则'}</div>

      <label className="block">
        <div className="text-sm text-gray-400 mb-1.5">规则名称</div>
        <input aria-label="规则名称" className={field} value={name} onChange={e => setName(e.target.value)} />
      </label>

      <label className="block">
        <div className="text-sm text-gray-400 mb-1.5">触发条件:单票投注金额 ≥(元,0=不限)</div>
        <input aria-label="投注金额阈值" inputMode="numeric" className={field} value={betGte} onChange={e => setBetGte(e.target.value)} />
      </label>

      <div>
        <div className="text-sm text-gray-400 mb-1.5">加奖效果</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {(Object.keys(effectLabel) as EffectKind[]).map(k => (
            <button key={k} onClick={() => setEffectKind(k)}
              className={`rounded-full px-4 py-2 text-base ${k === effectKind ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {effectLabel[k]}
            </button>
          ))}
        </div>
        <input aria-label="效果数值" inputMode="numeric" className={field} value={effectValue} onChange={e => setEffectValue(e.target.value)} />
      </div>

      {errors.length > 0 && (
        <ul className="text-red-500 text-sm list-disc pl-5">
          {errors.map(e => <li key={e}>{e}</li>)}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="flex-1 bg-indigo-500 text-white font-bold rounded-xl py-3">保存规则</button>
        <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 font-bold rounded-xl py-3">取消</button>
      </div>
    </div>
  )
}
```
`src/ui/rules/RulesPage.tsx`:
```tsx
import { useState } from 'react'
import type { Rule } from '../../data/types'
import { RuleForm } from './RuleForm'

interface Props { rules: Rule[]; onChange: (rules: Rule[]) => void }

export function RulesPage({ rules, onChange }: Props) {
  const [editing, setEditing] = useState<Rule | null>(null)
  const [creating, setCreating] = useState(false)

  function upsert(rule: Rule) {
    const exists = rules.some(r => r.id === rule.id)
    onChange(exists ? rules.map(r => (r.id === rule.id ? rule : r)) : [...rules, rule])
    setEditing(null); setCreating(false)
  }
  function remove(id: string) { onChange(rules.filter(r => r.id !== id)) }
  function toggle(id: string) { onChange(rules.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))) }

  if (creating || editing) {
    return (
      <div className="p-1">
        <RuleForm initial={editing ?? undefined} onSave={upsert} onCancel={() => { setEditing(null); setCreating(false) }} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold">活动规则</span>
        <button onClick={() => setCreating(true)} className="bg-indigo-500 text-white rounded-xl px-4 py-2 text-sm font-bold">＋ 新增</button>
      </div>
      {rules.length === 0 && <div className="text-gray-400 text-center py-10">暂无规则</div>}
      {rules.map(r => (
        <div key={r.id} className="border border-gray-200 rounded-2xl px-4 py-3 mb-2.5">
          <div className="flex justify-between items-center">
            <div className="text-base font-bold">{r.name}</div>
            <button onClick={() => toggle(r.id)}
              className={`text-xs font-bold rounded-md px-2.5 py-1 ${r.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {r.enabled ? '已启用' : '已停用'}
            </button>
          </div>
          <div className="flex gap-3 mt-2 text-sm">
            <button onClick={() => setEditing(r)} className="text-indigo-500">编辑</button>
            <button onClick={() => remove(r.id)} className="text-red-500">删除</button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/ui/rules/RuleForm.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(ui): 规则编辑表单与列表页 + 校验测试"
```

---

## Task 14: 公告收件箱页

**Files:**
- Create: `src/ui/inbox/AnnouncementForm.tsx`, `src/ui/inbox/InboxPage.tsx`, `src/ui/inbox/InboxPage.test.tsx`

- [ ] **Step 1: 写失败测试 `src/ui/inbox/InboxPage.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InboxPage } from './InboxPage'

describe('InboxPage', () => {
  it('粘贴并保存后回传新公告(status=pending)', async () => {
    const onChange = vi.fn()
    render(<InboxPage announcements={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '＋ 粘贴' }))
    await userEvent.type(screen.getByLabelText('公告标题'), '国庆加奖')
    await userEvent.type(screen.getByLabelText('公告内容'), '满18元翻倍')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const list = onChange.mock.calls[0][0]
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('国庆加奖')
    expect(list[0].status).toBe('pending')
  })

  it('标题为空不保存', async () => {
    const onChange = vi.fn()
    render(<InboxPage announcements={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '＋ 粘贴' }))
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('请填写标题和内容')).toBeInTheDocument()
  })

  it('点"标为已应用"把 pending 改成 applied', async () => {
    const onChange = vi.fn()
    render(<InboxPage announcements={[{ id: '1', title: 't', content: 'c', addedAt: '2026-10-01', status: 'pending' }]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '标为已应用' }))
    expect(onChange.mock.calls[0][0][0].status).toBe('applied')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/ui/inbox/InboxPage.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/ui/inbox/AnnouncementForm.tsx` 与 `src/ui/inbox/InboxPage.tsx`**

`src/ui/inbox/AnnouncementForm.tsx`:
```tsx
import { useState } from 'react'
import type { Announcement } from '../../data/types'
import { genId } from '../../store/rulesStore'

interface Props { onSave: (a: Announcement) => void; onCancel: () => void }

export function AnnouncementForm({ onSave, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const field = 'border border-gray-200 rounded-lg px-3 py-2.5 text-base w-full'

  function handleSave() {
    if (!title.trim() || !content.trim()) { setError('请填写标题和内容'); return }
    onSave({
      id: genId(),
      title: title.trim(),
      content: content.trim(),
      addedAt: new Date().toISOString(),
      status: 'pending',
    })
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <div className="text-sm text-gray-400 mb-1.5">公告标题</div>
        <input aria-label="公告标题" className={field} value={title} onChange={e => setTitle(e.target.value)} />
      </label>
      <label className="block">
        <div className="text-sm text-gray-400 mb-1.5">公告内容(粘贴原文)</div>
        <textarea aria-label="公告内容" className={`${field} min-h-24`} value={content} onChange={e => setContent(e.target.value)} />
      </label>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 bg-indigo-500 text-white font-bold rounded-xl py-3">保存</button>
        <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 font-bold rounded-xl py-3">取消</button>
      </div>
    </div>
  )
}
```
`src/ui/inbox/InboxPage.tsx`:
```tsx
import { useState } from 'react'
import type { Announcement, AnnouncementStatus } from '../../data/types'
import { AnnouncementForm } from './AnnouncementForm'

interface Props { announcements: Announcement[]; onChange: (list: Announcement[]) => void }

const statusStyle: Record<AnnouncementStatus, string> = {
  pending: 'bg-orange-50 text-orange-700',
  applied: 'bg-green-100 text-green-600',
  ignored: 'bg-gray-100 text-gray-400',
}
const statusText: Record<AnnouncementStatus, string> = { pending: '未应用', applied: '已应用', ignored: '已忽略' }

export function InboxPage({ announcements, onChange }: Props) {
  const [adding, setAdding] = useState(false)

  function add(a: Announcement) { onChange([a, ...announcements]); setAdding(false) }
  function setStatus(id: string, status: AnnouncementStatus) {
    onChange(announcements.map(x => (x.id === id ? { ...x, status } : x)))
  }

  if (adding) {
    return <div className="p-1"><AnnouncementForm onSave={add} onCancel={() => setAdding(false)} /></div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold">公告收件箱</span>
        <button onClick={() => setAdding(true)} className="bg-indigo-500 text-white rounded-xl px-4 py-2 text-sm font-bold">＋ 粘贴</button>
      </div>
      {announcements.length === 0 && <div className="text-gray-400 text-center py-10">暂无公告</div>}
      {announcements.map(a => (
        <div key={a.id} className="border border-gray-200 rounded-2xl px-4 py-3 mb-2.5">
          <div className="flex justify-between items-center">
            <div className="text-base font-bold">{a.title}</div>
            <span className={`text-xs font-bold rounded-md px-2.5 py-0.5 ${statusStyle[a.status]}`}>{statusText[a.status]}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1.5 leading-relaxed whitespace-pre-wrap">{a.content}</div>
          {a.status === 'pending' && (
            <div className="flex gap-3 mt-2.5 text-sm">
              <button onClick={() => setStatus(a.id, 'applied')} className="text-green-600">标为已应用</button>
              <button onClick={() => setStatus(a.id, 'ignored')} className="text-gray-400">忽略</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/ui/inbox/InboxPage.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(ui): 公告收件箱(粘贴/状态切换)+ 测试"
```

---

## Task 15: App 组装(顶部提示 + 底部 tab + 实时计算)

**Files:**
- Modify: `src/App.tsx`(替换占位)
- Create: `src/App.test.tsx`

- [ ] **Step 1: 写失败测试 `src/App.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('默认显示速查页与档位结果', () => {
    render(<App />)
    expect(screen.getByText('所有中奖档位')).toBeInTheDocument()
  })

  it('增加倍数后结果实时刷新', async () => {
    render(<App />)
    // 默认快乐8·选一·1倍:中1个 = 4.5(金额也出现在副标题,故用 getAllByText)
    expect(screen.getAllByText('¥4.5').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: '增加倍数' })) // 2倍 → 9
    expect(screen.getByText('¥9')).toBeInTheDocument()
  })

  it('切到公告页粘贴后,速查页顶部出现未应用提示', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /公告/ }))
    await userEvent.click(screen.getByRole('button', { name: '＋ 粘贴' }))
    await userEvent.type(screen.getByLabelText('公告标题'), '加奖')
    await userEvent.type(screen.getByLabelText('公告内容'), '满18翻倍')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    await userEvent.click(screen.getByRole('button', { name: /速查/ }))
    expect(screen.getByText(/有 1 条公告未应用为规则/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/App.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react'
import type { Announcement, GameId, Rule } from './data/types'
import { getGame } from './data/games'
import { computeTiers } from './engine/calc'
import { loadRules, saveRules } from './store/rulesStore'
import { loadAnnouncements, saveAnnouncements, pendingCount } from './store/announcementsStore'
import { GameSelector } from './ui/GameSelector'
import { PlaySelector } from './ui/PlaySelector'
import { MultiplierStepper } from './ui/MultiplierStepper'
import { ResultList } from './ui/ResultList'
import { PendingBanner } from './ui/PendingBanner'
import { RulesPage } from './ui/rules/RulesPage'
import { InboxPage } from './ui/inbox/InboxPage'

type Tab = 'calc' | 'rules' | 'inbox'

export default function App() {
  const [tab, setTab] = useState<Tab>('calc')
  const [gameId, setGameId] = useState<GameId>('kl8')
  const [playId, setPlayId] = useState<string>(getGame('kl8').plays[0].id)
  const [multiplier, setMultiplier] = useState(1)
  const [rules, setRules] = useState<Rule[]>(() => loadRules())
  const [anns, setAnns] = useState<Announcement[]>(() => loadAnnouncements())

  useEffect(() => { saveRules(rules) }, [rules])
  useEffect(() => { saveAnnouncements(anns) }, [anns])

  function changeGame(id: GameId) {
    setGameId(id)
    setPlayId(getGame(id).plays[0].id)
  }

  const results = useMemo(
    () => computeTiers({ gameId, playId, multiplier }, rules),
    [gameId, playId, multiplier, rules],
  )
  const pending = pendingCount(anns)

  const tabBtn = (t: Tab, label: string) =>
    <button onClick={() => setTab(t)} className={`flex-1 py-2 ${tab === t ? 'text-indigo-500 font-bold' : 'text-gray-400'}`}>{label}</button>

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col">
      <div className="flex-1 p-5">
        {tab === 'calc' && (
          <div className="space-y-4">
            <PendingBanner count={pending} onClick={() => setTab('inbox')} />
            <GameSelector value={gameId} onChange={changeGame} />
            <PlaySelector gameId={gameId} value={playId} onChange={setPlayId} />
            <MultiplierStepper value={multiplier} onChange={setMultiplier} />
            <div className="border-t border-dashed border-gray-200 my-2" />
            <ResultList results={results} />
          </div>
        )}
        {tab === 'rules' && <RulesPage rules={rules} onChange={setRules} />}
        {tab === 'inbox' && <InboxPage announcements={anns} onChange={setAnns} />}
      </div>
      <nav className="flex border-t border-gray-200 text-sm sticky bottom-0 bg-white">
        {tabBtn('calc', '速查')}
        {tabBtn('rules', '规则')}
        {tabBtn('inbox', pending > 0 ? `公告 ●` : '公告')}
      </nav>
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "feat(app): 组装主界面/规则/公告 + 顶部提示 + 底部tab + 实时计算"
```

---

## Task 16: 全量验证与构建

**Files:** 无新增

- [ ] **Step 1: 运行全部测试**

Run: `npm run test`
Expected: 所有测试套件 PASS。

- [ ] **Step 2: 生产构建**

Run: `npm run build`
Expected: 无 TS 报错,`dist/` 生成。

- [ ] **Step 3: 手动冒烟(可选但推荐)**

Run: `npm run dev`,浏览器打开提示的本地地址,逐项确认:
- 切换彩种→玩法随之变化;改倍数下方实时刷新;
- 快乐8 选八中八 显示"缴税/实名",选七中七 显示"免税/实名";
- 规则页新增"满18翻倍",回到速查选 3D 直选 10倍,看到增量明细 `+¥10,400`;
- 公告页粘贴一条,速查页顶部出现"有 1 条公告未应用",标为已应用后消失。

- [ ] **Step 4: 提交(若冒烟有微调)**

```
git add -A
git commit -m "chore: 全量测试与生产构建通过"
```

---

## 自检对照(spec → task)

- §2 全档位实时计算 → Task 6/10/11/15
- §3 三档税务/实名(3000/10000/20%)→ Task 3、Task 6 测试
- §4 官方奖金表(含浮动奖 null)→ Task 4、Task 6
- §5 计算管线 + TierResult/AppliedRule + 增量展示 → Task 6、Task 11
- §6 规则模型(条件/效果/启停/校验)→ Task 5、Task 8、Task 13
- §6.1 公告收件箱 + 未应用提示 → Task 9、Task 12、Task 14、Task 15
- §7 技术栈/模块边界/数据流 → Task 1 + 全局结构
- §8 错误边界(倍数夹紧、浮动跳过、表单校验、localStorage 降级)→ Task 8/9/10/11/13/14
- §10 测试策略边界 → Task 3/5/6 测试

> 说明:`feed.json` 抓取扩展点(§6.1)为将来扩展,本计划不实现,符合 spec 的 YAGNI 约定。
