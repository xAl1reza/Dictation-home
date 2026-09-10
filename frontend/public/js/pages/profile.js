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

  const provinceInput = document.getElementById('profile-province')
  const provinceTrigger = document.getElementById('profile-province-trigger')
  const provinceLabel = document.getElementById('profile-province-label')
  const provinceMenu = document.getElementById('profile-province-menu')
  const provinceChevron = document.getElementById('profile-province-chevron')

  const cityInput = document.getElementById('profile-city')
  const cityTrigger = document.getElementById('profile-city-trigger')
  const cityLabel = document.getElementById('profile-city-label')
  const cityMenu = document.getElementById('profile-city-menu')
  const cityChevron = document.getElementById('profile-city-chevron')

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
        : field === 'provinceCode'
          ? provinceTrigger
          : field === 'cityId'
            ? cityTrigger
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

  const loadCities = async (provinceCode, selectedCityId = null) => {
    resetCity('در حال دریافت شهرها...')

    const cities = await window.locationService.getCities(provinceCode)
    renderLocationOptions(cityMenu, cities, 'id', 'cityId')

    if (!cities.length) {
      cityLabel.textContent = 'شهری یافت نشد'
      return
    }

    cityTrigger.disabled = false
    const selected = cities.find((city) => String(city.id) === String(selectedCityId || ''))

    if (selected) {
      cityInput.value = String(selected.id)
      cityLabel.textContent = selected.name
      cityMenu.querySelectorAll('[data-city-id]').forEach((item) => {
        item.setAttribute('aria-selected', String(item.dataset.cityId === String(selected.id)))
      })
    } else {
      cityLabel.textContent = 'انتخاب شهر'
    }
  }

  const initLocations = async (user) => {
    if (!window.locationService) {
      if (provinceLabel) {
        provinceLabel.textContent = 'سرویس استان‌ها بارگذاری نشد'
      }

      if (provinceTrigger) {
        provinceTrigger.disabled = true
      }

      resetCity('سرویس شهرها بارگذاری نشد')

      console.error(
        '[PROFILE] location-service.js is not loaded or window.locationService is unavailable.'
      )

      return
    }

    provinceTrigger.disabled = true

    try {
      const provinces = await window.locationService.getProvinces()
      renderLocationOptions(provinceMenu, provinces, 'provinceCode', 'provinceCode')

      if (!provinces.length) {
        provinceLabel.textContent = 'استانی یافت نشد'
        return
      }

      provinceTrigger.disabled = false
      const selectedProvinceCode = String(user?.provinceCode || '')
      const selectedProvince = provinces.find(
        (province) => province.provinceCode === selectedProvinceCode
      )

      if (selectedProvince) {
        provinceInput.value = selectedProvince.provinceCode
        provinceLabel.textContent = selectedProvince.name
        provinceMenu.querySelectorAll('[data-province-code]').forEach((item) => {
          item.setAttribute(
            'aria-selected',
            String(item.dataset.provinceCode === selectedProvince.provinceCode)
          )
        })
        await loadCities(selectedProvince.provinceCode, user?.cityId)
      } else {
        provinceLabel.textContent = 'انتخاب استان'
        resetCity()
      }
    } catch (error) {
      provinceLabel.textContent = 'دریافت استان‌ها ناموفق بود'
      provinceTrigger.disabled = true
      resetCity('دریافت شهرها ناموفق بود')
      window.showToast?.({
        type: 'error',
        title: 'دریافت استان و شهر انجام نشد',
        message: 'صفحه را دوباره بارگذاری کن.',
      })
    }
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

    const provinceCode =
      provinceInput?.value.trim() || ''

    const cityId =
      cityInput?.value.trim() || ''

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

    if (!provinceCode) {
      invalid(
        'provinceCode',
        'استان را انتخاب کن.'
      )
    }

    if (!cityId) {
      invalid(
        'cityId',
        'شهر را انتخاب کن.'
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
        provinceCode,
        cityId: Number(cityId),
        grade: Number(grade),
      },
    }
  }

  const init = async () => {
    /*
     * Load locations independently from profile data.
     * This prevents the province selector from being stuck on
     * "در حال دریافت استان‌ها..." if profile loading is slow.
     */
    const locationsPromise = initLocations(null)

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

      await locationsPromise

      /*
       * Existing users may already have a saved province/city.
       * Re-apply their saved selection after the province list is ready.
       * Old users with NULL location simply keep the empty selectors.
       */
      if (user?.provinceCode) {
        await initLocations(user)
      }
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
    clearFieldError('provinceCode')
    clearFieldError('cityId')
    closeProvinceMenu()

    try {
      await loadCities(provinceCode)
    } catch (error) {
      resetCity('دریافت شهرها ناموفق بود')
      window.showToast?.({
        type: 'error',
        title: 'دریافت شهرها انجام نشد',
        message: 'دوباره تلاش کن.',
      })
    }
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
    clearFieldError('cityId')
    closeCityMenu()
  })

  document.addEventListener(
    'click',
    (event) => {
      if (!event.target.closest('#profile-grade-dropdown')) {
        closeGradeMenu()
      }
      if (!event.target.closest('#profile-province-dropdown')) {
        closeProvinceMenu()
      }
      if (!event.target.closest('#profile-city-dropdown')) {
        closeCityMenu()
      }
    }
  )

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        closeGradeMenu()
        closeProvinceMenu()
        closeCityMenu()
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
