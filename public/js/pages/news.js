/*
 * News pages controller.
 *
 * Handles:
 * - News listing
 * - News detail
 * - Related news
 * - Article metadata
 * - News gallery lightbox
 * - Page-level initialization
 */

/* --------------------------------------------------
 * Shared
 * -------------------------------------------------- */

const refreshAOS = () => {
  if (window.AOS) {
    AOS.refreshHard()
  }
}

const initNewsAOS = () => {
  if (!window.AOS) return

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  AOS.init({
    disable: () => window.innerWidth < 1024 || prefersReducedMotion,
    once: false,
    mirror: false,
    offset: 70,
    duration: 700,
    easing: 'ease-out-cubic',
  })
}

const updateFooterYear = () => {
  const yearElement = document.getElementById('year')

  if (!yearElement) return

  yearElement.textContent = new Date().getFullYear()
}

/* --------------------------------------------------
 * Listing page
 * -------------------------------------------------- */

const initNewsListing = async () => {
  const newsGrid = document.getElementById('news-grid')

  if (!newsGrid) return

  try {
    const news = await window.newsService.getNews()

    if (!news.length) {
      newsGrid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <p
            class="text-mutedColor
                   dark:text-mutedColor-dark"
          >
            در حال حاضر خبری برای نمایش وجود ندارد.
          </p>
        </div>
      `

      return
    }

    newsGrid.innerHTML = news
      .map((item, index) =>
        window.createContentCard(item, {
          detailPage: './newsdetail.html',
          aosDelay: (index % 3) * 80,
        })
      )
      .join('')

    refreshAOS()
  } catch (error) {
    console.error('Failed to load news:', error)

    newsGrid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <p
          class="text-mutedColor
                 dark:text-mutedColor-dark"
        >
          دریافت اخبار با مشکل مواجه شد.
        </p>
      </div>
    `
  }
}

/* --------------------------------------------------
 * Detail page
 * -------------------------------------------------- */

const getNewsSlug = () => {
  const params = new URLSearchParams(window.location.search)

  return params.get('slug')?.trim() || null
}

const updateNewsMeta = (news) => {
  const pageTitle = `${news.title} | دیکته خونه`

  document.title = pageTitle

  const description = document.querySelector('meta[name="description"]')

  const ogTitle = document.querySelector('meta[property="og:title"]')

  const ogDescription = document.querySelector(
    'meta[property="og:description"]'
  )

  const ogImage = document.querySelector('meta[property="og:image"]')

  if (description) {
    description.setAttribute('content', news.excerpt || news.title)
  }

  if (ogTitle) {
    ogTitle.setAttribute('content', pageTitle)
  }

  if (ogDescription) {
    ogDescription.setAttribute('content', news.excerpt || news.title)
  }

  if (ogImage && news.image) {
    ogImage.setAttribute('content', news.image)
  }
}

const renderNewsNotFound = () => {
  const container = document.getElementById('news-detail')

  if (!container) return

  document.title = 'خبر پیدا نشد | دیکته خونه'

  container.innerHTML = `
    <div class="py-20 md:py-28">
      <div
        class="mx-auto max-w-xl text-center
               rounded-lg
               bg-surface dark:bg-surface-dark
               border border-white/70 dark:border-border-dark
               p-8 sm:p-10
               shadow-card"
      >
        <span
          class="mx-auto mb-5
                 flex size-14
                 items-center justify-center
                 rounded-full
                 bg-primary/10 dark:bg-primary/15
                 text-primary dark:text-primary-light"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            class="size-6"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            ></circle>

            <path
              stroke-linecap="round"
              d="M12 8v5"
            ></path>

            <path
              stroke-linecap="round"
              d="M12 17h.01"
            ></path>
          </svg>
        </span>

        <h1 class="mb-4">
          خبر موردنظر پیدا نشد
        </h1>

        <p
          class="mb-7
                 text-mutedColor
                 dark:text-mutedColor-dark"
        >
          ممکنه لینک این خبر تغییر کرده باشه
          یا مطلب دیگه در دسترس نباشه.
        </p>

        <a
          href="./news.html"
          class="inline-flex items-center justify-center
                 bg-primary text-white
                 font-Peyda-medium text-sm
                 rounded-full px-7 py-3
                 border border-primary
                 transition-all duration-300 ease-in-out
                 hover:bg-transparent
                 hover:text-primary
                 hover:border-primary
                 hover:-translate-y-1
                 hover:shadow-lg
                 active:scale-95
                 focus:outline-none
                 focus:ring-2
                 focus:ring-primary/30"
        >
          بازگشت به اخبار
        </a>
      </div>
    </div>
  `

  document.getElementById('related-news-section')?.classList.add('hidden')
}

const renderNewsLoadError = () => {
  const container = document.getElementById('news-detail')

  if (!container) return

  container.innerHTML = `
    <div class="py-20 md:py-28">
      <div
        class="mx-auto max-w-xl text-center"
      >
        <h1 class="mb-4">
          دریافت خبر با مشکل مواجه شد
        </h1>

        <p
          class="mb-7
                 text-mutedColor
                 dark:text-mutedColor-dark"
        >
          لطفاً دوباره تلاش کنید.
        </p>

        <button
          type="button"
          data-news-retry
          class="inline-flex items-center justify-center
                 bg-primary text-white
                 font-Peyda-medium text-sm
                 rounded-full px-7 py-3
                 border border-primary
                 transition-all duration-300 ease-in-out
                 hover:bg-transparent
                 hover:text-primary
                 hover:border-primary
                 hover:-translate-y-1
                 hover:shadow-lg
                 active:scale-95"
        >
          تلاش دوباره
        </button>
      </div>
    </div>
  `
}

const renderRelatedNews = async (currentNews) => {
  const relatedNewsGrid = document.getElementById('related-news-grid')

  const relatedSection = document.getElementById('related-news-section')

  if (!relatedNewsGrid) return

  const relatedNews = await window.newsService.getRelatedNews(currentNews, 3)

  if (!relatedNews.length) {
    relatedSection?.classList.add('hidden')
    return
  }

  relatedNewsGrid.innerHTML = relatedNews
    .map((item, index) =>
      window.createContentCard(item, {
        detailPage: './newsdetail.html',
        aosDelay: index * 80,
      })
    )
    .join('')
}

const initNewsDetail = async () => {
  const container = document.getElementById('news-detail')

  if (!container) return

  const slug = getNewsSlug()

  if (!slug) {
    renderNewsNotFound()
    return
  }

  try {
    const news = await window.newsService.getNewsBySlug(slug)

    if (!news) {
      renderNewsNotFound()
      return
    }

    updateNewsMeta(news)

    container.innerHTML = window.createContentDetail(news)

    await renderRelatedNews(news)

    refreshAOS()
  } catch (error) {
    console.error('Failed to load news detail:', error)

    renderNewsLoadError()
  }
}

/* --------------------------------------------------
 * Gallery lightbox
 * -------------------------------------------------- */

const initNewsLightbox = () => {
  const lightbox = document.getElementById('news-lightbox')

  if (!lightbox) return

  const image = document.getElementById('news-lightbox-image')

  const caption = document.getElementById('news-lightbox-caption')

  const closeButton = lightbox.querySelector('[data-lightbox-close]')

  const nextButton = lightbox.querySelector('[data-lightbox-next]')

  const previousButton = lightbox.querySelector('[data-lightbox-previous]')

  let currentIndex = 0

  const getGalleryItems = () => {
    return Array.from(document.querySelectorAll('[data-news-lightbox]'))
  }

  const showImage = (index) => {
    const items = getGalleryItems()

    if (!items.length) return

    currentIndex = (index + items.length) % items.length

    const item = items[currentIndex]

    image.src = item.dataset.lightboxSrc || ''

    image.alt = item.dataset.lightboxAlt || ''

    if (caption) {
      caption.textContent = item.dataset.lightboxAlt || ''
    }
  }

  const openLightbox = (index) => {
    showImage(index)

    lightbox.classList.remove('hidden')
    lightbox.classList.add('flex')

    lightbox.setAttribute('aria-hidden', 'false')

    document.body.classList.add('overflow-hidden')

    closeButton?.focus()
  }

  const closeLightbox = () => {
    lightbox.classList.add('hidden')
    lightbox.classList.remove('flex')

    lightbox.setAttribute('aria-hidden', 'true')

    document.body.classList.remove('overflow-hidden')
  }

  const nextImage = () => {
    showImage(currentIndex + 1)
  }

  const previousImage = () => {
    showImage(currentIndex - 1)
  }

  document.addEventListener('click', (event) => {
    const galleryItem = event.target.closest('[data-news-lightbox]')

    if (galleryItem) {
      const index = Number(galleryItem.dataset.lightboxIndex)

      openLightbox(index)
      return
    }

    if (event.target.closest('[data-news-retry]')) {
      window.location.reload()
    }
  })

  closeButton?.addEventListener('click', closeLightbox)

  nextButton?.addEventListener('click', nextImage)

  previousButton?.addEventListener('click', previousImage)

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (lightbox.classList.contains('hidden')) {
      return
    }

    if (event.key === 'Escape') {
      closeLightbox()
    }

    if (event.key === 'ArrowLeft') {
      nextImage()
    }

    if (event.key === 'ArrowRight') {
      previousImage()
    }
  })
}

/* --------------------------------------------------
 * Initialize
 * -------------------------------------------------- */

const initNewsPages = async () => {
  updateFooterYear()
  initNewsAOS()
  initNewsLightbox()

  await Promise.all([initNewsListing(), initNewsDetail()])
}

initNewsPages()
