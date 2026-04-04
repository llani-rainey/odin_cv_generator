export default function ExperienceEntry({ entry }) {
    return (
        <div className="cv-experience-entry">
            <p className="cv-experience-entry-main-line">
                <strong>{entry.jobTitle}</strong>
                {' — '}
                {entry.companyURL ? (
                    <a href={entry.companyURL}>{entry.company}</a>
                ) : (
                    entry.company
                )}
                {' — '}
                {entry.location}
                {' — '}
                {entry.startDate} - {entry.endDate}
            </p>
            {entry.bullets.length > 0 && (
                <ul className="cv-experience-bullets">
                    {entry.bullets.map((bullet, index) => (
                        <li key={index}>{bullet}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}

{
    /*  

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
],*/
}
