
// HeaderForm.test.jsx
// frontend unit tests — test the HeaderForm component in isolation
// checks two things: 1) does it render correctly 2) does it call setPersonalInfo correctly when user interacts
// HeaderForm is a controlled component — it receives personalInfo as props and calls setPersonalInfo when anything changes
// testing controlled components means testing that the right props are passed back up, not that state changed

import { render, screen, fireEvent } from '@testing-library/react'
// render — mounts component into fake DOM
// screen — queries the fake DOM to find elements
// fireEvent — directly fires DOM events (change, click etc) — lower level than userEvent

import userEvent from '@testing-library/user-event'
// userEvent — simulates real user interactions more accurately than fireEvent
// e.g. userEvent.click() simulates mouse hover → mouse down → mouse up → click in sequence
// fireEvent.click() just fires the click event directly, skipping the surrounding events
// use userEvent for clicks and typing, fireEvent for simple onChange on controlled inputs

import { describe, it, expect, vi } from 'vitest'
// vi — Vitest's utility for mocks/spies (equivalent to jest in Jest)
// vi.fn() — creates a mock function that records how it was called
//           lets you assert: was this function called? with what arguments?

import HeaderForm from './HeaderForm'


// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseInfo = {
    // base personalInfo object — same shape as what App.jsx passes to HeaderForm
    // defined once at top, reused across tests
    // tests that need different data spread and override: { ...baseInfo, name: 'Other' }
    name: 'Jane Doe',
    title: 'Developer',
    location: 'London',
    phone: '',
    email: '',
    address: '',
    visaStatus: '',
    links: [],
}


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HeaderForm', () => {

    it('renders all text inputs', () => {
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={vi.fn()} />)
        // vi.fn() — mock function, we don't care what setPersonalInfo does here
        // we're only testing that inputs exist, not that they call anything

        expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
        // getByLabelText — finds an input by its associated <label> text
        // more reliable than getByPlaceholderText — tests the label exists too
        // fails if either the label or the input it points to is missing
        expect(screen.getByLabelText('Job Title')).toBeInTheDocument()
        expect(screen.getByLabelText('Location')).toBeInTheDocument()
        expect(screen.getByLabelText('Phone')).toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.getByLabelText('Address')).toBeInTheDocument()
    })

    it('shows current personalInfo values in inputs', () => {
        // tests that the component correctly displays the values it receives as props
        // controlled input — value comes from props, not internal state
        // if HeaderForm doesn't bind value={personalInfo.name} correctly, this fails
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={vi.fn()} />)
        expect(screen.getByLabelText('Full Name')).toHaveValue('Jane Doe')
        // toHaveValue — checks the current value of an input element
        // different from toBeInTheDocument — that just checks existence, this checks the actual value
        expect(screen.getByLabelText('Job Title')).toHaveValue('Developer')
        expect(screen.getByLabelText('Location')).toHaveValue('London')
    })

    it('calls setPersonalInfo with updated name when input changes', () => {
        // tests the onChange handler — when user types, does it call setPersonalInfo correctly?
        // this is the core behaviour of a controlled input — typing should call the setter with new value
        const setPersonalInfo = vi.fn()
        // vi.fn() creates a spy — a fake function that records every call made to it
        // we can then assert: was it called? how many times? with what arguments?

        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={setPersonalInfo} />)

        fireEvent.change(screen.getByLabelText('Full Name'), {
            target: { value: 'John Smith' },
        })
        // fireEvent.change — directly fires the onChange event on the input
        // target: { value: 'John Smith' } — simulates the input's value being changed to 'John Smith'
        // equivalent to: user clears the field and types 'John Smith'
        // we use fireEvent here not userEvent because this is a controlled input —
        // the value doesn't actually update in the DOM (no real state change since setPersonalInfo is mocked)
        // fireEvent just fires the event and we check what got passed to the mock

        expect(setPersonalInfo).toHaveBeenCalledWith({ ...baseInfo, name: 'John Smith' })
        // toHaveBeenCalledWith — checks the mock was called with exactly these arguments
        // HeaderForm's onChange should call setPersonalInfo with the full personalInfo object
        // with just the name field updated — { ...baseInfo, name: 'John Smith' }
        // if HeaderForm only passes { name: 'John Smith' } without the rest, this fails
    })

    it('calls setPersonalInfo with updated email when input changes', () => {
        const setPersonalInfo = vi.fn()
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={setPersonalInfo} />)

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'john@example.com' },
        })

        expect(setPersonalInfo).toHaveBeenCalledWith({ ...baseInfo, email: 'john@example.com' })
    })

    it('calls setPersonalInfo with updated location when input changes', () => {
        const setPersonalInfo = vi.fn()
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={setPersonalInfo} />)

        fireEvent.change(screen.getByLabelText('Location'), {
            target: { value: 'Manchester' },
        })

        expect(setPersonalInfo).toHaveBeenCalledWith({ ...baseInfo, location: 'Manchester' })
    })

    it('renders the Add Link button', () => {
        // simple existence check — does the button render at all
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={vi.fn()} />)
        expect(screen.getByText('+ Add Link')).toBeInTheDocument()
        // getByText — finds element by its visible text content
    })

    it('calls setPersonalInfo with a new empty link on Add Link click', async () => {
        // tests that clicking Add Link calls setPersonalInfo with a new empty link appended
        // async — needed because userEvent.click is async (simulates real browser timing)
        const setPersonalInfo = vi.fn()
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={setPersonalInfo} />)

        await userEvent.click(screen.getByText('+ Add Link'))
        // userEvent.click — simulates a real click with full event sequence
        // we use userEvent here not fireEvent because this is a button click not a controlled input change
        // await — wait for all async events to finish before asserting

        const lastCall = setPersonalInfo.mock.calls.at(-1)[0]
        // setPersonalInfo.mock.calls — array of every call made to the mock
        //     each call is an array of arguments: [[arg1, arg2], [arg1, arg2]]
        // .at(-1) — gets the last call (in case it was called multiple times)
        // [0] — gets the first argument of that call (the new personalInfo object)

        expect(lastCall.links).toHaveLength(1)
        // toHaveLength — checks array length
        // baseInfo had links: [] — after click it should have one link

        expect(lastCall.links[0]).toMatchObject({ label: '', url: '' })
        // toMatchObject — checks the object contains at least these keys with these values
        // doesn't require exact match — new link will also have an id (crypto.randomUUID())
        // toMatchObject ignores extra keys, toEqual would require exact match
        // { label: '', url: '' } — new link should be empty, ready for user to fill in
    })

    it('renders existing links with their values', () => {
        // tests that existing links in personalInfo are rendered correctly
        const info = {
            ...baseInfo,
            links: [{ id: 'abc', label: 'GitHub', url: 'https://github.com' }],
            // override links with one existing link
        }
        render(<HeaderForm personalInfo={info} setPersonalInfo={vi.fn()} />)
        expect(screen.getByDisplayValue('GitHub')).toBeInTheDocument()
        // getByDisplayValue — finds an input whose current value matches this string
        // different from getByText (for visible text) and getByLabelText (for label associations)
        // used here because link label and url are input values, not visible text
        expect(screen.getByDisplayValue('https://github.com')).toBeInTheDocument()
    })
})

