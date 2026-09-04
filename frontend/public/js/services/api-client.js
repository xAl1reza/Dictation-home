/*
 * Shared HTTP client for the real backend API.
 *
 * Authentication is cookie-based:
 * - the backend owns the session token
 * - the token is stored in an HttpOnly cookie
 * - frontend JavaScript never reads or writes the auth token
 *
 * All HTTP operations use async/await.
 */

;(() => {
  const LEGACY_TOKEN_STORAGE_KEY = 'dikteh-khooneh-auth-token'

  const isLocalHost = ['localhost', '127.0.0.1'].includes(
    window.location.hostname
  )

  const localApiBaseUrl = `http://${window.location.hostname}/dictation-home/backend/public/api/v1`

  const API_BASE_URL = String(
    window.APP_API_BASE_URL || (isLocalHost ? localApiBaseUrl : '/api/v1')
  ).replace(/\/+$/, '')

  const API_DEBUG = false

  class ApiError extends Error {
    constructor({
      code = 'API_REQUEST_FAILED',
      status = 0,
      serverMessage = '',
      errors = [],
      method = '',
      path = '',
      cause = null,
    } = {}) {
      super(code)

      this.name = 'ApiError'
      this.code = code
      this.status = Number(status || 0)
      this.serverMessage = serverMessage || ''
      this.errors = Array.isArray(errors) ? errors : []
      this.method = method
      this.path = path
      this.cause = cause
    }
  }

  const log = (...args) => {
    if (!API_DEBUG) return
    console.info(...args)
  }

  const warn = (...args) => {
    if (!API_DEBUG) return
    console.warn(...args)
  }

  /*
   * One-time migration cleanup.
   * Old Bearer tokens must not remain readable by JavaScript.
   */
  const removeLegacyBearerToken = () => {
    try {
      if (localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)) {
        localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)

        log('[API:AUTH] legacy localStorage bearer token removed')
      }
    } catch (error) {
      warn('[API:AUTH] legacy token cleanup could not access localStorage')
    }
  }

  const buildUrl = (path, query = null) => {
    const normalizedPath = String(path || '').startsWith('/')
      ? String(path)
      : `/${String(path || '')}`

    const url = new URL(`${API_BASE_URL}${normalizedPath}`)

    if (query && typeof query === 'object') {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return
        }

        url.searchParams.set(key, String(value))
      })
    }

    return url.toString()
  }

  const parsePayload = async (response, method, path) => {
    const contentType = response.headers.get('content-type') || ''

    if (!contentType.toLowerCase().includes('application/json')) {
      throw new ApiError({
        code: 'API_INVALID_RESPONSE',
        status: response.status,
        method,
        path,
      })
    }

    try {
      const payload = await response.json()

      return payload
    } catch (error) {
      throw new ApiError({
        code: 'API_INVALID_RESPONSE',
        status: response.status,
        method,
        path,
        cause: error,
      })
    }
  }

  const request = async (
    path,
    {
      method = 'GET',
      body,
      query = null,
      auth = true,
      headers = {},
      signal,
    } = {}
  ) => {
    const normalizedMethod = String(method || 'GET').toUpperCase()

    const requestHeaders = new Headers(headers)

    let requestBody = body

    if (
      body !== undefined &&
      body !== null &&
      !(body instanceof FormData) &&
      typeof body === 'object'
    ) {
      requestHeaders.set('Content-Type', 'application/json')

      requestBody = JSON.stringify(body)
    }

    log(
      `[API] → ${normalizedMethod} ${path}` +
        ` | session=${auth ? 'cookie' : 'public'}`
    )

    let response

    try {
      response = await fetch(buildUrl(path, query), {
        method: normalizedMethod,
        headers: requestHeaders,

        /*
         * Required for cross-origin development such as:
         * frontend: http://127.0.0.1:5578
         * backend:  http://127.0.0.1
         *
         * It also allows the browser to accept Set-Cookie
         * from the login response.
         */
        credentials: 'include',

        body:
          normalizedMethod === 'GET' || normalizedMethod === 'HEAD'
            ? undefined
            : requestBody,

        signal,
        cache: 'no-store',
      })
    } catch (error) {
      warn(`[API] ✕ NETWORK ${normalizedMethod} ${path}`)

      throw new ApiError({
        code: 'API_NETWORK_ERROR',
        status: 0,
        method: normalizedMethod,
        path,
        cause: error,
      })
    }

    const payload = await parsePayload(response, normalizedMethod, path)

    log(`[API] ← ${response.status} ` + `${normalizedMethod} ${path}`)

    if (!response.ok || payload?.success !== true) {
      const serverMessage = String(payload?.message || '').trim()

      warn(
        `[API] request failed: ` +
          `${normalizedMethod} ${path}` +
          ` | status=${response.status}` +
          ` | code=${serverMessage || 'UNKNOWN'}`
      )

      if (auth && response.status === 401) {
        window.dispatchEvent(
          new CustomEvent('app:auth-expired', {
            detail: {
              path,
              status: response.status,
            },
          })
        )
      }

      throw new ApiError({
        code: serverMessage || `HTTP_${response.status}`,
        status: response.status,
        serverMessage,
        errors: payload?.errors,
        method: normalizedMethod,
        path,
      })
    }

    return payload?.data
  }

  const get = async (path, options = {}) => {
    const data = await request(path, {
      ...options,
      method: 'GET',
    })

    return data
  }

  const post = async (path, body, options = {}) => {
    const data = await request(path, {
      ...options,
      method: 'POST',
      body,
    })

    return data
  }

  const patch = async (path, body, options = {}) => {
    const data = await request(path, {
      ...options,
      method: 'PATCH',
      body,
    })

    return data
  }

  const remove = async (path, options = {}) => {
    const data = await request(path, {
      ...options,
      method: 'DELETE',
    })

    return data
  }

  removeLegacyBearerToken()

  log(`[API] client ready: ${API_BASE_URL}`)

  log('[API:AUTH] HttpOnly cookie session mode enabled')

  window.apiClient = Object.freeze({
    ApiError,
    API_BASE_URL,
    API_DEBUG,

    request,
    get,
    post,
    patch,
    delete: remove,

    log,
    warn,
  })
})()
