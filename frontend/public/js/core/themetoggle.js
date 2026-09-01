const html = document.documentElement

const sun = document.getElementById('sunIcon')
const moon = document.getElementById('moonIcon')

const sunMobile = document.getElementById('sunIcon--mobile')
const moonMobile = document.getElementById('moonIcon--mobile')

// همه آیکن‌ها
const allSunIcons = [sun, sunMobile].filter(Boolean)
const allMoonIcons = [moon, moonMobile].filter(Boolean)

// بارگذاری حالت ذخیره‌شده
const theme = localStorage.getItem('theme')

function setDark() {
  html.classList.add('dark')
  localStorage.setItem('theme', 'dark')

  allSunIcons.forEach((el) => {
    el.classList.remove('hidden')
  })
  allMoonIcons.forEach((el) => {
    el.classList.add('hidden')
  })
}

function setLight() {
  html.classList.remove('dark')
  localStorage.setItem('theme', 'light')

  allSunIcons.forEach((el) => {
    el.classList.add('hidden')
  })
  allMoonIcons.forEach((el) => {
    el.classList.remove('hidden')
  })
}

// init state
if (theme === 'dark') {
  setDark()
} else {
  setLight()
}

// desktop
moon?.addEventListener('click', setDark)
sun?.addEventListener('click', setLight)

// mobile
moonMobile?.addEventListener('click', setDark)
sunMobile?.addEventListener('click', setLight)
