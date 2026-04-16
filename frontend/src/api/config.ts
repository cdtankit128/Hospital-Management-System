import axios from 'axios'

/**
 * Returns the backend base URL from the environment variable.
 * - When VITE_API_BASE_URL is set (e.g. Ngrok), returns the full URL (e.g. "https://abc123.ngrok-free.app")
 * - When not set (local dev), returns empty string so relative paths work with Vite proxy
 */
const ENV_BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
const IS_VERCEL_HOST = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')
const FORCE_SAME_ORIGIN = import.meta.env.VITE_FORCE_SAME_ORIGIN === 'true'

// On Vercel, prefer same-origin `/api` and proxy via vercel.json rewrites.
// This avoids client-side DNS resolution failures for Railway domains.
export const BACKEND_URL: string = (FORCE_SAME_ORIGIN || IS_VERCEL_HOST) ? '' : ENV_BACKEND_URL

/**
 * Whether we're running in Ngrok tunnel mode.
 */
export const IS_NGROK = BACKEND_URL.includes('ngrok')

// When using Ngrok, set the default header to skip the browser warning page
if (IS_NGROK) {
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'
}

/**
 * Prefixes a relative API path with the backend URL when using Ngrok tunneling.
 * In local dev mode, returns the path as-is (proxied by Vite).
 *
 * @example
 *   apiUrl('/api/auth/login') → '/api/auth/login'             (local)
 *   apiUrl('/api/auth/login') → 'https://xxx.ngrok-free.app/api/auth/login'  (Ngrok)
 */
export function apiUrl(path: string): string {
  return `${BACKEND_URL}${path}`
}
