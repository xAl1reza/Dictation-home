document.getElementById('year').textContent = new Date().getFullYear()

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const formatAboutCounter = (value, finalValue, suffix = '') => {
  if (finalValue) return finalValue
  return `${Math.round(value).toLocaleString('fa-IR')}${suffix}`
}

const animateAboutCounter = (element) => {
  const target = Number(element.dataset.target || 0)
  const suffix = element.dataset.suffix || ''
  const finalValue = element.dataset.final || ''
  const duration = 1400

  if (prefersReducedMotion) {
    element.textContent = formatAboutCounter(target, finalValue, suffix)
    return
  }

  const startTime = performance.now()

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const currentValue = target * eased

    element.textContent =
      progress === 1
        ? formatAboutCounter(target, finalValue, suffix)
        : formatAboutCounter(currentValue, '', suffix)

    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

const aboutCounters = document.querySelectorAll('[data-about-counter]')

if (!('IntersectionObserver' in window) || prefersReducedMotion) {
  aboutCounters.forEach(animateAboutCounter)
} else {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        animateAboutCounter(entry.target)
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.5 }
  )

  aboutCounters.forEach((counter) => counterObserver.observe(counter))
}

/*
 * AOS is intentionally disabled below lg.
 * Mobile layout stability is more important than entrance animation,
 * and the CSS guard in <head> prevents pre-init AOS transforms too.
 */
AOS.init({
  disable: () => window.innerWidth < 1024 || prefersReducedMotion,
  once: true,
  offset: 70,
  duration: 700,
  easing: 'ease-out-cubic',
})
