import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test/renderWithProviders'
import { DomainPicker } from './DomainPicker'

describe('DomainPicker', () => {
  it('renders all eleven broad domains', () => {
    renderWithProviders(<DomainPicker selected={[]} onChange={vi.fn()} />)
    for (const label of [
      'Science',
      'Technology',
      'History',
      'Geography',
      'Culture & Society',
      'Space & Universe',
      'Language & Etymology',
      'Psychology & the Mind',
      'Art & Design',
      'Food & Cuisine',
      'Sports & Fitness',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('adds a domain when an unselected card is clicked', async () => {
    const onChange = vi.fn()
    renderWithProviders(<DomainPicker selected={[]} onChange={onChange} />)

    await userEvent.click(screen.getByText('Science'))

    expect(onChange).toHaveBeenCalledWith(['science'])
  })

  it('removes a domain when an already-selected card is clicked', async () => {
    const onChange = vi.fn()
    renderWithProviders(<DomainPicker selected={['science', 'history']} onChange={onChange} />)

    await userEvent.click(screen.getByText('Science'))

    expect(onChange).toHaveBeenCalledWith(['history'])
  })

  it('marks selected domains as pressed for accessibility', () => {
    renderWithProviders(<DomainPicker selected={['space']} onChange={vi.fn()} />)
    expect(screen.getByText('Space & Universe').closest('[role="button"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
