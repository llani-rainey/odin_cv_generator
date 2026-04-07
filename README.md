# CV Builder

A full-stack CV builder with live preview, AI-assisted import, and Google OAuth — built with React and Django.

**Live Demo:** [odin-cv-generator-iota.vercel.app](https://odin-cv-generator-iota.vercel.app)

---

## Overview

CV Builder lets users create, edit, and export a professional CV through a split-panel interface — a form on the left, a live A4 preview on the right. Changes reflect instantly in the preview without any page reload.

The app ships with a fully populated Sherlock Holmes example CV so users can immediately see what a complete CV looks like before editing their own. Logged-in users can save and reload their CV across sessions via Google OAuth and a Django REST API backend.

---

## Features

### Core
- **Live split-panel preview** — form edits reflect instantly in the A4 preview
- **Full CV editing** — personal info, work experience, education, projects, custom sections
- **Add / rename / delete sections** — including section type selection (generic, experience, education)
- **PDF export** — exports the CV preview directly to PDF
- **Google OAuth** — sign in with Google to save and load your CV across sessions
- **Sherlock Holmes demo data** — new users see a fully populated example CV before editing their own

### AI Import (Novel Feature)
The app includes a prompt-based CV import workflow:

1. Click **Copy AI Prompt** — copies a detailed structured prompt to clipboard
2. Paste the prompt into Claude, ChatGPT, or any LLM along with your existing CV
3. The AI returns a structured JSON object matching the app's data schema
4. Click **Paste JSON** → **Import CV Data** — the entire CV populates automatically

This approach — generating a structured prompt that instructs an AI to map arbitrary input data to a specific schema — is applicable beyond CV building. The same pattern could accelerate onboarding flows, form population, data migration, and any scenario where structured data needs to be extracted from unstructured documents at speed. No API key required on the app side.

---

## Tech Stack

### Frontend
- **React** (Vite)
- **JavaScript** (ES6+)
- **CSS** (custom, no framework)
- `html2pdf.js` for PDF export

### Backend
- **Django 6** + **Django REST Framework**
- **PostgreSQL**
- **django-allauth** — Google OAuth
- **dj-database-url** — database configuration
- **gunicorn** — production WSGI server
- **WhiteNoise** — static file serving

### Deployment
- Frontend → **Vercel**
- Backend → **Render**
- Database → **Render PostgreSQL**

---

## Architecture Decisions

### Split-panel live preview
The Odin Project brief suggested a toggle pattern (show form OR preview). Instead, state is lifted to `App` and passed simultaneously to both the form panel and the preview panel — enabling true live preview without toggling.

### Single source of truth
All CV state lives in `App.jsx` and flows down as props. The form panel mutates state, the preview panel reads it. No duplication, no sync issues.

### Controlled inputs + nested state updates
The CV data structure is deeply nested (sections → entries → bullets). Every form input is controlled and updates state via nested `.map()` handlers — finding the right section, then the right entry, then the right field, and spreading only what changed.

### AI Import pattern
Rather than building an OCR pipeline or file parser, the import feature leverages the user's existing access to an LLM. The prompt is engineered to instruct the model to output valid JSON matching the app's exact data schema. The frontend then validates, cleans (handling smart quotes, markdown fences), and imports the result.

### Normalised Django models
CV data is stored across five related tables (CV, HeaderLink, Section, Entry, Bullet) rather than a single JSON blob. This was a deliberate choice for learning — the nested DRF serializers with custom `create()` and `update()` methods are a core pattern in production Django codebases.

### Delete-and-recreate for nested updates
On save, nested records (sections, entries, bullets) are deleted and rebuilt from the incoming payload rather than diffed. This sidesteps the complexity of tracking additions, deletions, and reorders across multiple levels — and works correctly because React sends the complete state on every save.

---

## Data Model

```
User (Django built-in)
└── CV
    ├── HeaderLink  (links: GitHub, LinkedIn etc)
    └── Section     (Summary, Experience, Education, Custom)
        └── Entry   (job, degree, project etc)
            └── Bullet
```

---

## Local Setup

### Prerequisites
- Python 3.13
- Node.js 18+
- PostgreSQL

### Frontend
```bash
cd odin_cv_generator
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=cv_db
DB_USER=your_mac_username
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=5432
```

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then in Django admin, add a Google Social Application with your OAuth credentials from Google Cloud Console.

---

## Key Learnings

### React
- **Lifting state** — all CV data lives in `App` and flows down as props to both form and preview panels simultaneously, enabling live preview without toggling
- **Controlled inputs** — every input is controlled; value comes from state, `onChange` updates state
- **Deeply nested state updates** — updating a bullet inside an entry inside a section requires double-nested `.map()` — find the right section, find the right entry, spread only the changed field
- **Component composition** — separate preview components (`Header`, `Section`, `GenericEntry`, `ExperienceEntry`, `EducationEntry`) and form components that mirror the same data structure
- **`useEffect` for data fetching** — loading CV from the API on mount, handling 401 (not logged in), 404 (no saved CV), and 200 (load data) as distinct cases
- **`crypto.randomUUID()`** for stable React keys on dynamically added items

### Django & DRF
- **Model relationships** — `OneToOneField` vs `ForeignKey`, `related_name` for reverse traversal, `on_delete=CASCADE` cascading deletes down the tree
- **DRF serializers** — `ModelSerializer`, `source=` for camelCase↔snake_case mapping, `allow_blank`, `required=False` for partial data
- **Nested writable serializers** — custom `create()` and `update()` methods to handle a 5-level deep model tree; DRF does not handle this automatically
- **`pop()` before `objects.create()`** — nested child data must be removed from `validated_data` before passing to `objects.create()` or Django throws an unknown field error
- **`enumerate()` for ordering** — array index becomes the `order` DB field, preserving sequence from React state
- **`setattr()` for dynamic field updates** — looping `validated_data.items()` and calling `setattr(instance, attr, value)` updates all flat fields without writing each one manually
- **Django ORM query interface** — `.objects.get()`, `.objects.create()`, `.all()`, `.filter()`, `.delete()`
- **`dj-database-url`** — parsing a `DATABASE_URL` environment variable into Django's `DATABASES` dict for production
- **Google OAuth with django-allauth** — `SocialApp` DB records, `SITE_ID`, allauth middleware, redirect URLs, and the cross-origin session cookie problem in production

### General
- **Environment variables** — separating secrets from code using `.env` locally and platform environment variables in production
- **CORS** — why cross-origin requests require explicit `CORS_ALLOWED_ORIGINS` and `credentials: 'include'` on both sides
- **Cross-origin session cookies** — browsers block third-party cookies by default; `SameSite=None; Secure=True` is required for cross-origin session auth to work
- **Deployment** — Vercel for static/frontend (zero config Vite detection), Render for Django (gunicorn, WhiteNoise, collectstatic, PostgreSQL)
- **`git log`, `git reset`, `git rm --cached`** — managing what gets tracked and reverting staged changes

---

## AI Usage Disclaimer

CSS styling for the form panel (colours, layout, button styles, spacing) was developed with AI assistance to save time and maintain focus on the core learning objectives of this project — React architecture, Django backend development, and full-stack integration. All React component logic, state management, Django models, serializers, views, URL configuration, and deployment were written and reasoned through independently.

---

## Author

**Llani Rainey** — [github.com/llani-rainey](https://github.com/llani-rainey)
