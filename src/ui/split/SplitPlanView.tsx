import type { SplitPlan } from '../../engine/split'
import { formatYuan } from '../../util/format'

export function SplitPlanView({ plan }: { plan: SplitPlan }) {
  if (!plan.feasible) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-2xl px-5 py-4">
        <div className="text-base font-bold text-red-700">无法拆分避税</div>
        <div className="text-sm text-gray-600 mt-1">{plan.reason}</div>
        <div className="text-sm text-gray-500 mt-2">
          整买一张:中奖 {formatYuan(plan.originalWin)},需缴税 {formatYuan(plan.originalTax)}。
        </div>
      </div>
    )
  }
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5">
          <div className="text-xs text-gray-400">不拆分(1张)</div>
          <div className="text-lg font-bold">{formatYuan(plan.originalWin)}</div>
          <div className="text-xs text-red-500">
            缴税 {formatYuan(plan.originalTax)}{plan.originalNeedRealname ? ' · 实名' : ''}
          </div>
        </div>
        <div className="flex-1 border-2 border-indigo-300 bg-indigo-50 rounded-xl px-3 py-2.5">
          <div className="text-xs text-indigo-500">拆成 {plan.tickets.length} 张</div>
          <div className="text-lg font-bold text-indigo-700">{formatYuan(plan.totalWin)}</div>
          <div className="text-xs text-green-600">
            免税 · {plan.realnameCount === 0 ? '全免实名' : `${plan.realnameCount}张实名`}
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-green-700 font-semibold mb-3">省税 {formatYuan(plan.taxSaved)}</div>

      <div className="text-sm text-gray-400 mb-2">拆分方案(每张为一张独立彩票)</div>
      {plan.tickets.map((t, i) => (
        <div key={i} className="flex justify-between items-center border border-gray-200 rounded-xl px-4 py-2.5 mb-2">
          <div className="text-base font-bold">第{i + 1}张 · {t.multiplier}倍</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">最高 {formatYuan(t.win)}</span>
            <span className={`text-xs font-bold rounded-md px-2 py-0.5 ${t.needRealname ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'}`}>
              {t.needRealname ? '需实名' : '免实名'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
