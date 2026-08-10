document.getElementById("year").textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const formatAboutCounter = (value, finalValue, suffix = "") => {
  if (finalValue) return finalValue;

  return `${Math.round(value).toLocaleString("fa-IR")}${suffix}`;
};

const resetAboutCounter = (element) => {
  element.dataset.counting = "false";
  element.textContent = "۰";
};

const animateAboutCounter = (element) => {
  if (element.dataset.counting === "true") return;

  const target = Number(element.dataset.target || 0);
  const suffix = element.dataset.suffix || "";
  const finalValue = element.dataset.final || "";
  const duration = 1400;

  if (prefersReducedMotion) {
    element.textContent = formatAboutCounter(target, finalValue, suffix);
    return;
  }

  element.dataset.counting = "true";

  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = target * eased;

    element.textContent =
      progress === 1
        ? formatAboutCounter(target, finalValue, suffix)
        : formatAboutCounter(currentValue, "", suffix);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.dataset.counting = "false";
    }
  };

  requestAnimationFrame(tick);
};

const aboutCounters = document.querySelectorAll("[data-about-counter]");

if (!("IntersectionObserver" in window) || prefersReducedMotion) {
  aboutCounters.forEach(animateAboutCounter);
} else {
  aboutCounters.forEach(resetAboutCounter);

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateAboutCounter(entry.target);
        } else {
          resetAboutCounter(entry.target);
        }
      });
    },
    {
      threshold: 0.5,
    },
  );

  aboutCounters.forEach((counter) => {
    counterObserver.observe(counter);
  });
}

/*
 * AOS is disabled below lg to prevent mobile/tablet
 * transform-related overflow and layout instability.
 *
 * On desktop, animations run again whenever elements
 * leave and re-enter the viewport.
 */
AOS.init({
  disable: () => window.innerWidth < 1024 || prefersReducedMotion,
  once: false,
  mirror: false,
  offset: 70,
  duration: 700,
  easing: "ease-out-cubic",
});
