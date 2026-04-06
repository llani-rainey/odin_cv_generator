export default function HeaderForm({ personalInfo, setPersonalInfo }) {
    function handleChange(field, value) {
        setPersonalInfo({ ...personalInfo, [field]: value })
    }

    function handleLinkChange(id, field, value) {
        setPersonalInfo({
            ...personalInfo,
            links: personalInfo.links.map((link) =>
                link.id === id ? { ...link, [field]: value } : link,
            ),
        })
    }

    function handleAddLink() {
        setPersonalInfo({
            ...personalInfo,
            links: [
                ...personalInfo.links,
                { id: crypto.randomUUID(), label: '', url: '' },
            ],
        })
    }

    function handleDeleteLink(id) {
        setPersonalInfo({
            ...personalInfo,
            links: personalInfo.links.filter((link) => link.id !== id),
        })
    }

    return (
        <div className="form-header">
            <h3 className="form-section-title">Personal Information</h3>

            <div className="form-fields-grid">
                <div className="form-field">
                    <label htmlFor="name">Full Name</label>
                    <input
                        id="name"
                        type="text"
                        value={personalInfo.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="Your full name"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="title">Job Title</label>
                    <input
                        id="title"
                        type="text"
                        value={personalInfo.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="e.g. Software Engineer"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="location">Location</label>
                    <input
                        id="location"
                        type="text"
                        value={personalInfo.location}
                        onChange={(e) =>
                            handleChange('location', e.target.value)
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="e.g. London"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="phone">Phone</label>
                    <input
                        id="phone"
                        type="text"
                        value={personalInfo.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="e.g. +44 7700 221221"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="your@email.com"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="address">Address</label>
                    <input
                        id="address"
                        type="text"
                        value={personalInfo.address}
                        onChange={(e) =>
                            handleChange('address', e.target.value)
                        }
                        placeholder="Your address"
                    />
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="visaStatus">Visa Status / Working Rights</label>
                <input
                    id="visaStatus"
                    type="text"
                    value={personalInfo.visaStatus}
                    onChange={(e) => handleChange('visaStatus', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="e.g. British Citizen [Full UK Working Rights]"
                />
            </div>

            

            <div className="form-links">
                <label>Links</label>
                {personalInfo.links.map((link) => (
                    <div key={link.id} className="form-link-entry">
                        <input
                            type="text"
                            value={link.label}
                            onChange={(e) =>
                                handleLinkChange(
                                    link.id,
                                    'label',
                                    e.target.value,
                                )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="Label e.g. GitHub"
                        />
                        <input
                            type="text"
                            value={link.url}
                            onChange={(e) =>
                                handleLinkChange(link.id, 'url', e.target.value)
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="URL e.g. https://github.com/..."
                        />
                        <button
                            
                            onClick={() => handleDeleteLink(link.id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button className="btn-add" onClick={handleAddLink}>
                    + Add Link
                </button>
            </div>
        </div>
    )
}
