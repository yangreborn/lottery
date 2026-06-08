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
