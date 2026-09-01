/*
 * Dashboard score summary.
 *
 * Renders aggregate score data returned by gameResultService.
 * It does not read appData/localStorage directly.
 */

;(() => {
  const { toPersianNumber } = window.DashboardShared

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  const setText = (id, value) => {
    const element = document.getElementById(id)

    if (element) {
      element.textContent = value
    }
  }

  const formatGamesCount = (count) => {
    return `${toPersianNumber(count)} مسابقه`
  }

  const animateSummaryCards = () => {
    if (prefersReducedMotion) return

    const cards = Array.from(
      document.querySelectorAll('[data-dashboard-score-card]')
    )

    cards.forEach((card, index) => {
      if (typeof card.animate !== 'function') return

      card.getAnimations().forEach((animation) => animation.cancel())

      card.animate(
        [
          {
            opacity: 0,
            transform: 'translateY(10px)',
          },
          {
            opacity: 1,
            transform: 'translateY(0)',
          },
        ],
        {
          duration: 360,
          delay: index * 65,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'backwards',
        }
      )
    })
  }

  const renderDashboardScoreSummary = (summary) => {
    const safeSummary = summary || {}
    const byGame = safeSummary.byGame || {}

    const math = byGame.math || {}
    const science = byGame.science || {}
    const dictation = byGame.dictation || {}

    setText(
      'dashboard-summary-total-score',
      toPersianNumber(safeSummary.totalScore || 0)
    )

    setText(
      'dashboard-summary-total-games',
      formatGamesCount(safeSummary.totalGames || 0)
    )

    setText(
      'dashboard-summary-math-score',
      toPersianNumber(math.score || 0)
    )
    setText(
      'dashboard-summary-math-games',
      formatGamesCount(math.gamesPlayed || 0)
    )

    setText(
      'dashboard-summary-science-score',
      toPersianNumber(science.score || 0)
    )
    setText(
      'dashboard-summary-science-games',
      formatGamesCount(science.gamesPlayed || 0)
    )

    setText(
      'dashboard-summary-dictation-score',
      toPersianNumber(dictation.score || 0)
    )
    setText(
      'dashboard-summary-dictation-games',
      formatGamesCount(dictation.gamesPlayed || 0)
    )

    animateSummaryCards()
  }

  window.DashboardScoreSummary = Object.freeze({
    renderDashboardScoreSummary,
  })
})()
