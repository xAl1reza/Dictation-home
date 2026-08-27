/*
 * Dashboard page controller.
 *
 * Handles:
 * - Current user information
 * - User score
 * - Dashboard navigation state
 * - Mobile drawer
 * - Folder view
 * - Folder creation
 */

/* --------------------------------------------------
 * Shared
 * -------------------------------------------------- */

const toPersianNumber = (value) => {
  return new Intl.NumberFormat('fa-IR').format(Number(value || 0))
}

const escapeDashboardHtml = (value = '') => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const getCurrentDashboardView = () => {
  const params = new URLSearchParams(window.location.search)

  return params.get('view') || 'folders'
}

/* --------------------------------------------------
 * User
 * -------------------------------------------------- */

const updateDashboardUser = (user, totalScore) => {
  if (!user) return

  const userName = document.getElementById('dashboard-user-name')

  const mobileUserName = document.getElementById('dashboard-mobile-user-name')

  const userScore = document.getElementById('dashboard-user-score')

  const mobileScore = document.getElementById('dashboard-mobile-score')

  const avatar = document.getElementById('dashboard-avatar')

  const welcomeTitle = document.getElementById('dashboard-welcome-title')

  if (userName) {
    userName.textContent = user.name
  }

  if (mobileUserName) {
    mobileUserName.textContent = user.name
  }

  if (userScore) {
    userScore.textContent = toPersianNumber(totalScore)
  }

  if (mobileScore) {
    mobileScore.textContent = toPersianNumber(totalScore)
  }

  if (welcomeTitle) {
    welcomeTitle.textContent = `${user.name}، خوش اومدی`
  }

  if (!avatar) return

  if (user.avatar) {
    avatar.innerHTML = `
      <img
        src="${escapeDashboardHtml(user.avatar)}"
        alt=""
        class="h-full w-full object-cover"
      />
    `

    return
  }

  avatar.textContent = user.name?.trim().charAt(0) || 'د'
}

/* --------------------------------------------------
 * Navigation
 * -------------------------------------------------- */

const updateDashboardActiveLink = () => {
  const currentView = getCurrentDashboardView()

  const links = document.querySelectorAll('[data-dashboard-link]')

  links.forEach((link) => {
    const isActive = link.dataset.dashboardLink === currentView

    link.classList.toggle('bg-primary/10', isActive)

    link.classList.toggle('dark:bg-primary/15', isActive)

    link.classList.toggle('text-primary', isActive)

    link.classList.toggle('dark:text-primary-light', isActive)

    if (isActive) {
      link.setAttribute('aria-current', 'page')
    } else {
      link.removeAttribute('aria-current')
    }
  })
}

/* --------------------------------------------------
 * Mobile drawer
 * -------------------------------------------------- */

const initDashboardDrawer = () => {
  const menuButton = document.getElementById('dashboard-menu-button')

  const mobileMenu = document.getElementById('dashboard-mobile-menu')

  if (!menuButton || !mobileMenu) {
    return
  }

  const closeButtons = mobileMenu.querySelectorAll(
    '[data-dashboard-menu-close]'
  )

  const openMenu = () => {
    mobileMenu.classList.remove('hidden')

    mobileMenu.setAttribute('aria-hidden', 'false')

    menuButton.setAttribute('aria-expanded', 'true')

    document.body.classList.add('overflow-hidden')
  }

  const closeMenu = () => {
    mobileMenu.classList.add('hidden')

    mobileMenu.setAttribute('aria-hidden', 'true')

    menuButton.setAttribute('aria-expanded', 'false')

    document.body.classList.remove('overflow-hidden')
  }

  menuButton.addEventListener('click', openMenu)

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeMenu)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      closeMenu()
    }
  })
}

/* --------------------------------------------------
 * Folder card
 * -------------------------------------------------- */

const createFolderCard = (folder) => {
  const title = escapeDashboardHtml(folder.title)

  const wordCount = toPersianNumber(folder.wordCount || 0)

  const isLocked = Boolean(folder.locked)

  if (isLocked) {
    return `
      <article
        aria-disabled="true"
        class="relative overflow-hidden
               rounded-lg
               border border-white/60
               dark:border-border-dark-soft
               bg-surface-soft
               dark:bg-surface-dark-soft
               p-5
               opacity-70"
      >
        <div
          aria-hidden="true"
          class="pointer-events-none
                 absolute -top-10 -left-10
                 size-28
                 rounded-full
                 bg-primary/8
                 blur-[50px]"
        ></div>

        <div class="relative z-10">
          <div
            class="mb-7
                   flex items-start
                   justify-between gap-4"
          >
            <div
              class="flex size-12
                     items-center justify-center
                     rounded-md
                     bg-primary/10
                     dark:bg-primary/15
                     text-primary
                     dark:text-primary-light"
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
              class="inline-flex items-center gap-1.5
                     rounded-full
                     bg-textColor/5
                     dark:bg-white/5
                     px-3 py-1.5
                     font-Dana-medium text-[11px]
                     text-mutedColor
                     dark:text-mutedColor-dark"
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
            class="mb-2
                   !text-lg
                   !leading-7"
          >
            ${title}
          </h3>

          <div
            class="flex items-center
                   justify-between gap-3"
          >
            <span
              class="font-Dana-regular text-xs
                     text-mutedColor
                     dark:text-mutedColor-dark"
            >
              ${wordCount} کلمه
            </span>

            <span
              class="font-Dana-regular text-[11px]
                     text-mutedColor/70
                     dark:text-mutedColor-dark/70"
            >
              قابل ویرایش نیست
            </span>
          </div>
        </div>
      </article>
    `
  }

  return `
    <article
      class="relative overflow-hidden
             rounded-lg
             border border-white/70
             dark:border-border-dark
             bg-surface
             dark:bg-surface-dark
             p-5
             shadow-card
             dark:shadow-card-dark"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none
               absolute -top-10 -left-10
               size-28
               rounded-full
               bg-secondary/8
               blur-[50px]"
      ></div>

      <div class="relative z-10">
        <div
          class="mb-7
                 flex items-start
                 justify-between gap-4"
        >
          <div
            class="flex size-12
                   items-center justify-center
                   rounded-md
                   bg-secondary/10
                   text-secondary"
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
            class="inline-flex items-center
                   rounded-full
                   bg-secondary/10
                   px-3 py-1.5
                   font-Dana-medium text-[11px]
                   text-secondary"
          >
            پوشه من
          </span>
        </div>

        <h3
          class="mb-2
                 !text-lg
                 !leading-7"
        >
          ${title}
        </h3>

        <span
          class="font-Dana-regular text-xs
                 text-mutedColor
                 dark:text-mutedColor-dark"
        >
          ${wordCount} کلمه
        </span>
      </div>
    </article>
  `
}

/* --------------------------------------------------
 * Folder modal
 * -------------------------------------------------- */

const createAddFolderModal = () => {
  return `
    <div
      id="add-folder-modal"
      class="fixed inset-0 z-[100]
             hidden
             items-center justify-center
             p-4 sm:p-6"
      aria-hidden="true"
    >
      <button
        type="button"
        data-folder-modal-close
        aria-label="بستن پنجره افزودن پوشه"
        class="absolute inset-0
               bg-bg-dark/50
               backdrop-blur-sm"
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-folder-title"
        class="relative z-10
               w-full max-w-md
               rounded-lg
               border border-white/70
               dark:border-border-dark
               bg-bg
               dark:bg-bg-dark-secondary
               p-5 sm:p-6
               shadow-floating
               dark:shadow-floating-dark"
      >
        <div
          class="mb-6
                 flex items-start
                 justify-between gap-4"
        >
          <div>
            <span
              class="mb-2 block
                     font-Dana-medium text-xs
                     text-primary
                     dark:text-primary-light"
            >
              پوشه جدید
            </span>

            <h2
              id="add-folder-title"
              class="!text-xl"
            >
              یک پوشه برای کلماتت بساز
            </h2>
          </div>

          <button
            type="button"
            data-folder-modal-close
            aria-label="بستن"
            class="flex size-9 shrink-0
                   items-center justify-center
                   rounded-full
                   bg-surface
                   dark:bg-surface-dark
                   text-textColor
                   dark:text-textColor-dark
                   transition-colors
                   hover:text-primary
                   dark:hover:text-primary-light"
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
            class="mt-7
                   flex flex-col-reverse gap-3
                   sm:flex-row
                   sm:justify-end"
          >
            <button
              type="button"
              data-folder-modal-close
              class="inline-flex
                     items-center justify-center
                     rounded-full
                     border border-textColor/10
                     dark:border-border-dark
                     bg-transparent
                     px-6 py-3
                     font-Peyda-medium text-sm
                     text-textColor
                     dark:text-textColor-dark
                     transition-all duration-300
                     hover:border-primary/30
                     hover:text-primary
                     dark:hover:text-primary-light"
            >
              انصراف
            </button>

            <button
              id="add-folder-submit"
              type="submit"
              class="inline-flex
                     items-center justify-center
                     rounded-full
                     border border-primary
                     bg-primary
                     px-7 py-3
                     font-Peyda-medium text-sm
                     text-white
                     shadow-btn
                     transition-all duration-300
                     ease-in-out
                     hover:-translate-y-1
                     hover:bg-transparent
                     hover:text-primary
                     hover:shadow-lg
                     active:scale-95
                     focus:outline-none
                     focus:ring-2
                     focus:ring-primary/30"
            >
              ساخت پوشه
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}

/* --------------------------------------------------
 * Folders view
 * -------------------------------------------------- */

const renderFoldersView = async () => {
  const container = document.getElementById('dashboard-view')

  if (!container) return

  container.innerHTML = `
    <div
      class="py-10 text-center"
    >
      <span
        class="font-Dana-regular text-sm
               text-mutedColor
               dark:text-mutedColor-dark"
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

    const userFolders = folders.filter((folder) => folder.ownerType === 'user')

    container.innerHTML = `
      <section
        aria-labelledby="folders-title"
      >
        <!-- Header -->
        <div
          class="mb-6
                 flex flex-col gap-4
                 sm:flex-row
                 sm:items-end
                 sm:justify-between"
        >
          <div>
            <div
              class="mb-2
                     flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                class="size-1.5
                       rounded-full
                       bg-primary"
              ></span>

              <span
                class="font-Dana-medium text-xs
                       text-primary
                       dark:text-primary-light"
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
              class="max-w-xl
                     text-sm leading-7
                     text-mutedColor
                     dark:text-mutedColor-dark"
            >
              کلماتت را در پوشه‌های مختلف مرتب کن تا بعداً برای مسابقه دیکته از آن‌ها استفاده کنی.
            </p>
          </div>

          <button
            type="button"
            data-add-folder
            class="inline-flex
                   cursor-pointer
                   shrink-0
                   items-center justify-center gap-2
                   self-start
                   rounded-full
                   border border-primary
                   bg-primary
                   px-6 py-3
                   font-Peyda-medium text-sm
                   text-white
                   shadow-btn
                   transition-all duration-300
                   ease-in-out
                   hover:-translate-y-1
                   hover:bg-transparent
                   hover:text-primary
                   hover:shadow-lg
                   active:scale-95
                   focus:outline-none
                   focus:ring-2
                   focus:ring-primary/30
                   sm:self-auto"
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
            class="mb-4
                   flex items-center
                   justify-between gap-4"
          >
            <h3
              class="!font-Peyda-medium
                     !text-base"
            >
              پوشه‌های من
            </h3>

            <span
              class="font-Dana-regular text-xs
                     text-mutedColor
                     dark:text-mutedColor-dark"
            >
              ${toPersianNumber(userFolders.length)} پوشه
            </span>
          </div>

          <div
            class="grid grid-cols-1
                   gap-4
                   sm:grid-cols-2
                   xl:grid-cols-3"
          >
            ${
              userFolders.length
                ? userFolders.map(createFolderCard).join('')
                : `
                  <div
                    class="sm:col-span-2
                           xl:col-span-3
                           rounded-lg
                           border border-dashed
                           border-primary/20
                           bg-primary/[0.03]
                           dark:bg-primary/[0.05]
                           px-6 py-10
                           text-center"
                  >
                    <div
                      class="mx-auto mb-4
                             flex size-12
                             items-center justify-center
                             rounded-full
                             bg-primary/10
                             text-primary
                             dark:bg-primary/15
                             dark:text-primary-light"
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
                      class="mb-2
                             !text-base"
                    >
                      هنوز پوشه‌ای نساختی
                    </h3>

                    <p
                      class="mb-5
                             text-sm
                             text-mutedColor
                             dark:text-mutedColor-dark"
                    >
                      اولین پوشه‌ات را برای نگهداری کلمات بساز.
                    </p>

                    <button
                      type="button"
                      data-add-folder
                      class="font-Peyda-medium text-sm
                             text-primary
                             dark:text-primary-light"
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
                    class="group
                           cursor-pointer
                           min-h-[190px]
                           rounded-lg
                           border border-dashed
                           border-primary/25
                           bg-primary/[0.025]
                           dark:bg-primary/[0.04]
                           p-5
                           text-right
                           transition-all duration-300
                           hover:-translate-y-1
                           hover:border-primary/45
                           hover:bg-primary/[0.045]
                           dark:hover:bg-primary/[0.07]
                           focus:outline-none
                           focus:ring-2
                           focus:ring-primary/20"
                  >
                    <div
                      class="mb-7
                             flex size-12
                             items-center justify-center
                             rounded-md
                             bg-primary/10
                             text-primary
                             transition-transform duration-300
                             group-hover:scale-105
                             dark:bg-primary/15
                             dark:text-primary-light"
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

                    <strong
                      class="mb-1.5 block
                             font-Peyda-medium text-base
                             text-textColor
                             dark:text-textColor-dark"
                    >
                      افزودن پوشه
                    </strong>

                    <span
                      class="font-Dana-regular text-xs
                             text-mutedColor
                             dark:text-mutedColor-dark"
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
                  class="mb-4
                         flex items-center
                         justify-between gap-4"
                >
                  <div>
                    <h3
                      class="mb-1
                             !font-Peyda-medium
                             !text-base"
                    >
                      پوشه‌های دیکته خونه
                    </h3>

                    <span
                      class="font-Dana-regular text-xs
                             text-mutedColor
                             dark:text-mutedColor-dark"
                    >
                      پوشه‌های آماده و پیش‌فرض
                    </span>
                  </div>

                  <span
                    class="font-Dana-regular text-xs
                           text-mutedColor
                           dark:text-mutedColor-dark"
                  >
                    ${toPersianNumber(systemFolders.length)} پوشه
                  </span>
                </div>

                <div
                  class="grid grid-cols-1
                         gap-4
                         sm:grid-cols-2
                         xl:grid-cols-3"
                >
                  ${systemFolders.map(createFolderCard).join('')}
                </div>
              </div>
            `
            : ''
        }

        ${createAddFolderModal()}
      </section>
    `

    initFolderViewEvents()
  } catch (error) {
    console.error('Failed to load folders:', error)

    container.innerHTML = `
      <div
        class="rounded-lg
               border border-secondary/15
               bg-secondary/5
               px-6 py-10
               text-center"
      >
        <h2
          class="mb-2 !text-lg"
        >
          دریافت پوشه‌ها انجام نشد
        </h2>

        <p
          class="text-sm
                 text-mutedColor
                 dark:text-mutedColor-dark"
        >
          لطفاً صفحه را دوباره بارگذاری کن.
        </p>
      </div>
    `
  }
}

/* --------------------------------------------------
 * Folder interactions
 * -------------------------------------------------- */

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

      await window.folderService.createFolder({
        title,
      })

      closeModal()

      await renderFoldersView()
    } catch (error) {
      const errors = {
        FOLDER_TITLE_REQUIRED: 'نام پوشه را وارد کن.',

        FOLDER_TITLE_TOO_LONG: 'نام پوشه خیلی طولانی است.',

        FOLDER_TITLE_DUPLICATE: 'پوشه‌ای با این نام از قبل وجود دارد.',
      }

      showError(errors[error.message] || 'ساخت پوشه انجام نشد.')
    } finally {
      if (submitButton) {
        submitButton.disabled = false

        submitButton.textContent = 'ساخت پوشه'
      }
    }
  })

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal()
      }
    },
    {
      once: true,
    }
  )
}

/* --------------------------------------------------
 * Future views
 * -------------------------------------------------- */

const renderComingSoonView = (title, description) => {
  const container = document.getElementById('dashboard-view')

  if (!container) return

  container.innerHTML = `
    <section
      class="rounded-lg
             border border-white/60
             dark:border-border-dark-soft
             bg-surface-soft
             dark:bg-surface-dark-soft
             px-6 py-10
             text-center"
    >
      <span
        class="mb-3
               inline-flex items-center
               rounded-full
               bg-primary/10
               px-4 py-2
               font-Dana-medium text-xs
               text-primary
               dark:bg-primary/15
               dark:text-primary-light"
      >
        مرحله بعد
      </span>

      <h2
        class="mb-3 !text-xl"
      >
        ${escapeDashboardHtml(title)}
      </h2>

      <p
        class="text-sm
               text-mutedColor
               dark:text-mutedColor-dark"
      >
        ${escapeDashboardHtml(description)}
      </p>
    </section>
  `
}

/* --------------------------------------------------
 * View controller
 * -------------------------------------------------- */

const renderDashboardView = async () => {
  const currentView = getCurrentDashboardView()

  switch (currentView) {
    case 'folders':
      await renderFoldersView()
      break

    case 'add-word':
      renderComingSoonView(
        'افزودن کلمه',
        'در مرحله بعد انتخاب پوشه و افزودن کلمات را پیاده‌سازی می‌کنیم.'
      )
      break

    default:
      await renderFoldersView()
  }
}

/* --------------------------------------------------
 * Initialize
 * -------------------------------------------------- */

const initDashboard = async () => {
  try {
    const [user, totalScore] = await Promise.all([
      window.userService.getCurrentUser(),

      window.userService.getUserTotalScore(),
    ])

    updateDashboardUser(user, totalScore)

    updateDashboardActiveLink()

    initDashboardDrawer()

    await renderDashboardView()
  } catch (error) {
    console.error('Failed to initialize dashboard:', error)
  }
}

initDashboard()
