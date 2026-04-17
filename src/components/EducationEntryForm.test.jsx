import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import EducationEntryForm from './EducationEntryForm'

const entry = {
    id: 'e1',
    degree: 'BSc Computer Science',
    institution: 'University of London',
    institutionURL: '',
    link: '',
    startDate: '2018',
    endDate: '2021',
    text: '',
    bullets: [],
}

const makeSection = (overrides = {}) => ({
    id: 's1',
    title: 'Education',
    type: 'education',
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

describe('EducationEntryForm', () => {
    it('renders the section title input with current value', () => {
        render(<EducationEntryForm {...makeProps()} />)
        expect(screen.getByDisplayValue('Education')).toBeInTheDocument()
    })

    it('renders entry fields', () => {
        render(<EducationEntryForm {...makeProps()} />)
        expect(screen.getByDisplayValue('BSc Computer Science')).toBeInTheDocument()
        expect(screen.getByDisplayValue('University of London')).toBeInTheDocument()
        expect(screen.getByDisplayValue('2018')).toBeInTheDocument()
        expect(screen.getByDisplayValue('2021')).toBeInTheDocument()
    })

    it('renders + Add Entry button', () => {
        render(<EducationEntryForm {...makeProps()} />)
        expect(screen.getByRole('button', { name: '+ Add Entry' })).toBeInTheDocument()
    })

    it('renders Delete Entry button', () => {
        render(<EducationEntryForm {...makeProps()} />)
        expect(screen.getByRole('button', { name: 'Delete Entry' })).toBeInTheDocument()
    })

    it('calls setSections with updated degree on change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<EducationEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('BSc Computer Science'), {
            target: { value: 'MSc Computer Science' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].degree).toBe('MSc Computer Science')
    })

    it('calls setSections with updated institution on change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<EducationEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('University of London'), {
            target: { value: 'Oxford University' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].institution).toBe('Oxford University')
    })

    it('calls setSections with updated section title on title change', () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<EducationEntryForm {...props} />)

        fireEvent.change(screen.getByDisplayValue('Education'), {
            target: { value: 'Academic History' },
        })

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].title).toBe('Academic History')
    })

    it('calls setSections with a new entry on Add Entry click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<EducationEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '+ Add Entry' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries).toHaveLength(2)
        expect(updated[0].entries[1]).toMatchObject({ degree: '', institution: '' })
    })

    it('calls setSections with entry removed on Delete Entry click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<EducationEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: 'Delete Entry' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries).toHaveLength(0)
    })

    it('calls onDeleteSection when ✕ button is clicked', async () => {
        const onDeleteSection = vi.fn()
        const props = makeProps({ onDeleteSection })
        render(<EducationEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '✕' }))

        expect(onDeleteSection).toHaveBeenCalledWith('s1')
    })

    it('calls setSections with new bullet on Add Bullet click', async () => {
        const setSections = vi.fn()
        const props = makeProps({ setSections })
        render(<EducationEntryForm {...props} />)

        await userEvent.click(screen.getByRole('button', { name: '+ Add Bullet' }))

        const updated = setSections.mock.calls.at(-1)[0]
        expect(updated[0].entries[0].bullets).toHaveLength(1)
        expect(updated[0].entries[0].bullets[0]).toBe('')
    })

    it('renders bullet inputs when entry has bullets', () => {
        const section = makeSection({
            entries: [{ ...entry, bullets: ['Studied algorithms'] }],
        })
        const props = makeProps({ section, sections: [section] })
        render(<EducationEntryForm {...props} />)
        expect(screen.getByDisplayValue('Studied algorithms')).toBeInTheDocument()
    })
})
