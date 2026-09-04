/*
 * Dashboard add-science-question view.
 *
 * Adds science question/answer pairs to writable science folders.
 */

;(() => {
  const { escapeDashboardHtml } = window.DashboardShared

  const initScienceFolderDropdown = () => {
    const dropdown = document.getElementById('science-folder-dropdown')
    const trigger = document.getElementById('science-folder-trigger')
    const menu = document.getElementById('science-folder-menu')
    const valueElement = document.getElementById('science-folder-value')
    const input = document.getElementById('science-folder')
    const chevron = document.getElementById('science-folder-chevron')
    const options = Array.from(
      document.querySelectorAll('.science-folder-option'),
    )

    if (!dropdown || !trigger || !menu || !valueElement || !input || !chevron) {
      return
    }

    let activeIndex = -1

    const openDropdown = () => {
      menu.classList.remove('hidden')
      trigger.setAttribute('aria-expanded', 'true')
      chevron.classList.add('rotate-180')

      const selectedIndex = options.findIndex(
        (option) => option.getAttribute('aria-selected') === 'true',
      )

      activeIndex = selectedIndex >= 0 ? selectedIndex : 0
      options[activeIndex]?.focus()
    }

    const closeDropdown = (returnFocus = false) => {
      menu.classList.add('hidden')
      trigger.setAttribute('aria-expanded', 'false')
      chevron.classList.remove('rotate-180')
      activeIndex = -1

      if (returnFocus) {
        trigger.focus()
      }
    }

    const selectFolder = (option) => {
      const value = option.dataset.value
      const label =
        option.querySelector('.science-folder-option-label')?.textContent.trim() ||
        ''

      input.value = value
      input.dispatchEvent(new Event('change', { bubbles: true }))
      valueElement.textContent = label

      valueElement.classList.remove(
        'text-mutedColor/60',
        'dark:text-mutedColor-dark/50',
      )
      valueElement.classList.add('text-textColor', 'dark:text-textColor-dark')

      options.forEach((item) => {
        const selected = item === option

        item.setAttribute('aria-selected', String(selected))
        item.classList.toggle('bg-primary/10', selected)
        item.classList.toggle('text-primary', selected)
        item.classList.toggle('dark:bg-primary/15', selected)
        item.classList.toggle('dark:text-primary-light', selected)
        item
          .querySelector('.science-folder-check')
          ?.classList.toggle('hidden', !selected)
      })

      closeDropdown(true)
    }

    trigger.addEventListener('click', () => {
      if (trigger.getAttribute('aria-expanded') === 'true') {
        closeDropdown()
      } else {
        openDropdown()
      }
    })

    options.forEach((option, index) => {
      option.addEventListener('click', () => selectFolder(option))

      option.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          activeIndex = (index + 1) % options.length
          options[activeIndex]?.focus()
          return
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()
          activeIndex = (index - 1 + options.length) % options.length
          options[activeIndex]?.focus()
          return
        }

        if (event.key === 'Home') {
          event.preventDefault()
          activeIndex = 0
          options[activeIndex]?.focus()
          return
        }

        if (event.key === 'End') {
          event.preventDefault()
          activeIndex = options.length - 1
          options[activeIndex]?.focus()
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          selectFolder(option)
          return
        }

        if (event.key === 'Escape') {
          event.preventDefault()
          closeDropdown(true)
        }
      })
    })

    trigger.addEventListener('keydown', (event) => {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        openDropdown()
      }
    })

    document.addEventListener('click', (event) => {
      if (
        !dropdown.contains(event.target) &&
        trigger.getAttribute('aria-expanded') === 'true'
      ) {
        closeDropdown()
      }
    })
  }

  const initScienceQuestionForm = () => {
    const form = document.getElementById('add-science-question-form')
    const folderInput = document.getElementById('science-folder')
    const folderValueElement = document.getElementById('science-folder-value')
    const questionInput = document.getElementById('science-question')
    const answerInput = document.getElementById('science-answer')
    const folderError = document.getElementById('science-folder-error')
    const questionError = document.getElementById('science-question-error')
    const answerError = document.getElementById('science-answer-error')
    const submitButton = document.getElementById('add-science-question-submit')

    if (
      !form ||
      !folderInput ||
      !questionInput ||
      !answerInput ||
      !folderError ||
      !questionError ||
      !answerError
    ) {
      return
    }

    const clearError = (element, field = null) => {
      element.textContent = ''
      element.classList.add('hidden')
      field?.removeAttribute('aria-invalid')
    }

    const showError = (element, message, field = null) => {
      element.textContent = message
      element.classList.remove('hidden')
      field?.setAttribute('aria-invalid', 'true')
    }

    folderInput.addEventListener('change', () => clearError(folderError))
    questionInput.addEventListener('input', () =>
      clearError(questionError, questionInput),
    )
    answerInput.addEventListener('input', () =>
      clearError(answerError, answerInput),
    )

    form.addEventListener('submit', async (event) => {
      event.preventDefault()

      clearError(folderError)
      clearError(questionError, questionInput)
      clearError(answerError, answerInput)

      const folderId = folderInput.value.trim()
      const question = questionInput.value.trim()
      const answer = answerInput.value.trim()
      let hasError = false

      if (!folderId) {
        showError(folderError, 'یک پوشه علوم انتخاب کن.')
        hasError = true
      }

      if (!question) {
        showError(questionError, 'متن سؤال را وارد کن.', questionInput)
        hasError = true
      }

      if (!answer) {
        showError(answerError, 'پاسخ سؤال را وارد کن.', answerInput)
        hasError = true
      }

      if (hasError) {
        let message = 'اطلاعات سؤال را کامل کن.'

        if (!folderId) {
          message = 'یک پوشه علوم انتخاب کن.'
          document.getElementById('science-folder-trigger')?.focus()
        } else if (!question) {
          message = 'متن سؤال را وارد کن.'
          questionInput.focus()
        } else if (!answer) {
          message = 'پاسخ سؤال را وارد کن.'
          answerInput.focus()
        }

        window.showToast?.({
          type: 'error',
          title: 'اطلاعات سؤال را بررسی کن',
          message,
        })

        return
      }

      try {
        if (submitButton) {
          submitButton.disabled = true
          submitButton.classList.add('opacity-60', 'cursor-not-allowed')
          submitButton.classList.remove('cursor-pointer')
          submitButton.textContent = 'در حال افزودن...'
        }

        await window.scienceQuestionService.createQuestion({
          folderId,
          question,
          answer,
        })

        const folderTitle = folderValueElement?.textContent.trim() || ''

        window.showToast?.({
          type: 'success',
          title: 'سؤال علوم اضافه شد',
          message: folderTitle
            ? `سؤال جدید به پوشه «${folderTitle}» اضافه شد.`
            : 'سؤال جدید با موفقیت اضافه شد.',
        })

        questionInput.value = ''
        answerInput.value = ''
        questionInput.focus()
      } catch (error) {
        const errors = {
          SCIENCE_FOLDER_REQUIRED: 'یک پوشه علوم انتخاب کن.',
          SCIENCE_FOLDER_NOT_FOUND: 'پوشه انتخاب‌شده پیدا نشد.',
          SCIENCE_FOLDER_LOCKED: 'این پوشه قابل ویرایش نیست.',
          SCIENCE_FOLDER_TYPE_INVALID: 'فقط پوشه‌های علوم قابل انتخاب هستند.',
          SCIENCE_QUESTION_REQUIRED: 'متن سؤال را وارد کن.',
          SCIENCE_QUESTION_TOO_LONG: 'متن سؤال خیلی طولانی است.',
          SCIENCE_ANSWER_REQUIRED: 'پاسخ سؤال را وارد کن.',
          SCIENCE_ANSWER_TOO_LONG: 'پاسخ سؤال خیلی طولانی است.',
          SCIENCE_QUESTION_DUPLICATE: 'این سؤال قبلاً در همین پوشه ثبت شده است.',
        }

        const resolved = window.apiErrors?.resolve(
          error,
          'افزودن سؤال انجام نشد. دوباره تلاش کن.'
        )

        const message =
          errors[error.message] ||
          resolved?.message ||
          'افزودن سؤال انجام نشد.'

        if (
          error.message === 'SCIENCE_FOLDER_REQUIRED' ||
          error.message === 'SCIENCE_FOLDER_NOT_FOUND' ||
          error.message === 'SCIENCE_FOLDER_LOCKED' ||
          error.message === 'SCIENCE_FOLDER_TYPE_INVALID'
        ) {
          showError(folderError, message)
        } else if (
          error.message === 'SCIENCE_ANSWER_REQUIRED' ||
          error.message === 'SCIENCE_ANSWER_TOO_LONG'
        ) {
          showError(answerError, message, answerInput)
          answerInput.focus()
        } else {
          showError(questionError, message, questionInput)
          questionInput.focus()
        }

        window.showToast?.({
          type: 'error',
          title: 'سؤال اضافه نشد',
          message,
        })
      } finally {
        if (submitButton) {
          submitButton.disabled = false
          submitButton.classList.remove('opacity-60', 'cursor-not-allowed')
          submitButton.classList.add('cursor-pointer')
          submitButton.textContent = 'افزودن سؤال علوم'
        }
      }
    })
  }

  const renderAddScienceQuestionView = async () => {
    const container = document.getElementById('dashboard-view')
    if (!container) return

    container.innerHTML = `
      <div class="py-10 text-center">
        <span class="ui-meta">در حال دریافت پوشه‌های علوم...</span>
      </div>
    `

    try {
      const folders = await window.folderService.getWritableFolders('science')

      const folderOptions = folders
        .map(
          (folder) => `
            <button
              type="button"
              role="option"
              aria-selected="false"
              data-value="${escapeDashboardHtml(folder.id)}"
              class="science-folder-option form-option"
            >
              <span class="science-folder-option-label">
                ${escapeDashboardHtml(folder.title)}
              </span>

              <span
                class="science-folder-check hidden text-primary dark:text-primary-light"
                aria-hidden="true"
              >
                ✓
              </span>
            </button>
          `,
        )
        .join('')

      container.innerHTML = `
        <section
          aria-labelledby="add-science-question-title"
          class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div
            class="rounded-lg border border-white/70 bg-surface p-6 shadow-card backdrop-blur-md dark:border-border-dark dark:bg-surface-dark dark:shadow-card-dark sm:p-8"
          >
            <div class="mb-7">
              <div class="mb-2 flex items-center gap-2">
                <span aria-hidden="true" class="size-1.5 rounded-full bg-secondary"></span>
                <span class="ui-eyebrow text-secondary">
                  مدیریت علوم
                </span>
              </div>

              <h2 id="add-science-question-title" class="mb-2">
                افزودن سؤال علوم
              </h2>

              <p class="max-w-xl text-mutedColor dark:text-mutedColor-dark">
                سؤال و پاسخ را داخل یکی از پوشه‌های علوم ذخیره کن تا در مسابقه علوم استفاده شوند.
              </p>
            </div>

            ${
              folders.length
                ? `
                  <form id="add-science-question-form" class="space-y-6" novalidate>
                    <div class="form-group">
                      <label id="science-folder-label" class="form-label">
                        انتخاب پوشه علوم
                        <span class="form-required" aria-hidden="true">*</span>
                      </label>

                      <div id="science-folder-dropdown" class="relative">
                        <input type="hidden" id="science-folder" name="folderId" value="" />

                        <button
                          type="button"
                          id="science-folder-trigger"
                          aria-labelledby="science-folder-label science-folder-value"
                          aria-haspopup="listbox"
                          aria-expanded="false"
                          aria-controls="science-folder-menu"
                          class="form-control form-select-trigger"
                        >
                          <span
                            id="science-folder-value"
                            class="text-mutedColor/60 dark:text-mutedColor-dark/50"
                          >
                            یک پوشه علوم انتخاب کن
                          </span>

                          <svg
                            id="science-folder-chevron"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            class="size-4 shrink-0 text-mutedColor transition-transform duration-300 dark:text-mutedColor-dark"
                            aria-hidden="true"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"></path>
                          </svg>
                        </button>

                        <div
                          id="science-folder-menu"
                          role="listbox"
                          aria-labelledby="science-folder-label"
                          tabindex="-1"
                          class="form-dropdown-menu hidden"
                        >
                          ${folderOptions}
                        </div>
                      </div>

                      <span id="science-folder-error" class="form-error hidden" role="alert"></span>
                    </div>

                    <div class="form-group">
                      <label for="science-question" class="form-label">
                        سؤال
                        <span class="form-required" aria-hidden="true">*</span>
                      </label>

                      <textarea
                        id="science-question"
                        name="question"
                        maxlength="220"
                        class="form-textarea"
                        placeholder="مثلاً گیاهان برای رشد به چه چیزهایی نیاز دارند؟"
                        aria-describedby="science-question-help science-question-error"
                      ></textarea>

                      <span id="science-question-help" class="form-help">
                        سؤال را کوتاه، روشن و متناسب با سطح دانش‌آموز بنویس.
                      </span>

                      <span id="science-question-error" class="form-error hidden" role="alert"></span>
                    </div>

                    <div class="form-group">
                      <label for="science-answer" class="form-label">
                        پاسخ درست
                        <span class="form-required" aria-hidden="true">*</span>
                      </label>

                      <textarea
                        id="science-answer"
                        name="answer"
                        maxlength="600"
                        class="form-textarea"
                        placeholder="پاسخ صحیح سؤال را بنویس"
                        aria-describedby="science-answer-help science-answer-error"
                      ></textarea>

                      <span id="science-answer-help" class="form-help">
                        پاسخ اصلی در مرحله بررسی جواب به دانش‌آموز نمایش داده می‌شود.
                      </span>

                      <span id="science-answer-error" class="form-error hidden" role="alert"></span>
                    </div>

                    <div
                      class="flex flex-col gap-3 border-t border-textColor/5 pt-6 dark:border-border-dark-soft sm:flex-row sm:items-center sm:justify-end"
                    >
                      <button
                        id="add-science-question-submit"
                        type="submit"
                        class="btn-primary gap-2"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          class="size-4"
                          aria-hidden="true"
                        >
                          <path stroke-linecap="round" d="M12 5v14M5 12h14"></path>
                        </svg>
                        افزودن سؤال علوم
                      </button>
                    </div>
                  </form>
                `
                : `
                  <div
                    class="rounded-lg border border-dashed border-secondary/20 bg-secondary/5 px-6 py-10 text-center dark:bg-secondary/5"
                  >
                    <div
                      class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary/10 text-secondary dark:bg-secondary/15"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        class="size-5"
                        aria-hidden="true"
                      >
                        <path stroke-linecap="round" d="M12 5v14M5 12h14"></path>
                      </svg>
                    </div>

                    <h3 class="mb-2">هنوز پوشه علوم نداری</h3>

                    <p class="mb-5 text-mutedColor dark:text-mutedColor-dark">
                      اول یک پوشه جدید بساز و نوع آن را «علوم» انتخاب کن.
                    </p>

                    <a
                      href="./dashboard.html?view=folders"
                      data-dashboard-link="folders"
                      class="btn-primary"
                    >
                      ساخت پوشه علوم
                    </a>
                  </div>
                `
            }
          </div>

          <aside
            class="rounded-lg border border-white/60 bg-surface-soft p-6 dark:border-border-dark-soft dark:bg-surface-dark-soft"
          >
            <div
              class="mb-5 flex size-11 items-center justify-center rounded-md bg-secondary/10 text-secondary dark:bg-secondary/15"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="size-5"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 3h6v4l4 7a4 4 0 0 1-3.5 6h-7A4 4 0 0 1 5 14l4-7V3Z"></path>
                <path stroke-linecap="round" d="M8 14h8"></path>
              </svg>
            </div>

            <h3 class="mb-3">این سؤال‌ها کجا استفاده می‌شن؟</h3>

            <p class="text-mutedColor dark:text-mutedColor-dark">
              در Stage 8 بازی علوم، سؤال‌ها از همان پوشه‌ای که انتخاب می‌کنی خوانده می‌شوند و پاسخ اصلی بعد از جواب دانش‌آموز نمایش داده خواهد شد.
            </p>

            <div class="mt-6 border-t border-textColor/5 pt-5 dark:border-border-dark-soft">
              <span class="ui-label block">نکته</span>
              <p class="mt-2 text-mutedColor dark:text-mutedColor-dark">
                پوشه‌های دیکته در این صفحه نمایش داده نمی‌شوند تا کلمات و سؤال‌های علوم با هم مخلوط نشوند.
              </p>
            </div>
          </aside>
        </section>
      `

      if (folders.length) {
        initScienceFolderDropdown()
        initScienceQuestionForm()
      }
    } catch (error) {
      console.error('Failed to load science question view:', error)

      window.apiErrors?.showToast(error, {
        title: 'دریافت پوشه‌های علوم انجام نشد',
        fallbackMessage: 'پوشه‌های علوم از سرور دریافت نشدند.',
      })

      container.innerHTML = `
        <div class="rounded-lg border border-secondary/15 bg-secondary/5 px-6 py-10 text-center">
          <h2 class="mb-2">دریافت پوشه‌های علوم انجام نشد</h2>
          <p class="text-mutedColor dark:text-mutedColor-dark">
            لطفاً صفحه را دوباره بارگذاری کن.
          </p>
        </div>
      `
    }
  }

  window.DashboardAddScienceQuestion = Object.freeze({
    renderAddScienceQuestionView,
  })
})()
