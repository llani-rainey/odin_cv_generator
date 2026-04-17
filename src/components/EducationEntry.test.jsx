import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EducationEntry from './EducationEntry'

const baseEntry = {
    id: 1,
    degree: 'BSc Computer Science',
    institution: 'University of London',
    link: '',
    startDate: '2018',
    endDate: '2021',
    text: '',
    bullets: [],
}

describe('EducationEntry', () => {
    it('renders degree in bold', () => {
        render(<EducationEntry entry={baseEntry} />)
        const strong = screen.getByText('BSc Computer Science')
        expect(strong.tagName).toBe('STRONG')
    })

    it('renders no link when link is empty', () => {
        render(<EducationEntry entry={baseEntry} />)
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('renders institution as a link when link is set', () => {
        const entry = { ...baseEntry, link: 'https://london.ac.uk' }
        render(<EducationEntry entry={entry} />)
        const link = screen.getByRole('link', { name: 'University of London' })
        expect(link).toHaveAttribute('href', 'https://london.ac.uk')
    })

    it('renders date range', () => {
        render(<EducationEntry entry={baseEntry} />)
        expect(screen.getByText(/2018/)).toBeInTheDocument()
        expect(screen.getByText(/2021/)).toBeInTheDocument()
    })

    it('renders text when provided', () => {
        const entry = { ...baseEntry, text: 'Graduated with first class honours.' }
        render(<EducationEntry entry={entry} />)
        expect(screen.getByText('Graduated with first class honours.')).toBeInTheDocument()
    })

    it('does not render a text paragraph when text is empty', () => {
        render(<EducationEntry entry={baseEntry} />)
        expect(screen.queryByText(/cv-entry-text/)).not.toBeInTheDocument()
    })

    it('renders no bullet list when bullets is empty', () => {
        render(<EducationEntry entry={baseEntry} />)
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('renders bullets as list items', () => {
        const entry = { ...baseEntry, bullets: ['Studied algorithms', 'Learned networking'] }
        render(<EducationEntry entry={entry} />)
        expect(screen.getByText('Studied algorithms')).toBeInTheDocument()
        expect(screen.getByText('Learned networking')).toBeInTheDocument()
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })
})
