/*
 * Public Iran map / partner schools API service.
 *
 * SVG geometry stays local in iran-map-data.js.
 * School/province business data comes from the backend.
 */

;(() => {
  let provinceCache = null
  const schoolsCache = new Map()

  const getProvinces = async () => {
    if (provinceCache) {
      return provinceCache
    }

    const provinces = await window.apiClient.get(
      '/iran-map/provinces',
      {
        auth: false,
      }
    )

    provinceCache = Array.isArray(provinces)
      ? provinces
      : []

    window.apiClient.log(
      `[API:MAP] provinces loaded from backend: ${provinceCache.length}`
    )

    return provinceCache
  }

  const getSchoolsByProvince = async (
    provinceCode
  ) => {
    const code = String(
      provinceCode || ''
    ).trim()

    if (!code) {
      return {
        province: null,
        schools: [],
      }
    }

    if (schoolsCache.has(code)) {
      return schoolsCache.get(code)
    }

    const result = await window.apiClient.get(
      `/iran-map/provinces/${encodeURIComponent(code)}/schools`,
      {
        auth: false,
      }
    )

    const normalized = {
      province:
        result?.province || null,

      schools:
        Array.isArray(result?.schools)
          ? result.schools
          : [],
    }

    schoolsCache.set(code, normalized)

    window.apiClient.log(
      `[API:MAP] schools loaded from backend for ${code}: ${normalized.schools.length}`
    )

    return normalized
  }

  window.partnerSchoolService = Object.freeze({
    getProvinces,
    getSchoolsByProvince,
  })
})()
