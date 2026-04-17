// to know/handle when a user is logged in right now 1) either freshly logged in via Google or 2) refreshed the page (and was already logged in)

import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Module-level variable: persists across re-renders, lost on page refresh.
// Not in useState — token changes shouldn't trigger re-renders.
// Page refresh → silent refresh path below gets a new one from the httpOnly cookie.
let accessToken = null // we need to store it somewhere so that every future fetch call can include it in the Authorization header, so we write it into this modeule-levle variable at the top of the file. After login it it will get an actual value . Not exported, private to this file

/**
 * Returns the Authorization header object if a token is stored, otherwise {}.
 * Spread into fetch headers: { 'Content-Type': 'application/json', ...authHeaders() }
 */
export function authHeaders() {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {} 
    // Django backend has   djangorestframework-simplejwt installed, which is configured to look for incoming requests with exactly: "Authorizatoin: Bearer <token>" and must be this exact spelling, this is per HTTP requirements, standard header name so severs are built to look for this header name
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
    const [user, setUser] = useState(null) // either null or loggedIn
    const [authLoading, setAuthLoading] = useState(true) // starts true because when the app first loads it doesnt know yet, flips to false once it figures it out. App.jsx shows a loading screen until this is false
    const [authError, setAuthError] = useState(null) //  if something goes wrong during login, store the error message to show to the user

    useEffect(() => { // empty depedency array means this runs once on mount i.e the moment the app loads
        const params = new URLSearchParams(window.location.search) //URLSearchParams is a dictionary like object (has .get method) but with extra methods, (like .has or .getAll) will looke something like:
            //  {
            //     code: "abc123",
            //     state: "xyz"
            // }
        // window.location.search is whatever is in the URL bar after the ?. URLSearchParams and window.location.search are both built in to the browser window being the gloval object thats always avialalbe in any JS running in a browswer.
        //window.location is the current URL broken into parts
        // i.e window.location.hred (full url), window.location.origin (just the domain), window.location.search (everything from ? onwards)
        //URLSearchParams is also built in, it takes the raw string i.e "?code=abc123" and parses it into something  we can work with, it handles the ?, the =, and if there were multiple params like ?code=abc123&state=xyz ut handles the & splitting too
        const code = params.get('code')

        if (code) {
            // PATH 1 — just came back from Google OAuth
            // Django redirected here with ?code=abc123 after successful login.
            // Remove the code from the URL immediately — don't leave it in browser history.
            window.history.replaceState({}, '', '/') // built in method on window.history - replaceState(state, title, url) approach is specifically chosen over window.location.href = '/' because it removes the code without adding an entry to browser history — so the back button doesn't take you to the URL with the code in it, and prevents reuse attempts and better user experience. Effectively just change the URL bar to show / right now, don't reload anything, don't add a history entry.

            fetch(`${API_URL}/api/token/exchange/`, {
                method: 'POST', // lets frontend talk to backend, post because we're sending data not requesting data
                headers: { 'Content-Type': 'application/json' }, // the data we're sending is JSON format
                credentials: 'include', // tells the browswer to send/receive cookies with this request, needed here because Django needs to set the httpOnly refresh token cookie in the response 
                // credentials: 'include' needed so Django can SET the httpOnly refresh_token cookie
                body: JSON.stringify({ code }), // short hand for {code: code}, converts it from a JS object to a JSON string because HTTP bodies are text
            })
                .then((res) => res.json()) // fetch doesnt return the data directly, it returns a Promise. when the browser receives an http resposne ,ti doesnt wait for the entire body to arrive before giving you the res object, it gives you res as soon as the headers arrive because theyre small and the body might still be downloading, rule of thumb is only make somethign async when it actually needs to wait for somethign outside the JS engine (i.e network requests (fetch, api calls), file system reads/writes, timers (setTimeout), database queries, these are slow because they depend on things outside JS - the network, the OS, the disk)
                .then((data) => { // each then returns whatever the previous step returned and we give a that parameter whatever names make sense at that stage. This '.then' is a mechanical requirement in the Promise chaining, u need another .then() to unwrap it and get the actual value out, its not waiting for anything network related but because res.json() returns a promise, we're not waiting for anything new ratehr than it being a genuine async operation
                    if (data.access) {
                        accessToken = data.access // data.access is the JWT token string which is truthy, if it exists, store it and mark user as logged in, if it failed Django might send back {'error': 'Invalid or expired code'} (defined by us in core/urls.py - see exchange_code function) - no access key, so data.access is undefined which is falsy -> show the error message
                        setUser('loggedIn') 
                    } else { // Django responded but login failed
                        setAuthError('Sign-in failed. Please try again.')
                    }
                    setAuthLoading(false)
                })
                .catch(() => { // Django never responded at all / network is down, server is dead, request never compelted 
                    setAuthError('Sign-in failed. Please try again.')
                    setAuthLoading(false)
                })
        } else {
            // PATH 2 — normal page load or refresh
            // no ?code= in URL → user either already has a session or has never logged in
            // only clue we have is whether a valid refresh_token cookie exists in the browser
            // send request to Django saying "here's my cookie, is it still valid?"
            // user never sees a login prompt if cookie is valid — completely silent
            fetch(`${API_URL}/api/token/refresh/`, {
                method: 'POST',
                // no body — nothing to send, cookie is the only thing Django needs
                credentials: 'include',
                // credentials: 'include' — tells browser to attach the httpOnly refresh_token cookie automatically
                // JS can never read httpOnly cookies directly — browser attaches them invisibly
            })
                .then((res) => {
                    // res = raw HTTP response — status code and headers, body not yet read
                    // check status BEFORE parsing — unlike path 1 which always has a parseable body,
                    // path 2's failure case (no cookie) returns a 401 with no useful body to parse
                    if (!res.ok) {
                        // res.ok is false — status was 401 (no cookie or expired)
                        // completely normal expected case — user simply isn't logged in
                        // no error message needed — login button appearing is enough
                        setUser(null)           // nobody logged in → login button shows in App.jsx
                        setAuthLoading(false)   // done figuring it out → app renders
                        return null             // passes null to next .then() as signal: nothing to do, stop here
                    }
                    // res.ok is true — cookie was valid, Django returned 200 with fresh access token
                    // { access: "eyJ0eXAiOiJKV1..." }
                    return res.json()           // parse body → pass to next .then()
                })
                .then((data) => {
                    // data is whatever previous .then() returned:
                    // null  → !res.ok was true, setUser(null) already called, nothing to do
                    // { access: "eyJ..." } → cookie was valid, store token and log in
                    if (!data) return   // guard — without this, null.access would crash
                    // cookie was valid — silently log user back in
                    accessToken = data.access   // store fresh JWT in module-level variable so authHeaders() can use it
                    setUser('loggedIn')         // triggers useEffect([user]) in App.jsx → CV fetch starts → user sees their CV
                    setAuthLoading(false)       // done → app renders
                })
                .catch(() => {
                    // only runs if fetch itself completely died — network down, Django server crashed
                    // not the user's fault — treat as logged out, show login button, no error message
                    setUser(null)
                    setAuthLoading(false)
                })
        }
    }, [])  // [] — empty dependency array, run once on mount only, never again

    /**
     * Logs out the user by deleting the httpOnly cookie server-side
     * (JavaScript cannot delete httpOnly cookies directly).
     * Clears the in-memory access token and resets user state.
     */
    function handleLogout() {
        // called by App.jsx's own handleLogout() which also resets CV state (personalInfo, sections etc)
        // this function only handles the auth side — token, cookie, user state
        // App.jsx wraps this as authLogout() to avoid naming clash with its own handleLogout
        fetch(`${API_URL}/api/auth/logout/`, {
            method: 'POST',
            credentials: 'include',
            // credentials: 'include' — sends the httpOnly refresh_token cookie so Django can delete it
            // JS cannot delete httpOnly cookies directly — only the server can
            headers: authHeaders(),
            // authHeaders() spreads { Authorization: 'Bearer eyJ...' } into headers
            // tells Django who is logging out
        }).finally(() => {
            // .finally() runs whether the request succeeded OR failed
            // even if Django is down, user still gets logged out on the frontend
            // contrast with .then() which only runs on success
            accessToken = null  // wipe JWT from module-level variable — authHeaders() now returns {}
            setUser(null)       // React re-renders → login button appears in App.jsx
        })
    }

    return { user, setUser, authLoading, authError, handleLogout } // deliberate public interface, when App.jsx calls this function - useAuth() it only gets back what useAuth explicitly returns, everything else inside this function (the fetch calls, the internal logic etc stays private inside the function).

// same as / shorthand for (when key and value are the same), with an obejct literal wrapping it for ease of destructuring on the other end when calling this function in App.jsx
//     { user: user,                    // value: null or 'loggedIn'
//       setUser: setUser,              // function: call it to change user e.g setUser('loggedIn') or setUser(null)
//       authLoading: authLoading,      // value: true or false
//       authError: authError,          // value: null or 'Sign-in failed. Please try again.' (the error string)
//       handleLogout: handleLogout }   // function: call it to log out e.g handleLogout()


// can destructure in App.jsx like so:
// const { user } = useAuth() i.e user is just a value either null or 'loggedIn'

//example 2: more important , renaming the function elsewhere but that creating the same named function 'handleLogout' but could have been called anything, calling the function within it, and adding other behaviour required for handleLogout in App.jsx

// const { handleLogout: authLogout } = useAuth().  - ESSENTIALY RENAMES HANDLELOGOUT TO AUTHLOGOUT IN THE DESTRUCTURE PROCESS
// handleLogout from useAuth now lives under the name authLogout
// authLogout() = clears token, deletes cookie, setUser(null)

// function handleLogout() {
// brand new function, just happens to be called handleLogout
// no clash because the original was renamed to authLogout above
//     authLogout()                                // calls the original useAuth one
//     setHasSavedCV(false)                        // extra CV stuff
//     setPersonalInfo(SHERLOCK_DATA.personalInfo)
//     setSections(SHERLOCK_DATA.sections)
// }


}
