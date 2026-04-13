import html2pdf from 'html2pdf.js'
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Section from './components/Section'
import './App.css'
import CVSettingsForm from './components/CVSettingsForm'
import HeaderForm from './components/HeaderForm'
import GenericEntryForm from './components/GenericEntryForm'
import ExperienceEntryForm from './components/ExperienceEntryForm'
import EducationEntryForm from './components/EducationEntryForm'

// JWT access token — stored outside component so it persists across re-renders
// not in useState — token changes shouldn't trigger re-renders
let accessToken = null

// returns Authorization header if token exists, empty object if not
// spread into headers object: { 'Content-Type': 'application/json', ...authHeaders() }
function authHeaders() {
    return accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SHERLOCK_DATA = {
    personalInfo: {
        name: 'Sherlock Holmes',
        title: 'Consulting Detective',
        location: 'London',
        phone: '+44 7700 221221',
        email: 'sherlock_holmes@gmail.com',
        address: '221B Baker Street, London NW1 6XE',
        visaStatus: 'British Citizen [Full UK Working Rights]',
        links: [
            { id: crypto.randomUUID(), label: 'GitHub', url: 'https://github.com/sherlockholmes' },
            { id: crypto.randomUUID(), label: 'LinkedIn', url: 'https://linkedin.com' },
        ],
    },
    sections: [
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
    ],
}

// normaliseSectionsFromDjango — transforms Django's response format into React state format
// Django returns bullets as objects: { text: 'bullet 1', order: 0 }
// React state expects bullets as plain strings: 'bullet 1'
// also handles case where bullets are already strings (typeof check) — defensive guard
function normaliseSectionsFromDjango(sections) {
    return (sections || []).map((section) => ({
        ...section,
        entries: (section.entries || []).map((entry) => ({
            ...entry,
            bullets: (entry.bullets || []).map((bullet) =>
                typeof bullet === 'string' ? bullet : bullet.text,
            ),
        })),
    }))
}

// normaliseSectionsForDjango — transforms React state format into Django serializer format
// React state stores bullets as plain strings: ['bullet 1', 'bullet 2']
// Django's BulletSerializer expects objects with text and order: { text: 'bullet 1', order: 0 }
// React state has no order integers — order is implicit from array position
// Django needs explicit order integers to store in the DB and return in correct sequence
// enumerate equivalent — sIndex/eIndex/bIndex from .map() second argument replaces Python's enumerate()
function normaliseSectionsForDjango(sections) {
    return sections.map((section, sIndex) => ({
        ...section,
        order: sIndex,
        entries: section.entries.map((entry, eIndex) => ({
            ...entry,
            order: eIndex,
            bullets: entry.bullets.map((bullet, bIndex) => ({
                text: typeof bullet === 'string' ? bullet : bullet.text,
                order: bIndex,
            })),
        })),
    }))
}

export default function App() {
    const [importJson, setImportJson] = useState('')
    const [showImport, setShowImport] = useState(false)
    const [formOpen, setFormOpen] = useState(true)
    const [user, setUser] = useState(null)
    const [hasSavedCV, setHasSavedCV] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState('')

    const [personalInfo, setPersonalInfo] = useState(SHERLOCK_DATA.personalInfo)
    const [cvSettings, setCvSettings] = useState({
        font: 'Arial',
        fontSize: '11px',
        margins: 'narrow',
        accentColor: '#000000',
    })
    const [sections, setSections] = useState(SHERLOCK_DATA.sections)

    //     useState   → stores values, triggers re-renders when values change
    //     useEffect  → reaches outside React (fetch, timers, DOM etc)
    //             → controlled by dependency array so it doesn't run uncontrollably

    // useEffect uses .then() chains — it can't be async itself, and .then() is the alternative syntax for handling promises without async/await.

    useEffect(() => {
        // runs once on mount — empty [] dependency array means never re-runs
        // two possible paths on page load:
        // 1. ?code= in URL → just came back from Google login → exchange code for JWT tokens
        // 2. no code → try silent refresh using httpOnly refresh_token cookie → get new access token
        // useEffect uses .then() chains — can't be async itself, .then() is the alternative syntax for promises

        const params = new URLSearchParams(window.location.search)
        // URLSearchParams — built-in browser API, parses the URL query string
        // window.location.search = '?code=abc123' — the query string part of the current URL
        // new URLSearchParams('?code=abc123').get('code') → 'abc123'
        // new URLSearchParams('').get('code') → null

        const code = params.get('code')
        // .get() — URLSearchParams method, returns value for key or null if not present
        // code = 'abc123xyz...' if coming back from Google login, null otherwise

        if (code) {
            // PATH 1 — just came back from Google OAuth
            // Django redirected here with ?code=abc123 in URL after successful login
            // code is a one-time token stored in Redis for 60 seconds

            window.history.replaceState({}, '', '/')
            // replaceState — built-in browser API, updates the URL bar without triggering a page reload
            // removes ?code=abc123 from URL — security: don't leave the code sitting in the URL bar
            // replaceState(stateObject, title, url) — stateObject={} (unused), title='' (ignored by browsers), url='/'

            fetch(`${API_URL}/api/token/exchange/`, {
                // POST the one-time code to Django — Django validates against Redis, returns JWT tokens
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                // credentials: 'include' needed here so Django can SET the httpOnly refresh_token cookie
                // the cookie travels in the response Set-Cookie header
                // without credentials: 'include', browser ignores Set-Cookie on cross-origin responses
                body: JSON.stringify({ code }),
                // { code } is ES6 shorthand for { code: code }
                // sends: { "code": "abc123xyz..." }
            })
                .then((res) => res.json())
                // parse response body — returns { access: 'eyJ...' } if valid, { error: '...' } if invalid
                .then((data) => {
                    if (data.access) {
                        accessToken = data.access
                        // store access token in module-level variable outside component
                        // not useState — token changes shouldn't trigger re-renders
                        // accessToken persists across re-renders but is lost on page refresh
                        // page refresh → silent refresh path below gets a new one from the cookie

                        return fetch(`${API_URL}/api/cv/`, {
                            // now fetch CV using the new access token
                            headers: authHeaders(),
                            // authHeaders() returns { Authorization: 'Bearer eyJ...' }
                            // no credentials: 'include' needed — using Bearer token not session cookie
                            // Bearer token in header bypasses all cross-origin cookie issues
                        })
                    } else {
                        // code exchange failed — invalid or expired code
                        setAuthLoading(false)
                        return null
                    }
                })
                .then((res) => {
                    // handles response from /api/cv/ fetch above
                    if (!res) return null
                    if (res.status === 404) {
                        // logged in but no CV saved yet — show Sherlock + demo banner
                        setUser('loggedIn')
                        setHasSavedCV(false)
                        setAuthLoading(false)
                        return null
                    }
                    if (!res.ok) {
                        // unexpected error — stop loading screen, show Sherlock
                        setAuthLoading(false)
                        return null
                    }
                    return res.json()
                    // gets passed on to next .then — async, returns promise (not resolved yet)
                    // only reaches here if status 200 — logged in and has a saved CV
                })
                .then((data) => {
                    // data is res.json() resolved — actual JS object, .then() did the unwrapping
                    if (data) {
                        // guards against null from branches above — if null was returned, this block doesn't run
                        setUser('loggedIn')
                        setHasSavedCV(true)
                        setPersonalInfo({
                            name: data.name || '',
                            title: data.title || '',
                            location: data.location || '',
                            phone: data.phone || '',
                            email: data.email || '',
                            address: data.address || '',
                            visaStatus: data.visaStatus || '',
                            links: (data.links || []).map((link) => ({
                                // if links missing, use empty array so .map doesn't crash
                                ...link,
                                // spread copies all existing properties from link into new object
                                id: link.id?.toString() || crypto.randomUUID(),
                                // Django returns integer ids, React needs strings for keys
                                // ?. optional chaining — if link.id undefined, returns undefined (doesn't crash)
                                // || crypto.randomUUID() — fallback if id missing
                            })),
                        })
                        setSections(normaliseSectionsFromDjango(data.sections))
                        // transform Django's bullet objects back to plain strings for React state
                        setCvSettings({
                            font: data.font || 'Arial',
                            fontSize: data.fontSize || '11px',
                            margins: data.margins || 'narrow',
                            accentColor: data.accentColor || '#000000',
                        })
                        setAuthLoading(false)
                    }
                })
                .catch(() => setAuthLoading(false))
            // .catch() — runs if anything in the chain throws or rejects
            // network failure, Redis down etc — stop loading screen regardless
        } else {
            // PATH 2 — no code in URL, normal page load or refresh
            // try silent refresh — use httpOnly refresh_token cookie to get new access token
            // user never sees a login prompt if they have a valid refresh token
            // this is the 'silent refresh' pattern

            fetch(`${API_URL}/api/token/refresh/`, {
                method: 'POST',
                credentials: 'include',
                // credentials: 'include' — sends the httpOnly refresh_token cookie
                // browser sends it automatically because samesite='None' and secure=True
                // Django reads it from request.COOKIES, validates it, returns new access token
            })
                .then((res) => {
                    if (!res.ok) {
                        // no refresh token cookie or it expired after 7 days
                        // user needs to log in again
                        setUser(null)
                        setAuthLoading(false)
                        return null
                    }
                    return res.json()
                    // { access: 'eyJ...' } — new access token
                })
                .then((data) => {
                    if (!data) return
                    accessToken = data.access
                    // store new access token in module-level variable
                    // now use it to fetch the CV
                    return fetch(`${API_URL}/api/cv/`, {
                        headers: authHeaders(),
                        // authHeaders() returns { Authorization: 'Bearer eyJ...' }
                    })
                })
                .then((res) => {
                    if (!res) return null
                    if (res.status === 404) {
                        // logged in but no CV saved yet
                        setUser('loggedIn')
                        setHasSavedCV(false)
                        setAuthLoading(false)
                        return null
                    }
                    if (!res.ok) {
                        setUser(null)
                        setAuthLoading(false)
                        return null
                    }
                    return res.json()
                })
                .then((data) => {
                    if (data) {
                        setUser('loggedIn')
                        setHasSavedCV(true)
                        setPersonalInfo({
                            name: data.name || '',
                            title: data.title || '',
                            location: data.location || '',
                            phone: data.phone || '',
                            email: data.email || '',
                            address: data.address || '',
                            visaStatus: data.visaStatus || '',
                            links: (data.links || []).map((link) => ({
                                ...link,
                                id: link.id?.toString() || crypto.randomUUID(),
                            })),
                        })
                        setSections(normaliseSectionsFromDjango(data.sections))
                        setCvSettings({
                            font: data.font || 'Arial',
                            fontSize: data.fontSize || '11px',
                            margins: data.margins || 'narrow',
                            accentColor: data.accentColor || '#000000',
                        })
                        setAuthLoading(false)
                    }
                })
                .catch(() => {
                    // network failure — not logged in, show Sherlock
                    setUser(null)
                    setAuthLoading(false)
                })
        }
    }, [])

    //FLow of data:
    // user types in form
    //     ↓
    // onChange handlers call setPersonalInfo / setSections etc
    //     ↓
    // state updates — React re-renders
    //     ↓
    // user clicks Save CV
    //     ↓
    // handleSave reads current state values
    //     ↓
    // sends them to Django via fetch POST
    //     ↓
    // Django saves to DB
    //     ↓
    // handleSave updates UI feedback state only (saveStatus, hasSavedCV)

    // handleSave just reads from state and sends it to Django — it doesn't modify state. The only state it updates is:
    // setHasSavedCV(true) // mark that a saved CV now exists in DB
    // setSaveStatus('saved') // update button text to '✓ Saved'
    // setTimeout(() => setSaveStatus(''), 2000) // reset button after 2 seconds
    async function handleSave() {
        // handleSave just takes a snapshot of whatever is currently in state and persists it to Django
        // marks as async so we can use await inside it, async functions always return a promise
        // but we dont need to worry about that here since we're not using the return value
        // we use async because we're calling something below that returns a promise

        setSaveStatus('saving') // updates the save button text immediately when clicked - before the fetch even starts

        // personalInfo and cvSettings dont need transformation, theyre already in the right shape to send directly
        // links only need order adding, simple enough to do inline in the JSON.stringify body which is done below

        const transformedSections = normaliseSectionsForDjango(sections)

        try {
            const response = await fetch(`${API_URL}/api/cv/`, {
                // data is sent to Django as an HTTP request in the shape/format the CVSerializer expects
                method: 'POST', // override default GET, sending data not reading it
                headers: {
                    'Content-Type': 'application/json', // tells Django the body is JSON, without this Django might not parse it correctly
                    ...authHeaders(),
                    // authHeaders() returns { Authorization: 'Bearer eyJ...' } if accessToken exists
                    // spread merges it into the headers object alongside Content-Type:
                    // { 'Content-Type': 'application/json', 'Authorization': 'Bearer eyJ...' }
                    // no credentials: 'include' needed — using Bearer token in header not session cookie
                    // Bearer token in Authorization header bypasses all cross-origin cookie issues
                },
                body: JSON.stringify({
                    // builds the complete JSON payload Django expects
                    // spreads personalInfo and cvSettings flat — matches what CVSerializer expects
                    // sections uses the pre-transformed version with orders and bullet objects
                    name: personalInfo.name,
                    title: personalInfo.title,
                    location: personalInfo.location,
                    phone: personalInfo.phone,
                    email: personalInfo.email,
                    address: personalInfo.address,
                    visaStatus: personalInfo.visaStatus,
                    links: personalInfo.links.map((link, i) => ({
                        // dealing with links inline here as fairly simple
                        // could have done a separate normalisation function like sections
                        ...link,
                        order: i, // add order from array position — same pattern as normaliseSectionsForDjango
                    })),
                    font: cvSettings.font,
                    fontSize: cvSettings.fontSize,
                    margins: cvSettings.margins,
                    accentColor: cvSettings.accentColor,
                    sections: transformedSections,
                    // contains all nested data — sections → entries → bullets
                    // Django's serializer unpacks it level by level:
                    // CVSerializer → SectionSerializer → EntrySerializer → BulletSerializer
                }),
            })
            if (response.ok) {
                setHasSavedCV(true)
                setSaveStatus('saved')
                setTimeout(() => setSaveStatus(''), 2000)
                // setTimeout — built-in browser function
                // runs callback after delay in milliseconds
                // resets button back to 'Save CV' after showing '✓ Saved' for 2 seconds
            } else {
                const errors = await response.json()
                // await response.json() — parse Django's error response
                // could be validation errors: { email: ['Enter a valid email'] }
                console.error('Save errors:', errors)
                setSaveStatus('error')
            }
        } catch (e) {
            // catch — runs if fetch fails completely (network error, server down etc)
            // e — user assigned name, the error object
            console.error('Save failed:', e)
            setSaveStatus('error')
        }
    }

    async function handleLogout() {
        // POST to Django to delete the refresh token cookie server-side
        // important: must tell Django to delete the cookie — can't delete httpOnly cookies from JavaScript
        // JavaScript can't read or delete httpOnly cookies — that's the whole point of httpOnly
        // only the server that set the cookie can delete it
        await fetch(`${API_URL}/api/auth/logout/`, {
            method: 'POST',
            credentials: 'include', // sends the refresh_token cookie so Django can delete it
            headers: authHeaders(), // sends Bearer token so Django knows who is logging out
        })
        accessToken = null // clear access token from module-level variable
        setUser(null) // update UI — shows Sign in with Google button
        setHasSavedCV(false) // reset hasSavedCV — no longer logged in
        setPersonalInfo(SHERLOCK_DATA.personalInfo) // reset to Sherlock demo data
        setSections(SHERLOCK_DATA.sections) // reset sections to Sherlock demo data
    }

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
    - companyURL: company website if you can reasonably infer it, otherwise ""
    - startDate/endDate: format as written e.g. "Jan 2020" or "2020" or "Present"
    - bullets: array of strings, one per bullet point. ALWAYS use bullets for experience entries — never put experience descriptions in a text field.

    3. EDUCATION sections (type: "education") — used for Education:
    - Each entry has: id, degree, institution, institutionURL, link, startDate, endDate, text, bullets
    - link: institution website if you can reasonably infer it, otherwise ""
    - institutionURL: leave as "" (deprecated field)
    - text: short description or note below the degree line if present
    - bullets: use bullets for awards, relevant papers, achievements etc. PREFER bullets over text.

    4. You may add additional generic sections if my CV has sections that don't fit the above (e.g. Certifications, Languages, Interests).

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
                .replace(/[\u2018\u2019]/g, "'")
                .replace(/[\u201C\u201D]/g, '"')
                .replace(/^\s+|\s+$/g, '')
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

    function handleAddSection(type = 'generic') {
        setSections([
            ...sections,
            {
                id: crypto.randomUUID(),
                type: type,
                title:
                    type === 'experience'
                        ? 'Work Experience'
                        : type === 'education'
                          ? 'Education'
                          : 'New Section',
                entries: [],
            },
        ])
    }

    if (authLoading) {
        return <div className="app-loading">Loading...</div>
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
                    {formOpen && (
                        <div className="form-panel-auth">
                            {user ? (
                                <>
                                    <button
                                        className="btn-save"
                                        onClick={handleSave}
                                        disabled={saveStatus === 'saving'}
                                    >
                                        {saveStatus === 'saving'
                                            ? 'Saving...'
                                            : saveStatus === 'saved'
                                              ? '✓ Saved'
                                              : saveStatus === 'error'
                                                ? 'Error'
                                                : 'Save CV'}
                                    </button>

                                    <button
                                        className="btn-logout"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <a
                                    href={`${API_URL}/accounts/google/login/`}
                                    className="btn-login"
                                >
                                    <img
                                        src="https://developers.google.com/identity/images/g-logo.png"
                                        alt="Google"
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            marginRight: '8px',
                                            verticalAlign: 'middle',
                                        }}
                                    />
                                    Sign in with Google
                                </a>
                            )}
                        </div>
                    )}
                    <button
                        className="collapse-btn"
                        onClick={() => setFormOpen(!formOpen)}
                    >
                        {formOpen ? '←' : '→'}
                    </button>
                </div>

                {formOpen && user && !hasSavedCV && (
                    <div className="demo-banner">
                        This is example data. Edit it directly or use AI Import
                        to populate with your own CV. Hit Save CV to save your
                        changes.
                    </div>
                )}

                {formOpen && (
                    <div className="form-import-panel">
                        <div className="form-import-buttons">
                            <button
                                className="btn-import"
                                onClick={handleCopyPrompt}
                                title="Copies a prompt to your clipboard. Paste it into Claude or ChatGPT or your AI of choice along with your existing CV to generate importable JSON then click Paste JSON to autopopulate the template."
                            >
                                Copy AI Prompt
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
                        <div className="form-add-section-buttons">
                            <button
                                className="btn-add"
                                onClick={() => handleAddSection('generic')}
                            >
                                + Custom Section
                            </button>
                            <button
                                className="btn-add"
                                onClick={() => handleAddSection('experience')}
                            >
                                + Experience Section
                            </button>
                            <button
                                className="btn-add"
                                onClick={() => handleAddSection('education')}
                            >
                                + Education Section
                            </button>
                        </div>
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