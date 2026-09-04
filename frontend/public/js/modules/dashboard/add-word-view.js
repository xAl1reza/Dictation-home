/*
 * Dashboard add-word view.
 *
 * Handles writable folder selection, custom dropdown
 * and add-word form interactions.
 */

;(() => {
  const { escapeDashboardHtml } = window.DashboardShared

  const initAddWordFolderDropdown = () => {
    const dropdown = document.getElementById('word-folder-dropdown')

    const trigger = document.getElementById('word-folder-trigger')

    const menu = document.getElementById('word-folder-menu')

    const valueElement = document.getElementById('word-folder-value')

    const input = document.getElementById('word-folder')

    const chevron = document.getElementById('word-folder-chevron')

    const options = Array.from(document.querySelectorAll('.word-folder-option'))

    if (!dropdown || !trigger || !menu || !valueElement || !input || !chevron) {
      return
    }

    let activeIndex = -1

    const openDropdown = () => {
      menu.classList.remove('hidden')

      trigger.setAttribute('aria-expanded', 'true')

      chevron.classList.add('rotate-180')

      const selectedIndex = options.findIndex(
        (option) => option.getAttribute('aria-selected') === 'true'
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
        option.querySelector('.word-folder-option-label')?.textContent.trim() ||
        ''

      input.value = value

      input.dispatchEvent(
        new Event('change', {
          bubbles: true,
        })
      )

      valueElement.textContent = label

      valueElement.classList.remove(
        'text-mutedColor/60',
        'dark:text-mutedColor-dark/50'
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
          .querySelector('.word-folder-check')
          ?.classList.toggle('hidden', !selected)
      })

      closeDropdown(true)
    }

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true'

      if (isOpen) {
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

          options[activeIndex].focus()
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()

          activeIndex = (index - 1 + options.length) % options.length

          options[activeIndex].focus()
        }

        if (event.key === 'Home') {
          event.preventDefault()

          activeIndex = 0

          options[activeIndex].focus()
        }

        if (event.key === 'End') {
          event.preventDefault()

          activeIndex = options.length - 1

          options[activeIndex].focus()
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()

          selectFolder(option)
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

  const initAddWordForm = () => {
    const form = document.getElementById('add-word-form')

    const folderInput = document.getElementById('word-folder')

    const folderValueElement = document.getElementById('word-folder-value')

    const wordInput = document.getElementById('word-value')

    const folderError = document.getElementById('word-folder-error')

    const wordError = document.getElementById('word-value-error')

    const submitButton = document.getElementById('add-word-submit')

    if (!form || !folderInput || !wordInput || !folderError || !wordError) {
      return
    }

    const clearFolderError = () => {
      folderError.textContent = ''
      folderError.classList.add('hidden')
    }

    const clearWordError = () => {
      wordError.textContent = ''
      wordError.classList.add('hidden')

      wordInput.removeAttribute('aria-invalid')
    }

    const showFolderError = (message) => {
      folderError.textContent = message

      folderError.classList.remove('hidden')
    }

    const showWordError = (message) => {
      wordError.textContent = message

      wordError.classList.remove('hidden')

      wordInput.setAttribute('aria-invalid', 'true')
    }

    wordInput.addEventListener('input', clearWordError)

    /*
     * The custom folder dropdown stores
     * the selected folder in this hidden input.
     */
    folderInput.addEventListener('change', clearFolderError)

    form.addEventListener('submit', async (event) => {
      event.preventDefault()

      clearFolderError()
      clearWordError()

      const folderId = folderInput.value.trim()

      const value = wordInput.value.trim()

      let hasError = false

      if (!folderId) {
        showFolderError('یک پوشه انتخاب کن.')

        hasError = true
      }

      if (!value) {
        showWordError('کلمه یا عبارت را وارد کن.')

        hasError = true
      }

      if (hasError) {
        window.showToast?.({
          type: 'error',
          title: 'اطلاعات کلمه را بررسی کن',
          message: !folderId
            ? 'یک پوشه دیکته انتخاب کن.'
            : 'کلمه یا عبارت را وارد کن.',
        })

        if (!folderId) {
          document.getElementById('word-folder-trigger')?.focus()
        } else {
          wordInput.focus()
        }

        return
      }

      const selectedFolderName = folderValueElement?.textContent.trim() || ''

      try {
        if (submitButton) {
          submitButton.disabled = true

          submitButton.classList.add('opacity-60', 'cursor-not-allowed')

          submitButton.classList.remove('cursor-pointer')

          submitButton.textContent = 'در حال افزودن...'
        }

        await window.wordService.createWord({
          folderId,
          value,
        })

        window.showToast?.({
          type: 'success',
          title: 'کلمه اضافه شد',
          message: selectedFolderName
            ? `«${value}» به پوشه «${selectedFolderName}» اضافه شد.`
            : `«${value}» با موفقیت اضافه شد.`,
        })

        /*
         * Keep the selected folder so the user
         * can quickly add multiple words.
         */
        wordInput.value = ''
        wordInput.focus()
      } catch (error) {
        const errors = {
          WORD_FOLDER_REQUIRED: 'یک پوشه انتخاب کن.',

          WORD_VALUE_REQUIRED: 'کلمه یا عبارت را وارد کن.',

          WORD_VALUE_TOO_LONG: 'کلمه یا عبارت خیلی طولانی است.',

          WORD_FOLDER_NOT_FOUND: 'پوشه انتخاب‌شده پیدا نشد.',

          WORD_FOLDER_LOCKED: 'امکان افزودن کلمه به این پوشه وجود ندارد.',

          WORD_FOLDER_TYPE_INVALID: 'فقط پوشه‌های دیکته قابل انتخاب هستند.',

          WORD_DUPLICATE: 'این کلمه قبلاً در همین پوشه اضافه شده است.',
        }

        const resolved = window.apiErrors?.resolve(
          error,
          'افزودن کلمه انجام نشد. دوباره تلاش کن.'
        )

        const message =
          errors[error.message] ||
          resolved?.message ||
          'افزودن کلمه انجام نشد.'

        if (
          error.message === 'WORD_FOLDER_REQUIRED' ||
          error.message === 'WORD_FOLDER_NOT_FOUND' ||
          error.message === 'WORD_FOLDER_LOCKED' ||
          error.message === 'WORD_FOLDER_TYPE_INVALID'
        ) {
          showFolderError(message)
        }

        if (
          error.message === 'WORD_VALUE_REQUIRED' ||
          error.message === 'WORD_VALUE_TOO_LONG' ||
          error.message === 'WORD_DUPLICATE'
        ) {
          showWordError(message)
          wordInput.focus()
        }

        if (!errors[error.message]) {
          console.error('Failed to create word:', error)
        }

        window.showToast?.({
          type: 'error',
          title: 'افزودن کلمه انجام نشد',
          message,
        })
      } finally {
        if (submitButton) {
          submitButton.disabled = false

          submitButton.classList.remove('opacity-60', 'cursor-not-allowed')

          submitButton.classList.add('cursor-pointer')

          submitButton.innerHTML = `
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              class="size-4"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                d="M12 5v14M5 12h14"
              ></path>
            </svg>

            افزودن کلمه
          `
        }
      }
    })
  }

  const renderAddWordView = async () => {
    const container = document.getElementById('dashboard-view')

    if (!container) return

    container.innerHTML = `
    <div class="py-10 text-center">
      <span
       
      >
        در حال دریافت پوشه‌ها...
      </span>
    </div>
  `

    try {
      const folders = await window.folderService.getWritableFolders('dictation')

      const folderOptions = folders
        .map(
          (folder) => `
      <button
        type="button"
        role="option"
        aria-selected="false"
        data-value="${escapeDashboardHtml(folder.id)}"
        class="word-folder-option form-option"
      >
        <span class="word-folder-option-label">
          ${escapeDashboardHtml(folder.title)}
        </span>

        <span
          class="word-folder-check hidden text-primary dark:text-primary-light"
          aria-hidden="true"
        >
          ✓
        </span>
      </button>
    `
        )
        .join('')

      container.innerHTML = `
      <section
        aria-labelledby="add-word-title"
        class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <!-- Main form -->
        <div
          class="rounded-lg border border-white/70 dark:border-border-dark bg-surface dark:bg-surface-dark p-6 sm:p-8 shadow-card dark:shadow-card-dark backdrop-blur-md"
        >
          <div class="mb-7">
            <div
              class="mb-2 flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                class="size-1.5 rounded-full bg-primary"
              ></span>

              <span
                class="ui-eyebrow"
              >
                مدیریت کلمات
              </span>
            </div>

            <h2
              id="add-word-title"
              class="mb-2"
            >
              افزودن کلمه
            </h2>

            <p
              class="max-w-xl text-mutedColor dark:text-mutedColor-dark"
            >
              ابتدا پوشه موردنظر را انتخاب کن و بعد کلمه جدید را به آن اضافه کن.
            </p>
          </div>

          ${
            folders.length
              ? `
                <form
                  id="add-word-form"
                  novalidate
                  class="space-y-6"
                >
                  <!-- Folder -->
                  <div class="form-group">
                   <label
  id="word-folder-label"
  class="form-label"
>
                      انتخاب پوشه

                      <span
                        class="form-required"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>

                    <div
  id="word-folder-dropdown"
  class="relative"
>
  <input
    type="hidden"
    id="word-folder"
    name="folderId"
    value=""
  />

  <button
    type="button"
    id="word-folder-trigger"
    aria-labelledby="word-folder-label word-folder-value"
    aria-haspopup="listbox"
    aria-expanded="false"
    aria-controls="word-folder-menu"
    class="form-control form-select-trigger"
  >
    <span
      id="word-folder-value"
      class="text-mutedColor/60 dark:text-mutedColor-dark/50"
    >
      یک پوشه انتخاب کن
    </span>

    <svg
      id="word-folder-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      class="size-4 shrink-0 text-mutedColor dark:text-mutedColor-dark transition-transform duration-300"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m6 9 6 6 6-6"
      ></path>
    </svg>
  </button>

  <div
    id="word-folder-menu"
    role="listbox"
    aria-labelledby="word-folder-label"
    tabindex="-1"
    class="form-dropdown-menu hidden"
  >
    ${folderOptions}
  </div>
</div>

                    <span
                      id="word-folder-error"
                      class="form-error hidden"
                      role="alert"
                    ></span>
                  </div>

                  <!-- Word -->
                  <div class="form-group">
                    <label
                      for="word-value"
                      class="form-label"
                    >
                      کلمه یا عبارت

                      <span
                        class="form-required"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>

                    <input
                      id="word-value"
                      name="wordValue"
                      type="text"
                      maxlength="80"
                      autocomplete="off"
                      class="form-control"
                      placeholder="مثلاً امام جماعت"
                      aria-describedby="word-value-help word-value-error"
                    />

                    <span
                      id="word-value-help"
                      class="form-help"
                    >
                      می‌تونی یک کلمه یا عبارت کوتاه وارد کنی.
                    </span>

                    <span
                      id="word-value-error"
                      class="form-error hidden"
                      role="alert"
                    ></span>
                  </div>

                  <!-- Actions -->
                  <div
                    class="flex flex-col gap-3 border-t border-textColor/5 dark:border-border-dark-soft pt-6 sm:flex-row sm:items-center sm:justify-end"
                  >
                    <button
                      id="add-word-submit"
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
                        <path
                          stroke-linecap="round"
                          d="M12 5v14M5 12h14"
                        ></path>
                      </svg>

                      افزودن کلمه
                    </button>
                  </div>
                </form>
              `
              : `
                <div
                  class="rounded-lg border border-dashed border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.05] px-6 py-10 text-center"
                >
                  <div
                    class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      class="size-5"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        d="M12 5v14M5 12h14"
                      ></path>
                    </svg>
                  </div>

                  <h3 class="mb-2">
                    هنوز پوشه دیکته قابل ویرایشی نداری
                  </h3>

                  <p
                    class="mb-5 text-mutedColor dark:text-mutedColor-dark"
                  >
                    برای افزودن کلمه، اول یک پوشه شخصی از نوع دیکته بساز.
                  </p>

                  <a
                    href="./dashboard.html?view=folders"
                    data-dashboard-link="folders"
                    class="btn-primary"
                  >
                    رفتن به پوشه‌ها
                  </a>
                </div>
              `
          }
        </div>

        <!-- Help -->
        <aside
          class="rounded-lg border border-white/60 dark:border-border-dark-soft bg-surface-soft dark:bg-surface-dark-soft p-6"
        >
          <div
            class="mb-5 flex size-11 items-center justify-center rounded-md bg-accent/15 text-accent"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              class="size-5"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 18h.01M9.8 9.5a2.4 2.4 0 1 1 3.7 2c-.9.6-1.5 1.1-1.5 2"
              ></path>

              <circle
                cx="12"
                cy="12"
                r="9"
              ></circle>
            </svg>
          </div>

          <h3
            class="mb-3"
          >
            کلمه‌ها کجا استفاده می‌شن؟
          </h3>

          <p
            class="text-mutedColor dark:text-mutedColor-dark"
          >
            کلمه‌هایی که اینجا اضافه می‌کنی، بعداً در مسابقه دیکته از پوشه انتخاب‌شده خوانده می‌شن.
          </p>

          <div
            class="mt-6 border-t border-textColor/5 dark:border-border-dark-soft pt-5"
          >
            <span
              class="ui-label block"
            >
              نکته
            </span>

            <p
              class="mt-2 text-mutedColor dark:text-mutedColor-dark"
            >
              پوشه‌های پیش‌فرض دیکته خونه قابل ویرایش نیستن؛ فقط پوشه‌هایی که خودت ساختی اینجا نمایش داده می‌شن.
            </p>
          </div>
        </aside>
      </section>
    `

      initAddWordFolderDropdown()
      initAddWordForm()
    } catch (error) {
      console.error('Failed to load add word view:', error)

      window.apiErrors?.showToast(error, {
        title: 'دریافت پوشه‌ها انجام نشد',
        fallbackMessage: 'پوشه‌های دیکته از سرور دریافت نشدند.',
      })

      container.innerHTML = `
      <div
        class="rounded-lg border border-secondary/15 bg-secondary/5 px-6 py-10 text-center"
      >
        <h2 class="mb-2">
          دریافت پوشه‌ها انجام نشد
        </h2>

        <p
          class="text-mutedColor dark:text-mutedColor-dark"
        >
          لطفاً صفحه را دوباره بارگذاری کن.
        </p>
      </div>
    `
    }
  }

  window.DashboardAddWord = {
    renderAddWordView,
  }
})()
