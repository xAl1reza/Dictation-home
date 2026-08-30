/*
 * Local authentication service used by the current frontend prototype.
 *
 * Public methods are async on purpose so the implementation can later be
 * replaced with HTTP requests without changing the page controller.
 *
 * IMPORTANT: this local implementation is for prototype/offline usage only.
 * Production authentication must be handled by the backend.
 */

;(() => {
  const USERNAME_MIN_LENGTH = 3
  const USERNAME_MAX_LENGTH = 30
  const PASSWORD_MIN_LENGTH = 8
  const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

  const getPasswordRequirements = (password) => {
    const value = String(password || '')

    return {
      minLength: value.length >= PASSWORD_MIN_LENGTH,
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
    }
  }

  const isPasswordValid = (password) => {
    return PASSWORD_PATTERN.test(String(password || ''))
  }

  const AVATAR_MAX_BYTES = 2 * 1024 * 1024
  const ALLOWED_AVATAR_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

  const createUserId = () => {
    if (window.crypto?.randomUUID) {
      return `user-${window.crypto.randomUUID()}`
    }

    return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const normalizeUsername = (value) => {
    return String(value || '')
      .normalize('NFKC')
      .trim()
  }

  const usernameKey = (value) => normalizeUsername(value).toLocaleLowerCase('fa')

  const sanitizeUser = (user) => {
    if (!user) return null

    return {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      schoolName: user.schoolName,
      grade: user.grade,
      avatar: user.avatar || null,
    }
  }

  const hashPassword = async (password) => {
    if (!window.crypto?.subtle) {
      throw new Error('AUTH_CRYPTO_UNAVAILABLE')
    }

    const bytes = new TextEncoder().encode(String(password))
    const digest = await window.crypto.subtle.digest('SHA-256', bytes)

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  const avatarFileToDataUrl = (file) => {
    if (!file) return Promise.resolve(null)

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      return Promise.reject(new Error('AUTH_AVATAR_TYPE_INVALID'))
    }

    if (file.size > AVATAR_MAX_BYTES) {
      return Promise.reject(new Error('AUTH_AVATAR_TOO_LARGE'))
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.addEventListener('load', () => resolve(String(reader.result || '')))
      reader.addEventListener('error', () => reject(new Error('AUTH_AVATAR_READ_FAILED')))
      reader.readAsDataURL(file)
    })
  }

  const validateRegistration = ({
    username,
    password,
    schoolName,
    grade,
  }) => {
    const cleanUsername = normalizeUsername(username)
    const cleanSchoolName = String(schoolName || '').trim()
    const cleanGrade = String(grade || '').trim()

    if (
      cleanUsername.length < USERNAME_MIN_LENGTH ||
      cleanUsername.length > USERNAME_MAX_LENGTH
    ) {
      throw new Error('AUTH_USERNAME_INVALID')
    }

    if (!isPasswordValid(password)) {
      throw new Error('AUTH_PASSWORD_WEAK')
    }

    if (cleanSchoolName.length < 2 || cleanSchoolName.length > 100) {
      throw new Error('AUTH_SCHOOL_INVALID')
    }

    if (!['1', '2', '3', '4', '5', '6'].includes(cleanGrade)) {
      throw new Error('AUTH_GRADE_INVALID')
    }

    return {
      username: cleanUsername,
      schoolName: cleanSchoolName,
      grade: cleanGrade,
    }
  }

  const register = async ({
    username,
    password,
    schoolName,
    grade,
    avatarFile = null,
  }) => {
    const normalized = validateRegistration({
      username,
      password,
      schoolName,
      grade,
    })

    const avatar = await avatarFileToDataUrl(avatarFile)
    const passwordHash = await hashPassword(password)
    let registeredUser = null

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.users)) {
        state.users = []
      }

      const exists = state.users.some(
        (user) => usernameKey(user.username) === usernameKey(normalized.username),
      )

      if (exists) {
        throw new Error('AUTH_USERNAME_TAKEN')
      }

      const now = new Date().toISOString()

      const user = {
        id: createUserId(),
        username: normalized.username,
        name: normalized.username,
        passwordHash,
        schoolName: normalized.schoolName,
        grade: normalized.grade,
        avatar,
        createdAt: now,
        updatedAt: now,
      }

      state.users.push(user)
      state.currentUser = sanitizeUser(user)
      registeredUser = sanitizeUser(user)

      return state
    })

    return registeredUser
  }

  const login = async ({ username, password }) => {
    const cleanUsername = normalizeUsername(username)

    if (!cleanUsername || !password) {
      throw new Error('AUTH_LOGIN_FIELDS_REQUIRED')
    }

    const passwordHash = await hashPassword(password)
    let loggedInUser = null

    await window.appDataProvider.updateState((state) => {
      const users = Array.isArray(state.users) ? state.users : []

      const user = users.find(
        (item) => usernameKey(item.username) === usernameKey(cleanUsername),
      )

      if (!user || user.passwordHash !== passwordHash) {
        throw new Error('AUTH_LOGIN_INVALID')
      }

      state.currentUser = sanitizeUser(user)
      loggedInUser = sanitizeUser(user)

      return state
    })

    return loggedInUser
  }

  const getCurrentUser = async () => {
    const state = await window.appDataProvider.getState()
    return state.currentUser || null
  }

  const logout = async () => {
    await window.appDataProvider.updateState((state) => {
      state.currentUser = null
      return state
    })
  }

  window.authService = Object.freeze({
    USERNAME_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_PATTERN,
    AVATAR_MAX_BYTES,
    getPasswordRequirements,
    isPasswordValid,
    register,
    login,
    getCurrentUser,
    logout,
  })
})()
