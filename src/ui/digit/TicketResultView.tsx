import type { TicketResult } from '../../data/types'
import { formatYuan } from '../../util/format'

function Tag({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span className={`text-sm font-bold rounded-md px-2.5 py-0.5 ${on ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'}`}>
      {on ? onText : offText}
    </span>
  )
}

const delta = (n: number) => (n >= 0 ? `+${formatYuan(n)}` : `−${formatYuan(-n)}`)

export function TicketResultView({ result: r }: { result: TicketResult }) {
  if (r.contributions.length === 0) {
    return <div className="text-gray-400 text-center py-8">请至少给一种玩法设置倍数</div>
  }
  return (
    <div>
      <div className="text-sm text-gray-400 mb-3">各玩法单独中奖</div>
      {r.contributions.map(c => (
        <div key={c.playId} className="border border-gray-200 rounded-2xl px-5 py-4 mb-2.5">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xl font-bold">{c.label}命中</div>
              <div className="text-sm text-gray-400 mt-0.5">{formatYuan(c.base)} × {c.multiplier}倍</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold">{formatYuan(c.amount)}</div>
              <div className="flex gap-1.5 justify-end mt-1.5">
                <Tag on={c.needTax} onText="缴税" offText="免税" />
                <Tag on={c.needRealname} onText="实名" offText="免实名" />
              </div>
            </div>
          </div>
          {c.applied.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-dashed border-gray-200 text-sm text-gray-600 leading-relaxed">
              {c.applied.map(a => (
                <div key={a.ruleId}>↳ 触发「{a.ruleName}」 <span className="text-indigo-500 font-semibold">{delta(a.delta)}</span></div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="border-2 border-indigo-300 bg-indigo-50 rounded-2xl px-5 py-4 mt-3">
        <div className="flex justify-between items-start">
          <div className="text-lg font-bold text-indigo-700">同时命中 · 合计</div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-indigo-700">{formatYuan(r.total)}</div>
            {r.needTax && <div className="text-xs text-gray-500 mt-0.5">税后 {formatYuan(r.netAmount)}</div>}
          </div>
        </div>
        <div className="flex gap-1.5 justify-end mt-1.5">
          <Tag on={r.needTax} onText="缴税" offText="免税" />
          <Tag on={r.needRealname} onText="实名" offText="免实名" />
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-dashed border-indigo-200 text-sm text-gray-600 leading-relaxed">
          {r.contributions.map(c => (
            <div key={c.playId} className="flex justify-between">
              <span>{c.label}</span><span className="font-semibold">{formatYuan(c.amount)}</span>
            </div>
          ))}
          {r.exclusiveNote && (
            <div className="text-amber-700 mt-1">注:组三/组六 不会同时中奖,合计按较高者计入。</div>
          )}
          {r.needTax && <div className="text-gray-400 mt-1">应缴税 {formatYuan(r.tax)}(税率20%)</div>}
        </div>
      </div>
    </div>
  )
}
