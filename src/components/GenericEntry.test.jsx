import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GenericEntry from './GenericEntry'

const baseEntry = {
    id: 1,
    subheading: 'Open Source Project',
    linkLabel: 'GitHub',
    link: '',
    text: '',
    bullets: [],
}

describe('GenericEntry', () => {
    it('renders subheading in bold', () => {
        render(<GenericEntry entry={baseEntry} />)
        const strong = screen.getByText('Open Source Project')
        expect(strong.tagName).toBe('STRONG')
    })

    it('does not render subheading element when subheading is empty', () => {
        const entry = { ...baseEntry, subheading: '' }
        render(<GenericEntry entry={entry} />)
        expect(screen.queryByText('Open Source Project')).not.toBeInTheDocument()
    })

    it('renders link with linkLabel when link is set', () => {
        const entry = { ...baseEntry, link: 'https://github.com/repo' }
        render(<GenericEntry entry={entry} />)
        const link = screen.getByRole('link', { name: 'GitHub' })
        expect(link).toHaveAttribute('href', 'https://github.com/repo')
    })

    it('falls back to "Link" text when linkLabel is empty but link is set', () => {
        const entry = { ...baseEntry, linkLabel: '', link: 'https://github.com/repo' }
        render(<GenericEntry entry={entry} />)
        expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument()
    })

    it('does not render a link when link is empty', () => {
        render(<GenericEntry entry={baseEntry} />)
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('renders text when provided', () => {
        const entry = { ...baseEntry, text: 'Contributed to Django REST Framework.' }
        render(<GenericEntry entry={entry} />)
        expect(screen.getByText('Contributed to Django REST Framework.')).toBeInTheDocument()
    })

    it('does not render text paragraph when text is empty', () => {
        render(<GenericEntry entry={baseEntry} />)
        // only the subheading paragraph should be present, not a text paragraph
        expect(screen.queryByText('Contributed to Django REST Framework.')).not.toBeInTheDocument()
    })

    it('renders no bullet list when bullets is empty', () => {
        render(<GenericEntry entry={baseEntry} />)
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('renders bullets as list items', () => {
        const entry = { ...baseEntry, bullets: ['React frontend', 'Django backend'] }
        render(<GenericEntry entry={entry} />)
        expect(screen.getByText('React frontend')).toBeInTheDocument()
        expect(screen.getByText('Django backend')).toBeInTheDocument()
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })
})
