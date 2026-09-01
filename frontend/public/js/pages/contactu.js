const yearElement = document.getElementById('year')

if (yearElement) {
  yearElement.textContent = new Date().getFullYear()
}

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

if (window.AOS) {
  AOS.init({
    disable: () => window.innerWidth < 1024 || prefersReducedMotion,
    once: false,
    mirror: false,
    offset: 70,
    duration: 700,
    easing: 'ease-out-cubic',
  })
} else {
  document.querySelectorAll('[data-aos]').forEach((element) => {
    element.style.opacity = '1'
    element.style.transform = 'none'
    element.style.transition = 'none'
  })
}

const subjectDropdown = document.getElementById('contact-subject-dropdown')
const subjectTrigger = document.getElementById('contact-subject-trigger')
const subjectMenu = document.getElementById('contact-subject-menu')
const subjectValue = document.getElementById('contact-subject-value')
const subjectInput = document.getElementById('contact-subject')
const subjectChevron = document.getElementById('contact-subject-chevron')
const subjectOptions = Array.from(
  document.querySelectorAll('.contact-subject-option')
)

let subjectActiveIndex = -1

const openSubjectDropdown = () => {
  subjectMenu.classList.remove('hidden')
  subjectTrigger.setAttribute('aria-expanded', 'true')
  subjectChevron.classList.add('rotate-180')

  const selectedIndex = subjectOptions.findIndex(
    (option) => option.getAttribute('aria-selected') === 'true'
  )

  subjectActiveIndex = selectedIndex >= 0 ? selectedIndex : 0
  subjectOptions[subjectActiveIndex]?.focus()
}

const closeSubjectDropdown = (returnFocus = false) => {
  subjectMenu.classList.add('hidden')
  subjectTrigger.setAttribute('aria-expanded', 'false')
  subjectChevron.classList.remove('rotate-180')
  subjectActiveIndex = -1

  if (returnFocus) {
    subjectTrigger.focus()
  }
}

const selectSubject = (option) => {
  const value = option.dataset.value
  const label = option.querySelector('span')?.textContent.trim() || ''

  subjectInput.value = value
  subjectValue.textContent = label
  subjectValue.classList.remove(
    'text-mutedColor/60',
    'dark:text-mutedColor-dark/50'
  )
  subjectValue.classList.add('text-textColor', 'dark:text-textColor-dark')

  subjectOptions.forEach((item) => {
    const selected = item === option

    item.setAttribute('aria-selected', String(selected))
    item.classList.toggle('bg-primary/10', selected)
    item.classList.toggle('text-primary', selected)
    item.classList.toggle('dark:bg-primary/15', selected)
    item.classList.toggle('dark:text-primary-light', selected)

    item
      .querySelector('.contact-subject-check')
      ?.classList.toggle('hidden', !selected)
  })

  closeSubjectDropdown(true)
}

subjectTrigger?.addEventListener('click', () => {
  const isOpen = subjectTrigger.getAttribute('aria-expanded') === 'true'

  if (isOpen) {
    closeSubjectDropdown()
  } else {
    openSubjectDropdown()
  }
})

subjectOptions.forEach((option, index) => {
  option.addEventListener('click', () => selectSubject(option))

  option.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      subjectActiveIndex = (index + 1) % subjectOptions.length
      subjectOptions[subjectActiveIndex].focus()
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      subjectActiveIndex =
        (index - 1 + subjectOptions.length) % subjectOptions.length
      subjectOptions[subjectActiveIndex].focus()
    }

    if (event.key === 'Home') {
      event.preventDefault()
      subjectActiveIndex = 0
      subjectOptions[subjectActiveIndex].focus()
    }

    if (event.key === 'End') {
      event.preventDefault()
      subjectActiveIndex = subjectOptions.length - 1
      subjectOptions[subjectActiveIndex].focus()
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectSubject(option)
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeSubjectDropdown(true)
    }
  })
})

subjectTrigger?.addEventListener('keydown', (event) => {
  if (
    event.key === 'ArrowDown' ||
    event.key === 'ArrowUp' ||
    event.key === 'Enter' ||
    event.key === ' '
  ) {
    event.preventDefault()
    openSubjectDropdown()
  }
})

document.addEventListener('click', (event) => {
  if (
    subjectDropdown &&
    !subjectDropdown.contains(event.target) &&
    subjectTrigger?.getAttribute('aria-expanded') === 'true'
  ) {
    closeSubjectDropdown()
  }
})
