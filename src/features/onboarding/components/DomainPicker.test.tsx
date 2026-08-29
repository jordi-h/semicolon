import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DomainPicker } from './DomainPicker'

describe('DomainPicker', () => {
  it('renders all six broad domains', () => {
    render(<DomainPicker selected={[]} onChange={vi.fn()} />)
    for (const label of [
      'Science',
      'Technology',
      'History',
      'Geography',
      'Culture & Society',
      'Space & Universe',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('adds a domain when an unselected card is clicked', async () => {
    const onChange = vi.fn()
    render(<DomainPicker selected={[]} onChange={onChange} />)

    await userEvent.click(screen.getByText('Science'))

    expect(onChange).toHaveBeenCalledWith(['science'])
  })

  it('removes a domain when an already-selected card is clicked', async () => {
    const onChange = vi.fn()
    render(<DomainPicker selected={['science', 'history']} onChange={onChange} />)

    await userEvent.click(screen.getByText('Science'))

    expect(onChange).toHaveBeenCalledWith(['history'])
  })

  it('marks selected domains as pressed for accessibility', () => {
    render(<DomainPicker selected={['space']} onChange={vi.fn()} />)
    expect(screen.getByText('Space & Universe').closest('[role="button"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
