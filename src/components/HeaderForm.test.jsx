import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import HeaderForm from './HeaderForm'

const baseInfo = {
    name: 'Jane Doe',
    title: 'Developer',
    location: 'London',
    phone: '',
    email: '',
    address: '',
    visaStatus: '',
    links: [],
}

describe('HeaderForm', () => {
    it('renders all text inputs', () => {
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={vi.fn()} />)
        expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
        expect(screen.getByLabelText('Job Title')).toBeInTheDocument()
        expect(screen.getByLabelText('Location')).toBeInTheDocument()
        expect(screen.getByLabelText('Phone')).toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.getByLabelText('Address')).toBeInTheDocument()
    })

    it('shows current personalInfo values in inputs', () => {
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={vi.fn()} />)
        expect(screen.getByLabelText('Full Name')).toHaveValue('Jane Doe')
        expect(screen.getByLabelText('Job Title')).toHaveValue('Developer')
        expect(screen.getByLabelText('Location')).toHaveValue('London')
    })

    it('calls setPersonalInfo with updated name when input changes', () => {
        const setPersonalInfo = vi.fn()
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={setPersonalInfo} />)

        // fireEvent.change directly fires the onChange event with a new value —
        // the correct approach for controlled inputs where state is mocked
        fireEvent.change(screen.getByLabelText('Full Name'), {
            target: { value: 'John Smith' },
        })

        expect(setPersonalInfo).toHaveBeenCalledWith({ ...baseInfo, name: 'John Smith' })
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
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={vi.fn()} />)
        expect(screen.getByText('+ Add Link')).toBeInTheDocument()
    })

    it('calls setPersonalInfo with a new empty link on Add Link click', async () => {
        const setPersonalInfo = vi.fn()
        render(<HeaderForm personalInfo={baseInfo} setPersonalInfo={setPersonalInfo} />)

        await userEvent.click(screen.getByText('+ Add Link'))

        const lastCall = setPersonalInfo.mock.calls.at(-1)[0]
        expect(lastCall.links).toHaveLength(1)
        expect(lastCall.links[0]).toMatchObject({ label: '', url: '' })
    })

    it('renders existing links with their values', () => {
        const info = {
            ...baseInfo,
            links: [{ id: 'abc', label: 'GitHub', url: 'https://github.com' }],
        }
        render(<HeaderForm personalInfo={info} setPersonalInfo={vi.fn()} />)
        expect(screen.getByDisplayValue('GitHub')).toBeInTheDocument()
        expect(screen.getByDisplayValue('https://github.com')).toBeInTheDocument()
    })
})
