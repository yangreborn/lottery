# 号码输入 + 快乐8 多注可能性分析 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 快乐8 的速查页改为「多注组合票」并自动分析「是否存在需缴税/实名的中奖可能」;数字彩与快乐8 支持手动输入真实号码(3D 自动锁组三/组六、快乐8 自动定选N)。

**Architecture:** 纯函数引擎 + React 组件。新增 `src/engine/derive.ts`(号码→玩法推导)与 `computeKl8Ticket`(复用现有 `computeTiers` 逐注取档),新增 `Kl8TicketBuilder`/`Kl8TicketResultView` 替换 App 中快乐8 的单玩法视图;数字彩 `DigitTicketBuilder` 增加 3 位号码输入以闸控玩法可选性。不做扫码、不做开奖兑奖(见 spec §14)。

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind v4 + Vitest + @testing-library/react。

---

## File Structure

- `src/data/types.ts` (modify) — 新增 `Kl8Entry`、`Kl8EntryResult`、`Kl8TicketResult`。
- `src/engine/derive.ts` (create) — `validateKl8Numbers`、`derivePlayFromKl8`、`derivePlayFromDigits`。
- `src/engine/derive.test.ts` (create) — 推导/校验测试。
- `src/engine/calc.ts` (modify) — 新增 `computeKl8Ticket`。
- `src/engine/calc.test.ts` (modify) — `computeKl8Ticket` 测试。
- `src/ui/kl8/Kl8TicketBuilder.tsx` (create) — 多注编辑器。
- `src/ui/kl8/Kl8TicketResultView.tsx` (create) — 结论卡 + 逐注明细 + 锁定场景。
- `src/ui/kl8/Kl8TicketBuilder.test.tsx` (create) — UI 冒烟。
- `src/ui/digit/DigitTicketBuilder.tsx` (modify) — 3 位号码输入闸控玩法。
- `src/ui/digit/DigitTicketBuilder.test.tsx` (create) — 号码闸控冒烟。
- `src/App.tsx` (modify) — 快乐8 分支改用 `Kl8TicketBuilder`,新增 `kl8Entries` 状态。
- `src/App.test.tsx` (modify) — 更新两条依赖旧快乐8视图的测试。

---

### Task 1: 号码推导与校验 `derive.ts`

**Files:**
- Create: `src/engine/derive.ts`
- Test: `src/engine/derive.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/engine/derive.test.ts
import { describe, it, expect } from 'vitest'
import { validateKl8Numbers, derivePlayFromKl8, derivePlayFromDigits } from './derive'

describe('validateKl8Numbers', () => {
  it('个数 1–10、1–80、不重复 通过', () => {
    expect(validateKl8Numbers([3, 7, 9]).ok).toBe(true)
  })
  it('个数为 0 或 >10 报错', () => {
    expect(validateKl8Numbers([]).ok).toBe(false)
    expect(validateKl8Numbers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).ok).toBe(false)
  })
  it('越界或重复 报错', () => {
    expect(validateKl8Numbers([0, 5]).ok).toBe(false)
    expect(validateKl8Numbers([81]).ok).toBe(false)
    expect(validateKl8Numbers([5, 5]).ok).toBe(false)
  })
})

describe('derivePlayFromKl8', () => {
  it('选 7 个号 → kl8-7', () => {
    expect(derivePlayFromKl8([1, 2, 3, 4, 5, 6, 7])).toBe('kl8-7')
  })
  it('非法输入 → null', () => {
    expect(derivePlayFromKl8([5, 5])).toBeNull()
  })
})

describe('derivePlayFromDigits', () => {
  it('全同(豹子)仅直选', () => {
    expect(derivePlayFromDigits([1, 1, 1])).toEqual({ zhixuan: true, zu3: false, zu6: false })
  })
  it('恰一对 → 直选 + 组三', () => {
    expect(derivePlayFromDigits([1, 1, 2])).toEqual({ zhixuan: true, zu3: true, zu6: false })
  })
  it('全不同 → 直选 + 组六', () => {
    expect(derivePlayFromDigits([1, 2, 3])).toEqual({ zhixuan: true, zu3: false, zu6: true })
  })
  it('非 3 位或越界 → null', () => {
    expect(derivePlayFromDigits([1, 2])).toBeNull()
    expect(derivePlayFromDigits([1, 2, 10])).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/derive.test.ts`
Expected: FAIL（`derive` 模块不存在）

- [ ] **Step 3: Write minimal implementation**

```ts
// src/engine/derive.ts

export function validateKl8Numbers(numbers: number[]): { ok: boolean; error?: string } {
  if (numbers.length < 1 || numbers.length > 10) return { ok: false, error: '请选 1–10 个号码' }
  if (numbers.some(n => !Number.isInteger(n) || n < 1 || n > 80)) return { ok: false, error: '号码需在 1–80' }
  if (new Set(numbers).size !== numbers.length) return { ok: false, error: '号码不可重复' }
  return { ok: true }
}

export function derivePlayFromKl8(numbers: number[]): string | null {
  if (!validateKl8Numbers(numbers).ok) return null
  return `kl8-${numbers.length}`
}

export interface DigitApplicability {
  zhixuan: boolean
  zu3: boolean
  zu6: boolean
}

// 3D/排列3:输 3 位数字,按重复模式判定可投玩法
//   全同(豹子)→ 仅直选;恰一对 → 直选+组三;全不同 → 直选+组六
export function derivePlayFromDigits(digits: number[]): DigitApplicability | null {
  if (digits.length !== 3) return null
  if (digits.some(d => !Number.isInteger(d) || d < 0 || d > 9)) return null
  const counts = new Map<number, number>()
  for (const d of digits) counts.set(d, (counts.get(d) ?? 0) + 1)
  const maxRepeat = Math.max(...counts.values())
  if (maxRepeat === 3) return { zhixuan: true, zu3: false, zu6: false }
  if (maxRepeat === 2) return { zhixuan: true, zu3: true, zu6: false }
  return { zhixuan: true, zu3: false, zu6: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/derive.test.ts`
Expected: PASS（全部通过）

- [ ] **Step 5: Commit**

```bash
git add src/engine/derive.ts src/engine/derive.test.ts
git commit -m "feat(engine): 号码→玩法推导与校验(derive)"
```

---

### Task 2: 快乐8 多注引擎 — 类型

**Files:**
- Modify: `src/data/types.ts`（在文件末尾追加)

- [ ] **Step 1: 追加类型(无单测,随 Task 3 编译验证)**

在 `src/data/types.ts` 末尾追加:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(types): 快乐8 多注票类型(Kl8Entry/Kl8TicketResult)"
```

---

### Task 3: `computeKl8Ticket` 引擎

**Files:**
- Modify: `src/engine/calc.ts`
- Test: `src/engine/calc.test.ts`（追加 describe 块)

- [ ] **Step 1: Write the failing test**

在 `src/engine/calc.test.ts` 末尾追加(保留文件原有 import,若缺则补 `computeKl8Ticket`):

```ts
import { computeKl8Ticket } from './calc'

describe('computeKl8Ticket', () => {
  it('单注选七1倍:最高可中8500 → 存在实名、不存在缴税', () => {
    const r = computeKl8Ticket([{ playId: 'kl8-7', multiplier: 1 }], [])
    expect(r.maxTotal).toBe(8500)
    expect(r.existsRealname).toBe(true)
    expect(r.existsTax).toBe(false)
    expect(r.maxFloating).toBe(false)
  })

  it('两注顶档求和过万 → 存在缴税', () => {
    // 选七中七8500 + 选六中六2880 = 11380 > 10000
    const r = computeKl8Ticket(
      [{ playId: 'kl8-7', multiplier: 1 }, { playId: 'kl8-6', multiplier: 1 }], [])
    expect(r.maxTotal).toBe(11380)
    expect(r.existsTax).toBe(true)
    expect(r.existsRealname).toBe(true)
  })

  it('选十含浮动头奖 → maxFloating,必然缴税+实名', () => {
    const r = computeKl8Ticket([{ playId: 'kl8-10', multiplier: 1 }], [])
    expect(r.maxFloating).toBe(true)
    expect(r.existsTax).toBe(true)
    expect(r.existsRealname).toBe(true)
  })

  it('锁定档位:一注锁中六(2880)、一注锁中七(8500)=11380 精确合计', () => {
    const r = computeKl8Ticket([
      { playId: 'kl8-7', multiplier: 1, lockedTierId: 'hit7' },
      { playId: 'kl8-6', multiplier: 1, lockedTierId: 'hit6' },
    ], [])
    expect(r.hasLocked).toBe(true)
    expect(r.lockedTotal).toBe(11380)
    expect(r.lockedNeedTax).toBe(true)
    expect(r.lockedTax).toBe(2276)   // 11380 × 20%
  })

  it('倍数>0 才计入', () => {
    const r = computeKl8Ticket(
      [{ playId: 'kl8-7', multiplier: 0 }, { playId: 'kl8-1', multiplier: 1 }], [])
    expect(r.entries).toHaveLength(1)
    expect(r.maxTotal).toBe(4.5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/calc.test.ts`
Expected: FAIL（`computeKl8Ticket` 未导出)

- [ ] **Step 3: Write minimal implementation**

在 `src/engine/calc.ts` 顶部 import 增补类型:

```ts
import type {
  CalcContext, CalcInput, DigitBet, GameId, Kl8Entry, Kl8EntryResult, Kl8TicketResult,
  PlayContribution, Rule, TicketResult, TierResult,
} from '../data/types'
```

在文件末尾追加:

```ts
// 快乐8:多注组合票 + 可能性分析(§14)。复用 computeTiers 逐注取各档。
export function computeKl8Ticket(
  entries: Kl8Entry[], rules: Rule[], nowMs: number = Date.now(),
): Kl8TicketResult {
  const active = entries.filter(e => e.multiplier > 0)
  const entryResults: Kl8EntryResult[] = active.map((e): Kl8EntryResult => {
    const play = getPlay('kl8', e.playId)
    const lines = computeTiers({ gameId: 'kl8', playId: e.playId, multiplier: e.multiplier }, rules, nowMs)
    const top = lines[0]   // 数据中各玩法档位按顶档在前排列
    const lockedLine = e.lockedTierId ? lines.find(l => l.tierId === e.lockedTierId) : undefined
    return {
      playId: e.playId, label: play.label, multiplier: e.multiplier, lines,
      topAmount: top ? top.amount : null, topFloating: top ? top.floating : false,
      lockedTierId: e.lockedTierId, lockedLine,
    }
  })

  const maxFloating = entryResults.some(r => r.topFloating)
  const maxTotal = round2(entryResults.reduce((s, r) => s + (r.topAmount ?? 0), 0))
  const existsTax = maxFloating || needTax(maxTotal)
  const existsRealname = maxFloating || needRealname(maxTotal)

  const lockedEntries = entryResults.filter(r => r.lockedLine)
  const hasLocked = lockedEntries.length > 0
  const lockedFloating = lockedEntries.some(r => r.lockedLine!.floating)
  const lockedTotal = round2(lockedEntries.reduce((s, r) => s + (r.lockedLine!.amount ?? 0), 0))
  const lockedTax = round2(computeTax(lockedTotal))
  return {
    entries: entryResults, maxTotal, maxFloating, existsTax, existsRealname,
    hasLocked, lockedTotal, lockedFloating,
    lockedTax, lockedNetAmount: round2(lockedTotal - lockedTax),
    lockedNeedTax: lockedFloating || needTax(lockedTotal),
    lockedNeedRealname: lockedFloating || needRealname(lockedTotal),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/calc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/calc.ts src/engine/calc.test.ts
git commit -m "feat(engine): 快乐8 多注可能性分析 computeKl8Ticket"
```

---

### Task 4: 快乐8 结果视图 `Kl8TicketResultView`

**Files:**
- Create: `src/ui/kl8/Kl8TicketResultView.tsx`

- [ ] **Step 1: Write the component(随 Task 6 的 builder 测试一起验证)**

```tsx
// src/ui/kl8/Kl8TicketResultView.tsx
import type { Kl8TicketResult } from '../../data/types'
import { formatYuan } from '../../util/format'

function Tag({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span className={`text-xs font-bold rounded-md px-2 py-0.5 ${on ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'}`}>
      {on ? onText : offText}
    </span>
  )
}

export function Kl8TicketResultView({ result: r }: { result: Kl8TicketResult }) {
  if (r.entries.length === 0) {
    return <div className="text-gray-400 text-center py-8">请至少添加一注并设置倍数</div>
  }

  return (
    <div>
      {/* 顶部结论 */}
      <div className={`rounded-2xl px-5 py-4 mb-3 border-2 ${r.existsTax ? 'border-red-300 bg-red-50' : r.existsRealname ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
        <div className="text-sm text-gray-500">本票最高可中</div>
        <div className="text-3xl font-extrabold mt-0.5">
          {r.maxFloating ? '浮动头奖' : formatYuan(r.maxTotal)}
        </div>
        <div className="mt-2 text-base font-bold leading-relaxed">
          {r.maxFloating ? (
            <span className="text-red-600">含浮动头奖,合计无法精确,但必然需缴税 + 实名 ⚠️</span>
          ) : r.existsTax ? (
            <span className="text-red-600">存在需要缴税的中奖情况 ⚠️</span>
          ) : r.existsRealname ? (
            <span className="text-amber-700">存在需要实名的中奖情况(但不缴税)</span>
          ) : (
            <span className="text-green-700">✅ 任何中奖都无需缴税 / 实名,放心兑</span>
          )}
        </div>
      </div>

      {/* 逐注明细 */}
      <div className="text-sm text-gray-400 mb-2">逐注各档可能金额</div>
      {r.entries.map((e, i) => (
        <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3 mb-2.5">
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-base font-bold">{e.label} · {e.multiplier}倍</div>
          </div>
          <div className="space-y-1">
            {e.lines.map(l => (
              <div key={l.tierId} className={`flex justify-between items-center text-sm ${e.lockedTierId === l.tierId ? 'font-bold text-indigo-600' : 'text-gray-600'}`}>
                <span>{l.tierLabel}{e.lockedTierId === l.tierId ? '(已锁定)' : ''}</span>
                <span className="flex items-center gap-1.5">
                  <span>{l.floating ? '浮动' : formatYuan(l.amount)}</span>
                  {!l.floating && <Tag on={l.needTax} onText="税" offText="免" />}
                  {!l.floating && <Tag on={l.needRealname} onText="名" offText="免" />}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 锁定场景合计 */}
      {r.hasLocked && (
        <div className="border-2 border-indigo-300 bg-indigo-50 rounded-2xl px-5 py-4 mt-3">
          <div className="flex justify-between items-start">
            <div className="text-lg font-bold text-indigo-700">锁定场景 · 合计</div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-indigo-700">
                {r.lockedFloating ? '浮动' : formatYuan(r.lockedTotal)}
              </div>
              {r.lockedNeedTax && !r.lockedFloating && (
                <div className="text-xs text-gray-500 mt-0.5">税后 {formatYuan(r.lockedNetAmount)}</div>
              )}
            </div>
          </div>
          <div className="flex gap-1.5 justify-end mt-1.5">
            <Tag on={r.lockedNeedTax} onText="缴税" offText="免税" />
            <Tag on={r.lockedNeedRealname} onText="实名" offText="免实名" />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/kl8/Kl8TicketResultView.tsx
git commit -m "feat(ui): 快乐8 结论卡+逐注明细+锁定场景视图"
```

---

### Task 5: 快乐8 多注编辑器 `Kl8TicketBuilder`

**Files:**
- Create: `src/ui/kl8/Kl8TicketBuilder.tsx`
- Test: `src/ui/kl8/Kl8TicketBuilder.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/kl8/Kl8TicketBuilder.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Kl8TicketBuilder } from './Kl8TicketBuilder'
import { computeKl8Ticket } from '../../engine/calc'
import type { Kl8Entry } from '../../data/types'

function setup(entries: Kl8Entry[]) {
  const onChange = vi.fn()
  const result = computeKl8Ticket(entries, [])
  render(<Kl8TicketBuilder entries={entries} onChange={onChange} result={result} />)
  return { onChange }
}

describe('Kl8TicketBuilder', () => {
  it('选七1倍:显示最高可中与存在实名结论', () => {
    setup([{ playId: 'kl8-7', multiplier: 1 }])
    expect(screen.getByText('本票最高可中')).toBeInTheDocument()
    expect(screen.getByText('¥8,500')).toBeInTheDocument()
    expect(screen.getByText(/存在需要实名的中奖情况/)).toBeInTheDocument()
  })

  it('点添加一注 回调新增 entry', async () => {
    const { onChange } = setup([{ playId: 'kl8-7', multiplier: 1 }])
    await userEvent.click(screen.getByRole('button', { name: '＋ 添加一注' }))
    expect(onChange).toHaveBeenCalledWith([
      { playId: 'kl8-7', multiplier: 1 },
      { playId: 'kl8-1', multiplier: 1 },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/kl8/Kl8TicketBuilder.test.tsx`
Expected: FAIL（组件不存在)

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/ui/kl8/Kl8TicketBuilder.tsx
import { useState } from 'react'
import type { Kl8Entry, Kl8TicketResult } from '../../data/types'
import { getGame, getPlay } from '../../data/games'
import { MultiplierStepper } from '../MultiplierStepper'
import { validateKl8Numbers, derivePlayFromKl8 } from '../../engine/derive'
import { Kl8TicketResultView } from './Kl8TicketResultView'

interface Props {
  entries: Kl8Entry[]
  onChange: (entries: Kl8Entry[]) => void
  result: Kl8TicketResult
}

const KL8_PLAYS = getGame('kl8').plays

export function Kl8TicketBuilder({ entries, onChange, result }: Props) {
  const [numOpen, setNumOpen] = useState<number | null>(null)
  const [numText, setNumText] = useState('')

  function update(i: number, patch: Partial<Kl8Entry>) {
    onChange(entries.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  }
  function add() {
    onChange([...entries, { playId: 'kl8-1', multiplier: 1 }])
  }
  function remove(i: number) {
    onChange(entries.filter((_, j) => j !== i))
  }
  function applyNumbers(i: number) {
    const nums = numText.split(/[\s,，]+/).filter(Boolean).map(Number)
    const v = validateKl8Numbers(nums)
    if (!v.ok) return
    const playId = derivePlayFromKl8(nums)!
    update(i, { playId, numbers: nums, lockedTierId: undefined })
    setNumOpen(null)
    setNumText('')
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">组合投注(可多注,倍数 0 = 不计)</div>
      <div className="space-y-2.5 mb-2">
        {entries.map((e, i) => {
          const play = getPlay('kl8', e.playId)
          return (
            <div key={i} className="border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex justify-between items-center gap-2">
                <select
                  aria-label={`第${i + 1}注玩法`}
                  className="text-base font-bold bg-transparent border border-gray-200 rounded-lg px-2 py-1"
                  value={e.playId}
                  onChange={ev => update(i, { playId: ev.target.value, lockedTierId: undefined, numbers: undefined })}
                >
                  {KL8_PLAYS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                {entries.length > 1 && (
                  <button onClick={() => remove(i)} className="text-gray-400 text-sm">删除</button>
                )}
              </div>

              <div className="mt-2">
                <MultiplierStepper value={e.multiplier} min={0} onChange={m => update(i, { multiplier: m })} />
              </div>

              <div className="mt-2 flex items-center gap-3 text-sm">
                <label className="text-gray-500">
                  锁定中几个:
                  <select
                    aria-label={`第${i + 1}注锁定档位`}
                    className="ml-1 bg-transparent border border-gray-200 rounded-lg px-1.5 py-0.5"
                    value={e.lockedTierId ?? ''}
                    onChange={ev => update(i, { lockedTierId: ev.target.value || undefined })}
                  >
                    <option value="">不锁(看可能)</option>
                    {play.tiers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </label>
                <button className="text-indigo-500" onClick={() => { setNumOpen(numOpen === i ? null : i); setNumText('') }}>
                  ✎ 输入号码
                </button>
              </div>

              {e.numbers && (
                <div className="mt-1 text-xs text-gray-400">已输号码:{e.numbers.join(' ')}(自动识别为{play.label})</div>
              )}

              {numOpen === i && (
                <div className="mt-2 flex gap-2">
                  <input
                    aria-label={`第${i + 1}注号码输入`}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                    placeholder="如 3 7 9 12(空格/逗号分隔,1–80)"
                    value={numText}
                    onChange={ev => setNumText(ev.target.value)}
                  />
                  <button className="text-indigo-500 font-semibold text-sm" onClick={() => applyNumbers(i)}>确定</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={add} className="w-full border border-dashed border-gray-300 rounded-2xl py-2 text-gray-500 text-sm">
        ＋ 添加一注
      </button>

      <div className="border-t border-dashed border-gray-200 my-3" />
      <Kl8TicketResultView result={result} />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/kl8/Kl8TicketBuilder.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/kl8/Kl8TicketBuilder.tsx src/ui/kl8/Kl8TicketBuilder.test.tsx
git commit -m "feat(ui): 快乐8 多注编辑器 Kl8TicketBuilder(含号码输入)"
```

---

### Task 6: 数字彩号码输入闸控玩法

**Files:**
- Modify: `src/ui/digit/DigitTicketBuilder.tsx`
- Test: `src/ui/digit/DigitTicketBuilder.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/digit/DigitTicketBuilder.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DigitTicketBuilder } from './DigitTicketBuilder'
import { computeDigitTicket } from '../../engine/calc'
import type { DigitBet } from '../../data/types'

function setup(bets: DigitBet[]) {
  const onChange = vi.fn()
  const result = computeDigitTicket('fc3d', bets, [])
  render(<DigitTicketBuilder gameId="fc3d" bets={bets} onChange={onChange} result={result} />)
  return { onChange }
}

describe('DigitTicketBuilder 号码闸控', () => {
  it('输 112(恰一对)禁用组选六', async () => {
    setup([{ playId: 'zhixuan', multiplier: 1 }])
    await userEvent.type(screen.getByLabelText('三位号码'), '112')
    // 组选六 的倍数步进被禁用
    expect(screen.getByText(/输入号码后,组选六 在此组合不可能中奖/)).toBeInTheDocument()
  })

  it('输 123(全不同)禁用组选三', async () => {
    setup([{ playId: 'zhixuan', multiplier: 1 }])
    await userEvent.type(screen.getByLabelText('三位号码'), '123')
    expect(screen.getByText(/输入号码后,组选三 在此组合不可能中奖/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/digit/DigitTicketBuilder.test.tsx`
Expected: FAIL（无号码输入框)

- [ ] **Step 3: Write minimal implementation**

把 `src/ui/digit/DigitTicketBuilder.tsx` 整体替换为:

```tsx
import { useState } from 'react'
import type { DigitBet, GameId, TicketResult } from '../../data/types'
import { getGame } from '../../data/games'
import { formatYuan } from '../../util/format'
import { MultiplierStepper } from '../MultiplierStepper'
import { TicketResultView } from './TicketResultView'
import { derivePlayFromDigits } from '../../engine/derive'

interface Props {
  gameId: GameId
  bets: DigitBet[]
  onChange: (bets: DigitBet[]) => void
  result: TicketResult
}

// 玩法 id → 可投性字段
const APPLIES_KEY: Record<string, 'zhixuan' | 'zu3' | 'zu6'> = {
  zhixuan: 'zhixuan', zu3: 'zu3', zu6: 'zu6',
}
const PLAY_LABEL: Record<string, string> = { zu3: '组选三', zu6: '组选六' }

export function DigitTicketBuilder({ gameId, bets, onChange, result }: Props) {
  const plays = getGame(gameId).plays
  const [digitText, setDigitText] = useState('')

  const digits = digitText.split('').filter(c => /\d/.test(c)).map(Number)
  const applicability = digits.length === 3 ? derivePlayFromDigits(digits) : null

  const multOf = (playId: string) => bets.find(b => b.playId === playId)?.multiplier ?? 0
  function setMult(playId: string, m: number) {
    const exists = bets.some(b => b.playId === playId)
    onChange(exists
      ? bets.map(b => (b.playId === playId ? { ...b, multiplier: m } : b))
      : [...bets, { playId, multiplier: m }])
  }
  function isDisabled(playId: string): boolean {
    if (!applicability) return false
    return !applicability[APPLIES_KEY[playId]]
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">组合投注(可同时下注,0 = 不买)</div>

      <div className="mb-3">
        <label className="text-sm text-gray-500">
          输入三位号码(可选,自动锁定可投玩法):
          <input
            aria-label="三位号码"
            inputMode="numeric"
            maxLength={3}
            className="ml-2 w-20 border border-gray-200 rounded-lg px-2 py-1 text-base tracking-widest"
            placeholder="如 112"
            value={digitText}
            onChange={e => setDigitText(e.target.value.replace(/\D/g, '').slice(0, 3))}
          />
        </label>
        {applicability && (['zu3', 'zu6'] as const).map(pid =>
          !applicability[pid] ? (
            <div key={pid} className="text-xs text-amber-700 mt-1">
              输入号码后,{PLAY_LABEL[pid]} 在此组合不可能中奖,已禁用。
            </div>
          ) : null,
        )}
      </div>

      <div className="space-y-2.5 mb-2">
        {plays.map(p => {
          const disabled = isDisabled(p.id)
          return (
            <div key={p.id} className={`border rounded-2xl px-4 py-3 ${disabled ? 'border-gray-100 bg-gray-50 opacity-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <div className="text-base font-bold">{p.label}</div>
                <div className="text-xs text-gray-400">单注 {formatYuan(p.tiers[0].prize ?? 0)}</div>
              </div>
              <div className="mt-1">
                <MultiplierStepper
                  value={disabled ? 0 : multOf(p.id)}
                  min={0}
                  onChange={m => { if (!disabled) setMult(p.id, m) }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t border-dashed border-gray-200 my-3" />
      <TicketResultView result={result} />
    </div>
  )
}
```

注:当号码使某玩法不可投时,展示禁用提示并把该玩法步进置 0、忽略其变更;合计仍由父层 `computeDigitTicket` 计算(禁用玩法的倍数保持原值但 UI 不再增长——若需严格清零可由 Task 7 在 App 层同步,本任务以 UI 闸控为准)。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/digit/DigitTicketBuilder.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/digit/DigitTicketBuilder.tsx src/ui/digit/DigitTicketBuilder.test.tsx
git commit -m "feat(ui): 数字彩输 3 位号码自动锁定组三/组六"
```

---

### Task 7: 接入 App,快乐8 改用多注编辑器

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: 更新 App.test.tsx 两条依赖旧视图的用例**

把 `src/App.test.tsx` 中下面两条替换为新断言:

将
```tsx
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
```
替换为
```tsx
  it('默认显示速查页与快乐8多注结论', () => {
    render(<App />)
    expect(screen.getByText('本票最高可中')).toBeInTheDocument()
  })

  it('默认选七1倍:最高可中8500、存在实名', () => {
    render(<App />)
    expect(screen.getByText('¥8,500')).toBeInTheDocument()
    expect(screen.getByText(/存在需要实名的中奖情况/)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL（App 仍是旧快乐8视图,找不到「本票最高可中」)

- [ ] **Step 3: 改 App.tsx**

在 `src/App.tsx` 替换 import 区块:把
```tsx
import type { Announcement, DigitBet, GameId, Rule } from './data/types'
```
改为
```tsx
import type { Announcement, DigitBet, GameId, Kl8Entry, Rule } from './data/types'
```
把
```tsx
import { computeTiers, computeDigitTicket, isDigitGame } from './engine/calc'
```
改为
```tsx
import { computeDigitTicket, computeKl8Ticket, isDigitGame } from './engine/calc'
```
删除这两行 import(快乐8 不再用单玩法视图):
```tsx
import { PlaySelector } from './ui/PlaySelector'
import { ResultList } from './ui/ResultList'
```
删除
```tsx
import { MultiplierStepper } from './ui/MultiplierStepper'
```
新增
```tsx
import { Kl8TicketBuilder } from './ui/kl8/Kl8TicketBuilder'
```

替换状态与计算:把
```tsx
  const [gameId, setGameId] = useState<GameId>('kl8')
  const [playId, setPlayId] = useState<string>(getGame('kl8').plays[0].id)
  const [multiplier, setMultiplier] = useState(1)
  const [digitBets, setDigitBets] = useState<DigitBet[]>(initialDigitBets)
```
改为
```tsx
  const [gameId, setGameId] = useState<GameId>('kl8')
  const [digitBets, setDigitBets] = useState<DigitBet[]>(initialDigitBets)
  const [kl8Entries, setKl8Entries] = useState<Kl8Entry[]>(() => [{ playId: 'kl8-7', multiplier: 1 }])
```
把
```tsx
  function changeGame(id: GameId) {
    setGameId(id)
    setPlayId(getGame(id).plays[0].id)
  }
```
改为
```tsx
  function changeGame(id: GameId) {
    setGameId(id)
  }
```
把
```tsx
  const digit = isDigitGame(gameId)
  const tierResults = useMemo(
    () => computeTiers({ gameId, playId, multiplier }, rules),
    [gameId, playId, multiplier, rules],
  )
  const ticketResult = useMemo(
    () => (digit ? computeDigitTicket(gameId, digitBets, rules) : null),
    [digit, gameId, digitBets, rules],
  )
```
改为
```tsx
  const digit = isDigitGame(gameId)
  const ticketResult = useMemo(
    () => (digit ? computeDigitTicket(gameId, digitBets, rules) : null),
    [digit, gameId, digitBets, rules],
  )
  const kl8Result = useMemo(
    () => computeKl8Ticket(kl8Entries, rules),
    [kl8Entries, rules],
  )
```
把渲染分支
```tsx
            {digit ? (
              <DigitTicketBuilder gameId={gameId} bets={digitBets} onChange={setDigitBets} result={ticketResult!} />
            ) : (
              <>
                <PlaySelector gameId={gameId} value={playId} onChange={setPlayId} />
                <MultiplierStepper value={multiplier} onChange={setMultiplier} />
                <div className="border-t border-dashed border-gray-200 my-2" />
                <ResultList results={tierResults} />
              </>
            )}
```
改为
```tsx
            {digit ? (
              <DigitTicketBuilder gameId={gameId} bets={digitBets} onChange={setDigitBets} result={ticketResult!} />
            ) : (
              <Kl8TicketBuilder entries={kl8Entries} onChange={setKl8Entries} result={kl8Result} />
            )}
```

若 `getGame` 在 App 中已不再被引用,删除其 import 以免 TS 报未使用;`initialDigitBets` 仍用 `getGame('fc3d')`,故 `getGame` 仍需保留——保留 import。

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat(app): 快乐8 速查改用多注可能性分析视图"
```

---

### Task 8: 全量校验

- [ ] **Step 1: 跑全部测试**

Run: `npx vitest run`
Expected: 全绿(原有 + 新增用例)。

- [ ] **Step 2: 类型 + 生产构建**

Run: `npm run build`
Expected: `tsc -b` 无类型错误,`vite build` 产出 `dist/`。
若报「`ResultList`/`PlaySelector`/`computeTiers` 已声明但未使用」之类——确认 Task 7 已删除对应 import。`ResultList.tsx`/`PlaySelector.tsx` 文件本身保留(无害,后续或复用)。

- [ ] **Step 3: 视觉自查(可选)**

Run: `npm run dev -- --host 127.0.0.1 --port 5180`
人工核对:快乐8 默认选七 → 顶部「存在需要实名」;加一注选六改倍数 → 过万变「存在需要缴税」;3D 输 `112` → 组选六禁用。

- [ ] **Step 4: Commit(若自查有微调)**

```bash
git add -A && git commit -m "chore: 号码输入+快乐8多注 收尾校验"
```

---

## Self-Review

- **Spec §14.1(快乐8 多注 + 可能性分析)**:Task 2/3(类型+引擎)、Task 4/5(视图+编辑器)、Task 7(接入)。✔
- **Spec §14.2(号码输入)**:快乐8 Task 5(`applyNumbers`/`derivePlayFromKl8`);数字彩 Task 6(`derivePlayFromDigits` 闸控)。✔
- **Spec §14.2(浮动头奖必然缴税+实名)**:Task 3 `maxFloating` 分支 + Task 4 红色提示。✔
- **Spec §14.1(锁定具体场景求和)**:Task 3 `lockedTotal`/`lockedNeedTax`,Task 5 锁定档位下拉,Task 4 锁定卡。✔
- **裁剪(不扫码/不兑奖)**:计划内无相关任务。✔
- **类型一致性**:`Kl8Entry`/`Kl8EntryResult`/`Kl8TicketResult` 字段(`maxTotal`/`maxFloating`/`existsTax`/`existsRealname`/`hasLocked`/`lockedTotal`/`lockedNeedTax`/`lockedNeedRealname`/`lockedNetAmount`/`lockedTax`/`lockedFloating`)在 Task 2 定义、Task 3 产出、Task 4 消费,命名一致。✔
- **回归**:Task 7 显式更新 `App.test.tsx` 两条依赖旧快乐8视图的用例。✔
```
