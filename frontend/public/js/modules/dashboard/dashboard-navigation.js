/*
 * Dashboard navigation module.
 *
 * Handles SPA-like view navigation, active menu state,
 * view transitions and the mobile drawer.
 */

;(() => {
  const { getCurrentDashboardView } = window.DashboardShared

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  const animateDashboardView = async (renderView) => {
    const container = document.getElementById('dashboard-view')

    if (!container) {
      await renderView()
      return
    }

    /*
     * A fixed modal lives inside #dashboard-view.
     * Any leftover transform on this container changes the
     * containing block of position: fixed descendants and can
     * break modal positioning after SPA-like navigation.
     */
    const clearViewAnimations = () => {
      container.getAnimations().forEach((animation) => {
        animation.cancel()
      })
    }

    clearViewAnimations()

    if (prefersReducedMotion || typeof container.animate !== 'function') {
      await renderView()
      return
    }

    // Current view leaves softly.
    const exitAnimation = container.animate(
      [
        {
          opacity: 1,
          transform: 'translateY(0)',
        },
        {
          opacity: 0,
          transform: 'translateY(8px)',
        },
      ],
      {
        duration: 180,
        easing: 'ease-out',
        fill: 'forwards',
      }
    )

    try {
      await exitAnimation.finished
    } catch {
      // Animation can be cancelled by fast navigation.
    }

    /*
     * Important: remove the filled exit transform before the
     * next view is rendered. Otherwise fixed modals become
     * relative to this transformed container.
     */
    exitAnimation.cancel()

    await renderView()

    const enterAnimation = container.animate(
      [
        {
          opacity: 0,
          transform: 'translateY(8px)',
        },
        {
          opacity: 1,
          transform: 'translateY(0)',
        },
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    )

    try {
      await enterAnimation.finished
    } catch {
      // Animation can be cancelled by fast navigation.
    }

    enterAnimation.cancel()

    /*
     * Final defensive cleanup so #dashboard-view never keeps
     * opacity/transform animation effects between views.
     */
    clearViewAnimations()
  }

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

  const initDashboardNavigation = (renderDashboardView) => {
    const links = document.querySelectorAll('[data-dashboard-link]')

    links.forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault()

        const targetView = link.dataset.dashboardLink

        const currentView = getCurrentDashboardView()

        if (!targetView || targetView === currentView) {
          return
        }

        const url = new URL(window.location.href)

        url.searchParams.set('view', targetView)

        window.history.pushState(
          {
            view: targetView,
          },
          '',
          url
        )

        updateDashboardActiveLink()

        await animateDashboardView(renderDashboardView)

        /*
         * Close the mobile drawer
         * after selecting a view.
         */
        const mobileMenu = document.getElementById('dashboard-mobile-menu')

        const menuButton = document.getElementById('dashboard-menu-button')

        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden')

          mobileMenu.setAttribute('aria-hidden', 'true')

          menuButton?.setAttribute('aria-expanded', 'false')

          document.body.classList.remove('overflow-hidden')
        }
      })
    })

    /*
     * Browser back / forward support.
     */
    window.addEventListener('popstate', async () => {
      updateDashboardActiveLink()

      await animateDashboardView(renderDashboardView)
    })
  }

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

  window.DashboardNavigation = {
    updateDashboardActiveLink,
    initDashboardNavigation,
    initDashboardDrawer,
  }
})()
