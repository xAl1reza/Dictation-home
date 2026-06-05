const btn = document.getElementById('menu-btn')
const menu = document.getElementById('mobile-menu')
const iconOpen = document.getElementById('icon-open')
const iconClose = document.getElementById('icon-close')

let isOpen = false

btn.addEventListener('click', () => {
  isOpen = !isOpen

  if (isOpen) {
    menu.style.maxHeight = menu.scrollHeight + 'px'
  } else {
    menu.style.maxHeight = '0'
  }

  iconOpen.classList.toggle('hidden')
  iconClose.classList.toggle('hidden')
})
