/*
 * Dashboard page controller.
 *
 * Coordinates dashboard modules without owning feature logic.
 */

;(() => {
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
  }

  const redirectToLogin = () => {
    window.location.replace('./auth.html#login')
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

  const initDashboardLogout = () => {
    const logoutButtons = document.querySelectorAll('[data-dashboard-logout]')

    logoutButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true

        try {
          await window.authService.logout()

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

      initDashboardLogout()

      await renderDashboardView()

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
