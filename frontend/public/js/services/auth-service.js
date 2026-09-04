/*
 * Authentication service backed by the real PHP API.
 *
 * Authentication token handling belongs entirely to the backend.
 * Frontend JavaScript never receives, reads, or stores the token.
 *
 * All backend requests use async/await.
 */

;(() => {
  const NATIONAL_CODE_PATTERN =
    /^[0-9]{10}$/

  const MOBILE_PATTERN =
    /^09\d{9}$/

  const PASSWORD_MIN_LENGTH = 8

  const PASSWORD_PATTERN =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

  const AVATAR_MAX_BYTES =
    2 * 1024 * 1024

  const ALLOWED_AVATAR_TYPES =
    new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ])

  const normalizeDigits = (value) => {
    return String(value || '')
      .replace(
        /[۰-۹]/g,
        (digit) =>
          String(
            '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)
          )
      )
      .replace(
        /[٠-٩]/g,
        (digit) =>
          String(
            '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)
          )
      )
  }

  const normalizeText = (value) => {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
  }

  const normalizeNationalCode = (
    value
  ) => {
    return normalizeDigits(value).trim()
  }

  const normalizeMobile = (
    value
  ) => {
    return normalizeDigits(value).trim()
  }

  const getPasswordRequirements = (
    password
  ) => {
    const value =
      String(password || '')

    return {
      minLength:
        value.length >=
        PASSWORD_MIN_LENGTH,

      lowercase:
        /[a-z]/.test(value),

      uppercase:
        /[A-Z]/.test(value),

      number:
        /\d/.test(value),
    }
  }

  const isPasswordValid = (
    password
  ) => {
    return PASSWORD_PATTERN.test(
      String(password || '')
    )
  }

  const validateAvatarFile = (
    file
  ) => {
    if (!file) return

    if (
      !ALLOWED_AVATAR_TYPES.has(
        file.type
      )
    ) {
      throw new Error(
        'AUTH_AVATAR_TYPE_INVALID'
      )
    }

    if (
      file.size >
      AVATAR_MAX_BYTES
    ) {
      throw new Error(
        'AUTH_AVATAR_TOO_LARGE'
      )
    }
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
    avatarFile,
  }) => {
    const cleanNationalCode =
      normalizeNationalCode(
        nationalCode
      )

    const cleanFirstName =
      normalizeText(
        firstName
      )

    const cleanLastName =
      normalizeText(
        lastName
      )

    const cleanMotherPhone =
      normalizeMobile(
        motherPhone
      )

    const cleanFatherPhone =
      normalizeMobile(
        fatherPhone
      )

    const cleanBirthDate =
      String(
        birthDate || ''
      ).trim()

    const cleanSchoolName =
      normalizeText(
        schoolName
      )

    const cleanGrade =
      String(
        grade || ''
      ).trim()

    if (
      !NATIONAL_CODE_PATTERN.test(
        cleanNationalCode
      )
    ) {
      throw new Error(
        'AUTH_NATIONAL_CODE_INVALID'
      )
    }

    if (
      cleanFirstName.length < 2 ||
      cleanFirstName.length > 50
    ) {
      throw new Error(
        'AUTH_FIRST_NAME_INVALID'
      )
    }

    if (
      cleanLastName.length < 2 ||
      cleanLastName.length > 80
    ) {
      throw new Error(
        'AUTH_LAST_NAME_INVALID'
      )
    }

    if (
      !MOBILE_PATTERN.test(
        cleanMotherPhone
      )
    ) {
      throw new Error(
        'AUTH_MOTHER_PHONE_INVALID'
      )
    }

    if (
      !MOBILE_PATTERN.test(
        cleanFatherPhone
      )
    ) {
      throw new Error(
        'AUTH_FATHER_PHONE_INVALID'
      )
    }

    if (!cleanBirthDate) {
      throw new Error(
        'AUTH_BIRTH_DATE_REQUIRED'
      )
    }

    if (
      !isPasswordValid(
        password
      )
    ) {
      throw new Error(
        'AUTH_PASSWORD_WEAK'
      )
    }

    if (
      cleanSchoolName.length < 2 ||
      cleanSchoolName.length > 100
    ) {
      throw new Error(
        'AUTH_SCHOOL_INVALID'
      )
    }

    if (
      ![
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ].includes(
        cleanGrade
      )
    ) {
      throw new Error(
        'AUTH_GRADE_INVALID'
      )
    }

    validateAvatarFile(
      avatarFile
    )

    return {
      nationalCode:
        cleanNationalCode,

      firstName:
        cleanFirstName,

      lastName:
        cleanLastName,

      motherPhone:
        cleanMotherPhone,

      fatherPhone:
        cleanFatherPhone,

      birthDate:
        cleanBirthDate,

      password:
        String(
          password || ''
        ),

      schoolName:
        cleanSchoolName,

      grade:
        Number(
          cleanGrade
        ),
    }
  }

  const performLogin = async ({
    nationalCode,
    password,
  }) => {
    const result =
      await window.apiClient.post(
        '/auth/login',
        {
          nationalCode:
            normalizeNationalCode(
              nationalCode
            ),

          password:
            String(
              password || ''
            ),
        },
        {
          auth: false,
        }
      )

    if (!result?.user?.id) {
      throw new window.apiClient.ApiError({
        code:
          'API_INVALID_RESPONSE',

        path:
          '/auth/login',

        method:
          'POST',
      })
    }

    window.apiClient.log(
      '[API:AUTH] login accepted; session is backend-owned HttpOnly cookie'
    )

    return result.user
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
    const payload =
      validateRegistration({
        nationalCode,
        firstName,
        lastName,
        motherPhone,
        fatherPhone,
        birthDate,
        password,
        schoolName,
        grade,
        avatarFile,
      })

    const registeredUser =
      await window.apiClient.post(
        '/auth/register',
        payload,
        {
          auth: false,
        }
      )

    window.apiClient.log(
      '[API:AUTH] account created on backend'
    )

    /*
     * Register does not create the login session.
     * Login once after registration.
     * The backend sets the HttpOnly cookie.
     */
    const loggedInUser =
      await performLogin({
        nationalCode:
          payload.nationalCode,

        password:
          payload.password,
      })

    return {
      user:
        loggedInUser ||
        registeredUser,

      avatarPending:
        Boolean(
          avatarFile
        ),
    }
  }

  const login = async ({
    nationalCode,
    password,
  }) => {
    const cleanNationalCode =
      normalizeNationalCode(
        nationalCode
      )

    if (
      !NATIONAL_CODE_PATTERN.test(
        cleanNationalCode
      ) ||
      !password
    ) {
      throw new Error(
        'AUTH_LOGIN_FIELDS_REQUIRED'
      )
    }

    const user =
      await performLogin({
        nationalCode:
          cleanNationalCode,

        password,
      })

    return user
  }

  const getCurrentUser =
    async () => {
      try {
        const user =
          await window.apiClient.get(
            '/me'
          )

        window.apiClient.log(
          '[API:AUTH] current session verified by backend'
        )

        return user || null
      } catch (error) {
        if (
          Number(
            error?.status || 0
          ) === 401
        ) {
          return null
        }

        throw error
      }
    }

  const logout =
    async () => {
      await window.apiClient.post(
        '/auth/logout'
      )

      window.apiClient.log(
        '[API:AUTH] HttpOnly session cleared by backend'
      )
    }

  window.authService =
    Object.freeze({
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
