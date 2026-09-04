/*
 * Frontend-owned error dictionary.
 *
 * Raw backend errors are used only for classification and are never
 * shown directly to the user.
 */

;(() => {
  const ERROR_MAP = Object.freeze({
    API_NETWORK_ERROR: {
      message:
        'ارتباط با سرور برقرار نشد. اتصال اینترنت یا سرویس را بررسی کن و دوباره تلاش کن.',
    },

    API_INVALID_RESPONSE: {
      message: 'پاسخ سرویس قابل پردازش نیست. دوباره تلاش کن.',
    },

    API_TOKEN_STORAGE_FAILED: {
      message: 'ذخیره نشست ورود در مرورگر انجام نشد.',
    },

    AUTH_TOKEN_MISSING: {
      message: 'برای ادامه دوباره وارد حساب کاربری شو.',
    },

    Unauthorized: {
      message: 'نشست شما معتبر نیست. دوباره وارد حساب کاربری شو.',
    },

    'Invalid or expired token': {
      message: 'نشست شما منقضی شده است. دوباره وارد حساب کاربری شو.',
    },

    AUTH_LOGIN_FIELDS_REQUIRED: {
      message: 'کد ملی و رمز عبور را کامل وارد کن.',
    },

    AUTH_LOGIN_INVALID: {
      field: 'password',
      message: 'کد ملی یا رمز عبور درست نیست.',
    },

    'Too many login attempts. Try again later.': {
      message:
        'تعداد تلاش‌های ورود بیش از حد مجاز شده است. حدود ۱۵ دقیقه بعد دوباره تلاش کن.',
    },

    AUTH_NATIONAL_CODE_INVALID: {
      field: 'nationalCode',
      message: 'کد ملی واردشده معتبر نیست.',
    },

    AUTH_NATIONAL_CODE_CHECKSUM_INVALID: {
      field: 'nationalCode',
      message: 'کد ملی واردشده معتبر نیست.',
    },

    AUTH_NATIONAL_CODE_TAKEN: {
      field: 'nationalCode',
      message: 'این کد ملی قبلاً ثبت شده است.',
    },

    AUTH_FIRST_NAME_INVALID: {
      field: 'firstName',
      message: 'نام واردشده معتبر نیست.',
    },

    AUTH_LAST_NAME_INVALID: {
      field: 'lastName',
      message: 'نام خانوادگی واردشده معتبر نیست.',
    },

    AUTH_MOTHER_PHONE_INVALID: {
      field: 'motherPhone',
      message: 'شماره تلفن مادر معتبر نیست.',
    },

    AUTH_FATHER_PHONE_INVALID: {
      field: 'fatherPhone',
      message: 'شماره تلفن پدر معتبر نیست.',
    },

    AUTH_BIRTH_DATE_REQUIRED: {
      field: 'birthDate',
      message: 'تاریخ تولد را انتخاب کن.',
    },

    AUTH_BIRTH_DATE_INVALID: {
      field: 'birthDate',
      message: 'تاریخ تولد واردشده معتبر نیست.',
    },

    AUTH_PASSWORD_WEAK: {
      field: 'password',
      message:
        'رمز عبور باید حداقل ۸ کاراکتر و شامل حرف کوچک، حرف بزرگ و عدد باشد.',
    },

    AUTH_SCHOOL_INVALID: {
      field: 'schoolName',
      message: 'نام مدرسه واردشده معتبر نیست.',
    },

    AUTH_GRADE_INVALID: {
      field: 'grade',
      message: 'پایه تحصیلی انتخاب‌شده معتبر نیست.',
    },

    AUTH_AVATAR_TOO_LARGE: {
      field: 'avatar',
      message: 'حجم عکس باید حداکثر ۲ مگابایت باشد.',
    },

    AUTH_AVATAR_TYPE_INVALID: {
      field: 'avatar',
      message: 'فرمت عکس باید JPG، PNG یا WebP باشد.',
    },

    PROFILE_FIRST_NAME_INVALID: {
      field: 'firstName',
      message: 'نام واردشده معتبر نیست.',
    },

    PROFILE_LAST_NAME_INVALID: {
      field: 'lastName',
      message: 'نام خانوادگی واردشده معتبر نیست.',
    },

    PROFILE_MOTHER_PHONE_INVALID: {
      field: 'motherPhone',
      message: 'شماره تلفن مادر معتبر نیست.',
    },

    PROFILE_FATHER_PHONE_INVALID: {
      field: 'fatherPhone',
      message: 'شماره تلفن پدر معتبر نیست.',
    },

    PROFILE_BIRTH_DATE_INVALID: {
      field: 'birthDate',
      message: 'تاریخ تولد واردشده معتبر نیست.',
    },

    PROFILE_SCHOOL_INVALID: {
      field: 'schoolName',
      message: 'نام مدرسه واردشده معتبر نیست.',
    },

    PROFILE_GRADE_INVALID: {
      field: 'grade',
      message: 'پایه تحصیلی انتخاب‌شده معتبر نیست.',
    },

    PROFILE_CURRENT_PASSWORD_INVALID: {
      field: 'currentPassword',
      message: 'رمز عبور فعلی درست نیست.',
    },

    PROFILE_NEW_PASSWORD_WEAK: {
      field: 'newPassword',
      message:
        'رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حرف کوچک، حرف بزرگ و عدد باشد.',
    },

    PROFILE_AVATAR_TOO_LARGE: {
      field: 'avatar',
      message: 'حجم عکس باید حداکثر ۲ مگابایت باشد.',
    },

    PROFILE_AVATAR_TYPE_INVALID: {
      field: 'avatar',
      message: 'فرمت عکس باید JPG، PNG یا WebP باشد.',
    },
  })

  const STATUS_FALLBACK = Object.freeze({
    400: 'اطلاعات ارسال‌شده قابل قبول نیست. دوباره بررسی کن.',
    401: 'برای ادامه دوباره وارد حساب کاربری شو.',
    403: 'اجازه انجام این عملیات را نداری.',
    404: 'اطلاعات موردنظر پیدا نشد.',
    409: 'این اطلاعات با یک مورد موجود تداخل دارد.',
    422: 'بعضی از اطلاعات واردشده معتبر نیست.',
    429: 'تعداد درخواست‌ها زیاد شده است. کمی بعد دوباره تلاش کن.',
    500: 'سرویس موقتاً با مشکل مواجه شده است. دوباره تلاش کن.',
    502: 'سرویس موقتاً در دسترس نیست. دوباره تلاش کن.',
    503: 'سرویس موقتاً در دسترس نیست. دوباره تلاش کن.',
  })

  const getCode = (error) => {
    return String(error?.code || error?.message || '').trim()
  }

  const resolve = (
    error,
    fallbackMessage = 'عملیات انجام نشد. دوباره تلاش کن.'
  ) => {
    const code = getCode(error)
    const status = Number(error?.status || 0)

    if (ERROR_MAP[code]) {
      return {
        code,
        field: ERROR_MAP[code].field || null,
        message: ERROR_MAP[code].message,
        status,
      }
    }

    if (STATUS_FALLBACK[status]) {
      return {
        code,
        field: null,
        message: STATUS_FALLBACK[status],
        status,
      }
    }

    return {
      code,
      field: null,
      message: fallbackMessage,
      status,
    }
  }

  const showToast = (
    error,
    {
      title = 'خطا',
      fallbackMessage = 'عملیات انجام نشد. دوباره تلاش کن.',
    } = {}
  ) => {
    const resolved = resolve(error, fallbackMessage)

    window.showToast?.({
      type: 'error',
      title,
      message: resolved.message,
    })

    return resolved
  }

  window.apiErrors = Object.freeze({
    resolve,
    showToast,
  })
})()
