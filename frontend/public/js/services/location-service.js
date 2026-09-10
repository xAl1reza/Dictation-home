/* Location API service */

;(() => {
  const getProvinces = async () => {
    const data = await window.apiClient.get('/locations/provinces', {
      auth: false,
    })

    return Array.isArray(data) ? data : []
  }

  const getCities = async (provinceCode) => {
    const cleanProvinceCode = String(provinceCode || '').trim().toUpperCase()

    if (!/^IR-\d{2}$/.test(cleanProvinceCode)) {
      return []
    }

    const data = await window.apiClient.get(
      `/locations/provinces/${encodeURIComponent(cleanProvinceCode)}/cities`,
      {
        auth: false,
      }
    )

    return Array.isArray(data) ? data : []
  }

  window.locationService = {
    getProvinces,
    getCities,
  }
})()
