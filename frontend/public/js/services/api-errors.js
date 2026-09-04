/*
 * Frontend-owned API error dictionary.
 *
 * Backend messages/codes are used only for classification.
 * Raw server errors are never rendered directly to the user.
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


    PROFILE_NO_FIELDS: {
      message: 'تغییری برای ذخیره وجود ندارد.',
    },

    PROFILE_CURRENT_PASSWORD_REQUIRED: {
      field: 'currentPassword',
      message: 'رمز عبور فعلی را وارد کن.',
    },

    PROFILE_AVATAR_REQUIRED: {
      field: 'avatar',
      message: 'یک تصویر برای پروفایل انتخاب کن.',
    },

    PROFILE_AVATAR_UPLOAD_INVALID: {
      field: 'avatar',
      message: 'آپلود تصویر کامل نشد. دوباره تلاش کن.',
    },

    PROFILE_AVATAR_NOT_FOUND: {
      field: 'avatar',
      message: 'تصویر پروفایل پیدا نشد.',
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

    FOLDER_ID_REQUIRED: {
      message: 'پوشه انتخاب‌شده معتبر نیست.',
    },
    FOLDER_TITLE_REQUIRED: {
      field: 'title',
      message: 'نام پوشه را وارد کن.',
    },
    FOLDER_TITLE_TOO_LONG: {
      field: 'title',
      message: 'نام پوشه خیلی طولانی است.',
    },
    FOLDER_TITLE_DUPLICATE: {
      field: 'title',
      message: 'پوشه‌ای با همین نام و همین نوع از قبل وجود دارد.',
    },
    FOLDER_TYPE_INVALID: {
      message: 'نوع پوشه معتبر نیست.',
    },
    FOLDER_NOT_FOUND: {
      message: 'پوشه موردنظر پیدا نشد.',
    },
    FOLDER_LOCKED: {
      message: 'این پوشه قابل ویرایش نیست.',
    },

    WORD_ID_REQUIRED: {
      message: 'کلمه انتخاب‌شده معتبر نیست.',
    },
    WORD_FOLDER_REQUIRED: {
      field: 'folderId',
      message: 'یک پوشه دیکته انتخاب کن.',
    },
    WORD_VALUE_REQUIRED: {
      field: 'value',
      message: 'کلمه یا عبارت را وارد کن.',
    },
    WORD_VALUE_TOO_LONG: {
      field: 'value',
      message: 'کلمه یا عبارت خیلی طولانی است.',
    },
    WORD_FOLDER_NOT_FOUND: {
      field: 'folderId',
      message: 'پوشه انتخاب‌شده پیدا نشد.',
    },
    WORD_FOLDER_LOCKED: {
      field: 'folderId',
      message: 'امکان افزودن کلمه به این پوشه وجود ندارد.',
    },
    WORD_FOLDER_TYPE_INVALID: {
      field: 'folderId',
      message: 'فقط پوشه‌های دیکته برای کلمات قابل استفاده هستند.',
    },
    WORD_DUPLICATE: {
      field: 'value',
      message: 'این کلمه قبلاً در همین پوشه وجود دارد.',
    },
    WORD_NOT_FOUND: {
      message: 'کلمه موردنظر پیدا نشد.',
    },

    SCIENCE_FOLDER_REQUIRED: {
      field: 'folderId',
      message: 'یک پوشه علوم انتخاب کن.',
    },
    SCIENCE_FOLDER_NOT_FOUND: {
      field: 'folderId',
      message: 'پوشه انتخاب‌شده پیدا نشد.',
    },
    SCIENCE_FOLDER_LOCKED: {
      field: 'folderId',
      message: 'این پوشه قابل ویرایش نیست.',
    },
    SCIENCE_FOLDER_TYPE_INVALID: {
      field: 'folderId',
      message: 'فقط پوشه‌های علوم برای سؤال‌ها قابل استفاده هستند.',
    },
    SCIENCE_QUESTION_ID_REQUIRED: {
      message: 'سؤال انتخاب‌شده معتبر نیست.',
    },
    SCIENCE_QUESTION_REQUIRED: {
      field: 'question',
      message: 'متن سؤال را وارد کن.',
    },
    SCIENCE_QUESTION_TOO_LONG: {
      field: 'question',
      message: 'متن سؤال خیلی طولانی است.',
    },
    SCIENCE_ANSWER_REQUIRED: {
      field: 'answer',
      message: 'پاسخ سؤال را وارد کن.',
    },
    SCIENCE_ANSWER_TOO_LONG: {
      field: 'answer',
      message: 'پاسخ سؤال خیلی طولانی است.',
    },
    SCIENCE_QUESTION_DUPLICATE: {
      field: 'question',
      message: 'این سؤال قبلاً در همین پوشه ثبت شده است.',
    },
    SCIENCE_QUESTION_NOT_FOUND: {
      message: 'سؤال موردنظر پیدا نشد.',
    },

    GAME_RESULT_REQUIRED: {
      message: 'اطلاعات نتیجه بازی کامل نیست.',
    },
    GAME_RESULT_NOT_FINISHED: {
      message: 'بازی هنوز به پایان نرسیده است.',
    },
    GAME_RESULT_SESSION_ID_REQUIRED: {
      message: 'شناسه مسابقه معتبر نیست.',
    },
    GAME_RESULT_GAME_TYPE_INVALID: {
      message: 'نوع بازی معتبر نیست.',
    },
    GAME_RESULT_USER_ID_REQUIRED: {
      message: 'کاربر مسابقه مشخص نیست.',
    },
    GAME_RESULT_PARTICIPANT_NOT_FOUND: {
      message: 'نتیجه بازیکن واردشده پیدا نشد.',
    },
    GAME_RESULT_FOLDER_NOT_FOUND: {
      message: 'پوشه مربوط به این مسابقه پیدا نشد.',
    },
    GAME_RESULT_DUPLICATE: {
      message: 'نتیجه این مسابقه قبلاً ذخیره شده است.',
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

  const remap = (error, codeMap = {}) => {
    const sourceCode = getCode(error)
    const mappedCode = codeMap[sourceCode]

    if (!mappedCode || mappedCode === sourceCode) {
      return error
    }

    const mappedError = new Error(mappedCode)
    mappedError.code = mappedCode
    mappedError.status = Number(error?.status || 0)
    mappedError.cause = error

    return mappedError
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
    getCode,
    remap,
    resolve,
    showToast,
  })
})()
