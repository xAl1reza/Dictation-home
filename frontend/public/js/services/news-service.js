/*
 * News data service.
 *
 * All pages access news data through this service.
 * The current source is a local JSON file and can later
 * be replaced with an API without changing page components.
 */

const NEWS_DATA_URL = './data/news-data.json'

let newsCache = null

/**
 * Loads all news items.
 * Data is cached after the first request.
 */
const fetchNewsData = async () => {
  if (newsCache) {
    return newsCache
  }

  const response = await fetch(NEWS_DATA_URL)

  if (!response.ok) {
    throw new Error(`Failed to load news data: ${response.status}`)
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Invalid news data format.')
  }

  newsCache = data

  return newsCache
}

/**
 * Returns all news items.
 */
const getNews = async () => {
  return fetchNewsData()
}

/**
 * Returns one news item by slug.
 */
const getNewsBySlug = async (slug) => {
  if (!slug) return null

  const news = await fetchNewsData()

  return news.find((item) => item.slug === slug) || null
}

/**
 * Returns one news item by numeric ID.
 */
const getNewsById = async (id) => {
  if (!id) return null

  const news = await fetchNewsData()

  return news.find((item) => item.id === Number(id)) || null
}

/**
 * Returns related news items.
 *
 * Priority:
 * 1. Same category
 * 2. Other latest items
 *
 * Current article is always excluded.
 */
const getRelatedNews = async (currentNews, limit = 3) => {
  if (!currentNews) return []

  const news = await fetchNewsData()

  const availableNews = news.filter((item) => item.slug !== currentNews.slug)

  const sameCategory = availableNews.filter(
    (item) => item.category === currentNews.category
  )

  const otherCategories = availableNews.filter(
    (item) => item.category !== currentNews.category
  )

  return [...sameCategory, ...otherCategories].slice(0, limit)
}

window.newsService = {
  getNews,
  getNewsBySlug,
  getNewsById,
  getRelatedNews,
}
