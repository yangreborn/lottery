import type { Announcement } from '../data/types'

const ANN_KEY = 'lottery.announcements.v1'

export function loadAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(ANN_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as Announcement[]) : []
  } catch {
    return []
  }
}

// 返回是否成功写入;false 表示 localStorage 不可用,数据只存内存
export function saveAnnouncements(list: Announcement[]): boolean {
  try {
    localStorage.setItem(ANN_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

export function pendingCount(list: Announcement[]): number {
  return list.filter(x => x.status === 'pending').length
}
