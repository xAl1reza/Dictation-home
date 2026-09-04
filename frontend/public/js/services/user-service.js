/*
 * User service backed by the real API.
 *
 * Auth state is verified by the backend HttpOnly cookie.
 * All backend access uses async/await.
 */

;(() => {
  const getCurrentUser =
    async () => {
      const user =
        await window.authService
          .getCurrentUser()

      if (user?.id) {
        window.apiClient.log(
          '[API:USER] loaded and verified from backend'
        )
      }

      return user
    }

  const getUserGameResults =
    async () => {
      const results =
        await window.apiClient.get(
          '/game-results'
        )

      const normalizedResults =
        Array.isArray(results)
          ? results
          : []

      window.apiClient.log(
        `[API:USER] game history loaded from backend: ${normalizedResults.length}`
      )

      return normalizedResults
    }

  const getUserTotalScore =
    async () => {
      const results =
        await getUserGameResults()

      const total =
        results.reduce(
          (
            sum,
            result
          ) => {
            return (
              sum +
              Number(
                result.score || 0
              )
            )
          },
          0
        )

      return total
    }

  window.userService =
    Object.freeze({
      getCurrentUser,
      getUserGameResults,
      getUserTotalScore,
    })
})()
