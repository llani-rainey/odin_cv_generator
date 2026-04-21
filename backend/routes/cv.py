from __future__ import annotations

# routes/cv.py — GET and POST /api/cv/
#
# Replaces cv_api/views.py + cv_api/urls.py.
#
# FastAPI route functions are much simpler than DRF views:
#   - No manual authentication check — Depends(get_current_user) handles it
#   - No manual serializer.is_valid() — Pydantic validates the request body automatically
#   - 422 Unprocessable Entity is returned automatically if the body doesn't match CVIn
#   - 403 is returned automatically if the Authorization header is missing

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import CV, Bullet, Entry, HeaderLink, Section, User
from schemas import CVIn, CVOut

router = APIRouter()


def _save_cv(cv: CV, data: CVIn, db: Session) -> None:
    """
    Write CV data to the database.

    Strategy: delete-and-recreate for nested data (links, sections, entries, bullets).
    Simpler than diffing — React always sends the complete current state, so wiping
    and rebuilding is correct and sidesteps tracking additions/deletions/reorders.

    Flat fields (name, title etc) are updated directly on the CV object.
    Cascade deletes handle the full nested tree: Section → Entry → Bullet.

    db.flush() after each insert sends the SQL without committing — needed to get
    the new row's .id before creating its children (FK constraint).
    """
    # Update flat fields
    cv.name = data.name
    cv.title = data.title
    cv.location = data.location
    cv.phone = data.phone
    cv.email = data.email
    cv.address = data.address
    cv.visa_status = data.visa_status
    cv.font = data.font
    cv.font_size = data.font_size
    cv.margins = data.margins
    cv.accent_color = data.accent_color

    # Delete all existing nested data — cascade wipes entries + bullets automatically
    db.query(HeaderLink).filter(HeaderLink.cv_id == cv.id).delete()
    db.query(Section).filter(Section.cv_id == cv.id).delete()
    db.flush()

    # Rebuild links — enumerate() gives (index, item) so index becomes the order field
    for order, link in enumerate(data.links):
        db.add(HeaderLink(cv_id=cv.id, label=link.label, url=link.url, order=order))

    # Rebuild sections → entries → bullets (three nested loops, same pattern each level)
    for s_order, section_data in enumerate(data.sections):
        section = Section(
            cv_id=cv.id,
            title=section_data.title,
            type=section_data.type,
            order=s_order,
        )
        db.add(section)
        db.flush()  # need section.id before creating entries

        for e_order, entry_data in enumerate(section_data.entries):
            entry = Entry(
                section_id=section.id,
                order=e_order,
                job_title=entry_data.job_title,
                company=entry_data.company,
                company_url=entry_data.company_url,
                degree=entry_data.degree,
                institution=entry_data.institution,
                link_url=entry_data.link_url,
                link_label=entry_data.link_label,
                subheading=entry_data.subheading,
                location=entry_data.location,
                start_date=entry_data.start_date,
                end_date=entry_data.end_date,
                text=entry_data.text,
            )
            db.add(entry)
            db.flush()  # need entry.id before creating bullets

            for b_order, bullet_data in enumerate(entry_data.bullets):
                db.add(Bullet(entry_id=entry.id, text=bullet_data.text, order=b_order))


@router.get("/api/cv/")
def get_cv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Return the CV for the authenticated user.

    Depends(get_current_user) reads the Bearer token, validates it, and injects
    the User — if the token is missing or invalid, FastAPI returns 401/403 automatically
    before this function body runs.

    JSONResponse + model_dump(by_alias=True) serializes snake_case SQLAlchemy attributes
    to camelCase JSON keys that React expects (e.g. font_size → fontSize).
    """
    cv = db.query(CV).filter(CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="No CV found for this user")

    cv_out = CVOut.model_validate(cv)
    return JSONResponse(cv_out.model_dump(by_alias=True))


@router.post("/api/cv/")
def save_cv(
    data: CVIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Create or update the CV for the authenticated user.

    Pydantic validates the request body against CVIn automatically — if the body
    doesn't match, FastAPI returns 422 before this function runs.
    """
    cv = db.query(CV).filter(CV.user_id == current_user.id).first()
    if not cv:
        # First save — create a new CV row
        cv = CV(user_id=current_user.id)
        db.add(cv)
        db.flush()  # need cv.id before _save_cv uses it as FK

    _save_cv(cv, data, db)
    db.commit()
    db.refresh(cv)  # reload from DB so relationships are up to date for serialization

    cv_out = CVOut.model_validate(cv)
    return JSONResponse(cv_out.model_dump(by_alias=True))
