/*
 * Dashboard folder manager.
 *
 * Manages folder title plus type-specific content:
 * - dictation folders → words
 * - science folders → science question/answer pairs
 */

;(() => {
  const { toPersianNumber, escapeDashboardHtml } = window.DashboardShared

  const getFolderMeta = (folder) => {
    const isScience = folder?.type === 'science'

    return {
      isScience,
      typeLabel: isScience ? 'علوم' : 'دیکته',
      itemLabel: isScience ? 'سؤال' : 'کلمه',
      itemsTitle: isScience ? 'سؤال‌های پوشه' : 'کلمات پوشه',
      itemsDescription: isScience
        ? 'سؤال و پاسخ‌های این پوشه را از اینجا ویرایش یا حذف کن.'
        : 'کلمات این پوشه را از اینجا ویرایش یا حذف کن.',
      emptyText: isScience
        ? 'هنوز سؤال علوم داخل این پوشه نیست.'
        : 'هنوز کلمه‌ای داخل این پوشه نیست.',
      typeClass: isScience
        ? 'bg-secondary/10 text-secondary dark:bg-secondary/15'
        : 'bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark',
    }
  }

  const createFolderManagerModal = () => {
    return `
      <div
        id="folder-manager-modal"
        class="fixed inset-0 z-[100] hidden items-center justify-center p-3 sm:p-6"
        aria-hidden="true"
      >
        <button
          type="button"
          data-folder-manager-close
          aria-label="بستن مدیریت پوشه"
          class="absolute inset-0 cursor-pointer bg-bg-dark/55 backdrop-blur-sm"
        ></button>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="folder-manager-heading"
          class="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-white/75 bg-surface-strong shadow-floating backdrop-blur-md dark:border-border-dark-strong dark:bg-surface-dark-strong dark:shadow-floating-dark"
        >
          <div
            class="flex shrink-0 items-start justify-between gap-4 border-b border-textColor/5 px-5 py-5 dark:border-border-dark-soft sm:px-6"
          >
            <div class="min-w-0">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class="ui-eyebrow">مدیریت پوشه</span>
                <span id="folder-manager-type" class="ui-badge"></span>
              </div>
              <h2 id="folder-manager-heading" class="truncate">پوشه</h2>
            </div>

            <button
              type="button"
              data-folder-manager-close
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

          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
            <section
              class="rounded-md border border-white/70 bg-surface-soft p-4 dark:border-border-dark-soft dark:bg-surface-dark-soft sm:p-5"
              aria-labelledby="folder-manager-title-label"
            >
              <form id="folder-manager-title-form" novalidate>
                <div class="form-group">
                  <label
                    id="folder-manager-title-label"
                    for="folder-manager-title"
                    class="form-label"
                  >
                    نام پوشه
                  </label>

                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div class="min-w-0 flex-1">
                      <input
                        id="folder-manager-title"
                        name="folderTitle"
                        type="text"
                        maxlength="60"
                        autocomplete="off"
                        class="form-control"
                        aria-describedby="folder-manager-title-error"
                      />

                      <span
                        id="folder-manager-title-error"
                        class="form-error mt-2 hidden"
                        role="alert"
                      ></span>
                    </div>

                    <button
                      id="folder-manager-title-submit"
                      type="submit"
                      class="btn-primary"
                    >
                      ذخیره نام
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <section class="mt-6" aria-labelledby="folder-manager-items-title">
              <div class="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 id="folder-manager-items-title" class="mb-1">محتوای پوشه</h3>
                  <span id="folder-manager-items-help" class="ui-meta"></span>
                </div>

                <span
                  id="folder-manager-item-count"
                  class="ui-badge shrink-0 bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
                >
                  ۰
                </span>
              </div>

              <div id="folder-manager-items" class="space-y-2.5"></div>
            </section>
          </div>

          <div
            class="flex shrink-0 flex-col gap-3 border-t border-textColor/5 bg-surface-soft px-5 py-4 dark:border-border-dark-soft dark:bg-surface-dark-soft sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <span id="folder-manager-delete-help" class="ui-meta"></span>

            <button
              id="folder-manager-delete-folder"
              type="button"
              class="btn-danger-soft"
            >
              حذف پوشه
            </button>
          </div>
        </div>

        <div
          id="delete-folder-confirm"
          class="absolute inset-0 z-20 hidden items-center justify-center p-4"
          aria-hidden="true"
        >
          <button
            type="button"
            data-delete-folder-cancel
            aria-label="انصراف از حذف پوشه"
            class="absolute inset-0 cursor-pointer bg-bg-dark/45 backdrop-blur-sm"
          ></button>

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-folder-confirm-title"
            aria-describedby="delete-folder-confirm-description"
            class="relative z-10 w-full max-w-md rounded-lg border border-white/75 bg-surface-strong p-5 shadow-floating backdrop-blur-md dark:border-border-dark-strong dark:bg-surface-dark-strong dark:shadow-floating-dark sm:p-6"
          >
            <div
              class="mb-5 flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary"
            >
              <svg viewBox="0 0 50 50" class="size-6" aria-hidden="true">
                <use href="#icon-trash"></use>
              </svg>
            </div>

            <h3 id="delete-folder-confirm-title" class="mb-2">
              مطمئنی می‌خوای این پوشه حذف بشه؟
            </h3>

            <p
              id="delete-folder-confirm-description"
              class="text-mutedColor dark:text-mutedColor-dark"
            >
              این عملیات قابل بازگشت نیست.
            </p>

            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" data-delete-folder-cancel class="btn-ghost">
                انصراف
              </button>
              <button id="delete-folder-confirm-submit" type="button" class="btn-secondary">
                حذف پوشه
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  const renderEmptyState = (text) => {
    return `
      <div
        class="rounded-md border border-dashed border-primary/20 bg-primary/5 px-5 py-8 text-center dark:bg-primary/5"
      >
        <span class="ui-meta">${escapeDashboardHtml(text)}</span>
      </div>
    `
  }

  const renderWordItems = (words, emptyText) => {
    if (!words.length) return renderEmptyState(emptyText)

    return words
      .map(
        (word) => `
          <article
            data-folder-item-row
            data-word-row
            data-word-id="${escapeDashboardHtml(word.id)}"
            class="rounded-md border border-white/70 bg-surface p-3.5 dark:border-border-dark-soft dark:bg-surface-dark sm:p-4"
          >
            <div data-item-display class="flex items-center justify-between gap-3">
              <p
                data-word-text
                class="word-list-value min-w-0 flex-1 break-words"
              >
                ${escapeDashboardHtml(word.value)}
              </p>

              <div class="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  data-edit-word
                  aria-label="ویرایش کلمه ${escapeDashboardHtml(word.value)}"
                  class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-200 hover:scale-105 hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-primary/15 dark:text-primary-light dark:hover:bg-primary/20"
                >
                  <svg viewBox="0 0 50 50" class="size-4" aria-hidden="true">
                    <use href="#icon-edit-pencil"></use>
                  </svg>
                </button>

                <button
                  type="button"
                  data-delete-word
                  aria-label="حذف کلمه ${escapeDashboardHtml(word.value)}"
                  class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-secondary/10 text-secondary transition-all duration-200 hover:scale-105 hover:bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-secondary/15 dark:hover:bg-secondary/20"
                >
                  <svg viewBox="0 0 50 50" class="size-4" aria-hidden="true">
                    <use href="#icon-trash"></use>
                  </svg>
                </button>
              </div>
            </div>

            <form data-word-edit-form class="hidden" novalidate>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div class="min-w-0 flex-1">
                  <input
                    data-word-edit-input
                    type="text"
                    maxlength="80"
                    autocomplete="off"
                    class="form-control"
                    value="${escapeDashboardHtml(word.value)}"
                  />
                  <span data-item-edit-error class="form-error mt-2 hidden" role="alert"></span>
                </div>

                <div class="flex shrink-0 gap-2">
                  <button type="submit" class="btn-primary btn-compact">ذخیره</button>
                  <button type="button" data-cancel-item-edit class="btn-ghost btn-compact">انصراف</button>
                </div>
              </div>
            </form>
          </article>
        `,
      )
      .join('')
  }

  const renderScienceItems = (questions, emptyText) => {
    if (!questions.length) return renderEmptyState(emptyText)

    return questions
      .map(
        (item) => `
          <article
            data-folder-item-row
            data-science-row
            data-question-id="${escapeDashboardHtml(item.id)}"
            class="rounded-md border border-white/70 bg-surface p-4 dark:border-border-dark-soft dark:bg-surface-dark"
          >
            <div data-item-display>
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <span class="ui-label mb-1 block">سؤال</span>
                  <h5 data-science-question-text class="break-words">
                    ${escapeDashboardHtml(item.question)}
                  </h5>
                </div>

                <div class="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    data-edit-science
                    aria-label="ویرایش سؤال علوم"
                    class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-200 hover:scale-105 hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-primary/15 dark:text-primary-light dark:hover:bg-primary/20"
                  >
                    <svg viewBox="0 0 50 50" class="size-4" aria-hidden="true">
                      <use href="#icon-edit-pencil"></use>
                    </svg>
                  </button>

                  <button
                    type="button"
                    data-delete-science
                    aria-label="حذف سؤال علوم"
                    class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-secondary/10 text-secondary transition-all duration-200 hover:scale-105 hover:bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-secondary/15 dark:hover:bg-secondary/20"
                  >
                    <svg viewBox="0 0 50 50" class="size-4" aria-hidden="true">
                      <use href="#icon-trash"></use>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mt-4 border-t border-textColor/5 pt-4 dark:border-border-dark-soft">
                <span class="ui-label mb-1 block">پاسخ</span>
                <p
                  data-science-answer-text
                  class="text-mutedColor dark:text-mutedColor-dark"
                >
                  ${escapeDashboardHtml(item.answer)}
                </p>
              </div>
            </div>

            <form data-science-edit-form class="hidden flex-col gap-4" novalidate>
              <div class="form-group">
                <label class="form-label">سؤال</label>
                <textarea
                  data-science-question-input
                  maxlength="220"
                  class="form-textarea"
                >${escapeDashboardHtml(item.question)}</textarea>
              </div>

              <div class="form-group">
                <label class="form-label">پاسخ درست</label>
                <textarea
                  data-science-answer-input
                  maxlength="600"
                  class="form-textarea"
                >${escapeDashboardHtml(item.answer)}</textarea>
              </div>

              <span data-item-edit-error class="form-error hidden" role="alert"></span>

              <div class="flex gap-2 sm:justify-end">
                <button type="submit" class="btn-primary btn-compact">ذخیره</button>
                <button type="button" data-cancel-item-edit class="btn-ghost btn-compact">انصراف</button>
              </div>
            </form>
          </article>
        `,
      )
      .join('')
  }

  const initFolderManagerEvents = (renderFoldersView) => {
    const modal = document.getElementById('folder-manager-modal')
    if (!modal) return

    const openButtons = document.querySelectorAll('[data-manage-folder]')
    const closeButtons = modal.querySelectorAll('[data-folder-manager-close]')
    const heading = document.getElementById('folder-manager-heading')
    const typeBadge = document.getElementById('folder-manager-type')
    const titleForm = document.getElementById('folder-manager-title-form')
    const titleInput = document.getElementById('folder-manager-title')
    const titleError = document.getElementById('folder-manager-title-error')
    const titleSubmit = document.getElementById('folder-manager-title-submit')
    const itemsTitle = document.getElementById('folder-manager-items-title')
    const itemsHelp = document.getElementById('folder-manager-items-help')
    const itemsContainer = document.getElementById('folder-manager-items')
    const itemCount = document.getElementById('folder-manager-item-count')
    const deleteHelp = document.getElementById('folder-manager-delete-help')
    const deleteFolderButton = document.getElementById('folder-manager-delete-folder')
    const deleteConfirm = document.getElementById('delete-folder-confirm')
    const deleteConfirmDescription = document.getElementById(
      'delete-folder-confirm-description',
    )
    const deleteConfirmSubmit = document.getElementById(
      'delete-folder-confirm-submit',
    )
    const deleteCancelButtons = modal.querySelectorAll(
      '[data-delete-folder-cancel]',
    )

    if (
      !heading ||
      !typeBadge ||
      !titleForm ||
      !titleInput ||
      !titleError ||
      !itemsTitle ||
      !itemsHelp ||
      !itemsContainer ||
      !itemCount ||
      !deleteHelp ||
      !deleteFolderButton ||
      !deleteConfirm ||
      !deleteConfirmDescription ||
      !deleteConfirmSubmit
    ) {
      return
    }

    let activeFolder = null
    let lastTrigger = null

    const clearTitleError = () => {
      titleError.textContent = ''
      titleError.classList.add('hidden')
      titleInput.removeAttribute('aria-invalid')
    }

    const showTitleError = (message) => {
      titleError.textContent = message
      titleError.classList.remove('hidden')
      titleInput.setAttribute('aria-invalid', 'true')
    }

    const loadItems = async () => {
      if (!activeFolder) return []

      if (activeFolder.type === 'science') {
        return window.scienceQuestionService.getQuestionsByFolder(activeFolder.id)
      }

      return window.wordService.getWordsByFolder(activeFolder.id)
    }

    const updateCard = (items) => {
      if (!activeFolder) return

      const card = document.querySelector(
        `[data-manage-folder][data-folder-id="${CSS.escape(activeFolder.id)}"]`,
      )

      const countElement = card?.querySelector('[data-folder-item-count]')
      const titleElement = card?.querySelector('[data-folder-card-title]')
      const meta = getFolderMeta(activeFolder)

      if (countElement) {
        countElement.textContent = `${toPersianNumber(items.length)} ${meta.itemLabel}`
      }

      if (titleElement) {
        titleElement.textContent = activeFolder.title
      }

      card?.setAttribute('aria-label', `مدیریت پوشه ${activeFolder.title}`)
    }

    const renderItems = (items) => {
      const meta = getFolderMeta(activeFolder)

      itemsTitle.textContent = meta.itemsTitle
      itemsHelp.textContent = meta.itemsDescription
      itemCount.textContent = `${toPersianNumber(items.length)} ${meta.itemLabel}`
      deleteHelp.textContent = `حذف پوشه، همه ${meta.itemLabel}‌های داخل آن را هم حذف می‌کند.`

      itemsContainer.innerHTML = meta.isScience
        ? renderScienceItems(items, meta.emptyText)
        : renderWordItems(items, meta.emptyText)

      updateCard(items)
    }

    const refreshItems = async () => {
      const items = await loadItems()
      renderItems(items)
      return items
    }

    const hideDeleteConfirm = () => {
      deleteConfirm.classList.add('hidden')
      deleteConfirm.classList.remove('flex')
      deleteConfirm.setAttribute('aria-hidden', 'true')
      deleteFolderButton.focus()
    }

    const showDeleteConfirm = async () => {
      if (!activeFolder) return

      const items = await loadItems()
      const meta = getFolderMeta(activeFolder)

      deleteConfirmDescription.textContent = items.length
        ? `پوشه «${activeFolder.title}» و ${toPersianNumber(items.length)} ${meta.itemLabel} داخل آن برای همیشه حذف می‌شوند. این عملیات قابل بازگشت نیست.`
        : `پوشه «${activeFolder.title}» برای همیشه حذف می‌شود. این عملیات قابل بازگشت نیست.`

      deleteConfirm.classList.remove('hidden')
      deleteConfirm.classList.add('flex')
      deleteConfirm.setAttribute('aria-hidden', 'false')

      requestAnimationFrame(() => deleteConfirmSubmit.focus())
    }

    const openModal = async (folderId, trigger) => {
      try {
        const folder = await window.folderService.getFolderById(folderId)

        if (!folder || folder.locked) return

        activeFolder = folder
        lastTrigger = trigger
        heading.textContent = folder.title
        titleInput.value = folder.title
        clearTitleError()

        const meta = getFolderMeta(folder)
        typeBadge.textContent = meta.typeLabel
        typeBadge.className = `ui-badge ${meta.typeClass}`

        const items = await loadItems()
        renderItems(items)

        modal.classList.remove('hidden')
        modal.classList.add('flex')
        modal.setAttribute('aria-hidden', 'false')
        document.body.classList.add('overflow-hidden')

        requestAnimationFrame(() => titleInput.focus())
      } catch (error) {
        console.error('Failed to open folder manager:', error)
        window.showToast?.({
          type: 'error',
          title: 'پوشه باز نشد',
          message: 'اطلاعات پوشه دریافت نشد.',
        })
      }
    }

    const closeModal = () => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
      modal.setAttribute('aria-hidden', 'true')
      deleteConfirm.classList.add('hidden')
      deleteConfirm.classList.remove('flex')
      deleteConfirm.setAttribute('aria-hidden', 'true')
      document.body.classList.remove('overflow-hidden')
      clearTitleError()
      activeFolder = null
      lastTrigger?.focus()
    }

    openButtons.forEach((button) => {
      button.addEventListener('click', () => {
        openModal(button.dataset.folderId, button)
      })
    })

    closeButtons.forEach((button) => {
      button.addEventListener('click', closeModal)
    })

    titleInput.addEventListener('input', clearTitleError)

    titleForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      if (!activeFolder) return

      clearTitleError()
      const title = titleInput.value.trim()

      if (!title) {
        showTitleError('نام پوشه را وارد کن.')
        titleInput.focus()
        return
      }

      try {
        if (titleSubmit) {
          titleSubmit.disabled = true
          titleSubmit.classList.add('opacity-60', 'cursor-not-allowed')
        }

        activeFolder = await window.folderService.updateFolder({
          folderId: activeFolder.id,
          title,
        })

        heading.textContent = activeFolder.title
        titleInput.value = activeFolder.title
        updateCard(await loadItems())

        window.showToast?.({
          type: 'success',
          title: 'نام پوشه تغییر کرد',
          message: `نام پوشه به «${activeFolder.title}» تغییر کرد.`,
        })
      } catch (error) {
        const errors = {
          FOLDER_TITLE_REQUIRED: 'نام پوشه را وارد کن.',
          FOLDER_TITLE_TOO_LONG: 'نام پوشه خیلی طولانی است.',
          FOLDER_TITLE_DUPLICATE:
            'پوشه‌ای با همین نام و همین نوع از قبل وجود دارد.',
          FOLDER_NOT_FOUND: 'پوشه پیدا نشد.',
          FOLDER_LOCKED: 'این پوشه قابل ویرایش نیست.',
        }

        const message = errors[error.message] || 'ویرایش نام پوشه انجام نشد.'
        showTitleError(message)

        window.showToast?.({
          type: 'error',
          title: 'نام پوشه تغییر نکرد',
          message,
        })
      } finally {
        if (titleSubmit) {
          titleSubmit.disabled = false
          titleSubmit.classList.remove('opacity-60', 'cursor-not-allowed')
        }
      }
    })

    itemsContainer.addEventListener('click', async (event) => {
      const row = event.target.closest('[data-folder-item-row]')
      if (!row || !activeFolder) return

      const display = row.querySelector('[data-item-display]')
      const editForm = row.querySelector(
        '[data-word-edit-form], [data-science-edit-form]',
      )
      const errorElement = row.querySelector('[data-item-edit-error]')

      if (event.target.closest('[data-cancel-item-edit]')) {
        const wordInput = row.querySelector('[data-word-edit-input]')
        const wordText = row.querySelector('[data-word-text]')
        const scienceQuestionInput = row.querySelector(
          '[data-science-question-input]',
        )
        const scienceQuestionText = row.querySelector(
          '[data-science-question-text]',
        )
        const scienceAnswerInput = row.querySelector(
          '[data-science-answer-input]',
        )
        const scienceAnswerText = row.querySelector(
          '[data-science-answer-text]',
        )

        if (wordInput && wordText) {
          wordInput.value = wordText.textContent.trim()
        }

        if (scienceQuestionInput && scienceQuestionText) {
          scienceQuestionInput.value = scienceQuestionText.textContent.trim()
        }

        if (scienceAnswerInput && scienceAnswerText) {
          scienceAnswerInput.value = scienceAnswerText.textContent.trim()
        }

        editForm?.classList.add('hidden')
        editForm?.classList.remove('flex')
        display?.classList.remove('hidden')
        errorElement?.classList.add('hidden')
        return
      }

      if (event.target.closest('[data-edit-word]')) {
        display?.classList.add('hidden')
        editForm?.classList.remove('hidden')
        editForm?.classList.add('flex')
        errorElement?.classList.add('hidden')
        const input = row.querySelector('[data-word-edit-input]')
        requestAnimationFrame(() => {
          input?.focus()
          input?.select()
        })
        return
      }

      if (event.target.closest('[data-edit-science]')) {
        display?.classList.add('hidden')
        editForm?.classList.remove('hidden')
        editForm?.classList.add('flex')
        errorElement?.classList.add('hidden')
        requestAnimationFrame(() =>
          row.querySelector('[data-science-question-input]')?.focus(),
        )
        return
      }

      const deleteWordButton = event.target.closest('[data-delete-word]')
      if (deleteWordButton) {
        try {
          deleteWordButton.disabled = true
          deleteWordButton.classList.add('opacity-50', 'cursor-not-allowed')
          await window.wordService.deleteWord(row.dataset.wordId)
          await refreshItems()

          window.showToast?.({
            type: 'success',
            title: 'کلمه حذف شد',
            message: 'کلمه از پوشه حذف شد.',
          })
        } catch (error) {
          window.showToast?.({
            type: 'error',
            title: 'حذف کلمه انجام نشد',
            message: 'حذف کلمه انجام نشد.',
          })

          if (deleteWordButton.isConnected) {
            deleteWordButton.disabled = false
            deleteWordButton.classList.remove('opacity-50', 'cursor-not-allowed')
          }
        }
        return
      }

      const deleteScienceButton = event.target.closest('[data-delete-science]')
      if (deleteScienceButton) {
        try {
          deleteScienceButton.disabled = true
          deleteScienceButton.classList.add('opacity-50', 'cursor-not-allowed')
          await window.scienceQuestionService.deleteQuestion(
            row.dataset.questionId,
          )
          await refreshItems()

          window.showToast?.({
            type: 'success',
            title: 'سؤال حذف شد',
            message: 'سؤال علوم از پوشه حذف شد.',
          })
        } catch (error) {
          window.showToast?.({
            type: 'error',
            title: 'حذف سؤال انجام نشد',
            message: 'حذف سؤال علوم انجام نشد.',
          })

          if (deleteScienceButton.isConnected) {
            deleteScienceButton.disabled = false
            deleteScienceButton.classList.remove(
              'opacity-50',
              'cursor-not-allowed',
            )
          }
        }
      }
    })

    itemsContainer.addEventListener('input', (event) => {
      event.target
        .closest('[data-folder-item-row]')
        ?.querySelector('[data-item-edit-error]')
        ?.classList.add('hidden')
    })

    itemsContainer.addEventListener('submit', async (event) => {
      const wordForm = event.target.closest('[data-word-edit-form]')
      const scienceForm = event.target.closest('[data-science-edit-form]')
      const form = wordForm || scienceForm
      if (!form) return

      event.preventDefault()
      const row = form.closest('[data-folder-item-row]')
      const errorElement = form.querySelector('[data-item-edit-error]')
      const submitButton = form.querySelector('button[type="submit"]')

      try {
        submitButton.disabled = true
        submitButton.classList.add('opacity-60', 'cursor-not-allowed')
        errorElement.classList.add('hidden')

        if (wordForm) {
          const input = form.querySelector('[data-word-edit-input]')
          await window.wordService.updateWord({
            wordId: row.dataset.wordId,
            value: input.value,
          })

          window.showToast?.({
            type: 'success',
            title: 'کلمه ویرایش شد',
            message: 'تغییرات کلمه ذخیره شد.',
          })
        } else {
          const questionInput = form.querySelector(
            '[data-science-question-input]',
          )
          const answerInput = form.querySelector('[data-science-answer-input]')

          await window.scienceQuestionService.updateQuestion({
            questionId: row.dataset.questionId,
            question: questionInput.value,
            answer: answerInput.value,
          })

          window.showToast?.({
            type: 'success',
            title: 'سؤال ویرایش شد',
            message: 'سؤال و پاسخ علوم ذخیره شدند.',
          })
        }

        await refreshItems()
      } catch (error) {
        const errors = {
          WORD_VALUE_REQUIRED: 'کلمه یا عبارت را وارد کن.',
          WORD_VALUE_TOO_LONG: 'کلمه یا عبارت خیلی طولانی است.',
          WORD_DUPLICATE: 'این کلمه قبلاً در همین پوشه وجود دارد.',
          WORD_FOLDER_TYPE_INVALID: 'این پوشه برای کلمات دیکته نیست.',
          SCIENCE_QUESTION_REQUIRED: 'متن سؤال را وارد کن.',
          SCIENCE_QUESTION_TOO_LONG: 'متن سؤال خیلی طولانی است.',
          SCIENCE_ANSWER_REQUIRED: 'پاسخ سؤال را وارد کن.',
          SCIENCE_ANSWER_TOO_LONG: 'پاسخ سؤال خیلی طولانی است.',
          SCIENCE_QUESTION_DUPLICATE: 'این سؤال قبلاً در همین پوشه وجود دارد.',
        }

        const message = errors[error.message] || 'ذخیره تغییرات انجام نشد.'
        errorElement.textContent = message
        errorElement.classList.remove('hidden')

        window.showToast?.({
          type: 'error',
          title: 'تغییرات ذخیره نشد',
          message,
        })
      } finally {
        if (submitButton?.isConnected) {
          submitButton.disabled = false
          submitButton.classList.remove('opacity-60', 'cursor-not-allowed')
        }
      }
    })

    deleteFolderButton.addEventListener('click', showDeleteConfirm)
    deleteCancelButtons.forEach((button) => {
      button.addEventListener('click', hideDeleteConfirm)
    })

    deleteConfirmSubmit.addEventListener('click', async () => {
      if (!activeFolder) return

      try {
        deleteConfirmSubmit.disabled = true
        deleteConfirmSubmit.classList.add('opacity-60', 'cursor-not-allowed')

        const result = await window.folderService.deleteFolder(activeFolder.id)
        const deletedTitle = result.folder?.title || activeFolder.title
        const deletedCount =
          activeFolder.type === 'science'
            ? result.deletedQuestionCount
            : result.deletedWordCount
        const meta = getFolderMeta(activeFolder)

        modal.classList.add('hidden')
        modal.classList.remove('flex')
        document.body.classList.remove('overflow-hidden')

        window.showToast?.({
          type: 'success',
          title: 'پوشه حذف شد',
          message: deletedCount
            ? `پوشه «${deletedTitle}» همراه با ${toPersianNumber(deletedCount)} ${meta.itemLabel} حذف شد.`
            : `پوشه «${deletedTitle}» حذف شد.`,
        })

        activeFolder = null
        await renderFoldersView()
      } catch (error) {
        window.showToast?.({
          type: 'error',
          title: 'حذف پوشه انجام نشد',
          message: 'حذف پوشه انجام نشد.',
        })
      } finally {
        if (deleteConfirmSubmit.isConnected) {
          deleteConfirmSubmit.disabled = false
          deleteConfirmSubmit.classList.remove(
            'opacity-60',
            'cursor-not-allowed',
          )
        }
      }
    })

    modal.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return

      if (!deleteConfirm.classList.contains('hidden')) {
        hideDeleteConfirm()
        return
      }

      closeModal()
    })
  }

  window.DashboardFolderManager = Object.freeze({
    createFolderManagerModal,
    initFolderManagerEvents,
  })
})()
