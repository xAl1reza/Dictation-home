/*
 * Local authentication service used by the current frontend prototype.
 *
 * Public methods are async so the implementation can later be replaced
 * with HTTP requests without changing page controllers.
 *
 * IMPORTANT:
 * Production authentication must be handled by the backend.
 */

;(() => {
  const NATIONAL_CODE_PATTERN = /^[0-9]{10}$/
  const MOBILE_PATTERN = /^09\d{9}$/

  const PASSWORD_MIN_LENGTH = 8
  const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

  const AVATAR_MAX_BYTES = 2 * 1024 * 1024

  const ALLOWED_AVATAR_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

  const normalizeDigits = (value) => {
    return String(value || '')
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  }

  const normalizeText = (value) => {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
  }

  const normalizeNationalCode = (value) => {
    return normalizeDigits(value).trim()
  }

  const normalizeMobile = (value) => {
    return normalizeDigits(value).trim()
  }

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

  const createUserId = () => {
    if (window.crypto?.randomUUID) {
      return `user-${window.crypto.randomUUID()}`
    }

    return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const sanitizeUser = (user) => {
    if (!user) return null

    const firstName = normalizeText(user.firstName)

    return {
      id: user.id,
      nationalCode: user.nationalCode,
      firstName,
      lastName: normalizeText(user.lastName),

      // Display name used by dashboard and all games.
      name: firstName,

      motherPhone: user.motherPhone,
      fatherPhone: user.fatherPhone,
      birthDate: user.birthDate,
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

      reader.addEventListener('load', () => {
        resolve(String(reader.result || ''))
      })

      reader.addEventListener('error', () => {
        reject(new Error('AUTH_AVATAR_READ_FAILED'))
      })

      reader.readAsDataURL(file)
    })
  }

  const validateRegistration = ({
    nationalCode,
    firstName,
    lastName,
    motherPhone,
    fatherPhone,
    birthDate,
    password,
    schoolName,
    grade,
  }) => {
    const cleanNationalCode = normalizeNationalCode(nationalCode)
    const cleanFirstName = normalizeText(firstName)
    const cleanLastName = normalizeText(lastName)
    const cleanMotherPhone = normalizeMobile(motherPhone)
    const cleanFatherPhone = normalizeMobile(fatherPhone)
    const cleanBirthDate = String(birthDate || '').trim()
    const cleanSchoolName = normalizeText(schoolName)
    const cleanGrade = String(grade || '').trim()

    if (!NATIONAL_CODE_PATTERN.test(cleanNationalCode)) {
      throw new Error('AUTH_NATIONAL_CODE_INVALID')
    }

    if (cleanFirstName.length < 2) {
      throw new Error('AUTH_FIRST_NAME_INVALID')
    }

    if (cleanLastName.length < 2) {
      throw new Error('AUTH_LAST_NAME_INVALID')
    }

    if (!MOBILE_PATTERN.test(cleanMotherPhone)) {
      throw new Error('AUTH_MOTHER_PHONE_INVALID')
    }

    if (!MOBILE_PATTERN.test(cleanFatherPhone)) {
      throw new Error('AUTH_FATHER_PHONE_INVALID')
    }

    if (!cleanBirthDate) {
      throw new Error('AUTH_BIRTH_DATE_REQUIRED')
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
      nationalCode: cleanNationalCode,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      motherPhone: cleanMotherPhone,
      fatherPhone: cleanFatherPhone,
      birthDate: cleanBirthDate,
      schoolName: cleanSchoolName,
      grade: cleanGrade,
    }
  }

  const register = async ({
    nationalCode,
    firstName,
    lastName,
    motherPhone,
    fatherPhone,
    birthDate,
    password,
    schoolName,
    grade,
    avatarFile = null,
  }) => {
    const normalized = validateRegistration({
      nationalCode,
      firstName,
      lastName,
      motherPhone,
      fatherPhone,
      birthDate,
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
        (user) =>
          normalizeNationalCode(user.nationalCode) === normalized.nationalCode
      )

      if (exists) {
        throw new Error('AUTH_NATIONAL_CODE_TAKEN')
      }

      const now = new Date().toISOString()

      const user = {
        id: createUserId(),

        nationalCode: normalized.nationalCode,
        firstName: normalized.firstName,
        lastName: normalized.lastName,

        motherPhone: normalized.motherPhone,
        fatherPhone: normalized.fatherPhone,
        birthDate: normalized.birthDate,

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

  const login = async ({ nationalCode, password }) => {
    const cleanNationalCode = normalizeNationalCode(nationalCode)

    if (!NATIONAL_CODE_PATTERN.test(cleanNationalCode) || !password) {
      throw new Error('AUTH_LOGIN_FIELDS_REQUIRED')
    }

    const passwordHash = await hashPassword(password)

    let loggedInUser = null

    await window.appDataProvider.updateState((state) => {
      const users = Array.isArray(state.users) ? state.users : []

      const user = users.find(
        (item) => normalizeNationalCode(item.nationalCode) === cleanNationalCode
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
    NATIONAL_CODE_PATTERN,
    MOBILE_PATTERN,

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
