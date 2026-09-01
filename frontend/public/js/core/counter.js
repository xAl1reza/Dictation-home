const counters = document.querySelectorAll('.counter')

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      const counter = entry.target
      const target = +counter.dataset.target
      const suffix = counter.dataset.suffix || ''
      const format = counter.dataset.format || ''

      let current = 0
      const increment = target / 160

      const updateCounter = () => {
        current += increment

        if (current >= target) {
          current = target
        }

        let value = Math.floor(current)

        if (format === 'k') {
          counter.textContent = (value / 1000).toFixed(0) + 'K' + suffix
        } else {
          counter.textContent = value.toLocaleString('fa-IR') + suffix
        }

        if (current < target) {
          requestAnimationFrame(updateCounter)
        }
      }

      updateCounter()
      observer.unobserve(counter)
    })
  },
  {
    threshold: 0.5,
  }
)

counters.forEach((counter) => {
  observer.observe(counter)
})
