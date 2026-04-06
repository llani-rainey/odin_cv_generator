import html2pdf from 'html2pdf.js'
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
    const [importJson, setImportJson] = useState('')
    const [showImport, setShowImport] = useState(false)
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

    function handleExportPDF() {
        const element = document.querySelector('.cv-page')
        element.style.minHeight = 'unset'

        const options = {
            margin: 0,
            filename: 'cv.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        }

        html2pdf()
            .set(options)
            .from(element)
            .save()
            .then(() => {
                element.style.minHeight = '1123px'
            })
    }

    const importPrompt = `You are helping populate a CV builder app. I will provide you with my existing CV content. Your job is to extract and map my information to the exact JSON structure below.

    CRITICAL RULES:
    - Return ONLY the JSON object. No markdown, no backticks, no explanation, no other text whatsoever.
    - Every field must be present even if empty — use "" for empty strings and [] for empty arrays.
    - Do not invent or assume information that is not in my CV.
    - Preserve my exact wording where possible.

    DATA STRUCTURE RULES:

    personalInfo:
    - name: full name as written
    - title: job title or professional headline
    - location: city or city + country
    - phone: phone number as written
    - email: email address
    - address: full address if provided
    - visaStatus: visa/citizenship/working rights if mentioned
    - links: array of { id, label, url }
    * These are the profile/social links shown in the CV header (e.g. GitHub, LinkedIn, personal website)
    * label: short display name e.g. "GitHub", "LinkedIn", "Portfolio" — NOT the full URL
    * url: the full URL e.g. "https://github.com/username"
    * IMPORTANT: If the CV contains clickable hyperlinks or underlined text with an underlying URL (e.g. the word "GitHub" links to https://github.com/username), extract the actual underlying URL — do not just use the display text as the URL
    * If the document has a LinkedIn or GitHub hyperlink, extract the real URL even if it is not written out in full

    sections — there are 4 section types:

    1. GENERIC sections (type: "generic") — used for Summary, Projects, Skills, Custom sections:
    - Each entry has: id, subheading, linkLabel, link, text, bullets
    - subheading: the project/skill name or sub-section title (empty string "" for Summary)
    - linkLabel: short display label for the link e.g. "GitHub" — this is the clickable text that appears after the subheading
    - link: the full URL that the linkLabel points to e.g. "https://github.com/username/project"
    * IMPORTANT: If the subheading has an underlying hyperlink (e.g. the project name is clickable), extract the actual URL into the link field
    - text: paragraph text. For Summary use this for the main body paragraph. For all other sections PREFER bullets over text — only use text if the information genuinely does not suit bullet points
    - bullets: array of strings, one per bullet point. PREFER bullets over text for projects, skills, training, certifications etc. Convert paragraph descriptions into bullet points where it makes sense.

    2. EXPERIENCE sections (type: "experience") — used for Work Experience:
    - Each entry has: id, jobTitle, company, companyURL, location, startDate, endDate, bullets
    - companyURL: if the company name is a hyperlink in the CV, extract the underlying URL. Otherwise use ""
    - startDate/endDate: format as written e.g. "Jan 2020" or "2020" or "Present"
    - bullets: array of strings, one per bullet point. ALWAYS use bullets for experience entries — never put experience descriptions in a text field.

    3. EDUCATION sections (type: "education") — used for Education:
    - Each entry has: id, degree, institution, institutionURL, link, startDate, endDate, text, bullets
    - link: if the institution name is a hyperlink, extract the underlying URL. Otherwise infer the institution website if well known (e.g. "https://www.cam.ac.uk" for University of Cambridge), otherwise ""
    - institutionURL: leave as "" (deprecated field)
    - text: short description or note below the degree line if present
    - bullets: use bullets for awards, relevant papers, achievements etc. PREFER bullets over text.

    4. You may add additional generic sections if my CV has sections that don't fit the above (e.g. Certifications, Technical Training, Languages, Interests).

    LINK EXTRACTION — IMPORTANT:
    - Many CVs have hyperlinked text where the display text (e.g. "GitHub") hides the actual URL underneath
    - If you can see or infer the underlying URL from context, extract it into the appropriate url/link field
    - For GitHub: if a username is mentioned anywhere, construct the URL as https://github.com/username
    - For LinkedIn: if a profile is mentioned, construct as https://linkedin.com/in/username if the username is visible
    - Never use a display label as the URL value — urls must always start with https://

    FORMATTING PREFERENCES:
    - Summary: use the text field for the main paragraph. Bullets are optional for summary.
    - Everything else: STRONGLY prefer bullets over text. Convert prose descriptions into concise bullet points.
    - Keep bullet points concise and achievement-focused where possible.

    ORDERING:
    - Keep sections in the same order as they appear in my CV.
    - Keep entries within each section in the same order as they appear.

    IDs:
    - Use sequential integers for all ids starting from 1.
    - Section ids: 1, 2, 3, 4 etc.
    - Entry ids within each section: 1, 2, 3 etc. (reset per section)

    Return this exact structure:

    {
    "personalInfo": {
        "name": "",
        "title": "",
        "location": "",
        "phone": "",
        "email": "",
        "address": "",
        "visaStatus": "",
        "links": [
        { "id": "1", "label": "GitHub", "url": "" },
        { "id": "2", "label": "LinkedIn", "url": "" }
        ]
    },
    "sections": [
        {
        "id": 1,
        "type": "generic",
        "title": "Summary",
        "entries": [
            {
            "id": 1,
            "subheading": "",
            "linkLabel": "",
            "link": "",
            "text": "",
            "bullets": []
            }
        ]
        },
        {
        "id": 2,
        "type": "generic",
        "title": "Projects / Technical Skills",
        "entries": [
            {
            "id": 1,
            "subheading": "",
            "linkLabel": "",
            "link": "",
            "text": "",
            "bullets": []
            }
        ]
        },
        {
        "id": 3,
        "type": "experience",
        "title": "Work Experience",
        "entries": [
            {
            "id": 1,
            "jobTitle": "",
            "company": "",
            "companyURL": "",
            "location": "",
            "startDate": "",
            "endDate": "",
            "bullets": []
            }
        ]
        },
        {
        "id": 4,
        "type": "education",
        "title": "Education",
        "entries": [
            {
            "id": 1,
            "degree": "",
            "institution": "",
            "institutionURL": "",
            "link": "",
            "startDate": "",
            "endDate": "",
            "text": "",
            "bullets": []
            }
        ]
        }
    ]
    }

Now please map my CV content to this structure. Here is my CV:`

    function handleCopyPrompt() {
        navigator.clipboard.writeText(importPrompt)
        alert(
            'Prompt copied to clipboard! Paste it into Claude or ChatGPT, then upload or paste your CV.',
        )
    }

    function handleImport(jsonString) {
        try {
            const cleaned = jsonString
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .replace(/[\u2018\u2019]/g, "'") // smart single quotes
                .replace(/[\u201C\u201D]/g, '"') // smart double quotes
                .replace(/^\s+|\s+$/g, '') // trim whitespace
                .trim()

            console.log('Attempting to parse:', cleaned.substring(0, 100))
            const data = JSON.parse(cleaned)

            if (
                window.confirm(
                    'This will replace all your current CV data. Continue?',
                )
            ) {
                setPersonalInfo(data.personalInfo)
                setSections(data.sections)
            }
        } catch (e) {
            console.error('Parse error:', e)
            alert(`Invalid JSON — Error: ${e.message}`)
        }
    }
    
    function handleDeleteSection(sectionId) {
        if (window.confirm('Delete this entire section?')) {
            setSections(sections.filter((s) => s.id !== sectionId))
        }
    }

    function handleAddSection() {
        setSections([
            ...sections,
            {
                id: crypto.randomUUID(),
                type: 'generic',
                title: 'New Section',
                entries: [],
            },
        ])
    }

    return (
        <div className="app">
            <div
                className={`form-panel ${formOpen ? '' : 'form-panel--collapsed'}`}
            >
                <div className="form-panel-header">
                    {formOpen && (
                        <span className="form-panel-logo">CV Builder</span>
                    )}
                    <button
                        className="collapse-btn"
                        onClick={() => setFormOpen(!formOpen)}
                    >
                        {formOpen ? '←' : '→'}
                    </button>
                </div>

                {formOpen && (
                    <div className="form-import-panel">
                        <div className="form-import-buttons">
                            <button
                                className="btn-import"
                                onClick={handleCopyPrompt}
                                title="Copies a prompt to your clipboard. Paste it into Claude or ChatGPT or your AI of choice along with your existing CV to generate importable JSON then click Paste JSON to autopopulate the template."
                            >
                                📋 Copy AI Prompt
                            </button>
                            <button
                                className="btn-import-toggle"
                                onClick={() => setShowImport(!showImport)}
                                title="After getting JSON from the AI, paste it here to automatically populate all your CV fields."
                            >
                                {showImport ? 'Hide Import' : 'Paste JSON'}
                            </button>
                            <button
                                className="btn-export"
                                onClick={handleExportPDF}
                                title="Export your CV as a PDF file."
                            >
                                Export PDF
                            </button>
                        </div>
                        {showImport && (
                            <div className="form-import-box">
                                <textarea
                                    value={importJson}
                                    onChange={(e) =>
                                        setImportJson(e.target.value)
                                    }
                                    placeholder="Paste the JSON response from the AI here..."
                                    rows={6}
                                />
                                <button
                                    className="btn-import-run"
                                    onClick={() => {
                                        handleImport(importJson)
                                        setImportJson('')
                                        setShowImport(false)
                                    }}
                                >
                                    Import CV Data
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {formOpen && (
                    <div className="form-content">
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
                                        onDeleteSection={handleDeleteSection}
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
                                        onDeleteSection={handleDeleteSection}
                                    />
                                )
                            }
                            return (
                                <GenericEntryForm
                                    key={section.id}
                                    section={section}
                                    sections={sections}
                                    setSections={setSections}
                                    onDeleteSection={handleDeleteSection}
                                />
                            )
                        })}
                        <button className="btn-add" onClick={handleAddSection}>
                            + Add Section
                        </button>
                    </div>
                )}
            </div>
            <div className="preview-panel">
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