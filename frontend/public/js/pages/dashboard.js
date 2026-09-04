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

  const redirectToLogin = (reason = 'AUTH_REQUIRED') => {
    window.apiClient?.warn(
      `[API:DASHBOARD] redirecting to login | reason=${reason}`
    )

    window.location.replace('./auth.html#login')
  }

  const refreshDashboardScoreData = async (user = null) => {
    const currentUser = user || (await window.userService.getCurrentUser())

    if (!currentUser?.id) {
      redirectToLogin('NO_VERIFIED_USER')
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

          const resolved = window.apiErrors?.resolve(
            error,
            'خروج از حساب روی سرور کامل نشد، اما نشست این مرورگر بسته شد.'
          )

          window.showToast?.({
            type: 'warning',
            title: 'خروج از حساب',
            message:
              resolved?.message ||
              'خروج از حساب روی سرور کامل نشد، اما نشست این مرورگر بسته شد.',
          })

          window.location.replace('./auth.html#login')
        }
      })
    })
  }

  const initDashboard = async () => {
    try {
      window.apiClient?.log(
        '[API:DASHBOARD] init | verifying HttpOnly session through /me'
      )

      const scoreData = await refreshDashboardScoreData()

      if (!scoreData) return

      updateDashboardActiveLink()

      initDashboardDrawer()

      initDashboardNavigation(renderDashboardView)

      initDashboardLogout()

      await renderDashboardView()
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)

      const resolved = window.apiErrors?.resolve(
        error,
        'اطلاعات داشبورد از سرور دریافت نشد.'
      )

      window.showToast?.({
        type: 'error',
        title: 'بارگذاری داشبورد',
        message:
          resolved?.message || 'اطلاعات داشبورد از سرور دریافت نشد.',
      })
    }
  }

  window.addEventListener('pageshow', async (event) => {
    if (!event.persisted) return

    try {
      await refreshDashboardScoreData()
    } catch (error) {
      console.error(
        'Failed to refresh dashboard score summary:',
        error
      )
    }
  })

  initDashboard()
})()
