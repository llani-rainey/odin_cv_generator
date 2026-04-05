export default function GenericEntryForm({ section, sections, setSections }) {
    function handleEntryChange(entryId, field, value) {
        setSections(
            sections.map((s) =>
                s.id === section.id
                    ? {
                          ...s,
                          entries: s.entries.map((entry) =>
                              entry.id === entryId
                                  ? { ...entry, [field]: value }
                                  : entry,
                          ),
                      }
                    : s,
            ),
        )
    }

    function handleAddEntry() {
        setSections(
            sections.map((s) =>
                s.id === section.id
                    ? {
                          ...s,
                          entries: [
                              ...s.entries,
                              {
                                  id: crypto.randomUUID(),
                                  subheading: '',
                                  linkLabel: '',
                                  link: '',
                                  text: '',
                                  bullets: [],
                              },
                          ],
                      }
                    : s,
            ),
        )
    }

    function handleDeleteEntry(entryId) {
        setSections(
            sections.map((s) =>
                s.id === section.id
                    ? {
                          ...s,
                          entries: s.entries.filter(
                              (entry) => entry.id !== entryId,
                          ),
                      }
                    : s,
            ),
        )
    }

    function handleAddBullet(entryId) {
        setSections(
            sections.map((s) =>
                s.id === section.id
                    ? {
                          ...s,
                          entries: s.entries.map((entry) =>
                              entry.id === entryId
                                  ? {
                                        ...entry,
                                        bullets: [...entry.bullets, ''],
                                    }
                                  : entry,
                          ),
                      }
                    : s,
            ),
        )
    }

    function handleBulletChange(entryId, bulletIndex, value) {
        setSections(
            sections.map((s) =>
                s.id === section.id
                    ? {
                          ...s,
                          entries: s.entries.map((entry) =>
                              entry.id === entryId
                                  ? {
                                        ...entry,
                                        bullets: entry.bullets.map(
                                            (bullet, i) =>
                                                i === bulletIndex
                                                    ? value
                                                    : bullet,
                                        ),
                                    }
                                  : entry,
                          ),
                      }
                    : s,
            ),
        )
    }

    function handleDeleteBullet(entryId, bulletIndex) {
        setSections(
            sections.map((s) =>
                s.id === section.id
                    ? {
                          ...s,
                          entries: s.entries.map((entry) =>
                              entry.id === entryId
                                  ? {
                                        ...entry,
                                        bullets: entry.bullets.filter(
                                            (_, i) => i !== bulletIndex,
                                        ),
                                    }
                                  : entry,
                          ),
                      }
                    : s,
            ),
        )
    }

    return (
        <div className="form-generic-section">
            <h3 className="form-section-title">{section.title}</h3>

            {section.entries.map((entry) => (
                <div key={entry.id} className="form-generic-entry">
                    <div className="form-field">
                        <label>Subheading</label>
                        <input
                            type="text"
                            value={entry.subheading}
                            onChange={(e) =>
                                handleEntryChange(
                                    entry.id,
                                    'subheading',
                                    e.target.value,
                                )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="e.g. Project Name — Python"
                        />
                    </div>

                    <div className="form-dates-row">
                        <div className="form-field">
                            <label>Link Label</label>
                            <input
                                type="text"
                                value={entry.linkLabel}
                                onChange={(e) =>
                                    handleEntryChange(
                                        entry.id,
                                        'linkLabel',
                                        e.target.value,
                                    )
                                }
                                onFocus={(e) => e.target.select()}
                                placeholder="e.g. GitHub"
                            />
                        </div>
                        <div className="form-field">
                            <label>Link URL</label>
                            <input
                                type="text"
                                value={entry.link}
                                onChange={(e) =>
                                    handleEntryChange(
                                        entry.id,
                                        'link',
                                        e.target.value,
                                    )
                                }
                                onFocus={(e) => e.target.select()}
                                placeholder="https://github.com/..."
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Text</label>
                        <textarea
                            value={entry.text}
                            onChange={(e) =>
                                handleEntryChange(
                                    entry.id,
                                    'text',
                                    e.target.value,
                                )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="Optional paragraph of text"
                            rows={3}
                        />
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
                        <button
                            className="btn-add"
                            onClick={() => handleAddBullet(entry.id)}
                        >
                            + Add Bullet
                        </button>
                    </div>

                    <button
                        className="btn-delete"
                        onClick={() => handleDeleteEntry(entry.id)}
                    >
                        Delete Entry
                    </button>
                </div>
            ))}

            <button className="btn-add" onClick={handleAddEntry}>
                + Add Entry
            </button>
        </div>
    )
}
