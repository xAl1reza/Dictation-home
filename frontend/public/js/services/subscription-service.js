/* Read-only entitlement API. Never infer permission from the device clock. */
;(() => {
  const features = ['dictation', 'science', 'math', 'content_manage']
  const getStatus = async () => {
    const status = await window.apiClient.get('/subscription')
    if (!status || !['trial', 'paid', 'free'].includes(status.tier) ||
        !features.every((key) => typeof status.permissions?.[key] === 'boolean') ||
        !Number.isFinite(status.remainingSeconds) || status.remainingSeconds < 0 ||
        !Number.isInteger(status.remainingDays) || status.remainingDays < 0 ||
        !Number.isFinite(status.remainingPercent) ||
        typeof status.purchaseRequired !== 'boolean') {
      throw new Error('API_INVALID_RESPONSE')
    }
    return status
  }
  window.subscriptionService = Object.freeze({ getStatus })
})()
