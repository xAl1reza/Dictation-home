/*
 * Reusable accessible modal controller.
 *
 * Required markup hooks:
 * - [data-modal]                modal root
 * - [data-modal-panel]          dialog panel
 * - [data-modal-open="modal-id"] opener
 * - [data-modal-close]          close control
 * - [data-modal-backdrop]       backdrop
 *
 * Optional behavior hooks:
 * - data-modal-autofocus
 * - data-modal-escape="false"
 * - data-modal-backdrop-close="false"
 */

;(() => {
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  const CLOSE_FALLBACK_DELAY = 300

  let activeModal = null
  let lastFocusedElement = null
  let closeTimer = null
  let initialized = false

  const resolveModal = (target) => {
    if (target instanceof HTMLElement) {
      return target.matches('[data-modal]') ? target : null
    }

    const id = String(target || '')
      .replace(/^#/, '')
      .trim()

    if (!id) return null

    const element = document.getElementById(id)

    return element?.matches('[data-modal]') ? element : null
  }

  const getModalPanel = (modal) => {
    return modal?.querySelector('[data-modal-panel]') || null
  }

  const getFocusableElements = (modal) => {
    if (!modal) return []

    return [...modal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
      (element) =>
        !element.hasAttribute('hidden') &&
        element.getAttribute('aria-hidden') !== 'true' &&
        element.getClientRects().length > 0
    )
  }

  const focusModal = (modal) => {
    const preferredTarget = modal.querySelector('[data-modal-autofocus]')
    const focusableElements = getFocusableElements(modal)
    const panel = getModalPanel(modal)
    const target = preferredTarget || focusableElements[0] || panel

    if (!target) return

    if (target === panel && !panel.hasAttribute('tabindex')) {
      panel.setAttribute('tabindex', '-1')
    }

    target.focus({ preventScroll: true })
  }

  const dispatchModalEvent = (modal, eventName) => {
    modal.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        detail: {
          modalId: modal.id,
        },
      })
    )
  }

  const finishClose = (modal, { restoreFocus = true } = {}) => {
    window.clearTimeout(closeTimer)
    closeTimer = null

    modal.hidden = true
    modal.setAttribute('aria-hidden', 'true')

    if (activeModal === modal) {
      activeModal = null
    }

    dispatchModalEvent(modal, 'app:modal-closed')

    if (
      restoreFocus &&
      lastFocusedElement instanceof HTMLElement &&
      document.contains(lastFocusedElement)
    ) {
      lastFocusedElement.focus({ preventScroll: true })
    }

    lastFocusedElement = null
  }

  const close = (
    target = activeModal,
    { restoreFocus = true, immediate = false } = {}
  ) => {
    const modal = resolveModal(target)

    if (!modal || modal.hidden) return false

    modal.dataset.state = 'closed'
    dispatchModalEvent(modal, 'app:modal-closing')

    if (immediate) {
      finishClose(modal, { restoreFocus })
      return true
    }

    window.clearTimeout(closeTimer)
    closeTimer = window.setTimeout(
      () => finishClose(modal, { restoreFocus }),
      CLOSE_FALLBACK_DELAY
    )

    return true
  }

  const open = (target, opener = null) => {
    const modal = resolveModal(target)

    if (!modal) return false

    if (activeModal && activeModal !== modal) {
      close(activeModal, {
        restoreFocus: false,
        immediate: true,
      })
    }

    window.clearTimeout(closeTimer)
    closeTimer = null

    lastFocusedElement =
      opener instanceof HTMLElement ? opener : document.activeElement

    activeModal = modal
    modal.hidden = false
    modal.setAttribute('aria-hidden', 'false')
    modal.dataset.state = 'opening'

    window.requestAnimationFrame(() => {
      if (activeModal !== modal) return

      modal.dataset.state = 'open'
      focusModal(modal)
      dispatchModalEvent(modal, 'app:modal-opened')
    })

    return true
  }

  const trapFocus = (event) => {
    if (!activeModal || event.key !== 'Tab') return

    const focusableElements = getFocusableElements(activeModal)

    if (!focusableElements.length) {
      event.preventDefault()
      focusModal(activeModal)
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const handleDocumentClick = (event) => {
    const openButton = event.target.closest('[data-modal-open]')

    if (openButton) {
      event.preventDefault()
      open(openButton.dataset.modalOpen, openButton)
      return
    }

    if (!activeModal) return

    const closeButton = event.target.closest('[data-modal-close]')

    if (closeButton && activeModal.contains(closeButton)) {
      event.preventDefault()
      close(activeModal)
      return
    }

    const backdrop = event.target.closest('[data-modal-backdrop]')

    if (
      backdrop &&
      activeModal.contains(backdrop) &&
      activeModal.dataset.modalBackdropClose !== 'false'
    ) {
      close(activeModal)
    }
  }

  const handleDocumentKeydown = (event) => {
    if (!activeModal) return

    if (event.key === 'Escape' && activeModal.dataset.modalEscape !== 'false') {
      event.preventDefault()
      close(activeModal)
      return
    }

    trapFocus(event)
  }

  const init = () => {
    if (initialized) return

    initialized = true

    document.querySelectorAll('[data-modal]').forEach((modal) => {
      modal.hidden = true
      modal.dataset.state = 'closed'
      modal.setAttribute('aria-hidden', 'true')
    })

    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleDocumentKeydown)
  }

  window.AppModal = {
    init,
    open,
    close,
    closeAll: () => close(activeModal),
    getActive: () => activeModal,
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
