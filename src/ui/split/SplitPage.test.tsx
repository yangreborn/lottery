import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SplitPage } from './SplitPage'

describe('SplitPage', () => {
  it('默认(3D直选10倍·0实名)显示拆成5张与省税', () => {
    render(<SplitPage rules={[]} />)
    expect(screen.getByText('省税拆票')).toBeInTheDocument()
    expect(screen.getByText(/拆成 5 张/)).toBeInTheDocument()
    expect(screen.getByText(/省税 ¥2,080/)).toBeInTheDocument()
  })

  it('数字彩有分开拆/混合打包模式切换', () => {
    render(<SplitPage rules={[]} />)
    expect(screen.getByRole('button', { name: '分开拆' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '混合打包' })).toBeInTheDocument()
  })
})
