import { describe, it, expect, beforeEach } from 'vitest'
import { loadAnnouncements, saveAnnouncements, pendingCount } from './announcementsStore'
import type { Announcement } from '../data/types'

beforeEach(() => localStorage.clear())

const a = (id: string, status: Announcement['status']): Announcement => ({
  id, title: 't' + id, content: 'c', addedAt: '2026-10-01', status,
})

describe('load/save', () => {
  it('空时返回空数组', () => expect(loadAnnouncements()).toEqual([]))
  it('保存后读取一致', () => {
    const list = [a('1', 'pending')]
    saveAnnouncements(list)
    expect(loadAnnouncements()).toEqual(list)
  })
  it('损坏数据返回空数组', () => {
    localStorage.setItem('lottery.announcements.v1', 'xxx')
    expect(loadAnnouncements()).toEqual([])
  })
})

describe('pendingCount', () => {
  it('只数 pending', () => {
    expect(pendingCount([a('1', 'pending'), a('2', 'applied'), a('3', 'pending'), a('4', 'ignored')])).toBe(2)
  })
})
