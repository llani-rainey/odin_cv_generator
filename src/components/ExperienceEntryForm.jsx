export default function ExperienceEntryForm({
    section,
    sections,
    setSections,
}) {
    function handleEntryChange(entryId, field, value) {
        const updated = sections.map((s) => {
            if (s.id !== section.id) return s
            return {
                ...s,
                entries: s.entries.map((entry) => {
                    if (entry.id !== entryId) return entry
                    return { ...entry, [field]: value }
                }),
            }
        })
        setSections(updated)
    }

    function handleAddEntry() {
        const updated = sections.map((s) => {
            if (s.id !== section.id) return s
            return {
                ...s,
                entries: [
                    ...s.entries,
                    {
                        id: crypto.randomUUID(),
                        jobTitle: '',
                        company: '',
                        companyURL: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        bullets: [],
                    },
                ],
            }
        })
        setSections(updated)
    }

    function handleDeleteEntry(entryId) {
        const updated = sections.map((s) => {
            if (s.id !== section.id) return s
            return {
                ...s,
                entries: s.entries.filter((entry) => entry.id !== entryId),
            }
        })
        setSections(updated)
    }

    function handleAddBullet(entryId) {
        const updated = sections.map((s) => {
            if (s.id !== section.id) return s
            return {
                ...s,
                entries: s.entries.map((entry) => {
                    if (entry.id !== entryId) return entry
                    return { ...entry, bullets: [...entry.bullets, ''] }
                }),
            }
        })
        setSections(updated)
    }

    function handleBulletChange(entryId, bulletIndex, value) {
        const updated = sections.map((s) => {
            if (s.id !== section.id) return s
            return {
                ...s,
                entries: s.entries.map((entry) => {
                    if (entry.id !== entryId) return entry
                    return {
                        ...entry,
                        bullets: entry.bullets.map((bullet, i) =>
                            i === bulletIndex ? value : bullet,
                        ),
                    }
                }),
            }
        })
        setSections(updated)
    }

    function handleDeleteBullet(entryId, bulletIndex) {
        const updated = sections.map((s) => {
            if (s.id !== section.id) return s
            return {
                ...s,
                entries: s.entries.map((entry) => {
                    if (entry.id !== entryId) return entry
                    return {
                        ...entry,
                        bullets: entry.bullets.filter(
                            (_, i) => i !== bulletIndex,
                        ),
                    }
                }),
            }
        })
        setSections(updated)
    }

    return (
        <div className="form-experience-section">
            <h3 className="form-section-title">{section.title}</h3>

            {section.entries.map((entry) => (
                <div key={entry.id} className="form-experience-entry">
                    <div className="form-field">
                        <label>Job Title</label>
                        <input
                            type="text"
                            value={entry.jobTitle}
                            onChange={(e) =>
                                handleEntryChange(
                                    entry.id,
                                    'jobTitle',
                                    e.target.value,
                                )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="e.g. Data Engineer"
                        />
                    </div>

                    <div className="form-field">
                        <label>Company</label>
                        <input
                            type="text"
                            value={entry.company}
                            onChange={(e) =>
                                handleEntryChange(
                                    entry.id,
                                    'company',
                                    e.target.value,
                                )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="e.g. Google"
                        />
                    </div>

                    <div className="form-field">
                        <label>Company URL</label>
                        <input
                            type="text"
                            value={entry.companyURL}
                            onChange={(e) =>
                                handleEntryChange(
                                    entry.id,
                                    'companyURL',
                                    e.target.value,
                                )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="form-field">
                        <label>Location</label>
                        <input
                            type="text"
                            value={entry.location}
                            onChange={(e) =>
                                handleEntryChange(
                                    entry.id,
                                    'location',
                                    e.target.value,
                                )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="e.g. London, UK"
                        />
                    </div>

                    <div className="form-dates-row">
                        <div className="form-field">
                            <label>Start Date</label>
                            <input
                                type="text"
                                value={entry.startDate}
                                onChange={(e) =>
                                    handleEntryChange(
                                        entry.id,
                                        'startDate',
                                        e.target.value,
                                    )
                                }
                                onFocus={(e) => e.target.select()}
                                placeholder="e.g. Jan 2022"
                            />
                        </div>
                        <div className="form-field">
                            <label>End Date</label>
                            <input
                                type="text"
                                value={entry.endDate}
                                onChange={(e) =>
                                    handleEntryChange(
                                        entry.id,
                                        'endDate',
                                        e.target.value,
                                    )
                                }
                                onFocus={(e) => e.target.select()}
                                placeholder="e.g. Present"
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Bullet Points</label>
                        {entry.bullets.map((bullet, index) => (
                            <div key={index} className="form-bullet-row">
                                <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) =>
                                        handleBulletChange(
                                            entry.id,
                                            index,
                                            e.target.value,
                                        )
                                    }
                                    onFocus={(e) => e.target.select()}
                                    placeholder="Bullet point"
                                />
                                <button
                                    onClick={() =>
                                        handleDeleteBullet(entry.id, index)
                                    }
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button onClick={() => handleAddBullet(entry.id)}>
                            + Add Bullet
                        </button>
                    </div>

                    <button onClick={() => handleDeleteEntry(entry.id)}>
                        Delete Entry
                    </button>
                </div>
            ))}

            <button onClick={handleAddEntry}>+ Add Entry</button>
        </div>
    )
}
