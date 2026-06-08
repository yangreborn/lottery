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

export function saveAnnouncements(list: Announcement[]): void {
  try {
    localStorage.setItem(ANN_KEY, JSON.stringify(list))
  } catch {
    /* 降级:不持久化 */
  }
}

export function pendingCount(list: Announcement[]): number {
  return list.filter(x => x.status === 'pending').length
}
