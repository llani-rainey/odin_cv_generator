export default function Header({ personalInfo }) {
    // destructured from props which would technically be anything written within App before the return statement . personalInfo is an object with name, title, location etc
    return (
        <div className="cv-header">
            <div className="cv-header-left">
                <h1 className="cv-name">{personalInfo.name}</h1>
                <p className="cv-subtitle">
                    {personalInfo.title} | {personalInfo.location}
                </p>
            </div>
            <div className="cv-header-right">
                <p className="cv-contact">
                    {personalInfo.phone} | {personalInfo.email}
                </p>
                <div className="cv-links">
                    {personalInfo.links.map((link, index) => (
                        <span key={link.id}>
                            <a href={link.url}>{link.label}</a>
                            {index < personalInfo.links.length - 1 && ' | '}
                        </span>
                    ))}
                </div>
                <p>{personalInfo.address}</p>
                <p>{personalInfo.visaStatus}</p>
            </div>
        </div>
    )
}