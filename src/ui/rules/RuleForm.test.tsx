import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RuleForm } from './RuleForm'

describe('RuleForm', () => {
  it('名称为空时保存被阻止并显示错误', async () => {
    const onSave = vi.fn()
    render(<RuleForm onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: '保存规则' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('请填写规则名称')).toBeInTheDocument()
  })

  it('填写名称后保存,回传带 id 的规则', async () => {
    const onSave = vi.fn()
    render(<RuleForm onSave={onSave} onCancel={() => {}} />)
    await userEvent.type(screen.getByLabelText('规则名称'), '满18翻倍')
    await userEvent.click(screen.getByRole('button', { name: '保存规则' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0]
    expect(saved.name).toBe('满18翻倍')
    expect(saved.id).toBeTruthy()
  })

  it('可设置"设为每注X元"效果并按玩法定向', async () => {
    const onSave = vi.fn()
    render(<RuleForm onSave={onSave} onCancel={() => {}} />)
    await userEvent.type(screen.getByLabelText('规则名称'), '排列3直选加奖')
    await userEvent.click(screen.getByRole('button', { name: '设为每注X元' }))
    const valInput = screen.getByLabelText('效果数值')
    await userEvent.clear(valInput)
    await userEvent.type(valInput, '1500')
    await userEvent.click(screen.getByRole('button', { name: '直选' }))
    await userEvent.click(screen.getByRole('button', { name: '保存规则' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0]
    expect(saved.effect).toEqual({ kind: 'setPerBetPrize', value: 1500 })
    expect(saved.plays).toContain('zhixuan')
  })
})
