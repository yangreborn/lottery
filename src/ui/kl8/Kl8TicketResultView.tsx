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
  if (r.bets.length === 0) {
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

      {/* 该玩法各档参考表(1倍基准) */}
      <div className="border border-gray-200 rounded-2xl px-4 py-3 mb-3">
        <div className="text-sm text-gray-400 mb-1.5">{r.playLabel} 各档奖金(单注 {r.multiplier} 倍)</div>
        <div className="space-y-1">
          {r.tierTable.map(l => (
            <div key={l.tierId} className="flex justify-between items-center text-sm text-gray-600">
              <span>{l.tierLabel}</span>
              <span className="flex items-center gap-1.5">
                <span>{l.floating ? '浮动' : formatYuan(l.amount ?? 0)}</span>
                {!l.floating && <Tag on={l.needTax} onText="税" offText="免" />}
                {!l.floating && <Tag on={l.needRealname} onText="名" offText="免" />}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 锁定场景合计 */}
      {r.hasLocked && (
        <div className="border-2 border-indigo-300 bg-indigo-50 rounded-2xl px-5 py-4">
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
