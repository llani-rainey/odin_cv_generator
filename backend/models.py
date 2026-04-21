from __future__ import annotations

# models.py — SQLAlchemy ORM models
#
# Each class maps to one DB table.
# Column() defines a column: type, constraints, defaults.
# ForeignKey() links a column to another table's primary key.
# relationship() gives Python-level access to related rows
#   (e.g. cv.sections returns a list of Section objects).
#
# Data tree: User → CV → HeaderLink / Section → Entry → Bullet
#
# cascade="all, delete-orphan" — deleting a parent automatically
#   deletes all children, so deleting a Section also deletes its
#   Entries and Bullets without needing explicit DELETE statements.

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    """One user can have one CV (OneToOne via unique FK on CV)."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    google_id = Column(String(255), unique=True, nullable=True)

    # uselist=False — back-reference returns a single CV object, not a list
    cv = relationship(
        "CV",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class CV(Base):
    """One CV per user — stores personal info and CV settings."""

    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Personal info
    name = Column(String(255), default="")
    title = Column(String(255), default="")
    location = Column(String(255), default="")
    phone = Column(String(50), default="")
    email = Column(String(254), default="")
    address = Column(Text, default="")
    visa_status = Column(String(255), default="")

    # CV settings
    font = Column(String(100), default="Arial")
    font_size = Column(String(50), default="11px")
    margins = Column(String(50), default="narrow")
    accent_color = Column(String(7), default="#000000")

    user = relationship("User", back_populates="cv")
    links = relationship(
        "HeaderLink",
        back_populates="cv",
        cascade="all, delete-orphan",
        order_by="HeaderLink.order",
    )
    sections = relationship(
        "Section",
        back_populates="cv",
        cascade="all, delete-orphan",
        order_by="Section.order",
    )


class HeaderLink(Base):
    """A link in the CV header (GitHub, LinkedIn etc)."""

    __tablename__ = "header_links"

    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    label = Column(String(100), default="")
    url = Column(String(500), default="")
    order = Column(Integer, default=0)

    cv = relationship("CV", back_populates="links")


class Section(Base):
    """A CV section (Experience, Education, Projects etc)."""

    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    title = Column(String(255), default="")
    type = Column(String(20), nullable=False)  # 'experience' | 'education' | 'generic'
    order = Column(Integer, default=0)

    cv = relationship("CV", back_populates="sections")
    entries = relationship(
        "Entry",
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="Entry.order",
    )


class Entry(Base):
    """
    A single item within a section (a job, a degree, a project etc).

    All entry types share this one table — unused fields are simply empty strings.
    Experience fields: job_title, company, company_url
    Education fields:  degree, institution
    Generic fields:    subheading
    Shared:            link_url, link_label, location, start_date, end_date, text
    """

    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    order = Column(Integer, default=0)

    # Experience
    job_title = Column(String(255), default="")
    company = Column(String(255), default="")
    company_url = Column(String(500), default="")

    # Education
    degree = Column(String(255), default="")
    institution = Column(String(255), default="")

    # Shared — React uses the field name 'link' for the clickable URL on both
    # education entries (institution link) and generic entries (project link).
    link_url = Column(String(500), default="")
    link_label = Column(String(100), default="")

    # Generic
    subheading = Column(String(255), default="")

    # All types
    location = Column(String(255), default="")
    start_date = Column(String(100), default="")
    end_date = Column(String(100), default="")
    text = Column(Text, default="")

    section = relationship("Section", back_populates="entries")
    bullets = relationship(
        "Bullet",
        back_populates="entry",
        cascade="all, delete-orphan",
        order_by="Bullet.order",
    )


class Bullet(Base):
    """A bullet point under an entry."""

    __tablename__ = "bullets"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("entries.id"), nullable=False)
    text = Column(Text, default="")
    order = Column(Integer, default=0)

    entry = relationship("Entry", back_populates="bullets")
