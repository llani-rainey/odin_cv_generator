import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuth, authHeaders } from './useAuth'

// Replace the real fetch with a mock before each test so no real network calls are made.
// vi.stubGlobal makes fetch available globally (same as window.fetch) in jsdom.
beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
})

// Restore the real fetch and reset the URL after each test.
afterEach(() => {
    vi.unstubAllGlobals()
    window.history.pushState({}, '', '/')
})

// ─── authHeaders() ───────────────────────────────────────────────────────────
// authHeaders() reads the module-level accessToken variable.
// At the start of this file (fresh module) it is null.

describe('authHeaders', () => {
    it('returns {} when no token is stored', () => {
        expect(authHeaders()).toEqual({})
    })
})

// ─── PATH 2: silent refresh (no ?code= in URL) ───────────────────────────────
// Normal page load — no code in the URL bar, so useAuth tries the refresh cookie.

describe('useAuth — silent refresh (PATH 2)', () => {
    it('starts with authLoading true before fetch resolves', () => {
        // Never resolves — lets us inspect the initial state before anything settles
        fetch.mockReturnValueOnce(new Promise(() => {}))

        const { result } = renderHook(() => useAuth())

        expect(result.current.authLoading).toBe(true)
        expect(result.current.user).toBeNull()
    })

    it('sets user to loggedIn and authLoading to false when cookie is valid (200)', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access: 'test-token' }),
        })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.user).toBe('loggedIn')
            expect(result.current.authLoading).toBe(false)
        })
    })

    it('sets user to null and authLoading to false when no cookie exists (401)', async () => {
        // 401 is the normal "not logged in" case — no error message should appear
        fetch.mockResolvedValueOnce({ ok: false })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.user).toBeNull()
            expect(result.current.authLoading).toBe(false)
            expect(result.current.authError).toBeNull() // no error — 401 here is expected
        })
    })

    it('sets user to null and authLoading to false on network failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'))

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.user).toBeNull()
            expect(result.current.authLoading).toBe(false)
        })
    })

    it('calls /api/token/refresh/ with POST and credentials: include', async () => {
        fetch.mockResolvedValueOnce({ ok: false })

        renderHook(() => useAuth())

        await waitFor(() => expect(fetch).toHaveBeenCalled())

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/token/refresh/'),
            expect.objectContaining({ method: 'POST', credentials: 'include' }),
        )
    })
})

// ─── PATH 1: code exchange (redirected back from Google OAuth) ────────────────
// After Google OAuth, Django redirects to /?code=abc123.
// useAuth reads ?code= on mount and exchanges it for JWT tokens.

describe('useAuth — code exchange (PATH 1)', () => {
    beforeEach(() => {
        // Simulate the URL Django redirects to after Google login.
        // Must be set before renderHook so the useEffect reads it on mount.
        window.history.pushState({}, '', '/?code=abc123')
    })

    it('sets user to loggedIn on successful exchange', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access: 'test-token' }),
        })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.user).toBe('loggedIn')
            expect(result.current.authLoading).toBe(false)
        })
    })

    it('removes ?code= from the URL immediately (so it never sits in browser history)', async () => {
        // If the code stayed in the URL, hitting back could replay it — replaceState prevents that
        const replaceState = vi.spyOn(window.history, 'replaceState')
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access: 'test-token' }),
        })

        renderHook(() => useAuth())

        await waitFor(() => expect(replaceState).toHaveBeenCalledWith({}, '', '/'))
    })

    it('calls /api/token/exchange/ with the code in the request body', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access: 'test-token' }),
        })

        renderHook(() => useAuth())

        await waitFor(() => expect(fetch).toHaveBeenCalled())

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/token/exchange/'),
            expect.objectContaining({
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ code: 'abc123' }),
            }),
        )
    })

    it('sets authError when exchange response contains no access token', async () => {
        // Django might respond with { error: 'Invalid or expired code' } — no access key
        fetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Invalid or expired code' }),
        })

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.authError).toBe('Sign-in failed. Please try again.')
            expect(result.current.user).toBeNull()
            expect(result.current.authLoading).toBe(false)
        })
    })

    it('sets authError on network failure during exchange', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'))

        const { result } = renderHook(() => useAuth())

        await waitFor(() => {
            expect(result.current.authError).toBe('Sign-in failed. Please try again.')
            expect(result.current.authLoading).toBe(false)
        })
    })
})

// ─── handleLogout ─────────────────────────────────────────────────────────────
// handleLogout uses .finally() — it clears the token and sets user to null
// whether the logout request succeeds or fails (even if Django is down).

describe('useAuth — handleLogout', () => {
    it('sets user to null after successful logout', async () => {
        fetch
            .mockResolvedValueOnce({
                // mount: silent refresh succeeds
                ok: true,
                json: () => Promise.resolve({ access: 'test-token' }),
            })
            .mockResolvedValueOnce({ ok: true }) // logout request succeeds

        const { result } = renderHook(() => useAuth())
        await waitFor(() => expect(result.current.user).toBe('loggedIn'))

        act(() => result.current.handleLogout())

        // waitFor because handleLogout doesn't return its promise —
        // the .finally() state update is async, so we wait for it to land
        await waitFor(() => expect(result.current.user).toBeNull())
    })

    it('still sets user to null even if the logout request fails (network down)', async () => {
        // This is the key .finally() behaviour — user is always logged out client-side
        // even if the server never received the request
        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ access: 'test-token' }),
            })
            .mockResolvedValueOnce({ ok: false }) // logout request fails

        const { result } = renderHook(() => useAuth())
        await waitFor(() => expect(result.current.user).toBe('loggedIn'))

        act(() => result.current.handleLogout())

        await waitFor(() => expect(result.current.user).toBeNull())
    })

    it('calls /api/auth/logout/ with POST and credentials: include', async () => {
        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ access: 'test-token' }),
            })
            .mockResolvedValueOnce({ ok: true })

        const { result } = renderHook(() => useAuth())
        await waitFor(() => expect(result.current.user).toBe('loggedIn'))

        act(() => result.current.handleLogout())
        await waitFor(() => expect(result.current.user).toBeNull())

        expect(fetch).toHaveBeenLastCalledWith(
            expect.stringContaining('/api/auth/logout/'),
            expect.objectContaining({ method: 'POST', credentials: 'include' }),
        )
    })
})
