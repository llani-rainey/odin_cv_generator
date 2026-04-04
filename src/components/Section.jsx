import ExperienceEntry from './ExperienceEntry'
import EducationEntry from './EducationEntry'
import GenericEntry from './GenericEntry'

export default function Section({ section }) {
    return (
        <div className="cv-section">
            <h2 className="cv-section-title">{section.title}</h2>
            <hr className="cv-section-line" />
            <div className="cv-section-entries">
                {section.entries.map((entry) => {
                    if (section.type === 'experience') {
                        return <ExperienceEntry key={entry.id} entry={entry} />
                    }
                    if (section.type === 'education') {
                        return <EducationEntry key={entry.id} entry={entry} />
                    }
                    return <GenericEntry key={entry.id} entry={entry} />
                })}
            </div>
        </div>
    )
}
