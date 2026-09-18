/* Dashboard UI only; the backend enforces every protected operation. */
;(() => {
  let status = null
  let pending = null
  let started = false
  const modalId = 'subscription-required-modal'
  const number = (n) => new Intl.NumberFormat('fa-IR').format(n)
  const can = (feature) => status?.permissions?.[feature] === true
  const showRequired = () => {
    if (!status) {
      window.showToast?.({ type: 'error', title: 'بررسی اشتراک', message: 'وضعیت اشتراک دریافت نشد؛ دوباره تلاش کن.' })
      return
    }
    window.AppModal?.open(modalId)
  }
  const featureFor = (element) => {
    if (element.matches('[data-add-folder], [data-manage-folder]')) return 'content_manage'
    if (['add-word', 'add-science-question'].includes(element.dataset.dashboardLink)) return 'content_manage'
    const url = new URL(element.getAttribute('href') || '', location.href)
    if (url.pathname.endsWith('/game.html')) return url.searchParams.get('type')
    return null
  }
  const updateLocks = () => {
    document.querySelectorAll('a[href], [data-add-folder], [data-manage-folder]').forEach((el) => {
      const feature = featureFor(el)
      if (!feature) return
      const locked = !can(feature)
      el.classList.toggle('opacity-50', locked)
      el.classList.toggle('cursor-not-allowed', locked)
      el.setAttribute('aria-disabled', String(locked))
      if (locked) el.setAttribute('title', status ? 'نیازمند اشتراک' : 'در انتظار بررسی اشتراک')
      else el.removeAttribute('title')
      let badge = el.querySelector('[data-subscription-lock]')
      if (locked && !badge) {
        badge = document.createElement('span')
        badge.dataset.subscriptionLock = ''
        badge.className = 'ui-meta ms-auto shrink-0'
        badge.textContent = 'قفل'
        el.append(badge)
      } else if (!locked) badge?.remove()
    })
  }
  const render = () => {
    const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value }
    text('subscription-title', !status ? 'وضعیت اشتراک' : status.tier === 'trial' ? 'اشتراک رایگان' : status.tier === 'paid' ? 'اشتراک فعال' : 'دوره اشتراک تمام شده')
    const seconds = Math.max(0, Math.floor(status?.remainingSeconds || 0))
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const timeDetail = days === 0 && hours === 0 && seconds > 0
      ? (minutes > 0 ? `${number(minutes)} دقیقه` : 'کمتر از یک دقیقه')
      : `${number(hours)} ساعت`
    text('subscription-days', status ? `${number(days)} روز` : '—')
    text('subscription-hours', status ? timeDetail : 'وضعیت نامشخص')
    text('subscription-description', !status ? 'وضعیت اشتراکت دریافت نشد؛ یک بار دیگر تلاش کن.' : status.tier === 'free' ? 'یادگیری ادامه داره؛ با تهیهٔ اشتراک، دوباره با هم بازی می‌کنیم.' : status.tier === 'trial' ? 'فرصت بازی و یادگیری توئه؛ هر روز یه قدم جلوتر!' : 'همراه هم، هر روز یه چیز تازه یاد می‌گیریم.')
    const ring = document.getElementById('subscription-ring-value')
    ring?.setAttribute('stroke-dasharray', `${status ? Math.max(0, Math.min(100, status.remainingPercent)) : 0} 100`)
    ring?.setAttribute('stroke-linecap', status?.remainingPercent > 0 ? 'round' : 'butt')
    const meter = document.getElementById('subscription-meter')
    meter?.setAttribute('aria-valuenow', String(status?.remainingPercent || 0))
    meter?.setAttribute('aria-valuetext', status ? `${number(days)} روز و ${timeDetail} باقی‌مانده` : 'وضعیت نامشخص')
    document.getElementById('subscription-purchase')?.classList.toggle('hidden', !status?.purchaseRequired)
    updateLocks()
  }
  const refresh = () => {
    if (pending) return pending
    const button = document.getElementById('subscription-refresh')
    if (button) {
      button.disabled = true
      button.setAttribute('aria-busy', 'true')
    }
    pending = (async () => {
      const previous = status
      try {
        status = await window.subscriptionService.getStatus()
        render()
        if (status.purchaseRequired && !previous?.purchaseRequired) showRequired()
      } catch (error) {
        status = null
        render()
        if (error?.status === 401) location.replace('./auth.html#login')
      } finally {
        pending = null
        if (button) {
          button.disabled = false
          button.removeAttribute('aria-busy')
        }
      }
      window.dispatchEvent(new CustomEvent('app:subscription-updated', { detail: status }))
      return status
    })()
    return pending
  }
  const init = async () => {
    if (!started) {
      started = true
      // Capture before existing dashboard click handlers.
      document.addEventListener('click', (event) => {
        const el = event.target.closest('a[href], [data-add-folder], [data-manage-folder]')
        if (!el) return
        const feature = featureFor(el)
        if (feature && !can(feature)) {
          event.preventDefault()
          event.stopImmediatePropagation()
          showRequired()
        }
      }, true)
      document.getElementById('subscription-refresh')?.addEventListener('click', refresh)
      document.getElementById('subscription-purchase')?.addEventListener('click', showRequired)
      document.querySelectorAll('[data-subscription-buy]').forEach((button) => {
        button.addEventListener('click', () => window.showToast?.({ type: 'info', title: 'تهیه اشتراک', message: 'روش تهیه اشتراک به‌زودی اعلام می‌شود.' }))
      })
      window.setInterval(() => { if (!document.hidden) void refresh() }, 60000)
      document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh() })
      window.addEventListener('pageshow', (e) => { if (e.persisted) void refresh() })
    }
    return refresh()
  }
  window.DashboardSubscription = { init, refresh, can, updateLocks, showRequired, getStatus: () => status }
})()
