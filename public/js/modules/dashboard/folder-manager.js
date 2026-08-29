/*
 * Dashboard folder manager.
 *
 * Handles folder detail modal, rename, word editing/deletion
 * and folder deletion.
 */

;(() => {
  const { toPersianNumber, escapeDashboardHtml } = window.DashboardShared

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
        <!-- Header -->
        <div
          class="flex shrink-0 items-start gap-4 border-b border-textColor/5 dark:border-border-dark-soft px-5 py-5 sm:px-6"
        >
          <div class="min-w-0">
            <span
              class="ui-eyebrow mb-1.5 block"
            >
              مدیریت پوشه
            </span>

            <h2
              id="folder-manager-heading"
              class="truncate"
            >
              پوشه
            </h2>
          </div>

        </div>

        <!-- Scrollable content -->
        <div
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6"
        >
          <!-- Folder title -->
          <section
            class="rounded-md border border-white/70 dark:border-border-dark-soft bg-surface-soft dark:bg-surface-dark-soft p-4 sm:p-5"
            aria-labelledby="folder-manager-title-label"
          >
            <form
              id="folder-manager-title-form"
              novalidate
            >
              <div class="form-group">
                <label
                  id="folder-manager-title-label"
                  for="folder-manager-title"
                  class="form-label"
                >
                  نام پوشه
                </label>

                <div
                  class="flex flex-col gap-3 sm:flex-row sm:items-start"
                >
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
                      class="form-error hidden mt-2"
                      role="alert"
                    ></span>
                  </div>

                  <button
                    id="folder-manager-title-submit"
                    type="submit"
                    class="btn-primary gap-2"
                  >
                    ذخیره نام
                  </button>
                </div>
              </div>
            </form>
          </section>

          <!-- Words -->
          <section
            class="mt-6"
            aria-labelledby="folder-manager-words-title"
          >
            <div
              class="mb-4 flex items-center justify-between gap-4"
            >
              <div>
                <h3
                  id="folder-manager-words-title"
                  class="mb-1"
                >
                  کلمات پوشه
                </h3>

                <span
                  class="ui-meta"
                >
                  از اینجا می‌تونی کلمات رو ویرایش یا حذف کنی.
                </span>
              </div>

              <span
                id="folder-manager-word-count"
                class="ui-eyebrow shrink-0 rounded-full bg-primary/10 dark:bg-primary/15 px-3 py-1.5"
              >
                ۰ کلمه
              </span>
            </div>

            <div
              id="folder-manager-words"
              class="space-y-2.5"
            ></div>
          </section>
        </div>

        <!-- Footer -->
        <div
          class="flex shrink-0 flex-col gap-3 border-t border-textColor/5 dark:border-border-dark-soft bg-surface-soft dark:bg-surface-dark-soft px-5 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <span
            class="ui-meta"
          >
            حذف پوشه، همه کلمات داخل آن را هم حذف می‌کند.
          </span>

          <button
            id="folder-manager-delete-folder"
            type="button"
            class="btn-danger-soft"
          >
            حذف پوشه
          </button>
        </div>
      </div>

      <!-- Delete folder confirmation -->
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
          class="relative z-10 w-full max-w-md rounded-lg border border-white/75 bg-surface-strong p-5 sm:p-6 shadow-floating backdrop-blur-md dark:border-border-dark-strong dark:bg-surface-dark-strong dark:shadow-floating-dark"
        >
          <div
            class="mb-5 flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              width="24"
              height="24"
              class="size-6 shrink-0"
              aria-hidden="true"
              focusable="false"
            >
              <use href="#icon-trash"></use>
            </svg>
          </div>

          <h3
            id="delete-folder-confirm-title"
            class="mb-2"
          >
            مطمئنی می‌خوای این پوشه حذف بشه؟
          </h3>

          <p
            id="delete-folder-confirm-description"
            class="text-mutedColor dark:text-mutedColor-dark"
          >
            این عملیات قابل بازگشت نیست.
          </p>

          <div
            class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              data-delete-folder-cancel
              class="btn-ghost"
            >
              انصراف
            </button>

            <button
              id="delete-folder-confirm-submit"
              type="button"
              class="btn-secondary gap-2"
            >
              حذف پوشه
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  }

  const renderFolderManagerWords = (words) => {
    if (!words.length) {
      return `
      <div
        class="rounded-md border border-dashed border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.05] px-5 py-8 text-center"
      >
        <span
         
        >
          هنوز کلمه‌ای داخل این پوشه نیست.
        </span>
      </div>
    `
    }

    return words
      .map(
        (word) => `
        <article
          data-word-row
          data-word-id="${escapeDashboardHtml(word.id)}"
          class="rounded-md border border-white/70 dark:border-border-dark-soft bg-surface dark:bg-surface-dark p-3.5 sm:p-4"
        >
          <div
            data-word-display
            class="flex items-center justify-between gap-3"
          >
            <span
              data-word-text
              class="word-list-value min-w-0 flex-1 break-words"
            >
              ${escapeDashboardHtml(word.value)}
            </span>

            <div
              class="flex shrink-0 items-center gap-1.5"
            >
              <button
                type="button"
                data-edit-word
                aria-label="ویرایش کلمه ${escapeDashboardHtml(word.value)}"
                class="btn-link flex size-9 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/15 transition-all duration-200 hover:bg-primary/15 dark:hover:bg-primary/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 50 50"
                  width="16"
                  height="16"
                  class="size-[15px] shrink-0"
                  aria-hidden="true"
                  focusable="false"
                >
                  <use href="#icon-edit-pencil"></use>
                </svg>
              </button>

              <button
                type="button"
                data-delete-word
                aria-label="حذف کلمه ${escapeDashboardHtml(word.value)}"
                class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-secondary/10 text-secondary dark:bg-secondary/15 transition-all duration-200 hover:bg-secondary/20 dark:hover:bg-secondary/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 50 50"
                  width="16"
                  height="16"
                  class="size-[15px] shrink-0"
                  aria-hidden="true"
                  focusable="false"
                >
                  <use href="#icon-trash"></use>
                </svg>
              </button>
            </div>
          </div>

          <form
            data-word-edit-form
            class="hidden"
            novalidate
          >
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <div class="min-w-0 flex-1">
                <input
                  data-word-edit-input
                  type="text"
                  maxlength="80"
                  autocomplete="off"
                  class="form-control"
                  value="${escapeDashboardHtml(word.value)}"
                />

                <span
                  data-word-edit-error
                  class="form-error hidden mt-2"
                  role="alert"
                ></span>
              </div>

              <div
                class="flex shrink-0 gap-2"
              >
                <button
                  type="submit"
                  class="btn-primary btn-compact"
                >
                  ذخیره
                </button>

                <button
                  type="button"
                  data-cancel-word-edit
                  class="btn-ghost btn-compact"
                >
                  انصراف
                </button>
              </div>
            </div>
          </form>
        </article>
      `
      )
      .join('')
  }

  const initFolderManagerEvents = (renderFoldersView) => {
    const modal = document.getElementById('folder-manager-modal')

    if (!modal) return

    const openButtons = document.querySelectorAll('[data-manage-folder]')

    const closeButtons = modal.querySelectorAll('[data-folder-manager-close]')

    const heading = document.getElementById('folder-manager-heading')

    const titleForm = document.getElementById('folder-manager-title-form')

    const titleInput = document.getElementById('folder-manager-title')

    const titleError = document.getElementById('folder-manager-title-error')

    const titleSubmit = document.getElementById('folder-manager-title-submit')

    const wordsContainer = document.getElementById('folder-manager-words')

    const wordCount = document.getElementById('folder-manager-word-count')

    const deleteFolderButton = document.getElementById(
      'folder-manager-delete-folder'
    )

    const deleteConfirm = document.getElementById('delete-folder-confirm')

    const deleteConfirmDescription = document.getElementById(
      'delete-folder-confirm-description'
    )

    const deleteConfirmSubmit = document.getElementById(
      'delete-folder-confirm-submit'
    )

    const deleteCancelButtons = modal.querySelectorAll(
      '[data-delete-folder-cancel]'
    )

    if (
      !heading ||
      !titleForm ||
      !titleInput ||
      !titleError ||
      !wordsContainer ||
      !wordCount ||
      !deleteFolderButton ||
      !deleteConfirm ||
      !deleteConfirmDescription ||
      !deleteConfirmSubmit
    ) {
      return
    }

    let activeFolderId = null
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

    const updateCardWordCount = (folderId, count) => {
      const card = document.querySelector(
        `[data-manage-folder][data-folder-id="${CSS.escape(folderId)}"]`
      )

      const countElement = card?.querySelector('[data-folder-word-count]')

      if (countElement) {
        countElement.textContent = `${toPersianNumber(count)} کلمه`
      }
    }

    const updateCardTitle = (folderId, title) => {
      const card = document.querySelector(
        `[data-manage-folder][data-folder-id="${CSS.escape(folderId)}"]`
      )

      const titleElement = card?.querySelector('[data-folder-card-title]')

      if (titleElement) {
        titleElement.textContent = title
      }

      if (card) {
        card.setAttribute('aria-label', `مدیریت پوشه ${title}`)
      }
    }

    const refreshWords = async () => {
      if (!activeFolderId) return

      const words = await window.wordService.getWordsByFolder(activeFolderId)

      wordsContainer.innerHTML = renderFolderManagerWords(words)

      wordCount.textContent = `${toPersianNumber(words.length)} کلمه`

      updateCardWordCount(activeFolderId, words.length)

      return words
    }

    const hideDeleteConfirm = () => {
      deleteConfirm.classList.add('hidden')

      deleteConfirm.classList.remove('flex')

      deleteConfirm.setAttribute('aria-hidden', 'true')

      deleteFolderButton.focus()
    }

    const showDeleteConfirm = async () => {
      if (!activeFolderId || !activeFolder) {
        return
      }

      const words = await window.wordService.getWordsByFolder(activeFolderId)

      deleteConfirmDescription.textContent = words.length
        ? `پوشه «${activeFolder.title}» و ${toPersianNumber(
            words.length
          )} کلمه داخل آن برای همیشه حذف می‌شوند. این عملیات قابل بازگشت نیست.`
        : `پوشه «${activeFolder.title}» برای همیشه حذف می‌شود. این عملیات قابل بازگشت نیست.`

      deleteConfirm.classList.remove('hidden')

      deleteConfirm.classList.add('flex')

      deleteConfirm.setAttribute('aria-hidden', 'false')

      requestAnimationFrame(() => {
        deleteConfirmSubmit.focus()
      })
    }

    const openModal = async (folderId, trigger) => {
      try {
        if (
          !window.folderService?.getFolderById ||
          !window.wordService?.getWordsByFolder
        ) {
          throw new Error('FOLDER_MANAGER_SERVICES_NOT_READY')
        }

        const [folder, words] = await Promise.all([
          window.folderService.getFolderById(folderId),

          window.wordService.getWordsByFolder(folderId),
        ])

        if (!folder || folder.locked) {
          return
        }

        activeFolderId = folder.id
        activeFolder = folder
        lastTrigger = trigger

        heading.textContent = folder.title

        titleInput.value = folder.title

        clearTitleError()

        wordsContainer.innerHTML = renderFolderManagerWords(words)

        wordCount.textContent = `${toPersianNumber(words.length)} کلمه`

        modal.classList.remove('hidden')

        modal.classList.add('flex')

        modal.setAttribute('aria-hidden', 'false')

        document.body.classList.add('overflow-hidden')

        requestAnimationFrame(() => {
          titleInput.focus()
        })
      } catch (error) {
        console.error('Failed to open folder manager:', error)

        window.showToast?.({
          type: 'error',
          title: 'پوشه باز نشد',
          message:
            error.message === 'FOLDER_MANAGER_SERVICES_NOT_READY'
              ? 'سرویس‌های مدیریت پوشه بارگذاری نشده‌اند.'
              : 'اطلاعات پوشه دریافت نشد.',
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

      activeFolderId = null
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

      if (!activeFolderId) return

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

        const updatedFolder = await window.folderService.updateFolder({
          folderId: activeFolderId,
          title,
        })

        activeFolder = updatedFolder

        heading.textContent = updatedFolder.title

        titleInput.value = updatedFolder.title

        updateCardTitle(activeFolderId, updatedFolder.title)

        window.showToast?.({
          type: 'success',
          title: 'نام پوشه تغییر کرد',
          message: `نام پوشه به «${updatedFolder.title}» تغییر کرد.`,
        })
      } catch (error) {
        const errors = {
          FOLDER_TITLE_REQUIRED: 'نام پوشه را وارد کن.',

          FOLDER_TITLE_TOO_LONG: 'نام پوشه خیلی طولانی است.',

          FOLDER_TITLE_DUPLICATE: 'پوشه‌ای با این نام از قبل وجود دارد.',

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

    wordsContainer.addEventListener('click', async (event) => {
      const editButton = event.target.closest('[data-edit-word]')

      const deleteButton = event.target.closest('[data-delete-word]')

      const cancelButton = event.target.closest('[data-cancel-word-edit]')

      const row = event.target.closest('[data-word-row]')

      if (!row) return

      const display = row.querySelector('[data-word-display]')

      const editForm = row.querySelector('[data-word-edit-form]')

      const editInput = row.querySelector('[data-word-edit-input]')

      const editError = row.querySelector('[data-word-edit-error]')

      if (editButton && display && editForm && editInput) {
        display.classList.add('hidden')

        editForm.classList.remove('hidden')

        editError?.classList.add('hidden')

        requestAnimationFrame(() => {
          editInput.focus()
          editInput.select()
        })

        return
      }

      if (cancelButton && display && editForm && editInput) {
        const currentText = row
          .querySelector('[data-word-text]')
          ?.textContent.trim()

        editInput.value = currentText || ''

        editError?.classList.add('hidden')

        editForm.classList.add('hidden')

        display.classList.remove('hidden')

        return
      }

      if (deleteButton && activeFolderId) {
        const wordId = row.dataset.wordId

        const wordText =
          row.querySelector('[data-word-text]')?.textContent.trim() || 'کلمه'

        try {
          deleteButton.disabled = true
          deleteButton.classList.add('opacity-50', 'cursor-not-allowed')

          await window.wordService.deleteWord(wordId)

          await refreshWords()

          window.showToast?.({
            type: 'success',
            title: 'کلمه حذف شد',
            message: `«${wordText}» از پوشه حذف شد.`,
          })
        } catch (error) {
          const errors = {
            WORD_NOT_FOUND: 'کلمه پیدا نشد.',

            WORD_FOLDER_NOT_FOUND: 'پوشه این کلمه پیدا نشد.',

            WORD_FOLDER_LOCKED: 'امکان حذف کلمه از این پوشه وجود ندارد.',
          }

          window.showToast?.({
            type: 'error',
            title: 'حذف کلمه انجام نشد',
            message: errors[error.message] || 'حذف کلمه انجام نشد.',
          })

          deleteButton.disabled = false
          deleteButton.classList.remove('opacity-50', 'cursor-not-allowed')
        }
      }
    })

    wordsContainer.addEventListener('input', (event) => {
      const input = event.target.closest('[data-word-edit-input]')

      if (!input) return

      const row = input.closest('[data-word-row]')

      row?.querySelector('[data-word-edit-error]')?.classList.add('hidden')
    })

    wordsContainer.addEventListener('submit', async (event) => {
      const form = event.target.closest('[data-word-edit-form]')

      if (!form) return

      event.preventDefault()

      const row = form.closest('[data-word-row]')

      const input = form.querySelector('[data-word-edit-input]')

      const errorElement = form.querySelector('[data-word-edit-error]')

      const submitButton = form.querySelector('button[type="submit"]')

      if (!row || !input || !errorElement) {
        return
      }

      const value = input.value.trim()

      if (!value) {
        errorElement.textContent = 'کلمه یا عبارت را وارد کن.'

        errorElement.classList.remove('hidden')

        input.focus()
        return
      }

      try {
        if (submitButton) {
          submitButton.disabled = true
          submitButton.classList.add('opacity-60', 'cursor-not-allowed')
        }

        const updatedWord = await window.wordService.updateWord({
          wordId: row.dataset.wordId,

          value,
        })

        await refreshWords()

        window.showToast?.({
          type: 'success',
          title: 'کلمه ویرایش شد',
          message: `کلمه به «${updatedWord.value}» تغییر کرد.`,
        })
      } catch (error) {
        const errors = {
          WORD_VALUE_REQUIRED: 'کلمه یا عبارت را وارد کن.',

          WORD_VALUE_TOO_LONG: 'کلمه یا عبارت خیلی طولانی است.',

          WORD_DUPLICATE: 'این کلمه قبلاً در همین پوشه وجود دارد.',

          WORD_NOT_FOUND: 'کلمه پیدا نشد.',

          WORD_FOLDER_NOT_FOUND: 'پوشه این کلمه پیدا نشد.',

          WORD_FOLDER_LOCKED: 'این پوشه قابل ویرایش نیست.',
        }

        const message = errors[error.message] || 'ویرایش کلمه انجام نشد.'

        errorElement.textContent = message

        errorElement.classList.remove('hidden')

        window.showToast?.({
          type: 'error',
          title: 'کلمه ویرایش نشد',
          message,
        })
      } finally {
        if (submitButton && submitButton.isConnected) {
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
      if (!activeFolderId || !activeFolder) {
        return
      }

      try {
        deleteConfirmSubmit.disabled = true

        deleteConfirmSubmit.classList.add('opacity-60', 'cursor-not-allowed')

        const result = await window.folderService.deleteFolder(activeFolderId)

        const deletedTitle = result.folder?.title || activeFolder.title

        modal.classList.add('hidden')

        modal.classList.remove('flex')

        document.body.classList.remove('overflow-hidden')

        window.showToast?.({
          type: 'success',
          title: 'پوشه حذف شد',
          message: result.deletedWordCount
            ? `پوشه «${deletedTitle}» همراه با ${toPersianNumber(
                result.deletedWordCount
              )} کلمه حذف شد.`
            : `پوشه «${deletedTitle}» حذف شد.`,
        })

        activeFolderId = null
        activeFolder = null

        await renderFoldersView()
      } catch (error) {
        const errors = {
          FOLDER_NOT_FOUND: 'پوشه پیدا نشد.',

          FOLDER_LOCKED: 'این پوشه قابل حذف نیست.',
        }

        window.showToast?.({
          type: 'error',
          title: 'حذف پوشه انجام نشد',
          message: errors[error.message] || 'حذف پوشه انجام نشد.',
        })
      } finally {
        if (deleteConfirmSubmit.isConnected) {
          deleteConfirmSubmit.disabled = false

          deleteConfirmSubmit.classList.remove(
            'opacity-60',
            'cursor-not-allowed'
          )
        }
      }
    })

    modal.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return
      }

      if (!deleteConfirm.classList.contains('hidden')) {
        hideDeleteConfirm()
        return
      }

      closeModal()
    })
  }

  window.DashboardFolderManager = {
    createFolderManagerModal,
    initFolderManagerEvents,
  }
})()
