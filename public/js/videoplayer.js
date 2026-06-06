document.querySelectorAll('.video-card').forEach((card) => {
  const video = card.querySelector('.video-player')
  const button = card.querySelector('.play-btn')

  button.addEventListener('click', () => {
    // توقف همه ویدیوهای دیگر
    document.querySelectorAll('.video-player').forEach((v) => {
      if (v !== video) {
        v.pause()
        v.controls = false

        const parent = v.closest('.video-card')

        parent.classList.remove('video-playing')
        parent.classList.remove('video-paused')
      }
    })

    video.play()
  })

  video.addEventListener('play', () => {
    card.classList.remove('video-paused')
    card.classList.add('video-playing')

    video.controls = true
  })

  video.addEventListener('pause', () => {
    card.classList.remove('video-playing')
    card.classList.add('video-paused')

    // کنترل‌ها حذف شوند
    video.controls = false
  })

  video.addEventListener('ended', () => {
    card.classList.remove('video-playing')
    card.classList.add('video-paused')

    video.controls = false
    video.currentTime = 0
  })
})
