/*
 * Reusable toast notification component.
 *
 * Usage:
 * window.showToast({
 *   type: 'success' | 'error' | 'warning' | 'info',
 *   title: '...',
 *   message: '...',
 *   duration: 3200,
 * })
 */

const TOAST_DEFAULT_DURATION = 3200
const TOAST_MAX_VISIBLE = 4

const toastPrefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const toastTypeConfig = {
  success: {
    title: 'انجام شد',
    iconClass:
      'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light',
    progressClass: 'bg-primary',
    icon: `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="size-4"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m7.5 12.5 3 3 6-7"
        ></path>
      </svg>
    `,
  },

  error: {
    title: 'خطا',
    iconClass: 'bg-secondary/10 text-secondary dark:bg-secondary/15',
    progressClass: 'bg-secondary',
    icon: `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="size-4"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          d="M8 8l8 8M16 8l-8 8"
        ></path>
      </svg>
    `,
  },

  warning: {
    title: 'توجه',
    iconClass: 'bg-accent/15 text-accent dark:bg-accent/10',
    progressClass: 'bg-accent',
    icon: `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        class="size-4"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 8.5v4.5M12 16.5h.01M10.2 4.9 3.7 16.2A2 2 0 0 0 5.4 19h13.2a2 2 0 0 0 1.7-2.8L13.8 4.9a2 2 0 0 0-3.6 0Z"
        ></path>
      </svg>
    `,
  },

  info: {
    title: 'اطلاع',
    iconClass:
      'bg-primary-light/10 text-primary dark:bg-primary-light/15 dark:text-primary-light',
    progressClass: 'bg-primary-light',
    icon: `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        class="size-4"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5"></circle>
        <path
          stroke-linecap="round"
          d="M12 11v5M12 8h.01"
        ></path>
      </svg>
    `,
  },
}

let toastContainer = null
const activeToasts = []

const getToastContainer = () => {
  if (toastContainer?.isConnected) {
    return toastContainer
  }

  toastContainer = document.createElement('div')

  toastContainer.id = 'app-toast-container'
  toastContainer.dir = 'rtl'
  toastContainer.setAttribute('aria-live', 'polite')
  toastContainer.setAttribute('aria-atomic', 'false')

  toastContainer.className = `
    pointer-events-none
    fixed top-4 right-4 left-4
    z-[120]
    flex flex-col gap-3
    sm:right-auto
    sm:left-5
    sm:w-[420px]
    sm:max-w-[calc(100vw-2.5rem)]
  `

  document.body.appendChild(toastContainer)

  return toastContainer
}

const createToastElement = ({ type, title, message }) => {
  const config = toastTypeConfig[type] || toastTypeConfig.info

  const toast = document.createElement('div')

  toast.setAttribute('role', type === 'error' ? 'alert' : 'status')

  toast.className = `
    pointer-events-auto
    relative
    overflow-hidden
    rounded-md
    border border-white/80
    dark:border-border-dark
    bg-white/90
    dark:bg-bg-dark-secondary/95
    shadow-floating
    dark:shadow-floating-dark
    backdrop-blur-xl
  `

  const content = document.createElement('div')

  content.className = `
    flex items-start gap-3
    p-4
    sm:p-4.5
  `

  const icon = document.createElement('span')

  icon.className = `
    ${config.iconClass}
    flex size-9 shrink-0
    items-center justify-center
    rounded-full
  `

  icon.innerHTML = config.icon

  const body = document.createElement('div')

  body.className = 'min-w-0 flex-1 pt-0.5'

  const titleElement = document.createElement('strong')

  titleElement.className = `
    block
    font-Peyda-medium text-sm
    text-textColor
    dark:text-textColor-dark
  `

  titleElement.textContent = title || config.title

  body.appendChild(titleElement)

  if (message) {
    const messageElement = document.createElement('p')

    messageElement.className = `
      mt-1
      !font-Dana-regular
      !text-xs
      !leading-6
      !text-mutedColor
      dark:!text-mutedColor-dark
    `

    messageElement.textContent = message

    body.appendChild(messageElement)
  }

  const closeButton = document.createElement('button')

  closeButton.type = 'button'
  closeButton.setAttribute('aria-label', 'بستن پیام')

  closeButton.className = `
    flex size-8 shrink-0
    cursor-pointer
    items-center justify-center
    rounded-full
    text-mutedColor
    dark:text-mutedColor-dark
    transition-colors duration-200
    hover:bg-textColor/5
    hover:text-textColor
    dark:hover:bg-white/5
    dark:hover:text-textColor-dark
    focus:outline-none
    focus:ring-2
    focus:ring-primary/20
  `

  closeButton.innerHTML = `
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
        d="M7 7l10 10M17 7 7 17"
      ></path>
    </svg>
  `

  const progressTrack = document.createElement('div')

  progressTrack.className = `
    absolute right-0 bottom-0 left-0
    h-1
    bg-textColor/5
    dark:bg-white/5
  `

  const progressBar = document.createElement('div')

  progressBar.className = `
    ${config.progressClass}
    h-full w-full
    origin-right
  `

  progressTrack.appendChild(progressBar)

  content.appendChild(icon)
  content.appendChild(body)
  content.appendChild(closeButton)

  toast.appendChild(content)
  toast.appendChild(progressTrack)

  return {
    toast,
    closeButton,
    progressBar,
  }
}

const showToast = ({
  type = 'info',
  title = '',
  message = '',
  duration = TOAST_DEFAULT_DURATION,
} = {}) => {
  const container = getToastContainer()

  if (activeToasts.length >= TOAST_MAX_VISIBLE) {
    activeToasts[0]?.close()
  }

  const { toast, closeButton, progressBar } = createToastElement({
    type,
    title,
    message,
  })

  container.appendChild(toast)

  let isClosed = false
  let timeoutId = null
  let progressAnimation = null
  let remaining = Math.max(Number(duration) || TOAST_DEFAULT_DURATION, 0)
  let startedAt = performance.now()

  const removeFromActive = () => {
    const index = activeToasts.findIndex((item) => item.toast === toast)

    if (index >= 0) {
      activeToasts.splice(index, 1)
    }
  }

  const removeToast = () => {
    toast.remove()
    removeFromActive()
  }

  const closeToast = async () => {
    if (isClosed) return

    isClosed = true

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    progressAnimation?.cancel()

    if (toastPrefersReducedMotion || typeof toast.animate !== 'function') {
      removeToast()
      return
    }

    try {
      const animation = toast.animate(
        [
          {
            opacity: 1,
            transform: 'translateY(0)',
          },
          {
            opacity: 0,
            transform: 'translateY(-6px)',
          },
        ],
        {
          duration: 180,
          easing: 'ease-in',
          fill: 'forwards',
        }
      )

      await animation.finished
    } catch {
      // Animation may be cancelled during rapid UI changes.
    }

    removeToast()
  }

  const startTimer = () => {
    if (!remaining) return

    startedAt = performance.now()

    timeoutId = window.setTimeout(closeToast, remaining)

    if (
      !toastPrefersReducedMotion &&
      typeof progressBar.animate === 'function'
    ) {
      progressAnimation = progressBar.animate(
        [
          {
            transform: 'scaleX(1)',
          },
          {
            transform: 'scaleX(0)',
          },
        ],
        {
          duration: remaining,
          easing: 'linear',
          fill: 'forwards',
        }
      )
    }
  }

  const pauseTimer = () => {
    if (!remaining || isClosed) {
      return
    }

    clearTimeout(timeoutId)

    const elapsed = performance.now() - startedAt

    remaining = Math.max(remaining - elapsed, 0)

    progressAnimation?.pause()
  }

  const resumeTimer = () => {
    if (!remaining || isClosed) {
      return
    }

    startedAt = performance.now()

    timeoutId = window.setTimeout(closeToast, remaining)

    progressAnimation?.play()
  }

  closeButton.addEventListener('click', closeToast)

  toast.addEventListener('mouseenter', pauseTimer)

  toast.addEventListener('mouseleave', resumeTimer)

  if (!toastPrefersReducedMotion && typeof toast.animate === 'function') {
    toast.animate(
      [
        {
          opacity: 0,
          transform: 'translateY(-8px) scale(0.985)',
        },
        {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        },
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    )
  }

  const toastController = {
    toast,
    close: closeToast,
  }

  activeToasts.push(toastController)

  startTimer()

  return toastController
}

window.showToast = showToast
