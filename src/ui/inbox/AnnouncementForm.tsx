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
