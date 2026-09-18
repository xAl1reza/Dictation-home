/* Auth page controller */

;(() => {
  const NATIONAL_CODE_PATTERN = /^[0-9]{10}$/
  const MOBILE_PATTERN = /^09\d{9}$/

  const normalizeDigits = (value) => {
    return String(value || '')
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  }

  const isNationalCodeValid = (value) => {
    const nationalCode = normalizeDigits(value).trim()

    if (!NATIONAL_CODE_PATTERN.test(nationalCode)) {
      return false
    }

    if (/^(\d)\1{9}$/.test(nationalCode)) {
      return false
    }

    const checkDigit = Number(nationalCode[9])

    const sum = nationalCode
      .slice(0, 9)
      .split('')
      .reduce((total, digit, index) => {
        return total + Number(digit) * (10 - index)
      }, 0)

    const remainder = sum % 11

    return remainder < 2
      ? checkDigit === remainder
      : checkDigit === 11 - remainder
  }

  const loginTab = document.getElementById('auth-login-tab')
  const registerTab = document.getElementById('auth-register-tab')
  const loginPanel = document.getElementById('auth-login-panel')
  const registerPanel = document.getElementById('auth-register-panel')

  const gradeInput = document.getElementById('register-grade')
  const gradeTrigger = document.getElementById('register-grade-trigger')
  const gradeLabel = document.getElementById('register-grade-label')
  const gradeMenu = document.getElementById('register-grade-menu')
  const gradeChevron = document.getElementById('register-grade-chevron')

  const provinceInput = document.getElementById('register-province')
  const provinceTrigger = document.getElementById('register-province-trigger')
  const provinceLabel = document.getElementById('register-province-label')
  const provinceMenu = document.getElementById('register-province-menu')
  const provinceChevron = document.getElementById('register-province-chevron')

  const cityInput = document.getElementById('register-city')
  const cityTrigger = document.getElementById('register-city-trigger')
  const cityLabel = document.getElementById('register-city-label')
  const cityMenu = document.getElementById('register-city-menu')
  const cityChevron = document.getElementById('register-city-chevron')

  const avatarInput = document.getElementById('register-avatar')
  const avatarPreview = document.getElementById('register-avatar-preview')
  const avatarInitial = document.getElementById('register-avatar-initial')
  const avatarImage = document.getElementById('register-avatar-image')
  const avatarName = document.getElementById('register-avatar-name')

  const registerPasswordInput = document.getElementById('register-password')
  const passwordStrength = document.getElementById('register-password-strength')
  const passwordStrengthLabel = document.getElementById(
    'register-password-strength-label'
  )
  const passwordRuleElements = Array.from(
    document.querySelectorAll('[data-password-rule]')
  )

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  const passwordStrengthLabels = {
    0: 'شروع به تایپ کن',
    1: 'ضعیف',
    2: 'متوسط',
    3: 'خوب',
    4: 'عالی',
  }

  const animatePasswordRule = (rule) => {
    if (prefersReducedMotion || !rule || typeof rule.animate !== 'function') {
      return
    }

    rule.animate(
      [
        { transform: 'translateY(2px) scale(0.98)' },
        { transform: 'translateY(0) scale(1)' },
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    )
  }

  const updatePasswordStrength = () => {
    if (!registerPasswordInput || !passwordStrength || !window.authService) {
      return
    }

    const value = registerPasswordInput.value
    const requirements = window.authService.getPasswordRequirements(value)
    const matchedRules = Object.values(requirements).filter(Boolean).length
    const strength = value ? matchedRules : 0

    passwordStrength.dataset.strength = String(strength)

    if (passwordStrengthLabel) {
      passwordStrengthLabel.textContent =
        passwordStrengthLabels[strength] || passwordStrengthLabels[0]
    }

    passwordRuleElements.forEach((rule) => {
      const ruleName = rule.dataset.passwordRule
      const isMet = Boolean(requirements[ruleName])
      const wasMet = rule.dataset.met === 'true'

      rule.classList.toggle('is-met', isMet)
      rule.dataset.met = String(isMet)

      if (isMet && !wasMet) {
        animatePasswordRule(rule)
      }
    })
  }

  const gradeLabels = {
    1: 'پایه اول',
    2: 'پایه دوم',
    3: 'پایه سوم',
    4: 'پایه چهارم',
    5: 'پایه پنجم',
    6: 'پایه ششم',
  }

  const animatePanel = (panel) => {
    if (prefersReducedMotion || !panel || typeof panel.animate !== 'function') {
      return
    }

    panel.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 320,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards',
      }
    )
  }

  const setAuthMode = (mode, { updateHash = true } = {}) => {
    const isRegister = mode === 'register'

    loginPanel.classList.toggle('hidden', isRegister)
    registerPanel.classList.toggle('hidden', !isRegister)

    loginTab.classList.toggle('is-active', !isRegister)
    registerTab.classList.toggle('is-active', isRegister)

    loginTab.setAttribute('aria-selected', String(!isRegister))
    registerTab.setAttribute('aria-selected', String(isRegister))

    if (updateHash) {
      history.replaceState(null, '', isRegister ? '#register' : '#login')
    }

    animatePanel(isRegister ? registerPanel : loginPanel)
  }

  loginTab?.addEventListener('click', () => setAuthMode('login'))
  registerTab?.addEventListener('click', () => setAuthMode('register'))

  document.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      setAuthMode(button.dataset.authMode)
    })
  })

  const clearFieldError = (form, fieldName) => {
    const error = form.querySelector(`[data-error-for="${fieldName}"]`)
    if (!error) return
    error.textContent = ''
    error.classList.add('hidden')
  }

  const setFieldError = (form, fieldName, message) => {
    const error = form.querySelector(`[data-error-for="${fieldName}"]`)
    if (!error) return
    error.textContent = message
    error.classList.remove('hidden')
  }

  const clearFormErrors = (form) => {
    form.querySelectorAll('[data-error-for]').forEach((error) => {
      error.textContent = ''
      error.classList.add('hidden')
    })
  }

  const showFormErrorFeedback = (
    form,
    { title = 'اطلاعات فرم را بررسی کن', message = '', focusFirst = true } = {}
  ) => {
    const firstError = Array.from(
      form.querySelectorAll('[data-error-for]')
    ).find((error) => {
      return !error.classList.contains('hidden') && error.textContent.trim()
    })

    const feedbackMessage =
      message ||
      firstError?.textContent?.trim() ||
      'بعضی از اطلاعات واردشده نیاز به اصلاح دارد.'

    window.showToast?.({
      type: 'error',
      title,
      message: feedbackMessage,
    })

    if (!focusFirst || !firstError) {
      return
    }

    const fieldName = firstError.dataset.errorFor

    let field = Array.from(form.elements).find((element) => {
      return element.name === fieldName
    })

    if (fieldName === 'grade') {
      field = gradeTrigger || field
    }

    if (fieldName === 'provinceCode') {
      field = provinceTrigger || field
    }

    if (fieldName === 'cityId') {
      field = cityTrigger || field
    }

    if (!field) {
      firstError.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      })

      return
    }

    field.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    })

    window.setTimeout(
      () => {
        field.focus?.({
          preventScroll: true,
        })
      },
      prefersReducedMotion ? 0 : 280
    )
  }

  document.querySelectorAll('form[data-auth-form]').forEach((form) => {
    form.addEventListener('input', (event) => {
      if (!event.target?.name) return
      clearFieldError(form, event.target.name)
    })
  })
  ;[
    document.getElementById('login-national-code'),
    document.getElementById('register-national-code'),
    document.getElementById('register-mother-phone'),
    document.getElementById('register-father-phone'),
  ].forEach((input) => {
    input?.addEventListener('input', () => {
      input.value = normalizeDigits(input.value).replace(/\D/g, '')
    })
  })

  registerPasswordInput?.addEventListener('input', updatePasswordStrength)
  updatePasswordStrength()

  const closeGradeMenu = () => {
    gradeMenu?.classList.add('hidden')
    gradeTrigger?.setAttribute('aria-expanded', 'false')
    gradeChevron?.classList.remove('rotate-180')
  }

  const openGradeMenu = () => {
    gradeMenu?.classList.remove('hidden')
    gradeTrigger?.setAttribute('aria-expanded', 'true')
    gradeChevron?.classList.add('rotate-180')
  }

  gradeTrigger?.addEventListener('click', () => {
    const isOpen = gradeTrigger.getAttribute('aria-expanded') === 'true'
    isOpen ? closeGradeMenu() : openGradeMenu()
  })

  gradeMenu?.addEventListener('click', (event) => {
    const option = event.target.closest('[data-grade-value]')
    if (!option) return

    const value = option.dataset.gradeValue
    gradeInput.value = value
    gradeLabel.textContent = gradeLabels[value] || 'انتخاب پایه'

    gradeMenu.querySelectorAll('[data-grade-value]').forEach((item) => {
      item.setAttribute('aria-selected', String(item === option))
    })

    clearFieldError(document.getElementById('register-form'), 'grade')
    closeGradeMenu()
  })

  const closeProvinceMenu = () => {
    provinceMenu?.classList.add('hidden')
    provinceTrigger?.setAttribute('aria-expanded', 'false')
    provinceChevron?.classList.remove('rotate-180')
  }

  const closeCityMenu = () => {
    cityMenu?.classList.add('hidden')
    cityTrigger?.setAttribute('aria-expanded', 'false')
    cityChevron?.classList.remove('rotate-180')
  }

  const closeLocationMenus = () => {
    closeProvinceMenu()
    closeCityMenu()
  }

  const renderLocationOptions = (menu, items, valueKey, dataKey) => {
    if (!menu) return

    menu.replaceChildren()

    items.forEach((item) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'form-option'
      button.setAttribute('role', 'option')
      button.setAttribute('aria-selected', 'false')
      button.dataset[dataKey] = String(item[valueKey])
      button.textContent = String(item.name || '')
      menu.appendChild(button)
    })
  }

  const resetCity = (label = 'ابتدا استان را انتخاب کن') => {
    if (cityInput) cityInput.value = ''
    if (cityLabel) cityLabel.textContent = label
    if (cityMenu) cityMenu.replaceChildren()
    if (cityTrigger) cityTrigger.disabled = true
    closeCityMenu()
  }

  const loadCities = async (provinceCode) => {
    resetCity('در حال دریافت شهرها...')

    try {
      const cities = await window.locationService.getCities(provinceCode)

      renderLocationOptions(cityMenu, cities, 'id', 'cityId')

      if (cityLabel) {
        cityLabel.textContent = cities.length ? 'انتخاب شهر' : 'شهری یافت نشد'
      }

      if (cityTrigger) {
        cityTrigger.disabled = cities.length === 0
      }
    } catch (error) {
      resetCity('دریافت شهرها ناموفق بود')

      window.showToast?.({
        type: 'error',
        title: 'دریافت شهرها انجام نشد',
        message: 'ارتباط با سرویس استان و شهر برقرار نشد. دوباره تلاش کن.',
      })
    }
  }

  const loadProvinces = async () => {
    if (!provinceTrigger || !provinceMenu || !window.locationService) return

    provinceTrigger.disabled = true

    try {
      const provinces = await window.locationService.getProvinces()

      renderLocationOptions(
        provinceMenu,
        provinces,
        'provinceCode',
        'provinceCode'
      )

      provinceLabel.textContent = provinces.length
        ? 'انتخاب استان'
        : 'استانی یافت نشد'

      provinceTrigger.disabled = provinces.length === 0
    } catch (error) {
      provinceLabel.textContent = 'دریافت استان‌ها ناموفق بود'
      provinceTrigger.disabled = true

      window.showToast?.({
        type: 'error',
        title: 'دریافت استان‌ها انجام نشد',
        message:
          'ارتباط با سرویس استان و شهر برقرار نشد. صفحه را دوباره بارگذاری کن.',
      })
    }
  }

  provinceTrigger?.addEventListener('click', () => {
    if (provinceTrigger.disabled) return

    const isOpen = provinceTrigger.getAttribute('aria-expanded') === 'true'
    closeCityMenu()

    provinceMenu?.classList.toggle('hidden', isOpen)
    provinceTrigger.setAttribute('aria-expanded', String(!isOpen))
    provinceChevron?.classList.toggle('rotate-180', !isOpen)
  })

  provinceMenu?.addEventListener('click', async (event) => {
    const option = event.target.closest('[data-province-code]')
    if (!option) return

    const provinceCode = String(option.dataset.provinceCode || '')

    provinceInput.value = provinceCode
    provinceLabel.textContent = option.textContent.trim()

    provinceMenu.querySelectorAll('[data-province-code]').forEach((item) => {
      item.setAttribute('aria-selected', String(item === option))
    })

    clearFieldError(document.getElementById('register-form'), 'provinceCode')
    clearFieldError(document.getElementById('register-form'), 'cityId')
    closeProvinceMenu()

    await loadCities(provinceCode)
  })

  cityTrigger?.addEventListener('click', () => {
    if (cityTrigger.disabled) return

    const isOpen = cityTrigger.getAttribute('aria-expanded') === 'true'
    closeProvinceMenu()

    cityMenu?.classList.toggle('hidden', isOpen)
    cityTrigger.setAttribute('aria-expanded', String(!isOpen))
    cityChevron?.classList.toggle('rotate-180', !isOpen)
  })

  cityMenu?.addEventListener('click', (event) => {
    const option = event.target.closest('[data-city-id]')
    if (!option) return

    cityInput.value = String(option.dataset.cityId || '')
    cityLabel.textContent = option.textContent.trim()

    cityMenu.querySelectorAll('[data-city-id]').forEach((item) => {
      item.setAttribute('aria-selected', String(item === option))
    })

    clearFieldError(document.getElementById('register-form'), 'cityId')
    closeCityMenu()
  })

  loadProvinces()

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#register-grade-dropdown')) {
      closeGradeMenu()
    }

    if (!event.target.closest('#register-province-dropdown')) {
      closeProvinceMenu()
    }

    if (!event.target.closest('#register-city-dropdown')) {
      closeCityMenu()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeGradeMenu()
      closeLocationMenus()
    }
  })

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.passwordToggle
      const input = document.getElementById(targetId)
      if (!input) return

      const showPassword = input.type === 'password'
      input.type = showPassword ? 'text' : 'password'
      button.setAttribute(
        'aria-label',
        showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'
      )
      button.setAttribute('aria-pressed', String(showPassword))
    })
  })

  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files?.[0] || null

    if (!file) {
      avatarImage.removeAttribute('src')
      avatarImage.classList.add('hidden')
      avatarInitial.classList.remove('hidden')
      avatarName.textContent = 'بدون عکس'
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      avatarInput.value = ''
      const form = document.getElementById('register-form')

      setFieldError(form, 'avatar', 'فرمت عکس باید JPG، PNG یا WebP باشد.')

      showFormErrorFeedback(form, {
        title: 'عکس پروفایل معتبر نیست',
        message: 'فرمت عکس باید JPG، PNG یا WebP باشد.',
        focusFirst: false,
      })

      return
    }

    if (file.size > window.authService.AVATAR_MAX_BYTES) {
      avatarInput.value = ''
      const form = document.getElementById('register-form')

      setFieldError(form, 'avatar', 'حجم عکس باید حداکثر ۲ مگابایت باشد.')

      showFormErrorFeedback(form, {
        title: 'حجم عکس زیاد است',
        message: 'حجم عکس باید حداکثر ۲ مگابایت باشد.',
        focusFirst: false,
      })

      return
    }

    clearFieldError(document.getElementById('register-form'), 'avatar')

    const url = URL.createObjectURL(file)
    avatarImage.src = url
    avatarImage.classList.remove('hidden')
    avatarInitial.classList.add('hidden')
    avatarName.textContent = file.name

    avatarImage.addEventListener('load', () => URL.revokeObjectURL(url), {
      once: true,
    })
  })

  const setSubmitting = (form, submitting) => {
    const button = form.querySelector('button[type="submit"]')
    if (!button) return

    button.disabled = submitting
    button.classList.toggle('opacity-60', submitting)
    button.classList.toggle('pointer-events-none', submitting)
    button.setAttribute('aria-busy', String(submitting))
  }

  const CHANNEL_MODAL_STORAGE_PREFIX = 'dikteh-khooneh:bale-channel-modal-shown'

  const prepareChannelModalForLogin = (userId) => {
    if (!userId) return

    try {
      sessionStorage.removeItem(
        `${CHANNEL_MODAL_STORAGE_PREFIX}:${String(userId)}`
      )
    } catch {
      // Login must continue if browser storage is unavailable.
    }
  }

  const redirectToDashboard = () => {
    window.location.assign('./dashboard.html')
  }

  document
    .getElementById('login-form')
    ?.addEventListener('submit', async (event) => {
      event.preventDefault()

      const form = event.currentTarget
      clearFormErrors(form)

      const formData = new FormData(form)
      const nationalCode = normalizeDigits(
        String(formData.get('nationalCode') || '').trim()
      )
      const password = String(formData.get('password') || '')

      let valid = true

      if (!isNationalCodeValid(nationalCode)) {
        setFieldError(form, 'nationalCode', 'کد ملی واردشده معتبر نیست.')
        valid = false
      }

      if (!password) {
        setFieldError(form, 'password', 'رمز عبور را وارد کن.')
        valid = false
      }

      if (!valid) {
        showFormErrorFeedback(form, {
          title: 'اطلاعات ورود را بررسی کن',
        })

        return
      }

      setSubmitting(form, true)

      try {
        const user = await window.authService.login({
          nationalCode,
          password,
        })

        prepareChannelModalForLogin(user?.id)

        window.apiClient?.log(
          '[API:AUTH] login verified; redirecting to dashboard'
        )

        window.showToast?.({
          type: 'success',
          title: 'خوش اومدی',
          message: 'ورود با موفقیت انجام شد.',
        })

        redirectToDashboard()
      } catch (error) {
        const resolved = window.apiErrors?.resolve(
          error,
          'ورود انجام نشد. دوباره تلاش کن.'
        )

        if (resolved?.field) {
          setFieldError(form, resolved.field, resolved.message)

          showFormErrorFeedback(form, {
            title: 'ورود انجام نشد',
            message: resolved.message,
          })
        } else {
          window.showToast?.({
            type: 'error',
            title: 'ورود انجام نشد',
            message: resolved?.message || 'ورود انجام نشد. دوباره تلاش کن.',
          })
        }
      } finally {
        setSubmitting(form, false)
      }
    })

  document
    .getElementById('register-form')
    ?.addEventListener('submit', async (event) => {
      event.preventDefault()

      const form = event.currentTarget
      clearFormErrors(form)

      const formData = new FormData(form)

      const nationalCode = normalizeDigits(
        String(formData.get('nationalCode') || '').trim()
      )
      const firstName = String(formData.get('firstName') || '').trim()
      const lastName = String(formData.get('lastName') || '').trim()
      const schoolName = String(formData.get('schoolName') || '').trim()
      const provinceCode = String(formData.get('provinceCode') || '').trim()
      const cityId = String(formData.get('cityId') || '').trim()
      const grade = String(formData.get('grade') || '').trim()
      const motherPhone = normalizeDigits(
        String(formData.get('motherPhone') || '').trim()
      )
      const fatherPhone = normalizeDigits(
        String(formData.get('fatherPhone') || '').trim()
      )
      const birthDate = String(formData.get('birthDate') || '').trim()
      const password = String(formData.get('password') || '')
      const confirmPassword = String(formData.get('confirmPassword') || '')
      const avatarFile = avatarInput.files?.[0] || null

      let valid = true

      if (!isNationalCodeValid(nationalCode)) {
        setFieldError(form, 'nationalCode', 'کد ملی واردشده معتبر نیست.')
        valid = false
      }

      if (firstName.length < 2) {
        setFieldError(form, 'firstName', 'نام را وارد کن.')
        valid = false
      }

      if (lastName.length < 2) {
        setFieldError(form, 'lastName', 'نام خانوادگی را وارد کن.')
        valid = false
      }

      if (schoolName.length < 2) {
        setFieldError(form, 'schoolName', 'نام مدرسه را وارد کن.')
        valid = false
      }

      if (!/^IR-\d{2}$/.test(provinceCode)) {
        setFieldError(form, 'provinceCode', 'استان را انتخاب کن.')
        valid = false
      }

      if (!/^\d+$/.test(cityId) || Number(cityId) <= 0) {
        setFieldError(form, 'cityId', 'شهر را انتخاب کن.')
        valid = false
      }

      if (!grade) {
        setFieldError(form, 'grade', 'پایه تحصیلی را انتخاب کن.')
        valid = false
      }

      if (!MOBILE_PATTERN.test(motherPhone)) {
        setFieldError(
          form,
          'motherPhone',
          'شماره تلفن مادر باید ۱۱ رقم و با 09 شروع شود.'
        )
        valid = false
      }

      if (!MOBILE_PATTERN.test(fatherPhone)) {
        setFieldError(
          form,
          'fatherPhone',
          'شماره تلفن پدر باید ۱۱ رقم و با 09 شروع شود.'
        )
        valid = false
      }

      if (!birthDate) {
        setFieldError(form, 'birthDate', 'تاریخ تولد را انتخاب کن.')
        valid = false
      }

      if (!window.authService.isPasswordValid(password)) {
        setFieldError(
          form,
          'password',
          'رمز عبور باید حداقل ۸ کاراکتر و شامل حرف کوچک، حرف بزرگ و عدد باشد.'
        )
        valid = false
      }

      if (password !== confirmPassword) {
        setFieldError(form, 'confirmPassword', 'تکرار رمز عبور یکسان نیست.')
        valid = false
      }

      if (!valid) {
        showFormErrorFeedback(form, {
          title: 'ثبت‌نام نیاز به اصلاح دارد',
          message: 'بعضی از اطلاعات فرم درست نیست. موارد مشخص‌شده را اصلاح کن.',
        })

        return
      }

      setSubmitting(form, true)

      try {
        const result = await window.authService.register({
          nationalCode,
          firstName,
          lastName,
          motherPhone,
          fatherPhone,
          birthDate,
          password,
          schoolName,
          provinceCode,
          cityId,
          grade,
          avatarFile,
        })

        prepareChannelModalForLogin(result?.user?.id)

        window.apiClient?.log(
          '[API:AUTH] registration + login verified; redirecting to dashboard'
        )

        window.showToast?.({
          type: 'success',
          title: 'حساب ساخته شد',
          message: result?.avatarUploadFailed
            ? 'ثبت‌نام با موفقیت انجام شد؛ فقط ذخیره تصویر پروفایل انجام نشد و بعداً می‌تونی از پروفایل دوباره امتحان کنی.'
            : 'ثبت‌نام با موفقیت انجام شد.',
        })

        redirectToDashboard()
      } catch (error) {
        const resolved = window.apiErrors?.resolve(
          error,
          'ثبت‌نام انجام نشد. دوباره تلاش کن.'
        )

        if (resolved?.field) {
          setFieldError(form, resolved.field, resolved.message)

          showFormErrorFeedback(form, {
            title: 'ثبت‌نام انجام نشد',
            message: resolved.message,
          })
        } else {
          window.showToast?.({
            type: 'error',
            title: 'ثبت‌نام انجام نشد',
            message: resolved?.message || 'ثبت‌نام انجام نشد. دوباره تلاش کن.',
          })
        }
      } finally {
        setSubmitting(form, false)
      }
    })

  const initAuthPage = async () => {
    try {
      const currentUser = await window.authService.getCurrentUser()

      if (currentUser?.id) {
        window.apiClient?.log(
          '[API:AUTH] active HttpOnly session found; redirecting to dashboard'
        )

        redirectToDashboard()
        return
      }
    } catch (error) {
      window.apiClient?.warn(
        '[API:AUTH] session check failed; showing auth page'
      )
    }

    setAuthMode(location.hash === '#register' ? 'register' : 'login', {
      updateHash: false,
    })
  }

  void initAuthPage()
})()
