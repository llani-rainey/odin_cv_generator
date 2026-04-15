import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Section from './Section'

const makeSection = (overrides = {}) => ({
    id: 1,
    title: 'Experience',
    type: 'experience',
    entries: [],
    ...overrides,
})

const experienceEntry = {
    id: 10,
    jobTitle: 'Software Engineer',
    company: 'Acme Corp',
    companyURL: '',
    location: 'London',
    startDate: '2022',
    endDate: 'Present',
    text: '',
    bullets: [],
}

const educationEntry = {
    id: 20,
    degree: 'BSc Computer Science',
    institution: 'University of London',
    institutionURL: '',
    location: 'London',
    startDate: '2018',
    endDate: '2021',
    text: '',
    bullets: [],
}

const genericEntry = {
    id: 30,
    subheading: 'Open Source Contributor',
    linkLabel: '',
    linkUrl: '',
    location: '',
    startDate: '',
    endDate: '',
    text: 'Contributed to Django.',
    bullets: [],
}

describe('Section', () => {
    it('renders the section title', () => {
        render(<Section section={makeSection()} />)
        expect(screen.getByText('Experience')).toBeInTheDocument()
    })

    it('renders experience entry job title', () => {
        const section = makeSection({ entries: [experienceEntry] })
        render(<Section section={section} />)
        // jobTitle is in a <strong> element — exact text match works
        expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    })

    it('renders education entry degree', () => {
        const section = makeSection({
            title: 'Education',
            type: 'education',
            entries: [educationEntry],
        })
        render(<Section section={section} />)
        // degree is in a <strong> element — exact text match works
        expect(screen.getByText('BSc Computer Science')).toBeInTheDocument()
    })

    it('renders generic entry subheading', () => {
        const section = makeSection({
            title: 'Projects',
            type: 'generic',
            entries: [genericEntry],
        })
        render(<Section section={section} />)
        expect(screen.getByText('Open Source Contributor')).toBeInTheDocument()
    })

    it('renders generic entry text content', () => {
        const section = makeSection({
            title: 'Projects',
            type: 'generic',
            entries: [genericEntry],
        })
        render(<Section section={section} />)
        expect(screen.getByText('Contributed to Django.')).toBeInTheDocument()
    })

    it('renders multiple entries', () => {
        const section = makeSection({
            entries: [
                experienceEntry,
                { ...experienceEntry, id: 11, jobTitle: 'Senior Engineer' },
            ],
        })
        render(<Section section={section} />)
        expect(screen.getByText('Software Engineer')).toBeInTheDocument()
        expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
    })

    it('renders section with no entries without crashing', () => {
        render(<Section section={makeSection({ entries: [] })} />)
        expect(screen.getByText('Experience')).toBeInTheDocument()
    })
})
