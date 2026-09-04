/*
 * Dashboard folders view.
 *
 * Handles typed folder cards and add-folder flow.
 */

;(() => {
  const { toPersianNumber, escapeDashboardHtml } = window.DashboardShared

  const { createFolderManagerModal, initFolderManagerEvents } =
    window.DashboardFolderManager

  const getFolderPresentation = (folder) => {
    const isScience = folder.type === 'science'

    return {
      typeLabel: isScience ? 'علوم' : 'دیکته',
      itemLabel: isScience ? 'سؤال' : 'کلمه',
      itemCount: Number(
        isScience ? folder.questionCount : folder.wordCount,
      ),
      iconClass: isScience
        ? 'bg-secondary/10 text-secondary dark:bg-secondary/15'
        : 'bg-accent/15 text-accent dark:bg-accent/10',
      badgeClass: isScience
        ? 'bg-secondary/10 text-secondary dark:bg-secondary/15'
        : 'bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark',
    }
  }

  const createFolderIcon = () => {
    return `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        class="size-6"
        aria-hidden="true"
      >
        <path
          stroke-linejoin="round"
          d="M3.5 7A2.5 2.5 0 0 1 6 4.5h4l2 2h6A2.5 2.5 0 0 1 20.5 9v7.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5V7Z"
        ></path>
      </svg>
    `
  }

  const createFolderCard = (folder) => {
    const title = escapeDashboardHtml(folder.title)
    const presentation = getFolderPresentation(folder)
    const itemCount = toPersianNumber(presentation.itemCount)
    const isLocked = Boolean(folder.locked)

    const content = `
      <div class="relative z-10">
        <div class="mb-7 flex items-start justify-between gap-4">
          <div
            class="flex size-12 items-center justify-center rounded-md ${presentation.iconClass}"
          >
            ${createFolderIcon()}
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <span class="ui-badge ${presentation.badgeClass}">
              ${presentation.typeLabel}
            </span>

            ${
              isLocked
                ? `
                  <span class="ui-badge gap-1.5 bg-textColor/5 dark:bg-white/5">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      class="size-3.5"
                      aria-hidden="true"
                    >
                      <rect x="5" y="10" width="14" height="10" rx="2"></rect>
                      <path stroke-linecap="round" d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                    </svg>
                    پیش‌فرض
                  </span>
                `
                : ''
            }
          </div>
        </div>

        <h3 data-folder-card-title class="mb-2">${title}</h3>

        <div class="flex items-center justify-between gap-3">
          <span data-folder-item-count class="ui-meta">
            ${itemCount} ${presentation.itemLabel}
          </span>

          ${
            isLocked
              ? '<span class="ui-meta text-mutedColor/70 dark:text-mutedColor-dark/70">قابل ویرایش نیست</span>'
              : '<span class="ui-meta">برای مدیریت بازش کن</span>'
          }
        </div>
      </div>
    `

    if (isLocked) {
      return `
        <article
          aria-disabled="true"
          class="relative overflow-hidden rounded-lg border border-white/60 bg-surface-soft p-5 opacity-70 dark:border-border-dark-soft dark:bg-surface-dark-soft"
        >
          ${content}
        </article>
      `
    }

    return `
      <button
        type="button"
        data-manage-folder
        data-folder-id="${escapeDashboardHtml(folder.id)}"
        aria-label="مدیریت پوشه ${title}"
        class="group relative cursor-pointer overflow-hidden rounded-lg border border-white/70 bg-surface p-5 text-right shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-floating focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-surface-dark dark:shadow-card-dark dark:hover:border-primary/30 dark:hover:shadow-floating-dark"
      >
        ${content}
      </button>
    `
  }

  const createUserFoldersEmptyState = () => {
    return `
      <div
        class="sm:col-span-2 xl:col-span-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 px-6 py-10 text-center dark:bg-primary/5"
        data-folder-empty-state
      >
        <div
          class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            class="size-5"
            aria-hidden="true"
          >
            <path stroke-linecap="round" d="M12 5v14M5 12h14"></path>
          </svg>
        </div>

        <h3 class="mb-2">هنوز پوشه‌ای نساختی</h3>
        <p class="mb-5 text-mutedColor dark:text-mutedColor-dark">
          اولین پوشه‌ات را بساز و مشخص کن برای دیکته است یا علوم.
        </p>
        <button type="button" data-add-folder class="btn-link">
          + ساخت اولین پوشه
        </button>
      </div>
    `
  }

  const createAddFolderModal = () => {
    return `
      <div
        id="add-folder-modal"
        class="fixed inset-0 z-[100] hidden items-center justify-center p-4 sm:p-6"
        aria-hidden="true"
      >
        <button
          type="button"
          data-folder-modal-close
          aria-label="بستن پنجره افزودن پوشه"
          class="absolute inset-0 cursor-pointer bg-bg-dark/50 backdrop-blur-sm"
        ></button>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-folder-title"
          class="relative z-10 w-full max-w-md rounded-lg border border-white/75 bg-surface-strong p-5 shadow-floating backdrop-blur-md dark:border-border-dark-strong dark:bg-surface-dark-strong dark:shadow-floating-dark sm:p-6"
        >
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <span class="ui-eyebrow mb-2 block">پوشه جدید</span>
              <h2 id="add-folder-title">یک پوشه جدید بساز</h2>
            </div>

            <button
              type="button"
              data-folder-modal-close
              aria-label="بستن"
              class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-textColor transition-colors hover:text-primary dark:bg-surface-dark dark:text-textColor-dark dark:hover:text-primary-light"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="size-4"
                aria-hidden="true"
              >
                <path stroke-linecap="round" d="M6 6l12 12M18 6 6 18"></path>
              </svg>
            </button>
          </div>

          <form id="add-folder-form" novalidate>
            <div class="form-group">
              <span class="form-label" id="folder-type-label">
                نوع پوشه
                <span class="form-required" aria-hidden="true">*</span>
              </span>

              <input type="hidden" id="folder-type" name="folderType" value="dictation" />

              <div
                class="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-labelledby="folder-type-label"
              >
                <button
                  type="button"
                  data-folder-type-option="dictation"
                  role="radio"
                  aria-checked="true"
                  class="form-option border border-primary/30 bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary-light"
                >
                  <span>دیکته</span>
                  <span aria-hidden="true">✓</span>
                </button>

                <button
                  type="button"
                  data-folder-type-option="science"
                  role="radio"
                  aria-checked="false"
                  class="form-option border border-textColor/10 dark:border-border-dark"
                >
                  <span>علوم</span>
                  <span class="hidden" aria-hidden="true">✓</span>
                </button>
              </div>

              <span id="folder-type-help" class="form-help">
                پوشه دیکته برای کلمات و تمرین دیکته استفاده می‌شود.
              </span>
            </div>

            <div class="form-group mt-5">
              <label for="folder-title" class="form-label">
                نام پوشه
                <span class="form-required" aria-hidden="true">*</span>
              </label>

              <input
                id="folder-title"
                name="folderTitle"
                type="text"
                maxlength="60"
                autocomplete="off"
                class="form-control"
                placeholder="مثلاً کلمات فارسی کلاس دوم"
                aria-describedby="folder-title-help folder-title-error"
              />

              <span id="folder-title-help" class="form-help">
                یک اسم کوتاه و مشخص برای پوشه انتخاب کن.
              </span>

              <span id="folder-title-error" class="form-error hidden" role="alert"></span>
            </div>

            <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" data-folder-modal-close class="btn-ghost">
                انصراف
              </button>

              <button id="add-folder-submit" type="submit" class="btn-primary">
                ساخت پوشه
              </button>
            </div>
          </form>
        </div>
      </div>
    `
  }

  const renderFoldersView = async () => {
    const container = document.getElementById('dashboard-view')
    if (!container) return

    container.innerHTML = `
      <div class="py-10 text-center">
        <span class="ui-meta">در حال دریافت پوشه‌ها...</span>
      </div>
    `

    try {
      const folders = await window.folderService.getFolders()
      const systemFolders = folders.filter(
        (folder) => folder.ownerType === 'system',
      )
      const userFolders = folders.filter((folder) => folder.ownerType === 'user')
      const dictationCount = userFolders.filter(
        (folder) => folder.type === 'dictation',
      ).length
      const scienceCount = userFolders.filter(
        (folder) => folder.type === 'science',
      ).length

      window.apiClient?.log(
        `[API:FOLDERS] dashboard view: user=${userFolders.length}, system=${systemFolders.length}`
      )

      container.innerHTML = `
        <section aria-labelledby="folders-title">
          <div
            class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div class="mb-2 flex items-center gap-2">
                <span aria-hidden="true" class="size-1.5 rounded-full bg-primary"></span>
                <span class="ui-eyebrow">محتوای من</span>
              </div>

              <h2 id="folders-title" class="mb-2">پوشه‌ها</h2>

              <p class="max-w-xl text-mutedColor dark:text-mutedColor-dark">
                برای کلمات دیکته و سؤال‌های علوم پوشه‌های جدا بساز تا هر مسابقه فقط محتوای مرتبط خودش را ببیند.
              </p>
            </div>

            <button type="button" data-add-folder class="btn-primary shrink-0 gap-2 self-start sm:self-auto">
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
              افزودن پوشه
            </button>
          </div>

          <div class="mb-9">
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3>پوشه‌های من</h3>

              <div class="flex flex-wrap gap-2">
                <span class="ui-badge bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark">
                  ${toPersianNumber(dictationCount)} دیکته
                </span>
                <span class="ui-badge bg-secondary/10 text-secondary dark:bg-secondary/15">
                  ${toPersianNumber(scienceCount)} علوم
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              ${
                userFolders.length
                  ? userFolders.map(createFolderCard).join('')
                  : createUserFoldersEmptyState()
              }

              ${
                userFolders.length
                  ? `
                    <button
                      type="button"
                      data-add-folder
                      class="group min-h-[190px] cursor-pointer rounded-lg border border-dashed border-primary/25 bg-primary/5 p-5 text-right transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-primary/5"
                    >
                      <div
                        class="mb-7 flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105 dark:bg-primary/15 dark:text-primary-light"
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

                      <h5 class="mb-1.5">افزودن پوشه</h5>
                      <span class="ui-meta">پوشه دیکته یا علوم بساز</span>
                    </button>
                  `
                  : ''
              }
            </div>
          </div>

          ${
            systemFolders.length
              ? `
                <div>
                  <div class="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 class="mb-1">پوشه‌های آماده دیکته خونه</h3>
                      <span class="ui-meta">پوشه‌های پیش‌فرض و غیرقابل ویرایش</span>
                    </div>
                    <span class="ui-meta">${toPersianNumber(systemFolders.length)} پوشه</span>
                  </div>

                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    ${systemFolders.map(createFolderCard).join('')}
                  </div>
                </div>
              `
              : ''
          }

          ${createAddFolderModal()}
          ${createFolderManagerModal()}
        </section>
      `

      initFolderViewEvents()
      initFolderManagerEvents(renderFoldersView)
    } catch (error) {
      console.error('Failed to load folders:', error)

      window.apiErrors?.showToast(error, {
        title: 'دریافت پوشه‌ها انجام نشد',
        fallbackMessage: 'پوشه‌ها از سرور دریافت نشدند. دوباره تلاش کن.',
      })

      container.innerHTML = `
        <div class="rounded-lg border border-secondary/15 bg-secondary/5 px-6 py-10 text-center">
          <h2 class="mb-2">دریافت پوشه‌ها انجام نشد</h2>
          <p class="text-mutedColor dark:text-mutedColor-dark">
            لطفاً صفحه را دوباره بارگذاری کن.
          </p>
        </div>
      `
    }
  }

  const initFolderViewEvents = () => {
    const modal = document.getElementById('add-folder-modal')
    const form = document.getElementById('add-folder-form')
    const titleInput = document.getElementById('folder-title')
    const typeInput = document.getElementById('folder-type')
    const typeHelp = document.getElementById('folder-type-help')
    const errorElement = document.getElementById('folder-title-error')
    const submitButton = document.getElementById('add-folder-submit')

    if (!modal || !form || !titleInput || !typeInput || !errorElement) {
      return
    }

    const openButtons = document.querySelectorAll('[data-add-folder]')
    const closeButtons = modal.querySelectorAll('[data-folder-modal-close]')
    const typeButtons = Array.from(
      modal.querySelectorAll('[data-folder-type-option]'),
    )
    let lastTrigger = null

    const clearError = () => {
      errorElement.textContent = ''
      errorElement.classList.add('hidden')
      titleInput.removeAttribute('aria-invalid')
    }

    const showError = (message) => {
      errorElement.textContent = message
      errorElement.classList.remove('hidden')
      titleInput.setAttribute('aria-invalid', 'true')
    }

    const applyFolderType = (type) => {
      const normalizedType = type === 'science' ? 'science' : 'dictation'
      typeInput.value = normalizedType

      typeButtons.forEach((button) => {
        const selected = button.dataset.folderTypeOption === normalizedType
        const check = button.querySelector('span:last-child')

        button.setAttribute('aria-checked', String(selected))
        button.classList.toggle('border-primary/30', selected)
        button.classList.toggle('bg-primary/5', selected)
        button.classList.toggle('text-primary', selected)
        button.classList.toggle('dark:bg-primary/10', selected)
        button.classList.toggle('dark:text-primary-light', selected)
        button.classList.toggle('border-textColor/10', !selected)
        button.classList.toggle('dark:border-border-dark', !selected)
        check?.classList.toggle('hidden', !selected)
      })

      if (normalizedType === 'science') {
        titleInput.placeholder = 'مثلاً علوم فصل سوم'
        if (typeHelp) {
          typeHelp.textContent =
            'پوشه علوم فقط سؤال و پاسخ‌های مسابقه علوم را نگهداری می‌کند.'
        }
      } else {
        titleInput.placeholder = 'مثلاً کلمات فارسی کلاس دوم'
        if (typeHelp) {
          typeHelp.textContent =
            'پوشه دیکته برای کلمات و تمرین دیکته استفاده می‌شود.'
        }
      }
    }

    const openModal = (trigger) => {
      lastTrigger = trigger
      clearError()
      form.reset()
      applyFolderType('dictation')
      modal.classList.remove('hidden')
      modal.classList.add('flex')
      modal.setAttribute('aria-hidden', 'false')
      document.body.classList.add('overflow-hidden')

      requestAnimationFrame(() => titleInput.focus())
    }

    const closeModal = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
      modal.setAttribute('aria-hidden', 'true')
      document.body.classList.remove('overflow-hidden')
      clearError()
      lastTrigger?.focus()
    }

    openButtons.forEach((button) => {
      button.addEventListener('click', () => openModal(button))
    })

    closeButtons.forEach((button) => {
      button.addEventListener('click', closeModal)
    })

    typeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        applyFolderType(button.dataset.folderTypeOption)
      })
    })

    titleInput.addEventListener('input', clearError)

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      clearError()

      const title = titleInput.value.trim()
      const type = typeInput.value

      if (!title) {
        const message = 'نام پوشه را وارد کن.'
        showError(message)
        titleInput.focus()

        window.showToast?.({
          type: 'error',
          title: 'ساخت پوشه انجام نشد',
          message,
        })
        return
      }

      try {
        if (submitButton) {
          submitButton.disabled = true
          submitButton.classList.add('opacity-60', 'cursor-not-allowed')
          submitButton.textContent = 'در حال ساخت...'
        }

        const createdFolder = await window.folderService.createFolder({
          title,
          type,
        })

        closeModal()

        window.showToast?.({
          type: 'success',
          title: 'پوشه ساخته شد',
          message: `پوشه «${createdFolder.title}» برای ${
            createdFolder.type === 'science' ? 'علوم' : 'دیکته'
          } ساخته شد.`,
        })

        await renderFoldersView()
      } catch (error) {
        const errors = {
          FOLDER_TITLE_REQUIRED: 'نام پوشه را وارد کن.',
          FOLDER_TITLE_TOO_LONG: 'نام پوشه خیلی طولانی است.',
          FOLDER_TITLE_DUPLICATE:
            'پوشه‌ای با همین نام و همین نوع از قبل وجود دارد.',
          FOLDER_TYPE_INVALID: 'نوع پوشه معتبر نیست.',
        }

        const resolved = window.apiErrors?.resolve(
          error,
          'ساخت پوشه انجام نشد. دوباره تلاش کن.'
        )
        const message = errors[error.message] || resolved?.message || 'ساخت پوشه انجام نشد.'
        showError(message)

        window.showToast?.({
          type: 'error',
          title: 'ساخت پوشه انجام نشد',
          message,
        })
      } finally {
        if (submitButton) {
          submitButton.disabled = false
          submitButton.classList.remove('opacity-60', 'cursor-not-allowed')
          submitButton.textContent = 'ساخت پوشه'
        }
      }
    })

    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal()
      }
    })
  }

  window.DashboardFolders = Object.freeze({
    renderFoldersView,
  })
})()
