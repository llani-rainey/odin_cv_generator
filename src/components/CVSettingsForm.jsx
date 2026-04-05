const FONT_OPTIONS = ['Arial', 'Calibri', 'Georgia', 'Garamond', 'Times New Roman']
const FONT_SIZE_OPTIONS = ['10px', '11px', '12px']
const MARGIN_OPTIONS = ['narrow', 'moderate', 'normal']

//no need for importing from App because by definition this component is a child of App and props flow down automatically through the JXS handover in App's return statement


export default function CVSettingsForm({ cvSettings, onCvSettingsChange }) {
    return (
        <div className="form-settings">
            <h3 className="form-section-title">CV Settings</h3>

            <div className="form-field">
                <label htmlFor="font-select">Font</label>
                <select
                    id="font-select"
                    value={cvSettings.font} //value is a reserved attribute here
                    onChange={(e) => onCvSettingsChange('font', e.target.value)} // 'font' is [field], e.target.value is: value
                >
                    {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>
                            {font}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-field">
                <label>Font Size</label>
                <div className="form-radio-group">
                    {FONT_SIZE_OPTIONS.map((size) => (
                        <label key={size} htmlFor={`fontsize-${size}`}>
                            <input
                                id={`fontsize-${size}`}
                                type="radio"
                                value={size}
                                checked={cvSettings.fontSize === size}
                                onChange={(e) =>
                                    onCvSettingsChange('fontSize', e.target.value)
                                }
                            />
                            {size.replace('px', '')}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-field">
                <label>Margins</label>
                <div className="form-radio-group">
                    {MARGIN_OPTIONS.map((margin) => (
                        <label key={margin} htmlFor={`margin-${margin}`}>
                            <input
                                id={`margin-${margin}`}
                                type="radio"
                                value={margin}
                                checked={cvSettings.margins === margin}
                                onChange={(e) =>
                                    onCvSettingsChange('margins', e.target.value)
                                }
                            />
                            {margin.charAt(0).toUpperCase() + margin.slice(1)}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="accent-colour">Accent Colour</label>
                <input
                    id="accent-colour"
                    type="color"
                    value={cvSettings.accentColor}
                    onChange={(e) =>
                        onCvSettingsChange('accentColor', e.target.value)
                    }
                />
            </div>
        </div>
    )
}
