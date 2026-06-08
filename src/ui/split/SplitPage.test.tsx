import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SplitPage } from './SplitPage'

describe('SplitPage', () => {
  it('默认(3D直选10倍·0实名)显示拆成5张与省税', () => {
    render(<SplitPage />)
    expect(screen.getByText('省税拆票')).toBeInTheDocument()
    expect(screen.getByText(/拆成 5 张/)).toBeInTheDocument()
    expect(screen.getByText(/省税 ¥2,080/)).toBeInTheDocument()
  })

  it('提高实名张数上限后总张数减少', async () => {
    render(<SplitPage />)
    // 把"实名张数上限"加到 1:应变为 2 张(9倍+1倍)
    const incButtons = screen.getAllByRole('button', { name: '增加倍数' })
    // 第一个步进器是总倍数,第二个是实名张数上限
    await userEvent.click(incButtons[1])
    expect(screen.getByText(/拆成 2 张/)).toBeInTheDocument()
  })
})
