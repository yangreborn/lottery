# 彩票中奖金额 / 缴税 / 实名 速查网页 — 设计文档

- 日期:2026-06-08
- 状态:待用户评审
- 形态:纯静态网页 App(可"添加到主屏幕"当 App 用)

## 1. 目标与范围

帮用户在购票前/兑奖前,快速看清**单张票**在各种中奖情况下:
1. 能拿多少奖金(税前 / 税后);
2. 是否需要**缴税**;
3. 是否需要**实名**登记。

### 第一版彩种(仅三个,均为固定奖金玩法)
- 福彩 3D
- 快乐8
- 体彩 排列3

### 包含
- 全档位中奖速查(奖金 / 税后 / 缴税 / 实名)
- 手动活动规则编辑器,且**计算结果展示每条规则加了多少奖金、由哪条规则触发**(见 §5、§6)
- **公告收件箱**:手动粘贴官方活动公告;应用只保存不自动转规则;顶部提示"有 N 条公告未应用为规则"(见 §6.1)

### 明确不做(YAGNI)
- 双色球 / 大乐透 / 七星彩等浮动奖大彩种
- 竞彩(按赔率、串关,结构完全不同)
- **自动爬取官网**(本版改为手动"粘贴公告";保留 `feed.json` 数据契约作为将来接入抓取器的扩展点,见 §6.1)
- 公告文字**自动解析成规则**(只提示、不解析;规则仍手动录入)
- 后端服务、账号、云同步

## 2. 核心用法(交互模型)

**全档位一览表 + 单屏实时计算。** 同一屏:
- 上半部分输入:**彩种 → 玩法 → 倍数**;
- 下半部分实时列出该配置下**所有中奖档位**的:奖金 / 税后 / 缴税·免税 / 实名·免实名;
- 任一输入变化,下方立即刷新,无"计算"按钮。

界面风格:**极简白**,大字号、大间距、手机优先;缴税/实名用**明确中文文字 + 颜色**(红=需要,绿=不需要),不用图标/圆点。

## 3. 税务与实名规则(权威依据)

依据国家税务总局等四部门 2024 年公告,2024-09-01 起执行(见参考链接)。

判定基数 = **单张票合计中奖金额**("一次中奖收入" = 同一人同一期同一游戏全部奖金;单张票即该票全部中奖注之和)。

| 单票中奖总额 `A` | 实名 | 缴税 | 税额 | 税后到手 |
|---|---|---|---|---|
| `A ≤ 3000` | 免实名 | 免税 | 0 | `A` |
| `3000 < A ≤ 10000` | 需实名 | 免税 | 0 | `A` |
| `A > 10000` | 需实名 | 缴税 | `A × 20%` | `A × 0.8` |

常量(集中存放,便于将来调整):
- `REALNAME_THRESHOLD = 3000`(严格大于触发)
- `TAX_THRESHOLD = 10000`(严格大于触发;等于 10000 仍免税)
- `TAX_RATE = 0.20`(超过即全额计税,非超额累进)

> 边界示例:快乐8 选七中七 = 8500 元 → 免税但**需实名**;选八中八 = 50000 元 → **缴税 + 实名**,税后 40000。

## 4. 奖金数据(官方核实,单注 2 元基准)

### 福彩 3D / 体彩 排列3(两者数值相同)
| 玩法 | 单注奖金 |
|---|---|
| 直选(单选) | 1040 |
| 组选三(组三) | 346 |
| 组选六(组六) | 173 |

> 注:3D 单选 10 倍 = 10400 > 10000 → 缴税 + 实名(用户给的例子)。

### 快乐8(选一~选十;"浮动奖"无法离线精确计算)
| 玩法 | 各档位 → 单注奖金 |
|---|---|
| 选一 | 中1=4.5 |
| 选二 | 中2=19 |
| 选三 | 中3=52,中2=3 |
| 选四 | 中4=93,中3=5,中2=3 |
| 选五 | 中5=1000,中4=20,中3=3 |
| 选六 | 中6=2880,中5=30,中4=10,中3=3 |
| 选七 | 中7=8500,中6=300,中5=30,中4=4,中0=2 |
| 选八 | 中8=50000,中7=800,中6=80,中5=10,中4=3,中0=2 |
| 选九 | 中9=**浮动**,中8=2000,中7=225,中6=22,中5=5,中4=3,中0=2 |
| 选十 | 中10=**浮动**,中9=8000,中8=720,中7=80,中6=5,中5=3,中0=2 |

**浮动奖处理**:选九中九、选十中十无固定值。该档显示"浮动奖 · 开奖后定",不参与税/实名判定(显示"—"),并附一行说明。

## 5. 计算引擎(纯函数,可单测)

对所选 `彩种 + 玩法 + 倍数` 输出一组档位结果。单档位计算管线:

```
base      = 该档位单注固定奖金
afterMult = base × 倍数
{ amount, applied } = applyActiveRules(afterMult, ctx)  // 套用启用规则,并记录每条贡献(见 §6)
                                                         // amount = 单票该档位中奖总额(税/实名判定基数)
tax       = amount > 10000 ? amount × 0.20 : 0
netAmount = amount - tax
needTax   = amount > 10000
needRealname = amount > 3000
```

每个档位结果 `TierResult` 携带完整计算明细(`base / afterMult / applied / amount`),供结果页展示"加了多少、哪条规则触发":
```ts
type AppliedRule = { ruleId: string; ruleName: string; delta: number }  // delta = 该规则带来的奖金增量(元)
type TierResult = {
  tierLabel: string          // 如 "中7个" / "组选三"
  base: number               // 单注基础奖金
  multiplier: number
  afterMult: number          // base × 倍数
  applied: AppliedRule[]     // 命中的活动规则及各自增量(空数组=无规则参与)
  amount: number | null      // 最终单票总额(浮动奖为 null)
  tax: number
  netAmount: number | null
  needTax: boolean
  needRealname: boolean
  floating: boolean
}
```

`ctx` 上下文含:彩种、玩法、档位、单票投注金额(= 玩法基础 2 元 × 倍数,用于"满额加奖"类条件判定)。

浮动奖档位:`amount = null`,跳过规则增量/税/实名计算,标记 `floating: true`。

**结果页展示**:每档默认显示最终奖金 + 缴税/实名标签;当 `applied` 非空时,卡片下方追加一行(或可点开)明细,例如:
`基础 1040 ×10 = 10400 → 「满18元加奖·翻倍」+10400 → 20800`,并对每条规则标出 `+金额` 与规则名。

引擎为**纯函数**,不依赖 DOM/存储,输入相同输出相同,便于 TDD。

## 6. 活动规则模型(纯手动)

一条规则 = 条件 + 效果 + 元信息。多条可叠加(按列表顺序依次套用)。

```ts
type Rule = {
  id: string
  name: string                 // 如 "国庆满18元加奖"
  enabled: boolean
  games: GameId[] | 'all'      // 适用彩种
  condition:
    | { kind: 'always' }
    | { kind: 'betAmountGte'; value: number }    // 单票投注金额 ≥ value(元)
    | { kind: 'tierAmountRange'; min?: number; max?: number } // 档位奖金落区间
    | { kind: 'specificTiers'; tiers: string[] } // 指定档位(如 3D 组三)
  effect:
    | { kind: 'multiply'; factor: number }       // 翻倍 = factor 2
    | { kind: 'addPercent'; percent: number }    // 加 50% = 50
    | { kind: 'addFixed'; value: number }        // 加固定金额
    | { kind: 'cap'; value: number }             // 封顶
  validFrom?: string           // 可选生效期
  validTo?: string
}
```

- 用户示例可表达:`满18元加奖`=`betAmountGte:18`;`翻倍`=`multiply:2`;`加50%`=`addPercent:50`;按档位区分用 `tierAmountRange`/`specificTiers`。
- 加奖后的金额**计入**中奖总额一并判税/判实名(假设,见 §9)。
- 规则持久化到 `localStorage`;提供"新增/编辑/删除/启停/排序"。
- 内置一个空规则集,默认不影响计算。

`applyActiveRules` 不仅返回最终金额,还返回每条命中规则的**增量明细**,供结果页展示(见 §5 的 `AppliedRule`):
```
running = afterMult
for rule in 启用且适用且条件命中的规则(按列表顺序):
    next  = applyEffect(running, rule.effect)   // multiply/addPercent/addFixed/cap
    delta = next - running
    记录 { ruleId, ruleName, delta }
    running = next
return { amount: running, applied: [...] }
```
`cap`(封顶)可能产生负 delta(被削减),如实记录,展示为 `−金额`。

### 6.1 公告收件箱与"未应用"提示

来源为**手动粘贴**(本版不抓取)。数据结构:
```ts
type Announcement = {
  id: string
  title: string
  content: string            // 粘贴的公告原文
  source?: string            // 可选:链接或出处
  addedAt: string
  status: 'pending' | 'applied' | 'ignored'   // 未应用 / 已转为规则 / 已忽略
  linkedRuleIds?: string[]   // 由该公告生成/关联的规则
}
```
- 用户在"公告收件箱"页**粘贴**官方活动公告并保存,状态默认 `pending`。
- 应用**只保存、不自动解析成规则**;规则仍由用户手动录入(录入后可把公告标为 `applied` 并关联 `linkedRuleIds`)。
- 顶部全局提示:当存在 `status==='pending'` 的公告时,显示红点/横幅 **"有 N 条公告未应用为规则"**;点击进入收件箱。这即"获取信息后不自动更新、网页提示有新规则未更新"。
- 持久化到 `localStorage`。
- **扩展点(本版不实现)**:约定 `public/feed.json` 数据契约 = `Announcement[]`(去 status 字段)。将来若加本地抓取脚本/云函数,只需写入 `feed.json`,应用启动时合并为 `pending` 公告,UI 与提示逻辑无需改动。

## 7. 技术方案与架构

- **栈**:Vite + React + TypeScript + Tailwind CSS;构建为纯静态文件。
- **无后端**;规则与偏好存 `localStorage`。
- **手机优先**响应式,大字号。

### 模块边界(各自单一职责、可独立测试)
```
src/
  data/
    games.ts        // 三个彩种的玩法与奖金表(常量)
    tax.ts          // 税/实名常量与档位定义
    types.ts        // GameId / Play / Tier / Rule 等类型
  engine/
    calc.ts         // computeTiers(input, rules) -> TierResult[]  (纯函数)
    rules.ts        // applyActiveRules(amount, ctx, rules) -> { amount, applied } (纯函数)
  store/
    rulesStore.ts          // 规则 localStorage 读写 + 校验
    announcementsStore.ts  // 公告收件箱 localStorage 读写 + 校验
  ui/
    App.tsx
    GameSelector.tsx
    PlaySelector.tsx
    MultiplierStepper.tsx
    ResultList.tsx / ResultCard.tsx   // ResultCard 展示规则增量明细(§5)
    PendingBanner.tsx                 // 顶部"有 N 条公告未应用"提示(§6.1)
    rules/RulesPage.tsx / RuleForm.tsx
    inbox/InboxPage.tsx / AnnouncementForm.tsx   // 粘贴/管理公告
```

### 数据流
输入(game/play/multiplier)+ 启用规则 → `useMemo(computeTiers)` → `ResultList`(每档可展开规则增量明细)。规则编辑页改动 → 写 rulesStore → 主页重算。公告收件箱改动 → 写 announcementsStore → `PendingBanner` 重新计数。

## 8. 错误处理与边界

- 倍数:整数,限定 1–99(超出夹紧),空输入按 1。
- 浮动奖档位:显示"浮动 · 开奖后定",不判税/实名,也不展示规则增量。
- 规则数值非法(负数、百分比越界):表单即时校验,阻止保存。
- 公告:标题或正文为空不允许保存;`pending` 计数为 0 时隐藏顶部提示。
- `localStorage` 不可用(隐私模式):降级为内存态,提示规则/公告不会被保存。
- 金额展示:千分位,人民币 `¥`;小数仅在必要时(如选一 4.5 元)。

## 9. 假设(需用户/实现期确认)

- 活动加奖金额**计入**应税中奖总额(实际税务处理可能有差异;集中在引擎一处,便于将来调整)。
- 税/实名门槛与税率取 2024 公告值,作为可配置常量。
- 第一版按"单张票 = 一种中奖档位场景"展示;多注组合(同票多注命中)留待后续。

## 10. 测试策略

- 引擎纯函数 TDD,重点边界:
  - 金额 = 3000 / 3001(实名翻转)、= 10000 / 10001(缴税翻转);
  - 3D 单选 ×10 = 10400 → 缴税+实名;
  - 快乐8 选八中八 = 50000 → 税后 40000;
  - 规则叠加顺序(multiply 后 addPercent 后 cap);
  - 规则增量明细 `applied`:各 delta 正确、`cap` 产生负 delta、无规则时为空数组;
  - 浮动奖跳过判定。
- 关键 UI 行为:切换输入实时刷新、规则启停影响结果、ResultCard 正确展示增量明细。
- 公告收件箱:粘贴保存为 `pending`、转规则后标 `applied`、顶部计数随 `pending` 变化。

## 11. 参考来源(官方)

- 彩票中奖个税新规(四部门,2024-09-01 起):https://www.gov.cn/zhengce/202408/content_6968804.htm
- 快乐8 游戏规则与奖金表:https://sports.sina.com.cn/l/rule/bjkl8/ ; https://www.zhcw.com/c/2020-09-22/618869.shtml
- 福彩3D / 排列3 玩法与奖金:https://sports.sina.com.cn/l/rule/3D/

> 实现前应再次以官方现行 game rules 复核奖金表数值。

---

## 12. v2 增补(2026-06-08,已与用户确认)

### 12.1 数字彩"组合投注"(3D / 排列3)
一张票可**同时投注多种玩法**(直选/组三/组六),它们可能**同时中奖**,合计金额可能跨过税/实名门槛。
- 数字彩界面改为:直选/组三/组六 **各自设倍数**(0 = 不买,默认直选=1)。
- 结果展示:① 每种已买玩法**单独**中奖金额(及其单独的税/实名);② 一张**"同时命中 · 合计"**卡片:把所有已买玩法的中奖额相加,**按合计判定缴税/实名**,并列出各玩法贡献与规则增量。
- "单票投注金额" = 所有已买玩法 `betUnit×倍数` 之和(用于"满 N 元"类活动门槛判定)。
- **快乐8 保持原样**(单玩法、全档位一览)。

### 12.2 规则按玩法定向 + 新效果
- `Rule` 增加可选 `plays?: string[]` 过滤(与 `games`、`condition` 取**与**);为空=不限玩法。
- 新增效果 `setPerBetPrize`:把**每注**奖金设为某值(总额 = 值 × 倍数),用于"某玩法加奖到 X 元/注"。
- `CalcContext` 增加 `multiplier`,供 `setPerBetPrize` 计算。
- 规则编辑器:增加"适用彩种""适用玩法"选择与"设为每注X元"效果。

### 12.3 内置体彩加奖规则(可一键启用)
依据 2026 年多省体彩**排列3 派奖**(直选加奖至 **1500 元/注**,**单票满 20 元**;省级、约 40 期、用完即止)。
- 提供内置规则(默认**停用**),首次启动播种进规则列表,用户一键启用/编辑/删除:
  `{ games:['pl3'], plays:['zhixuan'], condition: betAmountGte 20, effect: setPerBetPrize 1500 }`
- 来源:新浪财经·排列三全国多地加奖;中国体彩网。

### 12.4 修复
- 倍数输入框:可清空、手动输入多位(原 bug:删不掉最前面的 1)。已用本地文本态修复。

> 注:`setPerBetPrize`/`plays` 仅在引擎与计算层定向;税务判定基数仍为"整张票合计"(§3),与 12.1 的合计判定一致。
