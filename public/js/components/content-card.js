/*
 * Reusable content card component.
 * Used for news and other content-based lists.
 */

const createContentCard = (
  item,
  { detailPage = './newsdetail.html', aosDelay = 0 } = {}
) => {
  const detailUrl = `${detailPage}?slug=${encodeURIComponent(item.slug)}`

  return `
    <article
      data-aos="fade-up"
      data-aos-delay="${aosDelay}"
      class="group h-full overflow-hidden
             rounded-lg
             bg-surface dark:bg-surface-dark
             backdrop-blur-md
             border border-white/70 dark:border-border-dark
             shadow-card
             dark:shadow-[0_16px_48px_rgba(139,92,246,0.025)]"
    >
      <a
        href="${detailUrl}"
        class="flex h-full flex-col"
        aria-label="مشاهده خبر ${item.title}"
      >
        <!-- Image -->
        <div
          class="relative aspect-[16/10]
                 overflow-hidden
                 border-b border-textColor/5
                 dark:border-border-dark-soft"
        >
          <img
            src="${item.image}"
            alt="${item.title}"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover
                   transition-[filter] duration-500 ease-out
                   group-hover:brightness-[0.94]"
          />

          <!-- Image overlay -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0
                   bg-gradient-to-t
                   from-textColor/20
                   via-transparent
                   to-transparent"
          ></div>

          <!-- Category -->
          <span
            class="absolute top-4 right-4
                   inline-flex items-center
                   rounded-full
                   bg-white/90 dark:bg-bg-dark/80
                   backdrop-blur-md
                   border border-white/80 dark:border-border-dark
                   px-4 py-2
                   font-Dana-medium text-xs
                   text-primary dark:text-primary-light"
          >
            ${item.category}
          </span>
        </div>

        <!-- Content -->
        <div class="flex flex-1 flex-col p-5 sm:p-6">
          <!-- Date -->
          <div
            class="mb-4 flex items-center gap-2
                   text-mutedColor dark:text-mutedColor-dark"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              class="size-4 shrink-0"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="3"
              ></rect>

              <path
                stroke-linecap="round"
                d="M8 3v4M16 3v4M3 10h18"
              ></path>
            </svg>

            <time class="font-Dana-regular text-xs">
              ${item.date}
            </time>
          </div>

          <!-- Title -->
          <h2
            class="mb-3 min-h-14
                   line-clamp-2
                   text-lg leading-7
                   transition-colors duration-300
                   group-hover:text-primary
                   dark:group-hover:text-primary-light"
          >
            ${item.title}
          </h2>

          <!-- Excerpt -->
          <p
            class="mb-7 min-h-14
                   line-clamp-2
                   text-sm leading-7
                   text-mutedColor dark:text-mutedColor-dark"
          >
            ${item.excerpt}
          </p>

          <!-- CTA -->
          <div class="mt-auto">
            <span
              class="inline-flex items-center justify-center
                     bg-primary text-white
                     font-Peyda-medium text-sm
                     rounded-full px-6 py-3
                     border border-primary
                     shadow-btn
                     transition-all duration-300 ease-in-out
                     hover:bg-transparent
                     hover:text-primary
                     hover:border-primary
                     hover:-translate-y-1
                     hover:shadow-lg
                     active:scale-95"
            >
              مشاهده خبر
            </span>
          </div>
        </div>
      </a>
    </article>
  `
}

window.createContentCard = createContentCard
