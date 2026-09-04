/* Profile page controller — real Profile API integration. */

;(() => {
  const MOBILE_PATTERN = /^09\d{9}$/
  const AVATAR_MAX_BYTES = 2 * 1024 * 1024
  const ALLOWED_AVATAR_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

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

  const formatBirthDate = (value) => {
    if (!value) return ''

    const date = new Date(
      `${value}T00:00:00`
    )

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return new Intl.DateTimeFormat(
      'fa-IR-u-ca-persian',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }
    ).format(date)
  }

  const form = document.getElementById(
    'profile-form'
  )

  const firstNameInput = document.getElementById(
    'profile-first-name'
  )

  const lastNameInput = document.getElementById(
    'profile-last-name'
  )

  const nationalCodeInput = document.getElementById(
    'profile-national-code'
  )

  const schoolInput = document.getElementById(
    'profile-school'
  )

  const motherPhoneInput = document.getElementById(
    'profile-mother-phone'
  )

  const fatherPhoneInput = document.getElementById(
    'profile-father-phone'
  )

  const birthDateDisplay = document.getElementById(
    'profile-birth-date-fa'
  )

  const birthDateInput = document.getElementById(
    'profile-birth-date'
  )

  const gradeInput = document.getElementById(
    'profile-grade'
  )

  const gradeTrigger = document.getElementById(
    'profile-grade-trigger'
  )

  const gradeLabel = document.getElementById(
    'profile-grade-label'
  )

  const gradeMenu = document.getElementById(
    'profile-grade-menu'
  )

  const gradeChevron = document.getElementById(
    'profile-grade-chevron'
  )

  const avatarInput = document.getElementById(
    'profile-avatar-input'
  )

  const avatarImage = document.getElementById(
    'profile-avatar-image'
  )

  const avatarInitial = document.getElementById(
    'profile-avatar-initial'
  )

  const avatarError = document.getElementById(
    'profile-avatar-error'
  )

  const avatarDeleteButton = document.getElementById(
    'profile-avatar-delete'
  )

  const summaryName = document.getElementById(
    'profile-summary-name'
  )

  const summarySchool = document.getElementById(
    'profile-summary-school'
  )

  const summaryGrade = document.getElementById(
    'profile-summary-grade'
  )

  const saveButton = document.getElementById(
    'profile-save-button'
  )

  const passwordToggle = document.getElementById(
    'profile-password-toggle'
  )

  const passwordPanel = document.getElementById(
    'profile-password-panel'
  )

  const passwordForm = document.getElementById(
    'profile-password-form'
  )

  const currentPasswordInput = document.getElementById(
    'profile-current-password'
  )

  const newPasswordInput = document.getElementById(
    'profile-new-password'
  )

  const confirmPasswordInput = document.getElementById(
    'profile-confirm-password'
  )

  let currentUser = null

  const clearFieldError = (name) => {
    const error = form?.querySelector(
      `[data-error-for="${name}"]`
    )

    if (!error) return

    error.textContent = ''
    error.classList.add('hidden')
  }

  const setFieldError = (name, message) => {
    const error = form?.querySelector(
      `[data-error-for="${name}"]`
    )

    if (!error) return

    error.textContent = message
    error.classList.remove('hidden')
  }

  const clearAllProfileErrors = () => {
    form
      ?.querySelectorAll('[data-error-for]')
      .forEach((error) => {
        error.textContent = ''
        error.classList.add('hidden')
      })
  }

  const showProfileFormError = (
    message,
    field = null
  ) => {
    if (field) {
      setFieldError(field, message)
    }

    window.showToast?.({
      type: 'error',
      title: 'اطلاعات پروفایل را بررسی کن',
      message,
    })

    if (!field) return

    const target =
      field === 'grade'
        ? gradeTrigger
        : form?.querySelector(
            `[name="${field}"]`
          )

    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    window.setTimeout(
      () => target?.focus(),
      250
    )
  }

  const setButtonBusy = (
    button,
    busy,
    busyText = 'در حال ذخیره...'
  ) => {
    if (!button) return

    if (busy) {
      if (!button.dataset.idleText) {
        button.dataset.idleText =
          button.textContent.trim()
      }

      button.disabled = true
      button.textContent = busyText
      return
    }

    button.disabled = false

    if (button.dataset.idleText) {
      button.textContent =
        button.dataset.idleText
    }
  }

  const setGrade = (value) => {
    const grade = String(value || '')

    gradeInput.value = grade
    gradeLabel.textContent =
      gradeLabels[grade] ||
      'انتخاب پایه'

    summaryGrade.textContent =
      gradeLabels[grade] ||
      'پایه —'

    gradeMenu
      ?.querySelectorAll(
        '[data-grade-value]'
      )
      .forEach((option) => {
        option.setAttribute(
          'aria-selected',
          String(
            option.dataset.gradeValue ===
              grade
          )
        )
      })
  }

  const closeGradeMenu = () => {
    gradeMenu?.classList.add('hidden')

    gradeTrigger?.setAttribute(
      'aria-expanded',
      'false'
    )

    gradeChevron?.classList.remove(
      'rotate-180'
    )
  }

  const renderAvatar = (
    hasAvatar,
    firstName = '',
    cacheKey = ''
  ) => {
    const initial =
      String(firstName || 'د')
        .trim()
        .charAt(0) || 'د'

    avatarInitial.textContent = initial

    if (hasAvatar) {
      avatarImage.src =
        window.profileService
          .getAvatarUrl(cacheKey)

      avatarImage.classList.remove(
        'hidden'
      )

      avatarInitial.classList.add(
        'hidden'
      )

      avatarDeleteButton?.classList.remove(
        'hidden'
      )

      return
    }

    avatarImage.removeAttribute('src')
    avatarImage.classList.add('hidden')
    avatarInitial.classList.remove('hidden')
    avatarDeleteButton?.classList.add(
      'hidden'
    )
  }

  const populateUser = (user) => {
    currentUser = user

    firstNameInput.value =
      user.firstName || ''

    lastNameInput.value =
      user.lastName || ''

    nationalCodeInput.value =
      user.nationalCode || ''

    schoolInput.value =
      user.schoolName || ''

    motherPhoneInput.value =
      user.motherPhone || ''

    fatherPhoneInput.value =
      user.fatherPhone || ''

    birthDateInput.value =
      user.birthDate || ''

    birthDateDisplay.value =
      formatBirthDate(
        user.birthDate
      )

    setGrade(user.grade)

    const fullName = [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim()

    summaryName.textContent =
      fullName ||
      'دانش‌آموز دیکته خونه'

    summarySchool.textContent =
      user.schoolName ||
      'مدرسه ثبت نشده'

    renderAvatar(
      Boolean(user.avatar),
      user.firstName,
      Date.now()
    )
  }

  const initDatePicker = () => {
    if (
      !birthDateDisplay ||
      !birthDateInput ||
      !window.jalaliDatepicker
    ) {
      return
    }

    window.jalaliDatepicker.startWatch({
      selector:
        '#profile-birth-date-fa',
      date: true,
      time: false,
      maxDate: 'today',
      targetValueInput:
        '#profile-birth-date',
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

    birthDateDisplay.addEventListener(
      'click',
      () => {
        window.jalaliDatepicker.show(
          birthDateDisplay
        )
      }
    )

    birthDateDisplay.addEventListener(
      'jdp:change',
      () => {
        clearFieldError(
          'birthDate'
        )
      }
    )
  }

  const validateProfile = () => {
    let valid = true
    let firstInvalidField = null

    const firstName =
      firstNameInput.value.trim()

    const lastName =
      lastNameInput.value.trim()

    const schoolName =
      schoolInput.value.trim()

    const motherPhone =
      normalizeDigits(
        motherPhoneInput.value
      ).trim()

    const fatherPhone =
      normalizeDigits(
        fatherPhoneInput.value
      ).trim()

    const birthDate =
      birthDateInput.value.trim()

    const grade =
      gradeInput.value.trim()

    clearAllProfileErrors()

    const invalid = (
      field,
      message
    ) => {
      setFieldError(field, message)
      valid = false
      firstInvalidField ||= field
    }

    if (firstName.length < 2) {
      invalid(
        'firstName',
        'نام را وارد کن.'
      )
    }

    if (lastName.length < 2) {
      invalid(
        'lastName',
        'نام خانوادگی را وارد کن.'
      )
    }

    if (schoolName.length < 2) {
      invalid(
        'schoolName',
        'نام مدرسه را وارد کن.'
      )
    }

    if (!grade) {
      invalid(
        'grade',
        'پایه تحصیلی را انتخاب کن.'
      )
    }

    if (
      !MOBILE_PATTERN.test(
        motherPhone
      )
    ) {
      invalid(
        'motherPhone',
        'شماره تلفن مادر باید ۱۱ رقم و با 09 شروع شود.'
      )
    }

    if (
      !MOBILE_PATTERN.test(
        fatherPhone
      )
    ) {
      invalid(
        'fatherPhone',
        'شماره تلفن پدر باید ۱۱ رقم و با 09 شروع شود.'
      )
    }

    if (!birthDate) {
      invalid(
        'birthDate',
        'تاریخ تولد را انتخاب کن.'
      )
    }

    motherPhoneInput.value =
      motherPhone

    fatherPhoneInput.value =
      fatherPhone

    return {
      valid,
      firstInvalidField,
      payload: {
        firstName,
        lastName,
        motherPhone,
        fatherPhone,
        birthDate,
        schoolName,
        grade: Number(grade),
      },
    }
  }

  const init = async () => {
    try {
      const user =
        await window.profileService
          .getProfile()

      if (!user) {
        window.location.replace(
          './auth.html#login'
        )
        return
      }

      populateUser(user)
      initDatePicker()
    } catch (error) {
      if (
        Number(error?.status || 0) ===
        401
      ) {
        window.location.replace(
          './auth.html#login'
        )
        return
      }

      console.error(
        'Could not load profile:',
        error
      )

      window.apiErrors?.showToast(
        error,
        {
          title:
            'پروفایل بارگذاری نشد',
          fallbackMessage:
            'اطلاعات پروفایل بارگذاری نشد.',
        }
      )
    }
  }

  ;[
    firstNameInput,
    lastNameInput,
    schoolInput,
    motherPhoneInput,
    fatherPhoneInput,
  ].forEach((input) => {
    input?.addEventListener(
      'input',
      () => {
        if (input.name) {
          clearFieldError(input.name)
        }

        if (
          input === firstNameInput ||
          input === lastNameInput
        ) {
          summaryName.textContent =
            [
              firstNameInput.value.trim(),
              lastNameInput.value.trim(),
            ]
              .filter(Boolean)
              .join(' ') ||
            'دانش‌آموز دیکته خونه'

          if (
            avatarImage.classList.contains(
              'hidden'
            )
          ) {
            avatarInitial.textContent =
              firstNameInput.value
                .trim()
                .charAt(0) || 'د'
          }
        }

        if (input === schoolInput) {
          summarySchool.textContent =
            schoolInput.value.trim() ||
            'مدرسه ثبت نشده'
        }
      }
    )
  })

  ;[
    motherPhoneInput,
    fatherPhoneInput,
  ].forEach((input) => {
    input?.addEventListener(
      'input',
      () => {
        input.value =
          normalizeDigits(
            input.value
          ).replace(/\D/g, '')
      }
    )
  })

  gradeTrigger?.addEventListener(
    'click',
    () => {
      const open =
        gradeTrigger.getAttribute(
          'aria-expanded'
        ) === 'true'

      if (open) {
        closeGradeMenu()
        return
      }

      gradeMenu.classList.remove(
        'hidden'
      )

      gradeTrigger.setAttribute(
        'aria-expanded',
        'true'
      )

      gradeChevron.classList.add(
        'rotate-180'
      )
    }
  )

  gradeMenu?.addEventListener(
    'click',
    (event) => {
      const option =
        event.target.closest(
          '[data-grade-value]'
        )

      if (!option) return

      setGrade(
        option.dataset.gradeValue
      )

      clearFieldError('grade')
      closeGradeMenu()
    }
  )

  document.addEventListener(
    'click',
    (event) => {
      if (
        !event.target.closest(
          '#profile-grade-dropdown'
        )
      ) {
        closeGradeMenu()
      }
    }
  )

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        closeGradeMenu()
      }
    }
  )

  avatarImage?.addEventListener(
    'error',
    () => {
      avatarImage.removeAttribute('src')
      avatarImage.classList.add('hidden')
      avatarInitial.classList.remove(
        'hidden'
      )
    }
  )

  avatarInput?.addEventListener(
    'change',
    async () => {
      avatarError.classList.add(
        'hidden'
      )
      avatarError.textContent = ''

      const file =
        avatarInput.files?.[0] || null

      if (!file) return

      if (
        !ALLOWED_AVATAR_TYPES.has(
          file.type
        )
      ) {
        avatarInput.value = ''
        avatarError.textContent =
          'فرمت عکس باید JPG، PNG یا WebP باشد.'
        avatarError.classList.remove(
          'hidden'
        )

        window.showToast?.({
          type: 'error',
          title:
            'عکس پروفایل معتبر نیست',
          message:
            'فرمت عکس باید JPG، PNG یا WebP باشد.',
        })
        return
      }

      if (
        file.size >
        AVATAR_MAX_BYTES
      ) {
        avatarInput.value = ''
        avatarError.textContent =
          'حجم عکس باید حداکثر ۲ مگابایت باشد.'
        avatarError.classList.remove(
          'hidden'
        )

        window.showToast?.({
          type: 'error',
          title: 'حجم عکس زیاد است',
          message:
            'حجم عکس باید حداکثر ۲ مگابایت باشد.',
        })
        return
      }

      const uploadLabel =
        document.querySelector(
          'label[for="profile-avatar-input"]'
        )

      avatarInput.disabled = true
      uploadLabel?.classList.add(
        'pointer-events-none',
        'opacity-60'
      )

      try {
        const user =
          await window.profileService
            .uploadAvatar(file)

        currentUser = user

        renderAvatar(
          true,
          user?.firstName ||
            firstNameInput.value,
          Date.now()
        )

        avatarInput.value = ''

        window.showToast?.({
          type: 'success',
          title: 'تصویر ذخیره شد',
          message:
            'تصویر پروفایل با موفقیت به‌روزرسانی شد.',
        })
      } catch (error) {
        avatarInput.value = ''

        const resolved =
          window.apiErrors?.resolve(
            error,
            'آپلود تصویر انجام نشد. دوباره تلاش کن.'
          )

        avatarError.textContent =
          resolved?.message ||
          'آپلود تصویر انجام نشد.'

        avatarError.classList.remove(
          'hidden'
        )

        window.showToast?.({
          type: 'error',
          title:
            'تصویر ذخیره نشد',
          message:
            resolved?.message ||
            'آپلود تصویر انجام نشد. دوباره تلاش کن.',
        })
      } finally {
        avatarInput.disabled = false
        uploadLabel?.classList.remove(
          'pointer-events-none',
          'opacity-60'
        )
      }
    }
  )

  avatarDeleteButton?.addEventListener(
    'click',
    async () => {
      setButtonBusy(
        avatarDeleteButton,
        true,
        'در حال حذف...'
      )

      try {
        const user =
          await window.profileService
            .deleteAvatar()

        currentUser = user

        renderAvatar(
          false,
          user?.firstName ||
            firstNameInput.value
        )

        window.showToast?.({
          type: 'success',
          title: 'تصویر حذف شد',
          message:
            'تصویر پروفایل حذف شد.',
        })
      } catch (error) {
        window.apiErrors?.showToast(
          error,
          {
            title:
              'حذف تصویر انجام نشد',
            fallbackMessage:
              'حذف تصویر انجام نشد. دوباره تلاش کن.',
          }
        )
      } finally {
        setButtonBusy(
          avatarDeleteButton,
          false
        )
      }
    }
  )

  form?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault()

      const validation =
        validateProfile()

      if (!validation.valid) {
        showProfileFormError(
          'بعضی از اطلاعات فرم درست نیست. موارد مشخص‌شده را اصلاح کن.',
          validation.firstInvalidField
        )
        return
      }

      setButtonBusy(
        saveButton,
        true
      )

      try {
        const user =
          await window.profileService
            .updateProfile(
              validation.payload
            )

        populateUser(user)

        window.showToast?.({
          type: 'success',
          title: 'تغییرات ذخیره شد',
          message:
            'اطلاعات پروفایل با موفقیت به‌روزرسانی شد.',
        })
      } catch (error) {
        const resolved =
          window.apiErrors?.resolve(
            error,
            'ذخیره اطلاعات انجام نشد. دوباره تلاش کن.'
          )

        showProfileFormError(
          resolved?.message ||
            'ذخیره اطلاعات انجام نشد.',
          resolved?.field || null
        )
      } finally {
        setButtonBusy(
          saveButton,
          false
        )
      }
    }
  )

  passwordToggle?.addEventListener(
    'click',
    () => {
      const expanded =
        passwordToggle.getAttribute(
          'aria-expanded'
        ) === 'true'

      passwordToggle.setAttribute(
        'aria-expanded',
        String(!expanded)
      )

      passwordPanel.classList.toggle(
        'hidden',
        expanded
      )
    }
  )

  passwordForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault()

      const current =
        currentPasswordInput.value

      const next =
        newPasswordInput.value

      const confirm =
        confirmPasswordInput.value

      if (!current) {
        window.showToast?.({
          type: 'error',
          title:
            'رمز عبور را بررسی کن',
          message:
            'رمز عبور فعلی را وارد کن.',
        })
        currentPasswordInput.focus()
        return
      }

      if (
        !window.authService
          ?.isPasswordValid(next)
      ) {
        window.showToast?.({
          type: 'error',
          title:
            'رمز عبور را بررسی کن',
          message:
            'رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حرف کوچک، حرف بزرگ و عدد باشد.',
        })
        newPasswordInput.focus()
        return
      }

      if (next !== confirm) {
        window.showToast?.({
          type: 'error',
          title:
            'رمز عبور را بررسی کن',
          message:
            'تکرار رمز عبور جدید با رمز جدید یکسان نیست.',
        })
        confirmPasswordInput.focus()
        return
      }

      const submitButton =
        passwordForm.querySelector(
          'button[type="submit"]'
        )

      setButtonBusy(
        submitButton,
        true,
        'در حال ثبت...'
      )

      try {
        await window.profileService
          .changePassword({
            currentPassword: current,
            newPassword: next,
          })

        passwordForm.reset()

        passwordToggle.setAttribute(
          'aria-expanded',
          'false'
        )

        passwordPanel.classList.add(
          'hidden'
        )

        window.showToast?.({
          type: 'success',
          title: 'رمز عبور تغییر کرد',
          message:
            'رمز عبور جدید با موفقیت ذخیره شد.',
        })
      } catch (error) {
        const resolved =
          window.apiErrors?.resolve(
            error,
            'تغییر رمز عبور انجام نشد. دوباره تلاش کن.'
          )

        window.showToast?.({
          type: 'error',
          title:
            'تغییر رمز انجام نشد',
          message:
            resolved?.message ||
            'تغییر رمز عبور انجام نشد. دوباره تلاش کن.',
        })

        if (
          resolved?.field ===
          'currentPassword'
        ) {
          currentPasswordInput.focus()
        } else if (
          resolved?.field ===
          'newPassword'
        ) {
          newPasswordInput.focus()
        }
      } finally {
        setButtonBusy(
          submitButton,
          false
        )
      }
    }
  )

  void init()
})()
