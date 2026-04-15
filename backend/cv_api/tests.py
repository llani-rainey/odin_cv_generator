from __future__ import annotations

import json
from unittest.mock import patch

import factory
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Bullet, CV, Entry, HeaderLink, Section


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------

class UserFactory(factory.django.DjangoModelFactory):
    """Creates a Django User with a unique username and email."""
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')


class CVFactory(factory.django.DjangoModelFactory):
    """Creates a CV linked to a UserFactory user."""
    class Meta:
        model = CV

    user = factory.SubFactory(UserFactory)
    name = 'Test User'
    title = 'Software Engineer'
    email = factory.LazyAttribute(lambda obj: obj.user.email)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def auth_header(user: User) -> dict[str, str]:
    """Return a JWT Bearer Authorization header for the given user."""
    refresh = RefreshToken.for_user(user)
    return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------

class CVModelTests(TestCase):
    """Unit tests for model __str__ methods and basic relationships."""

    def test_cv_str(self) -> None:
        cv = CVFactory(name='Sherlock Holmes')
        self.assertEqual(str(cv), 'CV of Sherlock Holmes')

    def test_cv_linked_to_user(self) -> None:
        user = UserFactory()
        cv = CVFactory(user=user)
        self.assertEqual(cv.user, user)

    def test_header_link_str(self) -> None:
        cv = CVFactory()
        link = HeaderLink.objects.create(cv=cv, label='GitHub', url='https://github.com')
        self.assertEqual(str(link), 'GitHub (https://github.com)')

    def test_section_str(self) -> None:
        cv = CVFactory()
        section = Section.objects.create(cv=cv, title='Experience', type='experience', order=0)
        self.assertEqual(str(section), 'Experience (experience)')

    def test_bullet_str(self) -> None:
        cv = CVFactory()
        section = Section.objects.create(cv=cv, title='Experience', type='experience', order=0)
        entry = Entry.objects.create(section=section, order=0)
        bullet = Bullet.objects.create(entry=entry, text='Built a CI pipeline', order=0)
        self.assertEqual(str(bullet), 'Built a CI pipeline')

    def test_entry_str_falls_back_gracefully(self) -> None:
        cv = CVFactory()
        section = Section.objects.create(cv=cv, title='Generic', type='generic', order=0)
        entry = Entry.objects.create(section=section, subheading='Side Project', order=0)
        self.assertEqual(str(entry), 'Side Project')


# ---------------------------------------------------------------------------
# CV API tests — GET /api/cv/
# ---------------------------------------------------------------------------

class CVGetTests(TestCase):
    """Integration tests for GET /api/cv/."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = UserFactory()
        self.cv = CVFactory(user=self.user, name='Jane Doe')

    def test_get_cv_authenticated_returns_200(self) -> None:
        response = self.client.get('/api/cv/', **auth_header(self.user))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Jane Doe')

    def test_get_cv_unauthenticated_returns_401(self) -> None:
        response = self.client.get('/api/cv/')
        self.assertEqual(response.status_code, 401)

    def test_get_cv_no_cv_for_user_returns_404(self) -> None:
        new_user = UserFactory()
        response = self.client.get('/api/cv/', **auth_header(new_user))
        self.assertEqual(response.status_code, 404)


# ---------------------------------------------------------------------------
# CV API tests — POST /api/cv/
# ---------------------------------------------------------------------------

MINIMAL_CV_PAYLOAD: dict = {
    'name': 'Jane Doe',
    'title': 'Developer',
    'location': '',
    'phone': '',
    'email': '',
    'address': '',
    'visaStatus': '',
    'font': 'Arial',
    'fontSize': '11px',
    'margins': 'narrow',
    'accentColor': '#000000',
    'links': [],
    'sections': [],
}


class CVPostTests(TestCase):
    """Integration tests for POST /api/cv/."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = UserFactory()

    def test_post_cv_authenticated_creates_cv(self) -> None:
        response = self.client.post(
            '/api/cv/', MINIMAL_CV_PAYLOAD, format='json', **auth_header(self.user)
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(CV.objects.filter(user=self.user).exists())

    def test_post_cv_authenticated_updates_existing_cv(self) -> None:
        CVFactory(user=self.user, name='Old Name')
        payload = {**MINIMAL_CV_PAYLOAD, 'name': 'Updated Name'}
        response = self.client.post(
            '/api/cv/', payload, format='json', **auth_header(self.user)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(CV.objects.get(user=self.user).name, 'Updated Name')

    def test_post_cv_unauthenticated_returns_401(self) -> None:
        response = self.client.post('/api/cv/', MINIMAL_CV_PAYLOAD, format='json')
        self.assertEqual(response.status_code, 401)

    def test_post_cv_with_nested_sections_and_bullets(self) -> None:
        payload = {
            **MINIMAL_CV_PAYLOAD,
            'sections': [
                {
                    'title': 'Experience',
                    'type': 'experience',
                    'order': 0,
                    'entries': [
                        {
                            'jobTitle': 'Engineer',
                            'company': 'Acme',
                            'companyURL': '',
                            'location': 'London',
                            'startDate': '2023',
                            'endDate': 'Present',
                            'text': '',
                            'order': 0,
                            'bullets': [
                                {'text': 'Built things', 'order': 0},
                            ],
                        }
                    ],
                }
            ],
        }
        response = self.client.post(
            '/api/cv/', payload, format='json', **auth_header(self.user)
        )
        self.assertEqual(response.status_code, 200)
        cv = CV.objects.get(user=self.user)
        self.assertEqual(cv.sections.count(), 1)
        self.assertEqual(cv.sections.first().entries.first().bullets.count(), 1)


# ---------------------------------------------------------------------------
# Auth view tests
# ---------------------------------------------------------------------------

class TokenExchangeTests(TestCase):
    """Integration tests for POST /api/token/exchange/."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = UserFactory()

    @patch('core.urls.redis_client')
    def test_valid_code_returns_access_token_and_sets_cookie(self, mock_redis) -> None:
        refresh = RefreshToken.for_user(self.user)
        tokens = {'access': str(refresh.access_token), 'refresh': str(refresh)}
        mock_redis.getdel.return_value = json.dumps(tokens).encode()

        response = self.client.post(
            '/api/token/exchange/', {'code': 'validcode'}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh_token', response.cookies)

    @patch('core.urls.redis_client')
    def test_invalid_code_returns_400(self, mock_redis) -> None:
        mock_redis.getdel.return_value = None
        response = self.client.post(
            '/api/token/exchange/', {'code': 'badcode'}, format='json'
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_code_returns_400(self) -> None:
        response = self.client.post('/api/token/exchange/', {}, format='json')
        self.assertEqual(response.status_code, 400)


class TokenRefreshTests(TestCase):
    """Integration tests for POST /api/token/refresh/."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = UserFactory()

    def test_valid_cookie_returns_new_access_token(self) -> None:
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['refresh_token'] = str(refresh)
        response = self.client.post('/api/token/refresh/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_missing_cookie_returns_401(self) -> None:
        response = self.client.post('/api/token/refresh/')
        self.assertEqual(response.status_code, 401)

    def test_invalid_token_returns_401(self) -> None:
        self.client.cookies['refresh_token'] = 'not.a.valid.jwt'
        response = self.client.post('/api/token/refresh/')
        self.assertEqual(response.status_code, 401)


class LogoutTests(TestCase):
    """Integration tests for POST /api/auth/logout/."""

    def setUp(self) -> None:
        self.client = APIClient()

    def test_logout_returns_200(self) -> None:
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['detail'], 'Logged out')

    def test_logout_clears_refresh_cookie(self) -> None:
        self.client.cookies['refresh_token'] = 'sometoken'
        response = self.client.post('/api/auth/logout/')
        # Django marks the cookie as expired/deleted by setting max_age=0
        cookie = response.cookies.get('refresh_token')
        self.assertIsNotNone(cookie)
        self.assertEqual(cookie['max-age'], 0)
