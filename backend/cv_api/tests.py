from __future__ import annotations

import json
from unittest.mock import (
    patch,
)  # lets us fake external dependencies (like Redis) so tests don't need real infrastructure

import factory  # factory_boy — generates test data (fake users, CVs etc) without writing repetitive setUp code
from django.contrib.auth.models import User
from django.test import (
    TestCase,
)  # Django's base test class — each test gets a fresh DB, wiped after
from rest_framework.test import (
    APIClient,
)  # fake HTTP client — simulates React sending requests to Django without a real browser
from rest_framework_simplejwt.tokens import (
    RefreshToken,
)  # generates real JWT tokens for test users

from .models import Bullet, CV, Entry, HeaderLink, Section

# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------
# factories are blueprints for creating test data
# instead of writing User.objects.create(username='user1', email='user1@example.com'...) in every test
# you just write UserFactory() and it handles the repetitive bits automatically


class UserFactory(factory.django.DjangoModelFactory):
    """Creates a Django User with a unique username and email."""

    class Meta:
        model = User  # tells factory_boy which model to create

    username = factory.Sequence(
        lambda n: f"user{n}"
    )  # generates unique usernames: user0, user1, user2...
    # Sequence increments n each time factory is called
    # prevents unique constraint violations if multiple users created in one test
    email = factory.Sequence(
        lambda n: f"user{n}@example.com"
    )  # same pattern — unique emails
    password = factory.PostGenerationMethodCall("set_password", "testpass123")
    # PostGenerationMethodCall — runs set_password() after the user object is created
    # set_password() hashes the password properly — same as real Django auth


class CVFactory(factory.django.DjangoModelFactory):
    """Creates a CV linked to a UserFactory user."""

    class Meta:
        model = CV

    user = factory.SubFactory(
        UserFactory
    )  # SubFactory — automatically creates a User first, then links it to the CV
    # so CVFactory() creates both a User AND a CV in one call
    name = "Test User"
    title = "Software Engineer"
    email = factory.LazyAttribute(lambda obj: obj.user.email)
    # LazyAttribute — computed at creation time using the already-created object
    # obj.user.email reads the email from the User that SubFactory just created
    # so CV email always matches the linked User email


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def auth_header(user: User) -> dict[str, str]:
    """Return a JWT Bearer Authorization header for the given user."""
    refresh = RefreshToken.for_user(
        user
    )  # generates a real JWT token pair for this user
    return {"HTTP_AUTHORIZATION": f"Bearer {refresh.access_token}"}
    # HTTP_AUTHORIZATION — Django test client format for setting headers
    # equivalent to React sending: { Authorization: 'Bearer eyJ...' }
    # spread into requests with ** e.g. self.client.get('/api/cv/', **auth_header(self.user))


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------
# unit tests — test individual model methods in isolation
# no HTTP requests, no serializers — just: create a model object, check its behaviour


class CVModelTests(TestCase):
    """Unit tests for model __str__ methods and basic relationships."""

    # TestCase — each test method gets a completely fresh database
    # Django wraps each test in a transaction and rolls it back after
    # so data created in one test never bleeds into another

    def test_cv_str(self) -> None:
        # tests that CV.__str__ returns the expected string
        cv = CVFactory(name="Sherlock Holmes")  # override factory default name
        self.assertEqual(str(cv), "CV of Sherlock Holmes")
        # assertEqual — test passes if both values are equal, fails with a clear message if not

    def test_cv_linked_to_user(self) -> None:
        user = UserFactory()
        cv = CVFactory(
            user=user
        )  # pass specific user instead of letting SubFactory create one
        self.assertEqual(cv.user, user)  # check the FK relationship is correct

    def test_header_link_str(self) -> None:
        cv = CVFactory()
        link = HeaderLink.objects.create(
            cv=cv, label="GitHub", url="https://github.com"
        )
        self.assertEqual(str(link), "GitHub (https://github.com)")

    def test_section_str(self) -> None:
        cv = CVFactory()
        section = Section.objects.create(
            cv=cv, title="Experience", type="experience", order=0
        )
        self.assertEqual(str(section), "Experience (experience)")

    def test_bullet_str(self) -> None:
        cv = CVFactory()
        section = Section.objects.create(
            cv=cv, title="Experience", type="experience", order=0
        )
        entry = Entry.objects.create(section=section, order=0)
        bullet = Bullet.objects.create(entry=entry, text="Built a CI pipeline", order=0)
        self.assertEqual(str(bullet), "Built a CI pipeline")

    def test_entry_str_falls_back_gracefully(self) -> None:
        # tests that Entry.__str__ works even when jobTitle is empty
        # 'falls back gracefully' — doesn't crash when optional fields are missing
        cv = CVFactory()
        section = Section.objects.create(
            cv=cv, title="Generic", type="generic", order=0
        )
        entry = Entry.objects.create(
            section=section, subheading="Side Project", order=0
        )
        self.assertEqual(str(entry), "Side Project")


# ---------------------------------------------------------------------------
# CV API tests — GET /api/cv/
# ---------------------------------------------------------------------------
# integration tests — test the full request/response cycle
# request goes through: APIClient → urls.py → views.py → serializer → DB → back up
# closer to real usage than unit tests but slower


class CVGetTests(TestCase):
    """Integration tests for GET /api/cv/."""

    def setUp(self) -> None:
        # setUp runs before EVERY test method in this class
        # creates fresh data for each test — tests must never depend on each other's data
        self.client = APIClient()  # fake HTTP client — simulates React's fetch()
        self.user = UserFactory()  # creates a real user in the test DB
        self.cv = CVFactory(
            user=self.user, name="Jane Doe"
        )  # creates a CV linked to that user

    def test_get_cv_authenticated_returns_200(self) -> None:
        # happy path — logged in user requests their CV
        response = self.client.get("/api/cv/", **auth_header(self.user))
        # **auth_header(self.user) spreads { HTTP_AUTHORIZATION: 'Bearer eyJ...' } into the request
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["name"], "Jane Doe"
        )  # checks the right CV came back

    def test_get_cv_unauthenticated_returns_401(self) -> None:
        # no auth header — should be rejected
        response = self.client.get("/api/cv/")
        self.assertEqual(response.status_code, 401)  # 401 = unauthorised

    def test_get_cv_no_cv_for_user_returns_404(self) -> None:
        # logged in but no CV saved yet — should get 404 not a crash
        new_user = UserFactory()  # new user with no CV
        response = self.client.get("/api/cv/", **auth_header(new_user))
        self.assertEqual(response.status_code, 404)


# ---------------------------------------------------------------------------
# CV API tests — POST /api/cv/
# ---------------------------------------------------------------------------

MINIMAL_CV_PAYLOAD: dict = {
    # reusable test payload — minimum valid data the CVSerializer accepts
    # defined at module level so all POST tests can share and extend it
    # tests spread this and override specific fields: {**MINIMAL_CV_PAYLOAD, 'name': 'Other Name'}
    "name": "Jane Doe",
    "title": "Developer",
    "location": "",
    "phone": "",
    "email": "",
    "address": "",
    "visaStatus": "",
    "font": "Arial",
    "fontSize": "11px",
    "margins": "narrow",
    "accentColor": "#000000",
    "links": [],
    "sections": [],
}


class CVPostTests(TestCase):
    """Integration tests for POST /api/cv/."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = (
            UserFactory()
        )  # no CV created here — POST tests create CVs themselves

    def test_post_cv_authenticated_creates_cv(self) -> None:
        # happy path — logged in user saves a CV for the first time
        response = self.client.post(
            "/api/cv/", MINIMAL_CV_PAYLOAD, format="json", **auth_header(self.user)
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(CV.objects.filter(user=self.user).exists())
        # .exists() — returns True if any matching rows found in DB
        # checks the CV was actually written to DB, not just that the response said 200

    def test_post_cv_authenticated_updates_existing_cv(self) -> None:
        # tests the update path — user already has a CV, saving again should update not create a duplicate
        CVFactory(user=self.user, name="Old Name")  # existing CV
        payload = {
            **MINIMAL_CV_PAYLOAD,
            "name": "Updated Name",
        }  # spread + override name
        response = self.client.post(
            "/api/cv/", payload, format="json", **auth_header(self.user)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(CV.objects.get(user=self.user).name, "Updated Name")
        # .get() — returns exactly one object, raises exception if 0 or 2+ found
        # if two CVs existed for this user .get() would crash — implicitly tests no duplicate was created

    def test_post_cv_unauthenticated_returns_401(self) -> None:
        response = self.client.post("/api/cv/", MINIMAL_CV_PAYLOAD, format="json")
        self.assertEqual(response.status_code, 401)

    def test_post_cv_with_nested_sections_and_bullets(self) -> None:
        # tests the full nested tree — sections → entries → bullets all created correctly
        # most complex test — verifies the nested serializer create() logic works end to end
        payload = {
            **MINIMAL_CV_PAYLOAD,
            "sections": [
                {
                    "title": "Experience",
                    "type": "experience",
                    "order": 0,
                    "entries": [
                        {
                            "jobTitle": "Engineer",
                            "company": "Acme",
                            "companyURL": "",
                            "location": "London",
                            "startDate": "2023",
                            "endDate": "Present",
                            "text": "",
                            "order": 0,
                            "bullets": [
                                {"text": "Built things", "order": 0},
                            ],
                        }
                    ],
                }
            ],
        }
        response = self.client.post(
            "/api/cv/", payload, format="json", **auth_header(self.user)
        )
        self.assertEqual(response.status_code, 200)
        cv = CV.objects.get(user=self.user)
        self.assertEqual(cv.sections.count(), 1)  # one section created
        self.assertEqual(cv.sections.first().entries.first().bullets.count(), 1)
        # chains down the tree: cv → sections → first section → entries → first entry → bullets
        # verifies the whole nested structure was written to DB correctly


# ---------------------------------------------------------------------------
# Auth view tests
# ---------------------------------------------------------------------------


class TokenExchangeTests(TestCase):
    """Integration tests for POST /api/token/exchange/."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = UserFactory()

    @patch(
        "core.urls.redis_client"
    )  # decorator — replaces the real redis_client with a fake mock object for this test
    # 'core.urls.redis_client' is the exact import path to mock
    # without this the test would need a real Redis server running
    def test_valid_code_returns_access_token_and_sets_cookie(self, mock_redis) -> None:
        # mock_redis is the fake Redis object injected by @patch
        refresh = RefreshToken.for_user(self.user)
        tokens = {"access": str(refresh.access_token), "refresh": str(refresh)}
        mock_redis.getdel.return_value = json.dumps(tokens).encode()
        # mock_redis.getdel.return_value — tells the fake Redis what to return when getdel() is called
        # simulates Redis having a valid code stored
        # .encode() converts string to bytes — same as what real Redis returns

        response = self.client.post(
            "/api/token/exchange/", {"code": "validcode"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)  # access token in response body
        self.assertIn("refresh_token", response.cookies)  # refresh token set as cookie
        # assertIn — checks key exists in dict/object, doesn't care about the value

    @patch("core.urls.redis_client")
    def test_invalid_code_returns_400(self, mock_redis) -> None:
        mock_redis.getdel.return_value = (
            None  # simulates Redis returning nothing — code not found or expired
        )
        response = self.client.post(
            "/api/token/exchange/", {"code": "badcode"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_code_returns_400(self) -> None:
        # no @patch needed — request fails before Redis is even called
        response = self.client.post("/api/token/exchange/", {}, format="json")
        self.assertEqual(response.status_code, 400)


class TokenRefreshTests(TestCase):
    """Integration tests for POST /api/token/refresh/."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = UserFactory()

    def test_valid_cookie_returns_new_access_token(self) -> None:
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies["refresh_token"] = str(refresh)
        # manually set the cookie on the test client — simulates browser sending the httpOnly cookie
        response = self.client.post("/api/token/refresh/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_missing_cookie_returns_401(self) -> None:
        # no cookie set — simulates first visit or logged out user
        response = self.client.post("/api/token/refresh/")
        self.assertEqual(response.status_code, 401)

    def test_invalid_token_returns_401(self) -> None:
        self.client.cookies["refresh_token"] = "not.a.valid.jwt"
        # cookie exists but contains garbage — simulates tampered or corrupted cookie
        response = self.client.post("/api/token/refresh/")
        self.assertEqual(response.status_code, 401)


class LogoutTests(TestCase):
    """Integration tests for POST /api/auth/logout/."""

    def setUp(self) -> None:
        self.client = APIClient()
        # no user needed — logout endpoint accepts unauthenticated requests
        # if you're already logged out and hit logout, it should still return 200 gracefully

    def test_logout_returns_200(self) -> None:
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["detail"], "Logged out")

    def test_logout_clears_refresh_cookie(self) -> None:
        self.client.cookies["refresh_token"] = "sometoken"
        response = self.client.post("/api/auth/logout/")
        cookie = response.cookies.get("refresh_token")
        self.assertIsNotNone(cookie)  # cookie exists in response
        self.assertEqual(cookie["max-age"], 0)
        # max-age=0 is how HTTP cookie deletion works — there's no actual delete command in HTTP
        # server sets max-age to 0 meaning "this cookie is already expired"
        # browser receives it and throws the cookie away
