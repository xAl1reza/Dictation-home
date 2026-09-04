;(() => {
  'use strict'

  const escapeText = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        }

        return entities[char]
      }
    )

  const initializeIranSchoolsMap = async () => {
    const provinces = Array.isArray(
      window.IranMapData
    )
      ? window.IranMapData
      : []

    const mapHolder = document.getElementById(
      'iranMapHolder'
    )

    const schoolsPanel = document.getElementById(
      'iranSchoolsPanel'
    )

    if (
      !mapHolder ||
      !schoolsPanel ||
      !provinces.length ||
      !window.partnerSchoolService
    ) {
      console.warn(
        '[Iran Map] Required map elements/data/service not found.'
      )
      return
    }

    const provinceById = new Map(
      provinces.map(
        (province) => [
          province.id,
          province,
        ]
      )
    )

    let selectedProvinceId =
      provinceById.has('IR-07')
        ? 'IR-07'
        : provinces[0]?.id

    let provinceSummaryById = new Map()
    const schoolCacheByProvince = new Map()
    let selectionRequestId = 0

    const getSummary = (provinceId) => {
      return (
        provinceSummaryById.get(
          provinceId
        ) || null
      )
    }

    const getSchools = (provinceId) => {
      return (
        schoolCacheByProvince.get(
          provinceId
        ) || []
      )
    }

    const provinceHasSchools = (
      provinceId
    ) => {
      return Number(
        getSummary(provinceId)
          ?.schoolCount || 0
      ) > 0
    }

    const getProvincePathClass = (
      provinceId
    ) => {
      const isSelected =
        selectedProvinceId ===
        provinceId

      const hasSchools =
        provinceHasSchools(
          provinceId
        )

      const classes = [
        'cursor-pointer',
        'outline-none',
        'stroke-white/90',
        'dark:stroke-border-dark-strong',
        'transition-colors',
        'duration-200',
        'hover:fill-primary/40',
        'focus:fill-primary/40',
      ]

      if (isSelected) {
        classes.push(
          'fill-primary'
        )
      } else if (hasSchools) {
        classes.push(
          'fill-primary/25',
          'dark:fill-primary/30'
        )
      } else {
        classes.push(
          'fill-bg-secondary',
          'dark:fill-surface-dark-strong'
        )
      }

      return classes.join(' ')
    }

    const getProvinceLabelClass = (
      provinceId
    ) => {
      if (
        selectedProvinceId ===
        provinceId
      ) {
        return [
          'pointer-events-none',
          'select-none',
          'font-Dana-medium',
          'fill-white',
        ].join(' ')
      }

      return [
        'pointer-events-none',
        'select-none',
        'font-Dana-medium',
        'fill-textColor',
        'dark:fill-textColor-dark',
      ].join(' ')
    }

    const getProvinceAriaLabel = (
      province
    ) => {
      const schoolCount = Number(
        getSummary(province.id)
          ?.schoolCount || 0
      )

      if (!schoolCount) {
        return (
          `استان ${province.name}، ` +
          'بدون مدرسه ثبت‌شده'
        )
      }

      return (
        `استان ${province.name}، ` +
        `${schoolCount.toLocaleString('fa-IR')} مدرسه`
      )
    }

    const renderMap = () => {
      const paths = provinces
        .map(
          (province) => `
            <path
              d="${province.d}"
              data-province-id="${province.id}"
              class="${getProvincePathClass(province.id)}"
              stroke-width="1"
              stroke-linejoin="round"
              tabindex="0"
              role="button"
              aria-pressed="${selectedProvinceId === province.id}"
              aria-label="${escapeText(getProvinceAriaLabel(province))}"
            ></path>
          `
        )
        .join('')

      const labels = provinces
        .map(
          (province) => `
            <text
              x="${province.cx}"
              y="${province.cy + 3}"
              text-anchor="middle"
              font-size="9"
              class="${getProvinceLabelClass(province.id)}"
            >
              ${escapeText(province.short || province.name)}
            </text>
          `
        )
        .join('')

      mapHolder.innerHTML = `
        <svg
          viewBox="0 0 654.51147 593.71021"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="نقشه استان‌های ایران"
          class="w-full max-w-[560px] h-auto"
        >
          ${paths}
          ${labels}
        </svg>
      `
    }

    const renderLoadingPanel = () => {
      const province = provinceById.get(
        selectedProvinceId
      )

      schoolsPanel.innerHTML = `
        <div class="flex min-h-72 flex-col items-center justify-center text-center">
          <span class="ui-eyebrow mb-3">
            استان انتخاب‌شده
          </span>
          <h4>${escapeText(province?.name || '')}</h4>
          <p class="mt-3 text-mutedColor dark:text-mutedColor-dark">
            در حال دریافت مدارس...
          </p>
        </div>
      `
    }

    const renderLoadError = () => {
      const province = provinceById.get(
        selectedProvinceId
      )

      schoolsPanel.innerHTML = `
        <div class="flex min-h-72 flex-col items-center justify-center text-center">
          <h4>${escapeText(province?.name || '')}</h4>
          <p class="mt-3 text-mutedColor dark:text-mutedColor-dark">
            دریافت اطلاعات مدارس با مشکل مواجه شد.
          </p>
          <button
            type="button"
            class="btn-secondary mt-5"
            data-map-retry
          >
            تلاش دوباره
          </button>
        </div>
      `
    }

    const renderSchoolCard = (school) => {
      return `
        <div
          class="flex items-center justify-between gap-4 py-4 px-3 -mx-3 rounded-sm border-b border-textColor/10 dark:border-white/10 transition-colors duration-200 hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          <div class="min-w-0">
            <p class="font-Dana-medium mb-1">
              ${escapeText(school.name)}
            </p>
            ${
              school.city
                ? `<small>${escapeText(school.city)}</small>`
                : ''
            }
          </div>
          ${
            Number(school.students || 0) > 0
              ? `
                <small class="shrink-0 rounded-full bg-primary/5 dark:bg-primary/10 px-3 py-1.5 text-primary dark:text-primary-light">
                  ${Number(school.students).toLocaleString('fa-IR')}
                  دانش‌آموز
                </small>
              `
              : ''
          }
        </div>
      `
    }

    const renderProvincePanel = () => {
      const province = provinceById.get(
        selectedProvinceId
      )

      if (!province) return

      const summary = getSummary(
        selectedProvinceId
      )

      const schools = getSchools(
        selectedProvinceId
      )

      const schoolCount = Number(
        summary?.schoolCount ??
          schools.length
      )

      schoolsPanel.innerHTML = `
        <div class="flex h-full flex-col">
          <div class="flex items-start justify-between gap-4 pb-5 border-b border-textColor/10 dark:border-white/10">
            <div>
              <span class="inline-flex mb-2 text-primary dark:text-primary-light font-Dana-medium">
                استان انتخاب‌شده
              </span>
              <h4>${escapeText(province.name)}</h4>
            </div>
            <span class="shrink-0 rounded-full bg-primary/10 dark:bg-primary/15 px-3 py-2 text-primary dark:text-primary-light">
              ${schoolCount.toLocaleString('fa-IR')} مدرسه
            </span>
          </div>

          ${
            schools.length
              ? `
                <div class="pt-5 pb-2">
                  <p class="font-Dana-medium">
                    مدارس همراه دیکته‌خونه
                  </p>
                  <small>
                    مدارس فعال در استان ${escapeText(province.name)}
                  </small>
                </div>
                <div class="mt-2">
                  ${schools.map(renderSchoolCard).join('')}
                </div>
              `
              : `
                <div class="flex flex-1 flex-col items-center justify-center text-center py-12">
                  <span class="size-10 flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-light mb-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="size-5" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5" />
                    </svg>
                  </span>
                  <p class="font-Dana-medium mb-1">
                    هنوز مدرسه‌ای ثبت نشده
                  </p>
                  <small class="max-w-xs">
                    در حال حاضر مدرسه‌ای از استان
                    ${escapeText(province.name)}
                    در دیکته‌خونه ثبت نشده.
                  </small>
                </div>
              `
          }
        </div>
      `
    }

    const selectProvince = async (
      provinceId,
      forceReload = false
    ) => {
      if (!provinceById.has(provinceId)) {
        return
      }

      selectedProvinceId = provinceId
      selectionRequestId += 1
      const requestId = selectionRequestId

      renderMap()

      if (
        !forceReload &&
        schoolCacheByProvince.has(provinceId)
      ) {
        renderProvincePanel()
        return
      }

      renderLoadingPanel()

      try {
        const result =
          await window.partnerSchoolService
            .getSchoolsByProvince(
              provinceId
            )

        if (requestId !== selectionRequestId) {
          return
        }

        schoolCacheByProvince.set(
          provinceId,
          Array.isArray(result?.schools)
            ? result.schools
            : []
        )

        if (result?.province) {
          provinceSummaryById.set(
            provinceId,
            result.province
          )
        }

        renderMap()
        renderProvincePanel()
      } catch (error) {
        if (requestId !== selectionRequestId) {
          return
        }

        console.error(
          'Failed to load province schools:',
          error
        )

        renderLoadError()
      }
    }

    renderMap()
    renderLoadingPanel()

    try {
      const summaries =
        await window.partnerSchoolService
          .getProvinces()

      provinceSummaryById = new Map(
        summaries.map(
          (item) => [
            item.provinceCode,
            item,
          ]
        )
      )

      renderMap()
    } catch (error) {
      console.error(
        'Failed to load province summaries:',
        error
      )
    }

    await selectProvince(
      selectedProvinceId,
      true
    )

    mapHolder.addEventListener(
      'click',
      async (event) => {
        const provincePath =
          event.target.closest(
            '[data-province-id]'
          )

        if (!provincePath) return

        await selectProvince(
          provincePath.dataset.provinceId
        )
      }
    )

    mapHolder.addEventListener(
      'keydown',
      async (event) => {
        if (
          event.key !== 'Enter' &&
          event.key !== ' '
        ) {
          return
        }

        const provincePath =
          event.target.closest(
            '[data-province-id]'
          )

        if (!provincePath) return

        event.preventDefault()

        await selectProvince(
          provincePath.dataset.provinceId
        )
      }
    )

    schoolsPanel.addEventListener(
      'click',
      async (event) => {
        if (
          !event.target.closest(
            '[data-map-retry]'
          )
        ) {
          return
        }

        await selectProvince(
          selectedProvinceId,
          true
        )
      }
    )
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      async () => {
        await initializeIranSchoolsMap()
      }
    )
  } else {
    void initializeIranSchoolsMap()
  }
})()
