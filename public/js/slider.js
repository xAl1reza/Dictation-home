new Swiper('.testimonialSwiper', {
  slidesPerView: 1,
  spaceBetween: 16,
  loop: true,

  speed: 1200,

  autoplay: {
    delay: 2000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },

  navigation: {
    nextEl: '.testimonial-next',
    prevEl: '.testimonial-prev',
  },

  pagination: {
    el: '.testimonial-pagination',
    clickable: true,
  },

  breakpoints: {
    768: {
      slidesPerView: 2,
    },

    1024: {
      slidesPerView: 3,
    },
  },
})
