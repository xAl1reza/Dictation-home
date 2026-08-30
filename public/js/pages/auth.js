/* Auth page controller */

;(() => {
  const loginTab = document.getElementById('auth-login-tab')
  const registerTab = document.getElementById('auth-register-tab')
  const loginPanel = document.getElementById('auth-login-panel')
  const registerPanel = document.getElementById('auth-register-panel')

  const gradeInput = document.getElementById('register-grade')
  const gradeTrigger = document.getElementById('register-grade-trigger')
  const gradeLabel = document.getElementById('register-grade-label')
  const gradeMenu = document.getElementById('register-grade-menu')
  const gradeChevron = document.getElementById('register-grade-chevron')

  const avatarInput = document.getElementById('register-avatar')
  const avatarPreview = document.getElementById('register-avatar-preview')
  const avatarInitial = document.getElementById('register-avatar-initial')
  const avatarImage = document.getElementById('register-avatar-image')
  const avatarName = document.getElementById('register-avatar-name')


  const registerPasswordInput = document.getElementById('register-password')
  const passwordStrength = document.getElementById('register-password-strength')
  const passwordStrengthLabel = document.getElementById(
    'register-password-strength-label',
  )
  const passwordRuleElements = Array.from(
    document.querySelectorAll('[data-password-rule]'),
  )

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  const passwordStrengthLabels = {
    0: 'شروع به تایپ کن',
    1: 'ضعیف',
    2: 'متوسط',
    3: 'خوب',
    4: 'عالی',
  }

  const animatePasswordRule = (rule) => {
    if (
      prefersReducedMotion ||
      !rule ||
      typeof rule.animate !== 'function'
    ) {
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
      },
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
    if (
      prefersReducedMotion ||
      !panel ||
      typeof panel.animate !== 'function'
    ) {
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
      },
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

  document.querySelectorAll('form[data-auth-form]').forEach((form) => {
    form.addEventListener('input', (event) => {
      if (!event.target?.name) return
      clearFieldError(form, event.target.name)
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

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#register-grade-dropdown')) {
      closeGradeMenu()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeGradeMenu()
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
        showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور',
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
      setFieldError(
        document.getElementById('register-form'),
        'avatar',
        'فرمت عکس باید JPG، PNG یا WebP باشد.',
      )
      return
    }

    if (file.size > window.authService.AVATAR_MAX_BYTES) {
      avatarInput.value = ''
      setFieldError(
        document.getElementById('register-form'),
        'avatar',
        'حجم عکس باید حداکثر ۲ مگابایت باشد.',
      )
      return
    }

    clearFieldError(document.getElementById('register-form'), 'avatar')

    const url = URL.createObjectURL(file)
    avatarImage.src = url
    avatarImage.classList.remove('hidden')
    avatarInitial.classList.add('hidden')
    avatarName.textContent = file.name

    avatarImage.addEventListener(
      'load',
      () => URL.revokeObjectURL(url),
      { once: true },
    )
  })

  const setSubmitting = (form, submitting) => {
    const button = form.querySelector('button[type="submit"]')
    if (!button) return

    button.disabled = submitting
    button.classList.toggle('opacity-60', submitting)
    button.classList.toggle('pointer-events-none', submitting)
    button.setAttribute('aria-busy', String(submitting))
  }

  const redirectToDashboard = () => {
    window.location.assign('./dashboard.html')
  }

  document.getElementById('login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    clearFormErrors(form)

    const formData = new FormData(form)
    const username = String(formData.get('username') || '').trim()
    const password = String(formData.get('password') || '')

    let valid = true

    if (!username) {
      setFieldError(form, 'username', 'نام کاربری را وارد کن.')
      valid = false
    }

    if (!password) {
      setFieldError(form, 'password', 'رمز عبور را وارد کن.')
      valid = false
    }

    if (!valid) return

    setSubmitting(form, true)

    try {
      await window.authService.login({ username, password })

      window.showToast?.({
        type: 'success',
        title: 'خوش اومدی',
        message: 'ورود با موفقیت انجام شد.',
      })

      redirectToDashboard()
    } catch (error) {
      if (error?.message === 'AUTH_LOGIN_INVALID') {
        setFieldError(
          form,
          'password',
          'نام کاربری یا رمز عبور درست نیست.',
        )
      } else {
        window.showToast?.({
          type: 'error',
          message: 'ورود انجام نشد. دوباره تلاش کن.',
        })
      }
    } finally {
      setSubmitting(form, false)
    }
  })

  document.getElementById('register-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    clearFormErrors(form)

    const formData = new FormData(form)
    const username = String(formData.get('username') || '').trim()
    const schoolName = String(formData.get('schoolName') || '').trim()
    const grade = String(formData.get('grade') || '').trim()
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')
    const avatarFile = avatarInput.files?.[0] || null

    let valid = true

    if (
      username.length < window.authService.USERNAME_MIN_LENGTH ||
      username.length > window.authService.USERNAME_MAX_LENGTH
    ) {
      setFieldError(form, 'username', 'نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد.')
      valid = false
    }

    if (schoolName.length < 2) {
      setFieldError(form, 'schoolName', 'نام مدرسه را وارد کن.')
      valid = false
    }

    if (!grade) {
      setFieldError(form, 'grade', 'پایه تحصیلی را انتخاب کن.')
      valid = false
    }

    if (!window.authService.isPasswordValid(password)) {
      setFieldError(
        form,
        'password',
        'رمز عبور باید حداقل ۸ کاراکتر و شامل حرف کوچک، حرف بزرگ و عدد باشد.',
      )
      valid = false
    }

    if (password !== confirmPassword) {
      setFieldError(form, 'confirmPassword', 'تکرار رمز عبور یکسان نیست.')
      valid = false
    }

    if (!valid) return

    setSubmitting(form, true)

    try {
      await window.authService.register({
        username,
        password,
        schoolName,
        grade,
        avatarFile,
      })

      window.showToast?.({
        type: 'success',
        title: 'حساب ساخته شد',
        message: 'ثبت‌نام با موفقیت انجام شد.',
      })

      redirectToDashboard()
    } catch (error) {
      const code = error?.message

      if (code === 'AUTH_USERNAME_TAKEN') {
        setFieldError(form, 'username', 'این نام کاربری قبلاً ثبت شده است.')
      } else if (code === 'AUTH_PASSWORD_WEAK') {
        setFieldError(
          form,
          'password',
          'رمز عبور باید حداقل ۸ کاراکتر و شامل حرف کوچک، حرف بزرگ و عدد باشد.',
        )
      } else if (code === 'AUTH_AVATAR_TOO_LARGE') {
        setFieldError(form, 'avatar', 'حجم عکس باید حداکثر ۲ مگابایت باشد.')
      } else if (code === 'AUTH_AVATAR_TYPE_INVALID') {
        setFieldError(form, 'avatar', 'فرمت عکس باید JPG، PNG یا WebP باشد.')
      } else {
        window.showToast?.({
          type: 'error',
          message: 'ثبت‌نام انجام نشد. دوباره تلاش کن.',
        })
      }
    } finally {
      setSubmitting(form, false)
    }
  })

  setAuthMode(location.hash === '#register' ? 'register' : 'login', {
    updateHash: false,
  })
})()
