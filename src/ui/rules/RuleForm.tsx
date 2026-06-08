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
