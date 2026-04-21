from __future__ import annotations

# schemas.py — Pydantic models (input validation + output serialization)
#
# Pydantic replaces DRF serializers. Each schema class defines:
#   - what fields are accepted / returned
#   - their types and defaults
#   - aliases for camelCase ↔ snake_case mapping
#
# Two schema families:
#   *In  — what React sends to the API (POST body).
#          Field(alias="camelCase") maps the React field name to a Python attribute.
#          model_config = ConfigDict(populate_by_name=True) lets you use both names.
#
#   *Out — what the API returns to React (GET response).
#          Field(serialization_alias="camelCase") renames snake_case attributes
#          to camelCase when the schema is serialized with model_dump(by_alias=True).
#          model_config = ConfigDict(from_attributes=True) lets Pydantic read
#          directly from SQLAlchemy model objects (not just dicts).
#
# The camelCase ↔ snake_case split is deliberate: React uses camelCase everywhere;
# Python uses snake_case everywhere. Keeping both explicit makes the mapping clear.

from pydantic import BaseModel, ConfigDict, Field

# ── Bullet ────────────────────────────────────────────────────────────────────


class BulletIn(BaseModel):
    text: str = ""
    order: int = 0


class BulletOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str = ""
    order: int = 0


# ── Entry ─────────────────────────────────────────────────────────────────────


class EntryIn(BaseModel):
    # populate_by_name=True — accept both 'jobTitle' (React) and 'job_title' (Python)
    model_config = ConfigDict(populate_by_name=True)

    order: int = 0

    # Experience
    job_title: str = Field(default="", alias="jobTitle")
    company: str = ""
    company_url: str = Field(default="", alias="companyURL")

    # Education
    degree: str = ""
    institution: str = ""

    # React uses 'link' for the clickable URL on both education entries
    # (institution hyperlink) and generic entries (project/repo link).
    # Stored in the link_url DB column; alias maps React's 'link' to it.
    link_url: str = Field(default="", alias="link")
    link_label: str = Field(default="", alias="linkLabel")

    # Generic
    subheading: str = ""

    # Shared
    location: str = ""
    start_date: str = Field(default="", alias="startDate")
    end_date: str = Field(default="", alias="endDate")
    text: str = ""

    bullets: list[BulletIn] = []


class EntryOut(BaseModel):
    # from_attributes=True — read field values from SQLAlchemy model attributes
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    order: int = 0

    # Experience
    # serialization_alias — the key used when model_dump(by_alias=True) is called
    job_title: str = Field(default="", serialization_alias="jobTitle")
    company: str = ""
    company_url: str = Field(default="", serialization_alias="companyURL")

    # Education
    degree: str = ""
    institution: str = ""

    # 'link' is what React reads for the clickable href
    link_url: str = Field(default="", serialization_alias="link")
    link_label: str = Field(default="", serialization_alias="linkLabel")

    # Generic
    subheading: str = ""

    # Shared
    location: str = ""
    start_date: str = Field(default="", serialization_alias="startDate")
    end_date: str = Field(default="", serialization_alias="endDate")
    text: str = ""

    bullets: list[BulletOut] = []


# ── Section ───────────────────────────────────────────────────────────────────


class SectionIn(BaseModel):
    title: str = ""
    type: str  # 'experience' | 'education' | 'generic'
    order: int = 0
    entries: list[EntryIn] = []


class SectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str = ""
    type: str
    order: int = 0
    entries: list[EntryOut] = []


# ── HeaderLink ────────────────────────────────────────────────────────────────


class HeaderLinkIn(BaseModel):
    label: str = ""
    url: str = ""
    order: int = 0


class HeaderLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str = ""
    url: str = ""
    order: int = 0


# ── CV ────────────────────────────────────────────────────────────────────────


class CVIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = ""
    title: str = ""
    location: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    visa_status: str = Field(default="", alias="visaStatus")
    font: str = "Arial"
    font_size: str = Field(default="11px", alias="fontSize")
    margins: str = "narrow"
    accent_color: str = Field(default="#000000", alias="accentColor")
    links: list[HeaderLinkIn] = []
    sections: list[SectionIn] = []


class CVOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str = ""
    title: str = ""
    location: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    visa_status: str = Field(default="", serialization_alias="visaStatus")
    font: str = ""
    font_size: str = Field(default="", serialization_alias="fontSize")
    margins: str = ""
    accent_color: str = Field(default="", serialization_alias="accentColor")
    links: list[HeaderLinkOut] = []
    sections: list[SectionOut] = []
