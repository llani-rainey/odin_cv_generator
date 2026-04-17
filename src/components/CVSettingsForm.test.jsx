import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import CVSettingsForm from './CVSettingsForm'

const baseSettings = {
    font: 'Arial',
    fontSize: '11px',
    margins: 'moderate',
    accentColor: '#000000',
}

describe('CVSettingsForm', () => {
    it('renders the CV Settings heading', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        expect(screen.getByText('CV Settings')).toBeInTheDocument()
    })

    it('renders font select with current value selected', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        const select = screen.getByLabelText('Font')
        expect(select).toHaveValue('Arial')
    })

    it('renders all font options', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        const select = screen.getByLabelText('Font')
        const options = Array.from(select.options).map((o) => o.value)
        expect(options).toEqual(['Arial', 'Calibri', 'Georgia', 'Garamond', 'Times New Roman'])
    })

    it('calls onCvSettingsChange with font field when select changes', () => {
        const onCvSettingsChange = vi.fn()
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={onCvSettingsChange} />)

        fireEvent.change(screen.getByLabelText('Font'), {
            target: { value: 'Georgia' },
        })

        expect(onCvSettingsChange).toHaveBeenCalledWith('font', 'Georgia')
    })

    it('renders font size radio buttons', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        expect(screen.getByLabelText('10')).toBeInTheDocument()
        expect(screen.getByLabelText('11')).toBeInTheDocument()
        expect(screen.getByLabelText('12')).toBeInTheDocument()
    })

    it('checks the current font size radio', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        expect(screen.getByLabelText('11')).toBeChecked()
        expect(screen.getByLabelText('10')).not.toBeChecked()
    })

    it('calls onCvSettingsChange with fontSize field when radio changes', async () => {
        const onCvSettingsChange = vi.fn()
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={onCvSettingsChange} />)

        await userEvent.click(screen.getByLabelText('12'))

        expect(onCvSettingsChange).toHaveBeenCalledWith('fontSize', '12px')
    })

    it('renders margin radio buttons', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        expect(screen.getByLabelText('Narrow')).toBeInTheDocument()
        expect(screen.getByLabelText('Moderate')).toBeInTheDocument()
        expect(screen.getByLabelText('Normal')).toBeInTheDocument()
    })

    it('checks the current margin radio', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        expect(screen.getByLabelText('Moderate')).toBeChecked()
        expect(screen.getByLabelText('Narrow')).not.toBeChecked()
    })

    it('calls onCvSettingsChange with margins field when radio changes', async () => {
        const onCvSettingsChange = vi.fn()
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={onCvSettingsChange} />)

        await userEvent.click(screen.getByLabelText('Narrow'))

        expect(onCvSettingsChange).toHaveBeenCalledWith('margins', 'narrow')
    })

    it('renders accent colour input with current value', () => {
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={vi.fn()} />)
        const colorInput = screen.getByLabelText('Accent Colour')
        expect(colorInput).toHaveValue('#000000')
    })

    it('calls onCvSettingsChange with accentColor field when colour changes', () => {
        const onCvSettingsChange = vi.fn()
        render(<CVSettingsForm cvSettings={baseSettings} onCvSettingsChange={onCvSettingsChange} />)

        fireEvent.change(screen.getByLabelText('Accent Colour'), {
            target: { value: '#ff0000' },
        })

        expect(onCvSettingsChange).toHaveBeenCalledWith('accentColor', '#ff0000')
    })
})
