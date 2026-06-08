import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('默认显示速查页与档位结果', () => {
    render(<App />)
    expect(screen.getByText('所有中奖档位')).toBeInTheDocument()
  })

  it('增加倍数后结果实时刷新', async () => {
    render(<App />)
    // 默认快乐8·选一·1倍:中1个 = 4.5(金额也出现在副标题,故用 getAllByText)
    expect(screen.getAllByText('¥4.5').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: '增加倍数' })) // 2倍 → 9
    expect(screen.getByText('¥9')).toBeInTheDocument()
  })

  it('切到公告页粘贴后,速查页顶部出现未应用提示', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /公告/ }))
    await userEvent.click(screen.getByRole('button', { name: '＋ 粘贴' }))
    await userEvent.type(screen.getByLabelText('公告标题'), '加奖')
    await userEvent.type(screen.getByLabelText('公告内容'), '满18翻倍')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    await userEvent.click(screen.getByRole('button', { name: /速查/ }))
    expect(screen.getByText(/有 1 条公告未应用为规则/)).toBeInTheDocument()
  })

  it('切到排列3显示组合投注与合计', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: '排列3' }))
    expect(screen.getByText(/组合投注/)).toBeInTheDocument()
    expect(screen.getByText('同时命中 · 合计')).toBeInTheDocument()
  })

  it('刷新后已启用的规则保持(持久化)', async () => {
    const first = render(<App />)
    await userEvent.click(screen.getByRole('button', { name: '规则' }))
    await userEvent.click(screen.getByRole('button', { name: '已停用' })) // 启用内置规则
    expect(screen.getByRole('button', { name: '已启用' })).toBeInTheDocument()
    first.unmount()
    // 模拟刷新:重新挂载,localStorage 不清
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: '规则' }))
    expect(screen.getByRole('button', { name: '已启用' })).toBeInTheDocument()
  })
})
