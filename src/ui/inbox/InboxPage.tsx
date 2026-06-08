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
