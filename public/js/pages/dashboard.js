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

  const initDashboard = async () => {
    try {
      const [user, totalScore] = await Promise.all([
        window.userService.getCurrentUser(),

        window.userService.getUserTotalScore(),
      ])

      updateDashboardUser(user, totalScore)

      updateDashboardActiveLink()

      initDashboardDrawer()

      initDashboardNavigation(renderDashboardView)

      await renderDashboardView()
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
    }
  }

  initDashboard()
})()
