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

  const refreshDashboardScoreData = async (user = null) => {
    const currentUser = user || (await window.userService.getCurrentUser())

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

  const initDashboard = async () => {
    try {
      await refreshDashboardScoreData()

      updateDashboardActiveLink()

      initDashboardDrawer()

      initDashboardNavigation(renderDashboardView)

      await renderDashboardView()
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
