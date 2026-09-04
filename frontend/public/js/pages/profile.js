/* Profile page controller — UI stage. Profile API is intentionally not wired yet. */

;(() => {
  const MOBILE_PATTERN = /^09\d{9}$/
  const gradeLabels = {
    1: 'پایه اول',
    2: 'پایه دوم',
    3: 'پایه سوم',
    4: 'پایه چهارم',
    5: 'پایه پنجم',
    6: 'پایه ششم',
  }

  const normalizeDigits = (value) =>
    String(value || '')
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))

  const formatBirthDate = (value) => {
    if (!value) return ''
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }

  const form = document.getElementById('profile-form')
  const firstNameInput = document.getElementById('profile-first-name')
  const lastNameInput = document.getElementById('profile-last-name')
  const nationalCodeInput = document.getElementById('profile-national-code')
  const schoolInput = document.getElementById('profile-school')
  const motherPhoneInput = document.getElementById('profile-mother-phone')
  const fatherPhoneInput = document.getElementById('profile-father-phone')
  const birthDateDisplay = document.getElementById('profile-birth-date-fa')
  const birthDateInput = document.getElementById('profile-birth-date')
  const gradeInput = document.getElementById('profile-grade')
  const gradeTrigger = document.getElementById('profile-grade-trigger')
  const gradeLabel = document.getElementById('profile-grade-label')
  const gradeMenu = document.getElementById('profile-grade-menu')
  const gradeChevron = document.getElementById('profile-grade-chevron')
  const avatarInput = document.getElementById('profile-avatar-input')
  const avatarImage = document.getElementById('profile-avatar-image')
  const avatarInitial = document.getElementById('profile-avatar-initial')
  const avatarError = document.getElementById('profile-avatar-error')
  const summaryName = document.getElementById('profile-summary-name')
  const summarySchool = document.getElementById('profile-summary-school')
  const summaryGrade = document.getElementById('profile-summary-grade')
  const passwordToggle = document.getElementById('profile-password-toggle')
  const passwordPanel = document.getElementById('profile-password-panel')
  const passwordForm = document.getElementById('profile-password-form')

  const clearFieldError = (name) => {
    const error = form?.querySelector(`[data-error-for="${name}"]`)
    if (!error) return
    error.textContent = ''
    error.classList.add('hidden')
  }

  const setFieldError = (name, message) => {
    const error = form?.querySelector(`[data-error-for="${name}"]`)
    if (!error) return
    error.textContent = message
    error.classList.remove('hidden')
  }

  const setGrade = (value) => {
    const grade = String(value || '')
    gradeInput.value = grade
    gradeLabel.textContent = gradeLabels[grade] || 'انتخاب پایه'
    summaryGrade.textContent = gradeLabels[grade] || 'پایه —'

    gradeMenu?.querySelectorAll('[data-grade-value]').forEach((option) => {
      option.setAttribute('aria-selected', String(option.dataset.gradeValue === grade))
    })
  }

  const closeGradeMenu = () => {
    gradeMenu?.classList.add('hidden')
    gradeTrigger?.setAttribute('aria-expanded', 'false')
    gradeChevron?.classList.remove('rotate-180')
  }

  const renderAvatar = (avatar, firstName = '') => {
    const initial = String(firstName || 'د').trim().charAt(0) || 'د'
    avatarInitial.textContent = initial

    if (avatar) {
      avatarImage.src = avatar
      avatarImage.classList.remove('hidden')
      avatarInitial.classList.add('hidden')
      return
    }

    avatarImage.removeAttribute('src')
    avatarImage.classList.add('hidden')
    avatarInitial.classList.remove('hidden')
  }

  const populateUser = (user) => {
    firstNameInput.value = user.firstName || ''
    lastNameInput.value = user.lastName || ''
    nationalCodeInput.value = user.nationalCode || ''
    schoolInput.value = user.schoolName || ''
    motherPhoneInput.value = user.motherPhone || ''
    fatherPhoneInput.value = user.fatherPhone || ''
    birthDateInput.value = user.birthDate || ''
    birthDateDisplay.value = formatBirthDate(user.birthDate)
    setGrade(user.grade)

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    summaryName.textContent = fullName || 'دانش‌آموز دیکته خونه'
    summarySchool.textContent = user.schoolName || 'مدرسه ثبت نشده'
    renderAvatar(user.avatar, user.firstName)
  }

  const initDatePicker = () => {
    if (!birthDateDisplay || !birthDateInput || !window.jalaliDatepicker) return

    window.jalaliDatepicker.startWatch({
      selector: '#profile-birth-date-fa',
      date: true,
      time: false,
      maxDate: 'today',
      targetValueInput: '#profile-birth-date',
      targetValueType: 'gregorian',
      persianDigits: true,
      autoShow: true,
      autoHide: true,
      autoReadOnlyInput: true,
      hideAfterChange: true,
      showTodayBtn: false,
      showEmptyBtn: true,
      showCloseBtn: true,
      useDropdownYears: true,
      position: 'center',
      zIndex: 9999,
    })

    birthDateDisplay.addEventListener('click', () => {
      window.jalaliDatepicker.show(birthDateDisplay)
    })

    birthDateDisplay.addEventListener('jdp:change', () => {
      clearFieldError('birthDate')
    })
  }

  const validateProfile = () => {
    let valid = true
    const firstName = firstNameInput.value.trim()
    const lastName = lastNameInput.value.trim()
    const schoolName = schoolInput.value.trim()
    const motherPhone = normalizeDigits(motherPhoneInput.value).trim()
    const fatherPhone = normalizeDigits(fatherPhoneInput.value).trim()
    const birthDate = birthDateInput.value.trim()
    const grade = gradeInput.value.trim()

    form.querySelectorAll('[data-error-for]').forEach((error) => {
      error.textContent = ''
      error.classList.add('hidden')
    })

    if (firstName.length < 2) {
      setFieldError('firstName', 'نام را وارد کن.')
      valid = false
    }
    if (lastName.length < 2) {
      setFieldError('lastName', 'نام خانوادگی را وارد کن.')
      valid = false
    }
    if (schoolName.length < 2) {
      setFieldError('schoolName', 'نام مدرسه را وارد کن.')
      valid = false
    }
    if (!grade) {
      setFieldError('grade', 'پایه تحصیلی را انتخاب کن.')
      valid = false
    }
    if (!MOBILE_PATTERN.test(motherPhone)) {
      setFieldError('motherPhone', 'شماره تلفن مادر باید ۱۱ رقم و با 09 شروع شود.')
      valid = false
    }
    if (!MOBILE_PATTERN.test(fatherPhone)) {
      setFieldError('fatherPhone', 'شماره تلفن پدر باید ۱۱ رقم و با 09 شروع شود.')
      valid = false
    }
    if (!birthDate) {
      setFieldError('birthDate', 'تاریخ تولد را انتخاب کن.')
      valid = false
    }

    motherPhoneInput.value = motherPhone
    fatherPhoneInput.value = fatherPhone

    return valid
  }

  const init = async () => {
    try {
      const user = await window.userService?.getCurrentUser()
      if (!user) {
        window.location.replace('./auth.html#login')
        return
      }

      populateUser(user)
      initDatePicker()
    } catch (error) {
      console.error('Could not load profile:', error)
      window.showToast?.({ type: 'error', message: 'اطلاعات پروفایل بارگذاری نشد.' })
    }
  }

  ;[firstNameInput, lastNameInput, schoolInput, motherPhoneInput, fatherPhoneInput].forEach((input) => {
    input?.addEventListener('input', () => {
      if (input.name) clearFieldError(input.name)

      if (input === firstNameInput || input === lastNameInput) {
        summaryName.textContent = [firstNameInput.value.trim(), lastNameInput.value.trim()]
          .filter(Boolean)
          .join(' ') || 'دانش‌آموز دیکته خونه'
        if (avatarImage.classList.contains('hidden')) {
          avatarInitial.textContent = firstNameInput.value.trim().charAt(0) || 'د'
        }
      }

      if (input === schoolInput) {
        summarySchool.textContent = schoolInput.value.trim() || 'مدرسه ثبت نشده'
      }
    })
  })

  ;[motherPhoneInput, fatherPhoneInput].forEach((input) => {
    input?.addEventListener('input', () => {
      input.value = normalizeDigits(input.value).replace(/\D/g, '')
    })
  })

  gradeTrigger?.addEventListener('click', () => {
    const open = gradeTrigger.getAttribute('aria-expanded') === 'true'
    if (open) {
      closeGradeMenu()
    } else {
      gradeMenu.classList.remove('hidden')
      gradeTrigger.setAttribute('aria-expanded', 'true')
      gradeChevron.classList.add('rotate-180')
    }
  })

  gradeMenu?.addEventListener('click', (event) => {
    const option = event.target.closest('[data-grade-value]')
    if (!option) return
    setGrade(option.dataset.gradeValue)
    clearFieldError('grade')
    closeGradeMenu()
  })

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#profile-grade-dropdown')) closeGradeMenu()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeGradeMenu()
  })

  avatarInput?.addEventListener('change', () => {
    avatarError.classList.add('hidden')
    avatarError.textContent = ''

    const file = avatarInput.files?.[0] || null
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      avatarInput.value = ''
      avatarError.textContent = 'فرمت عکس باید JPG، PNG یا WebP باشد.'
      avatarError.classList.remove('hidden')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      avatarInput.value = ''
      avatarError.textContent = 'حجم عکس باید حداکثر ۲ مگابایت باشد.'
      avatarError.classList.remove('hidden')
      return
    }

    const url = URL.createObjectURL(file)
    avatarImage.src = url
    avatarImage.classList.remove('hidden')
    avatarInitial.classList.add('hidden')
    avatarImage.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  })

  form?.addEventListener('submit', (event) => {
    event.preventDefault()
    if (!validateProfile()) return

    window.showToast?.({
      type: 'info',
      title: 'UI آماده است',
      message: 'ذخیره واقعی اطلاعات بعد از ساخت Profile API متصل می‌شود.',
    })
  })

  passwordToggle?.addEventListener('click', () => {
    const expanded = passwordToggle.getAttribute('aria-expanded') === 'true'
    passwordToggle.setAttribute('aria-expanded', String(!expanded))
    passwordPanel.classList.toggle('hidden', expanded)
  })

  passwordForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    const current = document.getElementById('profile-current-password').value
    const next = document.getElementById('profile-new-password').value
    const confirm = document.getElementById('profile-confirm-password').value

    if (!current || !window.authService?.isPasswordValid(next) || next !== confirm) {
      window.showToast?.({ type: 'error', message: 'اطلاعات رمز عبور را کامل و معتبر وارد کن.' })
      return
    }

    window.showToast?.({
      type: 'info',
      title: 'UI آماده است',
      message: 'تغییر واقعی رمز بعد از ساخت Profile API فعال می‌شود.',
    })
  })

  init()
})()
