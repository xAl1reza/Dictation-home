/*
 * User service.
 * Provides current user and score information.
 */

const getCurrentUser = async () => {
  const data = await window.appDataProvider.getState()

  return data.currentUser || null
}

const getUserGameResults = async () => {
  const data = await window.appDataProvider.getState()

  const userId = data.currentUser?.id

  if (!userId) return []

  return (data.gameResults || []).filter((result) => result.userId === userId)
}

const getUserTotalScore = async () => {
  const results = await getUserGameResults()

  return results.reduce((total, result) => total + Number(result.score || 0), 0)
}

window.userService = {
  getCurrentUser,
  getUserGameResults,
  getUserTotalScore,
}
