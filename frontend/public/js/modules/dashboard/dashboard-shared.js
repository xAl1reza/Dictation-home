/*
 * Dashboard shared helpers.
 *
 * Contains shared formatting, escaping and current-user UI logic.
 */

;(() => {
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

  window.DashboardShared = {
    toPersianNumber,
    escapeDashboardHtml,
    getCurrentDashboardView,
    updateDashboardUser,
  }
})()
