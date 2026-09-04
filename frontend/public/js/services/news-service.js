/*
 * News service backed by the public backend API.
 *
 * Local JSON news data is no longer used.
 * All API requests use async/await.
 */

;(() => {
  let newsCache = null
  const detailCache = new Map()
  const relatedCache = new Map()

  const toPersianDigits = (value) => {
    return String(value || '').replace(
      /\d/g,
      (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]
    )
  }

  const formatPublishedDate = (item = {}) => {
    const directDate = String(
      item.date || ''
    ).trim()

    if (directDate) {
      return toPersianDigits(directDate)
    }

    const publishedAt = String(
      item.publishedAt ??
      item.published_at ??
      ''
    ).trim()

    if (!publishedAt) {
      return ''
    }

    /*
     * MySQL DATETIME may arrive as:
     * 2026-08-11 08:30:00
     *
     * Normalize it for browser Date parsing.
     */
    const normalizedDateTime =
      /^\d{4}-\d{2}-\d{2}\s/.test(publishedAt)
        ? publishedAt.replace(' ', 'T')
        : publishedAt

    const parsedDate =
      new Date(normalizedDateTime)

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return ''
    }

    try {
      const parts =
        new Intl.DateTimeFormat(
          'fa-IR-u-ca-persian',
          {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }
        ).formatToParts(parsedDate)

      const values =
        Object.fromEntries(
          parts.map(
            (part) => [
              part.type,
              part.value,
            ]
          )
        )

      if (
        values.year &&
        values.month &&
        values.day
      ) {
        return (
          `${values.year}/` +
          `${values.month}/` +
          `${values.day}`
        )
      }
    } catch (error) {
      // Fall through to a simple Persian-localized date.
    }

    return parsedDate.toLocaleDateString(
      'fa-IR'
    )
  }

  const normalizeNewsItem = (item) => {
    if (
      !item ||
      typeof item !== 'object'
    ) {
      return item
    }

    return {
      ...item,

      imageAlt:
        item.imageAlt ??
        item.image_alt ??
        '',

      categorySlug:
        item.categorySlug ??
        item.category_slug ??
        '',

      publishedAt:
        item.publishedAt ??
        item.published_at ??
        null,

      /*
       * Content cards and news detail components expect item.date.
       * If backend only returns publishedAt, derive the Persian date here.
       */
      date:
        formatPublishedDate(item),
    }
  }

  const normalizeNewsList = (items) => {
    return Array.isArray(items)
      ? items.map(normalizeNewsItem)
      : []
  }

  const getNews = async (filters = null) => {
    const hasFilters =
      filters &&
      typeof filters === 'object' &&
      Object.values(filters).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== ''
      )

    if (!hasFilters && newsCache) {
      return newsCache
    }

    const news =
      await window.apiClient.get(
        '/news',
        {
          auth: false,
          query:
            hasFilters
              ? filters
              : null,
        }
      )

    const normalized =
      normalizeNewsList(news)

    if (!hasFilters) {
      newsCache = normalized
    }

    window.apiClient.log(
      `[API:NEWS] loaded from backend: ${normalized.length}`
    )

    return normalized
  }

  const getNewsBySlug = async (slug) => {
    const normalizedSlug =
      String(
        slug || ''
      ).trim()

    if (!normalizedSlug) {
      return null
    }

    if (
      detailCache.has(
        normalizedSlug
      )
    ) {
      return detailCache.get(
        normalizedSlug
      )
    }

    try {
      const item =
        await window.apiClient.get(
          `/news/${encodeURIComponent(normalizedSlug)}`,
          {
            auth: false,
          }
        )

      const normalizedItem =
        item
          ? normalizeNewsItem(item)
          : null

      detailCache.set(
        normalizedSlug,
        normalizedItem
      )

      window.apiClient.log(
        '[API:NEWS] detail loaded from backend'
      )

      return normalizedItem
    } catch (error) {
      if (
        Number(
          error?.status || 0
        ) === 404
      ) {
        return null
      }

      throw error
    }
  }

  const getNewsById = async (id) => {
    const numericId =
      Number(id)

    if (
      !Number.isFinite(
        numericId
      )
    ) {
      return null
    }

    const news =
      await getNews()

    return (
      news.find(
        (item) =>
          Number(
            item?.id
          ) === numericId
      ) || null
    )
  }

  const getRelatedNews = async (
    currentNews,
    limit = 3
  ) => {
    const slug =
      String(
        currentNews?.slug || ''
      ).trim()

    if (!slug) {
      return []
    }

    const safeLimit =
      Math.max(
        1,
        Math.min(
          12,
          Number(limit) || 3
        )
      )

    const cacheKey =
      `${slug}:${safeLimit}`

    if (
      relatedCache.has(
        cacheKey
      )
    ) {
      return relatedCache.get(
        cacheKey
      )
    }

    const related =
      await window.apiClient.get(
        `/news/${encodeURIComponent(slug)}/related`,
        {
          auth: false,
          query: {
            limit:
              safeLimit,
          },
        }
      )

    const normalized =
      normalizeNewsList(
        related
      )

    relatedCache.set(
      cacheKey,
      normalized
    )

    window.apiClient.log(
      `[API:NEWS] related loaded from backend: ${normalized.length}`
    )

    return normalized
  }

  window.newsService =
    Object.freeze({
      getNews,
      getNewsBySlug,
      getNewsById,
      getRelatedNews,
    })
})()
