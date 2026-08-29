/*
 * Dashboard folders view.
 *
 * Handles folder cards, folder list rendering and add-folder flow.
 */

;(() => {
  const { toPersianNumber, escapeDashboardHtml } = window.DashboardShared

  const { createFolderManagerModal, initFolderManagerEvents } =
    window.DashboardFolderManager

  const createFolderCard = (folder) => {
    const title = escapeDashboardHtml(folder.title)

    const wordCount = toPersianNumber(folder.wordCount || 0)

    const isLocked = Boolean(folder.locked)

    if (isLocked) {
      return `
      <article
        aria-disabled="true"
        class="relative overflow-hidden rounded-lg border border-white/60 dark:border-border-dark-soft bg-surface-soft dark:bg-surface-dark-soft p-5 opacity-70"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -top-10 -left-10 size-28 rounded-full bg-primary/8 blur-[50px]"
        ></div>

        <div class="relative z-10">
          <div
            class="mb-7 flex items-start justify-between gap-4"
          >
            <div
              class="flex size-12 items-center justify-center rounded-md bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-light"
            >
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
            </div>

            <span
              class="ui-badge items-center gap-1.5 bg-textColor/5 dark:bg-white/5"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="size-3.5"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                ></rect>

                <path
                  stroke-linecap="round"
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                ></path>
              </svg>

              پیش‌فرض
            </span>
          </div>

          <h3
            class="mb-2"
          >
            ${title}
          </h3>

          <div
            class="flex items-center justify-between gap-3"
          >
            <span
              class="ui-meta"
            >
              ${wordCount} کلمه
            </span>

            <span
              class="ui-meta text-mutedColor/70 dark:text-mutedColor-dark/70"
            >
              قابل ویرایش نیست
            </span>
          </div>
        </div>
      </article>
    `
    }

    return `
    <button
      type="button"
      data-manage-folder
      data-folder-id="${escapeDashboardHtml(folder.id)}"
      aria-label="مدیریت پوشه ${title}"
      class="group relative overflow-hidden cursor-pointer rounded-lg border border-white/70 dark:border-border-dark bg-surface dark:bg-surface-dark p-5 text-right shadow-card dark:shadow-card-dark transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-floating dark:hover:border-secondary/25 dark:hover:shadow-floating-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-10 -left-10 size-28 rounded-full bg-secondary/8 blur-[50px]"
      ></div>

      <div class="relative z-10">
        <div
          class="mb-7 flex items-start justify-between gap-4"
        >
          <div
            class="flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary transition-transform duration-300 group-hover:scale-105"
          >
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
          </div>

          <span
            class="ui-badge items-center bg-secondary/10 text-secondary"
          >
            مدیریت
          </span>
        </div>

        <h3
          data-folder-card-title
          class="mb-2"
        >
          ${title}
        </h3>

        <div class="flex items-center">
          <span
            data-folder-word-count
            class="ui-meta"
          >
            ${wordCount} کلمه
          </span>
        </div>
      </div>
    </button>
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
        class="relative z-10 w-full max-w-md rounded-lg border border-white/75 bg-surface-strong p-5 sm:p-6 shadow-floating backdrop-blur-md dark:border-border-dark-strong dark:bg-surface-dark-strong dark:shadow-floating-dark"
      >
        <div
          class="mb-6 flex items-start justify-between gap-4"
        >
          <div>
            <span
              class="ui-eyebrow mb-2 block"
            >
              پوشه جدید
            </span>

            <h2
              id="add-folder-title"
             
            >
              یک پوشه برای کلماتت بساز
            </h2>
          </div>

          <button
            type="button"
            data-folder-modal-close
            aria-label="بستن"
            class="flex size-9 shrink-0 items-center justify-center cursor-pointer rounded-full bg-surface dark:bg-surface-dark text-textColor dark:text-textColor-dark transition-colors hover:text-primary dark:hover:text-primary-light"
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
                d="M6 6l12 12M18 6 6 18"
              ></path>
            </svg>
          </button>
        </div>

        <form
          id="add-folder-form"
          novalidate
        >
          <div class="form-group">
            <label
              for="folder-title"
              class="form-label"
            >
              نام پوشه

              <span
                class="form-required"
                aria-hidden="true"
              >
                *
              </span>
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

            <span
              id="folder-title-help"
              class="form-help"
            >
              یک اسم کوتاه و مشخص برای پوشه انتخاب کن.
            </span>

            <span
              id="folder-title-error"
              class="form-error hidden"
              role="alert"
            ></span>
          </div>

          <div
            class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              data-folder-modal-close
              class="btn-ghost"
            >
              انصراف
            </button>

            <button
              id="add-folder-submit"
              type="submit"
              class="btn-primary"
            >
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
    <div
      class="py-10 text-center"
    >
      <span
       
      >
        در حال دریافت پوشه‌ها...
      </span>
    </div>
  `

    try {
      const folders = await window.folderService.getFolders()

      const systemFolders = folders.filter(
        (folder) => folder.ownerType === 'system'
      )

      const userFolders = folders.filter(
        (folder) => folder.ownerType === 'user'
      )

      container.innerHTML = `
      <section
        aria-labelledby="folders-title"
      >
        <!-- Header -->
        <div
          class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
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
                کلمات من
              </span>
            </div>

            <h2
              id="folders-title"
              class="mb-2"
            >
              پوشه‌ها
            </h2>

            <p
              class="max-w-xl text-mutedColor dark:text-mutedColor-dark"
            >
              کلماتت را در پوشه‌های مختلف مرتب کن تا بعداً برای مسابقه دیکته از آن‌ها استفاده کنی.
            </p>
          </div>

          <button
            type="button"
            data-add-folder
            class="btn-primary shrink-0 gap-2 self-start sm:self-auto"
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

            افزودن پوشه
          </button>
        </div>

        <!-- User folders -->
        <div class="mb-9">
          <div
            class="mb-4 flex items-center justify-between gap-4"
          >
            <h3
             
            >
              پوشه‌های من
            </h3>

            <span
              class="ui-meta"
            >
              ${toPersianNumber(userFolders.length)} پوشه
            </span>
          </div>

          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            ${
              userFolders.length
                ? userFolders.map(createFolderCard).join('')
                : `
                  <div
                    class="sm:col-span-2 xl:col-span-3 rounded-lg border border-dashed border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.05] px-6 py-10 text-center"
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
                        <path
                          stroke-linecap="round"
                          d="M12 5v14M5 12h14"
                        ></path>
                      </svg>
                    </div>

                    <h3
                      class="mb-2"
                    >
                      هنوز پوشه‌ای نساختی
                    </h3>

                    <p
                      class="mb-5 text-mutedColor dark:text-mutedColor-dark"
                    >
                      اولین پوشه‌ات را برای نگهداری کلمات بساز.
                    </p>

                    <button
                      type="button"
                      data-add-folder
                      class="btn-link"
                    >
                      + ساخت اولین پوشه
                    </button>
                  </div>
                `
            }

            <!-- Add folder card -->
            ${
              userFolders.length
                ? `
                  <button
                    type="button"
                    data-add-folder
                    class="group cursor-pointer min-h-[190px] rounded-lg border border-dashed border-primary/25 bg-primary/[0.025] dark:bg-primary/[0.04] p-5 text-right transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:bg-primary/[0.045] dark:hover:bg-primary/[0.07] focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                        <path
                          stroke-linecap="round"
                          d="M12 5v14M5 12h14"
                        ></path>
                      </svg>
                    </div>

                    <h5
                      class="mb-1.5"
                    >
                      افزودن پوشه
                    </h5>

                    <span
                      class="ui-meta"
                    >
                      یک دسته جدید برای کلماتت بساز
                    </span>
                  </button>
                `
                : ''
            }
          </div>
        </div>

        <!-- System folders -->
        ${
          systemFolders.length
            ? `
              <div>
                <div
                  class="mb-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3
                      class="mb-1"
                    >
                      پوشه‌های دیکته خونه
                    </h3>

                    <span
                      class="ui-meta"
                    >
                      پوشه‌های آماده و پیش‌فرض
                    </span>
                  </div>

                  <span
                    class="ui-meta"
                  >
                    ${toPersianNumber(systemFolders.length)} پوشه
                  </span>
                </div>

                <div
                  class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
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

      container.innerHTML = `
      <div
        class="rounded-lg border border-secondary/15 bg-secondary/5 px-6 py-10 text-center"
      >
        <h2
          class="mb-2"
        >
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

  const initFolderViewEvents = () => {
    const modal = document.getElementById('add-folder-modal')

    const form = document.getElementById('add-folder-form')

    const input = document.getElementById('folder-title')

    const errorElement = document.getElementById('folder-title-error')

    const submitButton = document.getElementById('add-folder-submit')

    if (!modal || !form || !input || !errorElement) {
      return
    }

    const openButtons = document.querySelectorAll('[data-add-folder]')

    const closeButtons = modal.querySelectorAll('[data-folder-modal-close]')

    let lastTrigger = null

    const clearError = () => {
      errorElement.textContent = ''
      errorElement.classList.add('hidden')

      input.removeAttribute('aria-invalid')
    }

    const showError = (message) => {
      errorElement.textContent = message
      errorElement.classList.remove('hidden')

      input.setAttribute('aria-invalid', 'true')
    }

    const openModal = (trigger) => {
      lastTrigger = trigger

      clearError()
      form.reset()

      modal.classList.remove('hidden')
      modal.classList.add('flex')

      modal.setAttribute('aria-hidden', 'false')

      document.body.classList.add('overflow-hidden')

      requestAnimationFrame(() => {
        input.focus()
      })
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

    input.addEventListener('input', clearError)

    form.addEventListener('submit', async (event) => {
      event.preventDefault()

      clearError()

      const title = input.value.trim()

      if (!title) {
        showError('نام پوشه را وارد کن.')

        input.focus()

        return
      }

      try {
        if (submitButton) {
          submitButton.disabled = true

          submitButton.textContent = 'در حال ساخت...'
        }

        const createdFolder = await window.folderService.createFolder({
          title,
        })

        closeModal()

        window.showToast?.({
          type: 'success',
          title: 'پوشه ساخته شد',
          message: `پوشه «${createdFolder.title}» با موفقیت اضافه شد.`,
        })

        await renderFoldersView()
      } catch (error) {
        const errors = {
          FOLDER_TITLE_REQUIRED: 'نام پوشه را وارد کن.',

          FOLDER_TITLE_TOO_LONG: 'نام پوشه خیلی طولانی است.',

          FOLDER_TITLE_DUPLICATE: 'پوشه‌ای با این نام از قبل وجود دارد.',
        }

        const message = errors[error.message] || 'ساخت پوشه انجام نشد.'

        showError(message)

        window.showToast?.({
          type: 'error',
          title: 'ساخت پوشه انجام نشد',
          message,
        })
      } finally {
        if (submitButton) {
          submitButton.disabled = false

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

  window.DashboardFolders = {
    renderFoldersView,
  }
})()
