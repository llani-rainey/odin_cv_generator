// Section.test.jsx
// frontend unit tests — test the Section component in isolation
// no Django, no fetch calls, no real browser — just: render a component, check what appears on screen
// uses Vitest (test runner, like Jest but for Vite) and React Testing Library (renders components and queries the DOM)

import { render, screen } from '@testing-library/react'
// render — mounts a React component into a fake DOM (jsdom) so you can inspect it
// screen — provides queries to find elements in that fake DOM e.g. screen.getByText('hello')

import { describe, it, expect } from 'vitest'
// describe — groups related tests together under a label
// it — defines a single test (alias for 'test') — reads like a sentence: "it renders the section title"
// expect — makes assertions: expect(something).toBeInTheDocument() — test passes if true, fails if not

import Section from './Section'
// the actual component being tested — this is what all tests below are checking

// ---------------------------------------------------------------------------
// Test data — defined once at the top, reused across multiple tests
// ---------------------------------------------------------------------------
// equivalent to Django's MINIMAL_CV_PAYLOAD — shared base data tests can extend
// keeps tests DRY — don't repeat the same object shape in every test

const makeSection = (overrides = {}) => ({
    // factory function — returns a base section object with sensible defaults
    // overrides = {} — default parameter, if nothing passed in, overrides is empty object
    // caller can pass specific fields to change: makeSection({ title: 'Education', type: 'education' })
    id: 1,
    title: 'Experience',
    type: 'experience',
    entries: [],
    ...overrides,
    // spread overrides LAST — any keys in overrides replace the defaults above
    // makeSection({ title: 'Education' }) → { id: 1, title: 'Education', type: 'experience', entries: [] }
})

// plain test data objects — one per entry type your Section component handles
// defined as constants here so multiple tests can reuse them without rewriting

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Section', () => {
    // describe — groups all these tests under the label 'Section'
    // when tests run you see: Section > renders the section title ✓
    //                         Section > renders experience entry job title ✓  etc

    it('renders the section title', () => {
        // it('description', () => { ... }) — one test
        // description should complete the sentence "it ___" — reads like a spec
        render(<Section section={makeSection()} />)
        // render — mounts the Section component with a basic section prop
        // makeSection() returns { id:1, title:'Experience', type:'experience', entries:[] }
        // Section receives this as its section prop — same as App.jsx passing section={section}

        expect(screen.getByText('Experience')).toBeInTheDocument()
        // screen.getByText('Experience') — finds a DOM element containing exactly this text
        //     throws an error if not found — which fails the test with a clear message
        // .toBeInTheDocument() — assertion: checks the found element actually exists in the fake DOM
        // test passes if 'Experience' appears anywhere in the rendered output
    })

    it('renders experience entry job title', () => {
        const section = makeSection({ entries: [experienceEntry] })
        // makeSection with override — spreads experienceEntry into entries array
        // result: { id:1, title:'Experience', type:'experience', entries: [experienceEntry] }
        render(<Section section={section} />)
        expect(screen.getByText('Software Engineer')).toBeInTheDocument()
        // checks that jobTitle appears in the rendered output
        // if Section component doesn't render jobTitle, this fails
    })

    it('renders education entry degree', () => {
        const section = makeSection({
            title: 'Education',
            type: 'education', // overrides type — Section uses this to decide which sub-component to render
            entries: [educationEntry],
        })
        render(<Section section={section} />)
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
        // separate test from subheading — tests a different field of the same entry type
        // one assertion per test is good practice — if it fails you know exactly what broke
        const section = makeSection({
            title: 'Projects',
            type: 'generic',
            entries: [genericEntry],
        })
        render(<Section section={section} />)
        expect(screen.getByText('Contributed to Django.')).toBeInTheDocument()
    })

    it('renders multiple entries', () => {
        // tests that Section renders ALL entries, not just the first one
        const section = makeSection({
            entries: [
                experienceEntry,
                { ...experienceEntry, id: 11, jobTitle: 'Senior Engineer' },
                // spread experienceEntry and override two fields — creates a second entry
                // id must be different — React uses id as key, duplicate keys cause warnings
            ],
        })
        render(<Section section={section} />)
        expect(screen.getByText('Software Engineer')).toBeInTheDocument() // first entry
        expect(screen.getByText('Senior Engineer')).toBeInTheDocument() // second entry
        // both must be present — if Section only rendered one, one of these would fail
    })

    it('renders section with no entries without crashing', () => {
        // defensive test — checks the component handles empty entries gracefully
        // i.e doesn't crash with "cannot read property of undefined" when entries is []
        // 'without crashing' tests are valuable — they catch missing null checks
        render(<Section section={makeSection({ entries: [] })} />)
        expect(screen.getByText('Experience')).toBeInTheDocument()
        // if render threw an error, the test would fail before even reaching expect
        // so just checking the title renders is enough to confirm it didn't crash
    })
})
