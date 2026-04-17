import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExperienceEntry from './ExperienceEntry'

const baseEntry = {
    id: 1,
    jobTitle: 'Software Engineer',
    company: 'Acme Corp',
    companyURL: '',
    location: 'London',
    startDate: '2022',
    endDate: 'Present',
    bullets: [],
}

describe('ExperienceEntry', () => {
    it('renders job title in bold', () => {
        render(<ExperienceEntry entry={baseEntry} />)
        const strong = screen.getByText('Software Engineer')
        expect(strong.tagName).toBe('STRONG')
    })

    it('renders no link when companyURL is empty', () => {
        render(<ExperienceEntry entry={baseEntry} />)
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('renders company as a link when companyURL is set', () => {
        const entry = { ...baseEntry, companyURL: 'https://acme.com' }
        render(<ExperienceEntry entry={entry} />)
        const link = screen.getByRole('link', { name: 'Acme Corp' })
        expect(link).toHaveAttribute('href', 'https://acme.com')
    })

    it('renders location and date range', () => {
        render(<ExperienceEntry entry={baseEntry} />)
        expect(screen.getByText(/London/)).toBeInTheDocument()
        expect(screen.getByText(/2022/)).toBeInTheDocument()
        expect(screen.getByText(/Present/)).toBeInTheDocument()
    })

    it('renders no bullet list when bullets is empty', () => {
        render(<ExperienceEntry entry={baseEntry} />)
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('renders bullets as list items', () => {
        const entry = { ...baseEntry, bullets: ['Built a feature', 'Fixed a bug'] }
        render(<ExperienceEntry entry={entry} />)
        expect(screen.getByText('Built a feature')).toBeInTheDocument()
        expect(screen.getByText('Fixed a bug')).toBeInTheDocument()
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })
})
