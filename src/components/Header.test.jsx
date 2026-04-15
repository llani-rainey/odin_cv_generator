import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from './Header'

const baseInfo = {
    name: 'Jane Doe',
    title: 'Software Engineer',
    location: 'London',
    phone: '+44 7700 123456',
    email: 'jane@example.com',
    address: '1 Test Street',
    visaStatus: 'British Citizen',
    links: [
        { id: '1', label: 'GitHub', url: 'https://github.com/jane' },
        { id: '2', label: 'LinkedIn', url: 'https://linkedin.com/in/jane' },
    ],
}

describe('Header', () => {
    it('renders the name', () => {
        render(<Header personalInfo={baseInfo} />)
        expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    it('renders title and location', () => {
        render(<Header personalInfo={baseInfo} />)
        expect(screen.getByText(/Software Engineer/)).toBeInTheDocument()
        expect(screen.getByText(/London/)).toBeInTheDocument()
    })

    it('renders phone and email', () => {
        render(<Header personalInfo={baseInfo} />)
        expect(screen.getByText(/\+44 7700 123456/)).toBeInTheDocument()
        expect(screen.getByText(/jane@example\.com/)).toBeInTheDocument()
    })

    it('renders all links with correct hrefs', () => {
        render(<Header personalInfo={baseInfo} />)
        const githubLink = screen.getByRole('link', { name: 'GitHub' })
        expect(githubLink).toHaveAttribute('href', 'https://github.com/jane')

        const linkedInLink = screen.getByRole('link', { name: 'LinkedIn' })
        expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com/in/jane')
    })

    it('renders address and visa status', () => {
        render(<Header personalInfo={baseInfo} />)
        expect(screen.getByText('1 Test Street')).toBeInTheDocument()
        expect(screen.getByText('British Citizen')).toBeInTheDocument()
    })

    it('renders with no links without crashing', () => {
        render(<Header personalInfo={{ ...baseInfo, links: [] }} />)
        expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
})
