/*
 * Reusable content detail component.
 * Presentation only — no data fetching or page logic.
 */

const escapeContentHtml = (value = '') => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/* --------------------------------------------------
 * Article body
 * -------------------------------------------------- */

const createContentBody = (content = []) => {
  if (!Array.isArray(content) || !content.length) {
    return ''
  }

  return content
    .map(
      (paragraph) => `
        <p
          class="text-[15px] sm:text-base
                 leading-8 sm:leading-9
                 text-textColor/85
                 dark:text-textColor-dark/80"
        >
          ${escapeContentHtml(paragraph)}
        </p>
      `
    )
    .join('')
}

/* --------------------------------------------------
 * Gallery
 * -------------------------------------------------- */

const createContentGallery = (gallery = []) => {
  if (!Array.isArray(gallery) || !gallery.length) {
    return ''
  }

  const galleryItems = gallery
    .map((image, index) => {
      const src = escapeContentHtml(image.src)
      const alt = escapeContentHtml(image.alt || '')

      return `
        <button
          type="button"
          data-news-lightbox
          data-lightbox-index="${index}"
          data-lightbox-src="${src}"
          data-lightbox-alt="${alt}"
          aria-label="نمایش تصویر ${index + 1}"
          class="group relative
                 aspect-[16/10]
                 overflow-hidden
                 rounded-md
                 bg-surface dark:bg-surface-dark
                 border border-white/70 dark:border-border-dark
                 cursor-zoom-in
                 focus:outline-none
                 focus:ring-2
                 focus:ring-primary/30"
        >
          <img
            src="${src}"
            alt="${alt}"
            loading="lazy"
            decoding="async"
            class="h-full w-full
                   object-cover
                   transition-[filter] duration-300
                   group-hover:brightness-[0.9]"
          />

          <!-- Hover layer -->
          <span
            aria-hidden="true"
            class="pointer-events-none
                   absolute inset-0
                   flex items-center justify-center
                   bg-textColor/0
                   transition-colors duration-300
                   group-hover:bg-textColor/10"
          >
            <span
              class="flex size-10
                     translate-y-1
                     items-center justify-center
                     rounded-full
                     bg-white/90
                     text-textColor
                     opacity-0
                     shadow-card
                     backdrop-blur-md
                     transition-all duration-300
                     group-hover:translate-y-0
                     group-hover:opacity-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="size-4"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                ></circle>

                <path
                  stroke-linecap="round"
                  d="m20 20-4-4M11 8v6M8 11h6"
                ></path>
              </svg>
            </span>
          </span>
        </button>
      `
    })
    .join('')

  return `
    <!-- Gallery section -->
    <section
      data-aos="fade-up"
      class="mt-16 md:mt-20"
      aria-labelledby="news-gallery-title"
    >
      <div
        class="rounded-lg
               bg-surface-soft
               dark:bg-surface-dark-soft
               border border-white/60
               dark:border-border-dark-soft
               p-5 sm:p-6 lg:p-7"
      >
        <!-- Gallery heading -->
        <div
          class="mb-5
                 flex flex-col gap-2
                 sm:flex-row
                 sm:items-end
                 sm:justify-between"
        >
          <div>
            <div
              class="mb-2
                     flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                class="size-1.5 rounded-full
                       bg-primary"
              ></span>

              <span
                class="font-Dana-medium text-xs
                       text-primary
                       dark:text-primary-light"
              >
                گالری خبر
              </span>
            </div>

            <h2
              id="news-gallery-title"
              class="!text-xl sm:!text-2xl"
            >
              تصاویر بیشتر
            </h2>
          </div>

          <span
            class="hidden sm:block
                   font-Dana-regular text-xs
                   text-mutedColor
                   dark:text-mutedColor-dark"
          >
            برای بزرگ‌نمایی روی تصاویر کلیک کنید
          </span>
        </div>

        <!-- Gallery grid -->
        <div
          class="grid grid-cols-1 gap-3
                 sm:grid-cols-2
                 lg:grid-cols-3
                 lg:gap-4"
        >
          ${galleryItems}
        </div>
      </div>
    </section>
  `
}

/* --------------------------------------------------
 * Content detail
 * -------------------------------------------------- */

const createContentDetail = (item) => {
  if (!item) return ''

  const title = escapeContentHtml(item.title)
  const excerpt = escapeContentHtml(item.excerpt)
  const category = escapeContentHtml(item.category)
  const date = escapeContentHtml(item.date)
  const image = escapeContentHtml(item.image)

  return `
    <article class="pt-7 md:pt-10">
      <!-- Breadcrumb -->
      <nav
        aria-label="مسیر صفحه"
        data-aos="fade-up"
        class="mb-7"
      >
        <ol
          class="flex flex-wrap items-center gap-2
                 font-Dana-medium text-xs
                 text-mutedColor
                 dark:text-mutedColor-dark"
        >
          <li>
            <a
              href="./index.html"
              class="transition-colors
                     hover:text-primary
                     dark:hover:text-primary-light"
            >
              خانه
            </a>
          </li>

          <li aria-hidden="true">/</li>

          <li>
            <a
              href="./news.html"
              class="transition-colors
                     hover:text-primary
                     dark:hover:text-primary-light"
            >
              اخبار
            </a>
          </li>

          <li aria-hidden="true">/</li>

          <li
            aria-current="page"
            class="max-w-[220px] truncate
                   text-primary
                   dark:text-primary-light"
          >
            ${title}
          </li>
        </ol>
      </nav>

      <!-- =========================================
           Hero
      ========================================== -->
      <section
        aria-labelledby="news-title"
        class="grid grid-cols-1
               items-center gap-7
               lg:grid-cols-12
               lg:gap-10"
      >
        <!-- Information -->
        <header
          data-aos="fade-left"
          class="lg:col-span-7"
        >
          <!-- Meta -->
          <div
            class="mb-4
                   flex flex-wrap
                   items-center gap-3"
          >
            <span
              class="inline-flex items-center
                     rounded-full
                     bg-primary/10
                     dark:bg-primary/15
                     px-3.5 py-2
                     font-Dana-medium text-xs
                     text-primary
                     dark:text-primary-light"
            >
              ${category}
            </span>

            <span
              aria-hidden="true"
              class="size-1 rounded-full
                     bg-mutedColor/35
                     dark:bg-mutedColor-dark/35"
            ></span>

            <time
              class="font-Dana-regular text-xs
                     text-mutedColor
                     dark:text-mutedColor-dark"
            >
              ${date}
            </time>
          </div>

          <!-- Title -->
          <h1
            id="news-title"
            class="mb-5
                   max-w-3xl
                   !text-[clamp(26px,3vw,38px)]
                   !leading-[1.65]"
          >
            ${title}
          </h1>

          <!-- Summary -->
          <div
            class="max-w-2xl
                   border-r-2
                   border-primary/25
                   pr-4"
          >
            <span
              class="mb-1.5 block
                     font-Dana-medium text-xs
                     text-primary
                     dark:text-primary-light"
            >
              خلاصه خبر
            </span>

            <p
              class="text-sm
                     leading-8
                     text-mutedColor
                     dark:text-mutedColor-dark"
            >
              ${excerpt}
            </p>
          </div>
        </header>

        <!-- Main image -->
        <div
          data-aos="fade-right"
          data-aos-delay="80"
          class="lg:col-span-5"
        >
          <figure
            class="relative
                   aspect-[4/3]
                   overflow-hidden
                   rounded-md
                   bg-surface
                   dark:bg-surface-dark
                   border border-white/70
                   dark:border-border-dark
                   shadow-card
                   dark:shadow-card-dark"
          >
            <img
              src="${image}"
              alt="${title}"
              fetchpriority="high"
              decoding="async"
              class="h-full w-full
                     object-cover"
            />

            <div
              aria-hidden="true"
              class="pointer-events-none
                     absolute inset-0
                     bg-gradient-to-t
                     from-textColor/10
                     via-transparent
                     to-transparent"
            ></div>
          </figure>
        </div>
      </section>

      <!-- =========================================
           Article
      ========================================== -->
      <section
        data-aos="fade-up"
        class="mt-12 md:mt-16
               border-t
               border-textColor/5
               dark:border-border-dark-soft
               pt-9 md:pt-11"
        aria-labelledby="article-content-title"
      >
        <div class="">
          <!-- Section label -->
          <div
            class="mb-6
                   flex items-center gap-2"
          >
            <span
              aria-hidden="true"
              class="size-1.5
                     rounded-full
                     bg-primary"
            ></span>

            <h2
              id="article-content-title"
              class="!font-Dana-medium
                     !text-xs
                     !leading-none
                     text-primary
                     dark:text-primary-light"
            >
              متن خبر
            </h2>
          </div>

          <!-- Article content -->
          <div class="space-y-6">
            ${createContentBody(item.content)}
          </div>
        </div>
      </section>

      ${createContentGallery(item.gallery)}
    </article>
  `
}

window.createContentDetail = createContentDetail
