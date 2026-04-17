import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import GenericEntryForm from './GenericEntryForm'

const entry = {
    id: 'e1',
    subheading: 'CV Builder',
    linkLabel: 'GitHub',
    link: '',
    text: '',
    bullets: [],
}

const makeSection = (overrides = {}) => ({
    id: 's1',
    title: 'Projects',
    type: 'generic',
    entries: [entry],
    ...overrides,
})

const makeProps = (overrides = {}) => {
    const section = makeSection()
    return {
        section,
        sections: [section],
        setSections: vi.fn(),
        onDeleteSection: vi.fn(),
        ...overrides,
    }
}

describe('GenericEntryForm', () => {
    it('renders the section title input with current value', () => {
        render(<GenericEntryForm {...makeProps()} />)
        expect(screen.getByDisplayValue('Projects')).toBeInTheDocument()
    })

    it('renders entry fields', () => {
        render(<GenericEntryForm {...makeProps()} />)
        expect(screen.getByDisplayValue('CV Builder')).toBeInTheDocument()
        expect(screen.getByDisplayValue('GitHub')).toBeInTheDocument()
    })

    it('renders + Add Entry button', () => {
        render(<GenericEntryForm {...makeProps()} />)
        expect(screen.getByRole('button', { name: '+ Add Entry' })).toBeInTheDocument()
    })

    it('renders Delete Entry button', () => {
        render(<GenericEntryForm {...makeProps()} />)
        expect(screen.getByRole('button', { name: 'Delete Entry' })).toBeInTheDocument()
    })

    it('calls setSections with updated subheading on change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<GenericEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('CV Builder'), {
            target: { value: 'Portfolio Site' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].subheading).toBe('Portfolio Site')
    })

    it('calls setSections with updated linkLabel on change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<GenericEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('GitHub'), {
            target: { value: 'Demo' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].linkLabel).toBe('Demo')
    })

    it('calls setSections with updated section title on title change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<GenericEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('Projects'), {
            target: { value: 'Side Projects' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].title).toBe('Side Projects')
    })

    it('calls setSections with a new entry on Add Entry click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<GenericEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '+ Add Entry' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries).toHaveLength(2)
        expect(updated[0].entries[1]).toMatchObject({ subheading: '', linkLabel: '', link: '' })
    })

    it('calls setSections with entry removed on Delete Entry click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<GenericEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: 'Delete Entry' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries).toHaveLength(0)
    })

    it('calls onDeleteSection when ✕ button is clicked', async () => {
        const onDeleteSection = vi.fn()
        const props = makeProps({ onDeleteSection })
        render(<GenericEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '✕' }))

        expect(onDeleteSection).toHaveBeenCalledWith('s1')
    })

    it('calls setSections with new bullet on Add Bullet click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<GenericEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '+ Add Bullet' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].bullets).toHaveLength(1)
        expect(updated[0].entries[0].bullets[0]).toBe('')
    })

    it('renders bullet inputs when entry has bullets', () => {
        const section = makeSection({
            entries: [{ ...entry, bullets: ['Used React', 'Used Django'] }],
        })
        const props = makeProps({ section, sections: [section] })
        render(<GenericEntryForm {...props} />)
        expect(screen.getByDisplayValue('Used React')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Used Django')).toBeInTheDocument()
    })
})
