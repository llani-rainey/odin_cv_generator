import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ExperienceEntryForm from './ExperienceEntryForm'

const entry = {
    id: 'e1',
    jobTitle: 'Developer',
    company: 'Acme Corp',
    companyURL: '',
    location: 'London',
    startDate: '2022',
    endDate: 'Present',
    bullets: [],
}

const makeSection = (overrides = {}) => ({
    id: 's1',
    title: 'Experience',
    type: 'experience',
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

describe('ExperienceEntryForm', () => {
    it('renders the section title input with current value', () => {
        render(<ExperienceEntryForm {...makeProps()} />)
        expect(screen.getByDisplayValue('Experience')).toBeInTheDocument()
    })

    it('renders entry fields', () => {
        render(<ExperienceEntryForm {...makeProps()} />)
        expect(screen.getByDisplayValue('Developer')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
        expect(screen.getByDisplayValue('London')).toBeInTheDocument()
        expect(screen.getByDisplayValue('2022')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Present')).toBeInTheDocument()
    })

    it('renders + Add Entry button', () => {
        render(<ExperienceEntryForm {...makeProps()} />)
        expect(screen.getByRole('button', { name: '+ Add Entry' })).toBeInTheDocument()
    })

    it('renders Delete Entry button', () => {
        render(<ExperienceEntryForm {...makeProps()} />)
        expect(screen.getByRole('button', { name: 'Delete Entry' })).toBeInTheDocument()
    })

    it('renders + Add Bullet button', () => {
        render(<ExperienceEntryForm {...makeProps()} />)
        expect(screen.getByRole('button', { name: '+ Add Bullet' })).toBeInTheDocument()
    })

    it('calls setSections with updated jobTitle on change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<ExperienceEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('Developer'), {
            target: { value: 'Senior Developer' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].jobTitle).toBe('Senior Developer')
    })

    it('calls setSections with updated section title on title change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<ExperienceEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('Experience'), {
            target: { value: 'Work History' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].title).toBe('Work History')
    })

    it('calls setSections with a new entry on Add Entry click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<ExperienceEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '+ Add Entry' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries).toHaveLength(2)
        expect(updated[0].entries[1]).toMatchObject({ jobTitle: '', company: '' })
    })

    it('calls setSections with entry removed on Delete Entry click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<ExperienceEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: 'Delete Entry' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries).toHaveLength(0)
    })

    it('calls onDeleteSection when ✕ button is clicked', async () => {
        const onDeleteSection = vi.fn()
        const props = makeProps({ onDeleteSection })
        render(<ExperienceEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '✕' }))

        expect(onDeleteSection).toHaveBeenCalledWith('s1')
    })

    it('renders bullet inputs when entry has bullets', () => {
        const section = makeSection({
            entries: [{ ...entry, bullets: ['Bullet one', 'Bullet two'] }],
        })
        const props = makeProps({ section, sections: [section] })
        render(<ExperienceEntryForm {...props} />)
        expect(screen.getByDisplayValue('Bullet one')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Bullet two')).toBeInTheDocument()
    })

    it('calls setSections with new bullet on Add Bullet click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<ExperienceEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '+ Add Bullet' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].bullets).toHaveLength(1)
        expect(updated[0].entries[0].bullets[0]).toBe('')
    })
})
