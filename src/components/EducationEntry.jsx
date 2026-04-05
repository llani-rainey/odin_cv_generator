export default function EducationEntry({ entry }) {
    return (
        <div className="cv-education-entry">
            <p className="cv-education-entry-main-line">
                <strong>{entry.degree}</strong>
                {' — '}
                {entry.link ? (
                    <a href={entry.link}>{entry.institution}</a>
                ) : (
                    entry.institution
                )}
                {' — '}
                {entry.startDate} - {entry.endDate}
            </p>
            {entry.text && <p className="cv-entry-text">{entry.text}</p>}
            {entry.bullets.length > 0 && (
                <ul className="cv-education-bullets">
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

    */
}
