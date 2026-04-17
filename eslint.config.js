// eslint.config.js
// ESLint configuration — defines the rules ESLint uses when checking your frontend code
// ESLint is a linter — reads your JS/JSX files and flags potential bugs, bad patterns, unused variables etc
// this file tells ESLint what rules to enforce and which files to check

// imports — each is a plugin or helper that extends what ESLint can check
import js from '@eslint/js'                        // ESLint's own built-in recommended JS rules
import globals from 'globals'                       // provides lists of known global variables (window, document etc) so ESLint doesn't flag them as undefined
import reactHooks from 'eslint-plugin-react-hooks'  // rules specific to React hooks — catches violations like missing dependencies in useEffect
import reactRefresh from 'eslint-plugin-react-refresh' // rules for Vite's hot module replacement — warns if components aren't exported correctly for fast refresh to work
import { defineConfig, globalIgnores } from 'eslint/config' // helper functions from ESLint — defineConfig wraps your config for better type checking, globalIgnores excludes folders

export default defineConfig([
  globalIgnores(['dist']),  // tell ESLint to completely ignore the dist/ folder
                            // dist/ is your built production output — no point linting generated files

  {
    files: ['**/*.{js,jsx}'],  // only lint .js and .jsx files
                                // ** means any folder depth — matches src/App.jsx, src/hooks/useAuth.js etc

    extends: [
      js.configs.recommended,                    // ESLint's built-in recommended rules — catches common JS bugs like no-undef, no-unused-vars etc
      reactHooks.configs.flat.recommended,        // React hooks rules — e.g. hooks must be called at top level, not inside if statements or loops
      reactRefresh.configs.vite,                  // Vite-specific rules — components must be exported correctly for hot reload to work during development
    ],

    languageOptions: {
      ecmaVersion: 2020,          // tells ESLint which JS version your code uses — 2020 means ES2020 features like optional chaining (?.) are valid syntax
      globals: globals.browser,   // tells ESLint that browser globals like window, document, console, fetch exist
                                  // without this ESLint would flag every use of window or fetch as "undefined variable"
      parserOptions: {
        ecmaVersion: 'latest',          // parser uses latest JS syntax — lets you write modern JS without parse errors
        ecmaFeatures: { jsx: true },    // tells the parser to understand JSX syntax — without this <div> in JS files would be a parse error
        sourceType: 'module',           // tells ESLint your files use ES modules (import/export) not CommonJS (require)
      },
    },

    rules: {
      // rules override or extend what's in extends above
      // 'error' means ESLint blocks the commit and shows an error (vs 'warn' which just warns)
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // no-unused-vars — flags variables that are declared but never used (dead code)
      // varsIgnorePattern: '^[A-Z_]' — regex exception: ignore variables that START with a capital letter or underscore
      // why: React components must be imported to use in JSX even if not referenced directly in JS
      // e.g. import React from 'react' — React looks unused to ESLint but JSX needs it
      // the capital letter pattern lets those imports through without triggering the rule
    },
  },
])