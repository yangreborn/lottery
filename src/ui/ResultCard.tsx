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
