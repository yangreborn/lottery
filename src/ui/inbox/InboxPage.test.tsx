import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InboxPage } from './InboxPage'

describe('InboxPage', () => {
  it('粘贴并保存后回传新公告(status=pending)', async () => {
    const onChange = vi.fn()
    render(<InboxPage announcements={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '＋ 粘贴' }))
    await userEvent.type(screen.getByLabelText('公告标题'), '国庆加奖')
    await userEvent.type(screen.getByLabelText('公告内容'), '满18元翻倍')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const list = onChange.mock.calls[0][0]
    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('国庆加奖')
    expect(list[0].status).toBe('pending')
  })

  it('标题为空不保存', async () => {
    const onChange = vi.fn()
    render(<InboxPage announcements={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '＋ 粘贴' }))
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('请填写标题和内容')).toBeInTheDocument()
  })

  it('点"标为已应用"把 pending 改成 applied', async () => {
    const onChange = vi.fn()
    render(<InboxPage announcements={[{ id: '1', title: 't', content: 'c', addedAt: '2026-10-01', status: 'pending' }]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '标为已应用' }))
    expect(onChange.mock.calls[0][0][0].status).toBe('applied')
  })
})
