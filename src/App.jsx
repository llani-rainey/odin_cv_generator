import { useState } from 'react'
import Header from './components/Header'
import Section from './components/Section'
import './App.css'
import CVSettingsForm from './components/CVSettingsForm'
import HeaderForm from './components/HeaderForm'
import GenericEntryForm from './components/GenericEntryForm'
import ExperienceEntryForm from './components/ExperienceEntryForm'
import EducationEntryForm from './components/EducationEntryForm'

export default function App() {
    const [formOpen, setFormOpen] = useState(true)

    const [personalInfo, setPersonalInfo] = useState({
        name: 'Sherlock Holmes',
        title: 'Consulting Detective',
        location: 'London',
        phone: '+44 7700 221221',
        email: 'sherlock_holmes@gmail.com',
        address: '221B Baker Street, London NW1 6XE',
        visaStatus: 'British Citizen [Full UK Working Rights]',
        links: [
            {
                id: crypto.randomUUID(),
                label: 'GitHub',
                url: 'https://github.com/sherlockholmes',
            },
            {
                id: crypto.randomUUID(),
                label: "LinkedIn",
                url: 'https://linkedin.com',
            },
        ],
    })

    const [cvSettings, setCvSettings] = useState({
        font: 'Arial',
        fontSize: '11px',
        margins: 'narrow', // 'narrow' | 'moderate' | 'normal'
        accentColor: '#000000',
    })

    const [sections, setSections] = useState([
        {
            id: 1,
            type: 'generic',
            title: 'Summary',
            entries: [
                {
                    id: 1,
                    subheading: '',
                    linkLabel: '',
                    link: '',
                    text: "World's only consulting detective with 20 years experience solving cases through data-driven deduction and pattern recognition, underpinned by self-directed study in chemistry, forensic science, and 140 varieties of tobacco ash. I began applying systematic analysis and pattern recognition to criminal investigations at 221B Baker Street, which led to a focused transition into consulting work after reading law briefly at Cambridge. After resolving the matter at the Reichenbach Falls, I returned to London and have since taken on increasingly complex casework spanning organised crime, foreign espionage, and inheritance disputes. Seeking a role where I can apply strong deductive foundations, analytical problem-solving, clear client communication, and a proven ability to work autonomously under pressure.",
                    bullets: [],
                },
            ],
        },
        {
            id: 2,
            type: 'generic',
            title: 'Projects / Technical Skills',
            entries: [
                {
                    id: 1,
                    subheading: 'The Hound of the Baskervilles — Python',
                    linkLabel: 'GitHub',
                    link: 'https://github.com/sherlockholmes/baskervilles',
                    text: '',
                    bullets: [
                        'Investigated supernatural dog sightings using systematic elimination of variables',
                        'Reduced suspect list from 14 to 1 using Bayesian inference and tobacco ash analysis',
                        'Coordinated with local constabulary and managed stakeholder expectations across Devon and London simultaneously',
                    ],
                },
                {
                    id: 2,
                    subheading: 'Cryptography Solver — Python',
                    linkLabel: 'GitHub',
                    link: 'https://github.com/sherlockholmes/final-problem',
                    text: '',
                    bullets: [
                        "Built a cipher decryption tool capable of breaking Moriarty's encoded communications using frequency analysis and substitution mapping",
                        'Implemented support for 12 classical cipher types including Vigenère, Playfair, and Rail Fence',
                        'Achieved sub-second decryption on messages up to 10,000 characters using optimised string parsing',
                    ],
                },
                {
                    id: 3,
                    subheading: 'Technologies',
                    link: '',
                    text: '',
                    bullets: [
                        'Python (the snake, not the language — currently working on it; have however mastered Python-adjacent skills such as deduction, recursion, and handling unexpected inputs)',
                        'Violin: proficient to concert level; particularly effective when applied during late-night analysis sessions at 221B',
                        'Baritsu, single-stick, and boxing: useful for edge cases where the data does not cooperate',
                        'Excel (advanced): pivot tables, VLOOKUP, conditional formatting — Watson handles the charts',
                        'Disguise and social engineering: extensive experience extracting information from unwilling stakeholders',
                    ],
                },
            ],
        },
        {
            id: 3,
            type: 'experience',
            title: 'Work Experience',
            entries: [
                {
                    id: 1,
                    jobTitle: 'Consulting Detective',
                    company: '221B Baker Street (Self-Employed)',
                    companyURL: '',
                    location: 'London, UK',
                    startDate: 'Jan 1881',
                    endDate: 'Present',
                    bullets: [
                        'Solved over 60 documented cases for clients ranging from royalty to the destitute, maintaining full confidentiality throughout',
                        'Developed proprietary methods for forensic analysis including tobacco ash classification, footprint identification, and typeface dating',
                        'Maintained 100% case resolution rate; single anomaly attributed to temporarily being dead',
                        'Managed all client communications, casework prioritisation, and stakeholder relationships without administrative support',
                    ],
                },
                {
                    id: 2,
                    jobTitle: 'Government Consultant',
                    company: 'British Secret Service',
                    companyURL: 'https://www.sis.gov.uk/',
                    location: 'London, UK',
                    startDate: 'Jan 1895',
                    endDate: 'Jan 1903',
                    bullets: [
                        'Advised senior government officials on matters of national security and foreign espionage',
                        'Led covert operations across Europe resulting in the disruption of two major criminal networks',
                        'Operated under multiple aliases with zero compromise of identity across 8-year tenure',
                    ],
                },
                {
                    id: 3,
                    jobTitle: 'Private Consultant',
                    company: 'Various European Police Forces',
                    companyURL: '',
                    location: 'Paris, Vienna, Montpellier',
                    startDate: 'Jan 1891',
                    endDate: 'Jan 1894',
                    bullets: [
                        'Operated under the alias Sigerson while assisting French, Austrian and Italian authorities with unsolved cases during sabbatical period',
                        'Disrupted a major international smuggling ring operating across three countries using forensic linguistics and handwriting analysis',
                        'Trained local investigators in systematic deduction methodology subsequently adopted as standard practice',
                    ],
                },
            ],
        },
        {
            id: 4,
            type: 'education',
            title: 'Education',
            entries: [
                {
                    id: 1,
                    degree: 'Bachelor of Laws (incomplete)',
                    institution: 'University of Cambridge',
                    institutionURL: '',
                    link: 'https://www.cam.ac.uk',
                    startDate: '1872',
                    endDate: '1874',
                    text: 'Departed before completion to pursue consulting work. Gained sufficient knowledge of criminal law to consistently outperform Scotland Yard.',
                    bullets: [
                        'Studied criminal law, evidence, and legal procedure — applied directly to subsequent casework',
                        'Developed foundational chemistry knowledge later extended through independent study at 221B',
                        'Awarded informal distinction in logical reasoning by Professor Moriarty (subsequently revoked following professional disagreement at Reichenbach Falls)',
                    ],
                },
                {
                    id: 2,
                    degree: 'Master of Chemistry (self-directed)',
                    institution: 'Royal Institution of Great Britain',
                    institutionURL: '',
                    link: 'https://www.rigb.org',
                    startDate: '1875',
                    endDate: '1878',
                    text: 'Independent study programme in analytical chemistry, toxicology, and forensic science conducted alongside early consulting work.',
                    bullets: [
                        'Conducted original research into 140 varieties of tobacco ash — published monograph remains the definitive reference',
                        'Developed novel techniques for trace evidence analysis subsequently adopted by several European police forces',
                        'Awarded distinction in practical chemistry; failed social sciences module on account of not caring about it',
                    ],
                },
            ],
        },
        {
            id: 5,
            type: 'generic',
            title: 'Example Custom Section',
            entries: [
                {
                    id: 1,
                    subheading: 'Example Subheading',
                    linkLabel: '',
                    link: '',
                    text: 'You can use this section for anything — certifications, volunteering, languages, interests. Delete it or rename it as you wish.',
                    bullets: [
                        'Add bullet points like this',
                        'Or remove them entirely and just use the text field above',
                    ],
                },
                {
                    id: 2,
                    subheading: 'Languages',
                    linkLabel: '',
                    link: '',
                    text: 'Fluent: English, French, German. Working knowledge: Italian, Norwegian, Dutch. Basic: Japanese (self-taught during sabbatical).',
                    bullets: [],
                },
            ],
        },
    ])


    function handleCvSettingsChange(field, value) {
        setCvSettings({ ...cvSettings, [field]: value })
    }


    return (
        <div className="app">
            <div className={`form-panel ${formOpen ? '' : 'form-panel--collapsed'}`}>
                <div className="form-panel-header">
                    {formOpen && <span className="form-panel-logo">CV Builder</span>}
                    <button
                        className="collapse-btn"
                        onClick={() => setFormOpen(!formOpen)}
                    >
                        {formOpen ? '←' : '→'}
                    </button>
                </div>
                {formOpen && (
                    <div className="form-content">
                        {/* forms go here */}
                        <CVSettingsForm
                            cvSettings={cvSettings}
                            onCvSettingsChange={handleCvSettingsChange}
                        />
                        <HeaderForm
                            personalInfo={personalInfo}
                            setPersonalInfo={setPersonalInfo}
                        />
                        {sections.map((section) => {
                            if (section.type === 'experience') {
                                return (
                                    <ExperienceEntryForm
                                        key={section.id}
                                        section={section}
                                        sections={sections}
                                        setSections={setSections}
                                    />
                                )
                            }
                            if (section.type === 'education') {
                                return (
                                    <EducationEntryForm
                                        key={section.id}
                                        section={section}
                                        sections={sections}
                                        setSections={setSections}
                                    />
                                )
                            }
                            return (
                                <GenericEntryForm
                                    key={section.id}
                                    section={section}
                                    sections={sections}
                                    setSections={setSections}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
            <div className="preview-panel">
                {/* toolbar sits here — above the CV page */}

                {/* cv page sits below the toolbar */}
                <div
                    className="cv-page"
                    style={{
                        fontFamily: cvSettings.font,
                        fontSize: cvSettings.fontSize,
                        padding:
                            cvSettings.margins === 'narrow'
                                ? '40px 50px'
                                : cvSettings.margins === 'moderate'
                                  ? '56px 72px'
                                  : '72px 96px',
                        '--accent-color': cvSettings.accentColor,
                    }}
                >
                    <Header personalInfo={personalInfo} />
                    {sections.map((section) => (
                        <Section key={section.id} section={section} />
                    ))}
                </div>
            </div>
        </div>
    )
}
