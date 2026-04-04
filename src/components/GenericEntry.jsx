
export default function GenericEntry( { entry } ) {
    return (
        <div className="cv-generic-entry">
            {entry.subheading && (
                <p className="cv-entry-subheading">
                    {entry.subheading}
                    {entry.link && (
                        <span>
                            {' '}
                            —{' '}
                            <a href={entry.link}>{entry.linkLabel || 'Link'}</a>
                        </span>
                    )}
                </p>
            )}

            {entry.text && (
                <p className="cv-generic-entry-text">{entry.text}</p>
            )}

            {entry.bullets.length > 0 && (
                <ul className="cv-generic-bullets">
                    {entry.bullets.map((bullet, index) => (
                        <li key={index}>{bullet}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}

{/* 
    
    {
    id: 1,
    subheading: 'The Hound of the Baskervilles',
    link: 'https://github.com/...',
    text: '',
    bullets: ['bullet 1', 'bullet 2']
}
    

one entry gets passed in as a prop, entries will be mapped to entry at its parent component (Section.jsx to offload one entry to this component)*/}