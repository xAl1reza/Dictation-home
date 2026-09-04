/*
 * Profile service backed by the real API.
 *
 * Profile data, password and avatar are all persisted by the backend.
 * All API requests use async/await.
 */

;(() => {
  const getProfile = async () => {
    const user = await window.apiClient.get('/me')

    window.apiClient.log(
      '[API:PROFILE] loaded from backend'
    )

    return user || null
  }

  const updateProfile = async (payload) => {
    const user = await window.apiClient.patch(
      '/profile',
      payload
    )

    window.apiClient.log(
      '[API:PROFILE] updated on backend'
    )

    return user
  }

  const changePassword = async ({
    currentPassword,
    newPassword,
  }) => {
    const result = await window.apiClient.patch(
      '/profile/password',
      {
        currentPassword,
        newPassword,
      }
    )

    window.apiClient.log(
      '[API:PROFILE] password updated on backend'
    )

    return result
  }

  const uploadAvatar = async (file) => {
    if (!file) {
      const error = new Error(
        'PROFILE_AVATAR_REQUIRED'
      )
      error.code = 'PROFILE_AVATAR_REQUIRED'
      throw error
    }

    const formData = new FormData()
    formData.append('avatar', file)

    const user = await window.apiClient.post(
      '/profile/avatar',
      formData
    )

    window.apiClient.log(
      '[API:PROFILE] avatar uploaded to backend'
    )

    return user
  }

  const deleteAvatar = async () => {
    const user = await window.apiClient.delete(
      '/profile/avatar'
    )

    window.apiClient.log(
      '[API:PROFILE] avatar deleted on backend'
    )

    return user
  }

  const getAvatarUrl = (cacheKey = '') => {
    const suffix = cacheKey
      ? `?v=${encodeURIComponent(String(cacheKey))}`
      : ''

    return (
      `${window.apiClient.API_BASE_URL}/profile/avatar${suffix}`
    )
  }

  window.profileService = Object.freeze({
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    getAvatarUrl,
  })
})()
