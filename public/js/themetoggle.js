const html = document.documentElement
const sun = document.getElementById('sunIcon')
const moon = document.getElementById('moonIcon')

moon.addEventListener('click', () => {
  html.classList.add('dark')
  sun.classList.remove('hidden')
  moon.classList.add('hidden')
})

sun.addEventListener('click', () => {
  html.classList.remove('dark')
  sun.classList.add('hidden')
  moon.classList.remove('hidden')
})
