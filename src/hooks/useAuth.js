import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Module-level variable: persists across re-renders, lost on page refresh.
// Not in useState — token changes shouldn't trigger re-renders.
// Page refresh → silent refresh path below gets a new one from the httpOnly cookie.
let accessToken = null

/**
 * Returns the Authorization header object if a token is stored, otherwise {}.
 * Spread into fetch headers: { 'Content-Type': 'application/json', ...authHeaders() }
 */
export function authHeaders() {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

/**
 * Manages authentication state and token lifecycle.
 *
 * On mount, runs one of two paths:
 *   1. ?code= in URL → just came back from Google OAuth → exchange one-time code for JWT tokens
 *   2. No code → try silent refresh using the httpOnly refresh_token cookie
 *
 * Returns { user, setUser, authLoading, authError, handleLogout }
 */
export function useAuth() {
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [authError, setAuthError] = useState(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
            // PATH 1 — just came back from Google OAuth
            // Django redirected here with ?code=abc123 after successful login.
            // Remove the code from the URL immediately — don't leave it in browser history.
            window.history.replaceState({}, '', '/')

            fetch(`${API_URL}/api/token/exchange/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                // credentials: 'include' needed so Django can SET the httpOnly refresh_token cookie
                body: JSON.stringify({ code }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.access) {
                        accessToken = data.access
                        setUser('loggedIn')
                    } else {
                        setAuthError('Sign-in failed. Please try again.')
                    }
                    setAuthLoading(false)
                })
                .catch(() => {
                    setAuthError('Sign-in failed. Please try again.')
                    setAuthLoading(false)
                })
        } else {
            // PATH 2 — normal page load or refresh
            // Try silent refresh — use httpOnly refresh_token cookie to get a new access token.
            // User never sees a login prompt if they have a valid refresh token.
            fetch(`${API_URL}/api/token/refresh/`, {
                method: 'POST',
                credentials: 'include',
                // credentials: 'include' sends the httpOnly refresh_token cookie automatically
            })
                .then((res) => {
                    if (!res.ok) {
                        // No cookie or expired — user needs to log in
                        setUser(null)
                        setAuthLoading(false)
                        return null
                    }
                    return res.json()
                })
                .then((data) => {
                    if (!data) return
                    accessToken = data.access
                    setUser('loggedIn')
                    setAuthLoading(false)
                })
                .catch(() => {
                    setUser(null)
                    setAuthLoading(false)
                })
        }
    }, [])

    /**
     * Logs out the user by deleting the httpOnly cookie server-side
     * (JavaScript cannot delete httpOnly cookies directly).
     * Clears the in-memory access token and resets user state.
     */
    function handleLogout() {
        fetch(`${API_URL}/api/auth/logout/`, {
            method: 'POST',
            credentials: 'include',
            headers: authHeaders(),
        }).finally(() => {
            accessToken = null
            setUser(null)
        })
    }

    return { user, setUser, authLoading, authError, handleLogout }
}
