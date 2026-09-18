/*
 * Dashboard page controller.
 *
 * Coordinates dashboard modules without owning feature logic.
 */

;(() => {
  const CHANNEL_MODAL_ID = 'bale-channel-modal'
  const CHANNEL_MODAL_STORAGE_PREFIX = 'dikteh-khooneh:bale-channel-modal-shown'
  const CHANNEL_MODAL_DELAY = 450

  const { getCurrentDashboardView, updateDashboardUser } =
    window.DashboardShared

  const {
    updateDashboardActiveLink,
    initDashboardDrawer,
    initDashboardNavigation,
  } = window.DashboardNavigation

  const { renderFoldersView } = window.DashboardFolders

  const { renderAddWordView } = window.DashboardAddWord

  const { renderAddScienceQuestionView } = window.DashboardAddScienceQuestion

  const { renderDashboardScoreSummary } = window.DashboardScoreSummary

  const renderDashboardView = async () => {
    const currentView = getCurrentDashboardView()

    if (['add-word', 'add-science-question'].includes(currentView) &&
        !window.DashboardSubscription.can('content_manage')) {
      const container = document.getElementById('dashboard-view')
      container.replaceChildren()
      const message = document.createElement('p')
      message.className = 'ui-meta'
      message.textContent = 'برای مدیریت محتوا، اشتراک فعال لازم است.'
      container.append(message)
      window.DashboardSubscription.showRequired()
      return
    }

    switch (currentView) {
      case 'folders':
        await renderFoldersView()
        break

      case 'add-word':
        await renderAddWordView()
        break

      case 'add-science-question':
        await renderAddScienceQuestionView()
        break

      default:
        await renderFoldersView()
    }
    window.DashboardSubscription.updateLocks()
  }

  const redirectToLogin = () => {
    window.location.replace('./auth.html#login')
  }

  const getChannelModalStorageKey = (userId) => {
    return `${CHANNEL_MODAL_STORAGE_PREFIX}:${String(userId)}`
  }

  const hasShownChannelModal = (userId) => {
    try {
      return sessionStorage.getItem(getChannelModalStorageKey(userId)) === '1'
    } catch {
      return false
    }
  }

  const markChannelModalAsShown = (userId) => {
    try {
      sessionStorage.setItem(getChannelModalStorageKey(userId), '1')
    } catch {
      // The modal can still work if browser storage is unavailable.
    }
  }

  const resetChannelModalState = (userId) => {
    try {
      sessionStorage.removeItem(getChannelModalStorageKey(userId))
    } catch {
      // Logout must continue even if browser storage is unavailable.
    }
  }

  const scheduleChannelModal = (user) => {
    if (
      !user?.id ||
      !window.AppModal ||
      !document.getElementById(CHANNEL_MODAL_ID) ||
      hasShownChannelModal(user.id)
    ) {
      return
    }

    window.setTimeout(() => {
      if (!window.DashboardSubscription.getStatus() ||
          window.DashboardSubscription.getStatus().purchaseRequired ||
          window.AppModal.getActive()) return
      const opened = window.AppModal.open(CHANNEL_MODAL_ID)

      if (opened) {
        markChannelModalAsShown(user.id)
      }
    }, CHANNEL_MODAL_DELAY)
  }

  const refreshDashboardScoreData = async (user = null) => {
    const currentUser = user || (await window.userService.getCurrentUser())

    if (!currentUser?.id) {
      redirectToLogin()
      return null
    }

    const summary = await window.gameResultService.getUserScoreSummary(
      currentUser.id
    )

    updateDashboardUser(currentUser, summary.totalScore)

    renderDashboardScoreSummary(summary)

    return {
      user: currentUser,
      summary,
    }
  }

  const initDashboardLogout = (userId) => {
    const logoutButtons = document.querySelectorAll('[data-dashboard-logout]')

    logoutButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true

        try {
          await window.authService.logout()

          resetChannelModalState(userId)

          window.location.replace('./auth.html#login')
        } catch (error) {
          console.error('Failed to logout:', error)

          button.disabled = false
        }
      })
    })
  }

  const initDashboard = async () => {
    try {
      const currentUser = await window.userService.getCurrentUser()

      if (!currentUser?.id) {
        redirectToLogin()
        return
      }

      /*
       * Render the dashboard view independently from score loading.
       * A stats/API issue must never leave the folders area blank.
       */
      updateDashboardUser(currentUser, 0)

      updateDashboardActiveLink()

      initDashboardDrawer()

      initDashboardNavigation(renderDashboardView)

      initDashboardLogout(currentUser.id)

      await window.DashboardSubscription.init()

      await renderDashboardView()

      let previousPermissions = JSON.stringify(window.DashboardSubscription.getStatus()?.permissions)
      window.addEventListener('app:subscription-updated', () => {
        const nextPermissions = JSON.stringify(window.DashboardSubscription.getStatus()?.permissions)
        if (nextPermissions === previousPermissions) return
        previousPermissions = nextPermissions
        renderDashboardView().catch((error) => {
          console.error('Failed to update dashboard access:', error)
        })
      })

      scheduleChannelModal(currentUser)

      try {
        await refreshDashboardScoreData(currentUser)
      } catch (error) {
        console.error('Failed to refresh dashboard score summary:', error)
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
    }
  }

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return

    refreshDashboardScoreData().catch((error) => {
      console.error('Failed to refresh dashboard score summary:', error)
    })
  })

  initDashboard()
})()
