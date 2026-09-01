;(() => {
  'use strict'

  /* -----------------------------------------
     Schools data
     بعداً فقط دیتای واقعی مدارس را اینجا جایگزین کن
  ----------------------------------------- */
  const schoolsByProvince = {
    'IR-07': {
      schools: [
        {
          name: 'مدرسه نمونه تهران ۱',
          city: 'تهران',
          students: 120,
        },
        {
          name: 'مدرسه نمونه تهران ۲',
          city: 'تهران',
          students: 85,
        },
        {
          name: 'مدرسه نمونه تهران ۳',
          city: 'ری',
          students: 64,
        },
      ],
    },

    'IR-04': {
      schools: [
        {
          name: 'مدرسه نمونه اصفهان ۱',
          city: 'اصفهان',
          students: 90,
        },
        {
          name: 'مدرسه نمونه اصفهان ۲',
          city: 'کاشان',
          students: 72,
        },
      ],
    },

    'IR-30': {
      schools: [
        {
          name: 'مدرسه نمونه خراسان ۱',
          city: 'مشهد',
          students: 110,
        },
        {
          name: 'مدرسه نمونه خراسان ۲',
          city: 'نیشابور',
          students: 68,
        },
      ],
    },

    'IR-14': {
      schools: [
        {
          name: 'مدرسه نمونه فارس',
          city: 'شیراز',
          students: 95,
        },
      ],
    },

    'IR-15': {
      schools: [
        {
          name: 'مدرسه نمونه کرمان',
          city: 'کرمان',
          students: 74,
        },
      ],
    },
  }

  function initializeIranSchoolsMap() {
    const provinces = Array.isArray(window.IranMapData)
      ? window.IranMapData
      : []

    const mapHolder = document.getElementById('iranMapHolder')
    const schoolsPanel = document.getElementById('iranSchoolsPanel')

    if (!mapHolder || !schoolsPanel || !provinces.length) {
      console.warn(
        '[Iran Map] Map holder, schools panel or IranMapData not found.'
      )
      return
    }

    const provinceById = new Map(
      provinces.map((province) => [province.id, province])
    )

    let selectedProvinceId = 'IR-07'

    const escapeText = (value) =>
      String(value ?? '').replace(/[&<>"']/g, (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        }

        return entities[char]
      })

    const getSchools = (provinceId) =>
      schoolsByProvince[provinceId]?.schools || []

    const provinceHasSchools = (provinceId) => getSchools(provinceId).length > 0

    function getProvincePathClass(provinceId) {
      const isSelected = selectedProvinceId === provinceId
      const hasSchools = provinceHasSchools(provinceId)

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
        classes.push('fill-primary')
      } else if (hasSchools) {
        classes.push('fill-primary/25', 'dark:fill-primary/30')
      } else {
        classes.push('fill-bg-secondary', 'dark:fill-surface-dark-strong')
      }

      return classes.join(' ')
    }

    function getProvinceLabelClass(provinceId) {
      if (selectedProvinceId === provinceId) {
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

    function getProvinceAriaLabel(province) {
      const schools = getSchools(province.id)

      if (!schools.length) {
        return `استان ${province.name}، بدون مدرسه ثبت‌شده`
      }

      return `استان ${province.name}، ${schools.length.toLocaleString(
        'fa-IR'
      )} مدرسه`
    }

    function renderMap() {
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

    function renderSchoolCard(school) {
      return `
    <div
      class="
        flex items-center justify-between gap-4
        py-4 px-3 -mx-3
        rounded-sm
        border-b
        border-textColor/10
        dark:border-white/10
        transition-colors duration-200
        hover:bg-primary/5
        dark:hover:bg-primary/10
      "
    >
      <div class="min-w-0">
        <p class="font-Dana-medium mb-1">
          ${escapeText(school.name)}
        </p>

        ${
          school.city
            ? `
              <small>
                ${escapeText(school.city)}
              </small>
            `
            : ''
        }
      </div>

      ${
        school.students
          ? `
            <small
              class="
                shrink-0
                rounded-full
                bg-primary/5
                dark:bg-primary/10
                px-3 py-1.5
                text-primary
                dark:text-primary-light
              "
            >
              ${Number(school.students).toLocaleString('fa-IR')}
              دانش‌آموز
            </small>
          `
          : ''
      }
    </div>
  `
    }

    function renderProvincePanel() {
      const province = provinceById.get(selectedProvinceId)

      if (!province) return

      const schools = getSchools(selectedProvinceId)

      schoolsPanel.innerHTML = `
    <div class="flex h-full flex-col">

      <!-- Province heading -->
      <div
        class="
          flex items-start justify-between gap-4
          pb-5
          border-b
          border-textColor/10
          dark:border-white/10
        "
      >
        <div>
          <span
            class="
              inline-flex mb-2
              text-primary
              dark:text-primary-light
              font-Dana-medium
            "
          >
            استان انتخاب‌شده
          </span>

          <h4>
            ${escapeText(province.name)}
          </h4>
        </div>

        <span
          class="
            shrink-0
            rounded-full
            bg-primary/10
            dark:bg-primary/15
            px-3 py-2
            text-primary
            dark:text-primary-light
          "
        >
          ${schools.length.toLocaleString('fa-IR')} مدرسه
        </span>
      </div>

      ${
        schools.length
          ? `
            <!-- Schools title -->
            <div class="pt-5 pb-2">
              <p class="font-Dana-medium">
                مدارس همراه دیکته‌خونه
              </p>

              <small>
                مدارس فعال در استان
                ${escapeText(province.name)}
              </small>
            </div>

            <!-- Schools -->
            <div class="mt-2">
              ${schools.map(renderSchoolCard).join('')}
            </div>
          `
          : `
            <!-- Empty state -->
            <div
              class="
                flex flex-1
                flex-col
                items-center
                justify-center
                text-center
                py-12
              "
            >
              <span
                class="
                  size-10
                  flex items-center justify-center
                  rounded-full
                  bg-primary/10
                  dark:bg-primary/15
                  text-primary
                  dark:text-primary-light
                  mb-4
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  class="size-5"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5"
                  />
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

    function selectProvince(provinceId) {
      if (!provinceById.has(provinceId)) return

      selectedProvinceId = provinceId

      renderMap()
      renderProvincePanel()
    }

    renderMap()
    renderProvincePanel()

    /* Mouse click */
    mapHolder.addEventListener('click', (event) => {
      const provincePath = event.target.closest('[data-province-id]')

      if (!provincePath) return

      selectProvince(provincePath.dataset.provinceId)
    })

    /* Keyboard accessibility */
    mapHolder.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      const provincePath = event.target.closest('[data-province-id]')

      if (!provincePath) return

      event.preventDefault()

      selectProvince(provincePath.dataset.provinceId)
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIranSchoolsMap)
  } else {
    initializeIranSchoolsMap()
  }
})()
