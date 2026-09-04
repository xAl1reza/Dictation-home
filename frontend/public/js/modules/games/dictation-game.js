/*
 * Dictation game.
 *
 * Two-player flow:
 * SETUP → READER → REVIEW → next round
 *
 * The participant who writes the word receives the score.
 * Completed results are persisted through gameResultService.
 */

;(() => {
  const PHASE = Object.freeze({
    READY: 'ready',
    SETUP: 'setup',
    READER: 'reader',
    REVIEW: 'review',
    FINISHED: 'finished',
  })

  const MIN_DICTATION_WORDS = 10

  const getFairRoundCount = (wordCount) => {
    const count = Number(wordCount || 0)

    if (count < MIN_DICTATION_WORDS) {
      return 0
    }

    return count % 2 === 0 ? count : count - 1
  }

  const config = Object.freeze({
    title: 'دیکته',
    eyebrow: 'مسابقه دیکته',
    description: 'کلمات را نوبتی تمرین کن و امتیاز هر پاسخ را ثبت کن.',
    icon: '#icon-game-dictation',
    iconClass: 'bg-accent/15 text-accent dark:bg-accent/10',
    glowClass: 'bg-accent/10',
    badgeClass:
      'bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark',
    tutorial: {
      title: 'مسابقه دیکته چطور انجام می‌شود؟',
      description:
        'این بازی دونفره است. بازیکن دوم فقط برای همین مسابقه وارد می‌شود و نیازی به حساب کاربری ندارد.',
      steps: [
        'یک پوشه از کلماتت را برای مسابقه انتخاب می‌کنی.',
        'در هر دور، یک نفر کلمه را می‌بیند و برای نفر مقابل می‌خواند؛ سپس نتیجه را با دکمه «درست» یا «غلط» ثبت کنید.',
        'بعد از ثبت نتیجه، نقش دو بازیکن خودکار عوض می‌شود و کلمه بعدی نمایش داده خواهد شد.',
        'فقط امتیاز کاربر واردشده در حساب ذخیره می‌شود.',
      ],
    },
  })

  const runtime = {
    phase: PHASE.READY,
    user: null,
    guest: null,
    folder: null,
    words: [],
    wordIndex: 0,
    currentWord: null,
    readerId: null,
    writerId: null,
    cardBusy: false,
  }

  const createGuestId = () => {
    if (window.crypto?.randomUUID) {
      return `guest-${window.crypto.randomUUID()}`
    }

    return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const normalizeName = (value = '') => {
    return String(value).replace(/\s+/g, ' ').trim()
  }

  const shuffleWords = (words) => {
    const items = [...words]

    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))

      ;[items[index], items[randomIndex]] = [items[randomIndex], items[index]]
    }

    return items
  }

  const getStage = () => {
    return document.getElementById('game-stage-content')
  }

  const getParticipant = (engine, participantId) => {
    return engine
      .getSnapshot()
      .participants.find((participant) => participant.id === participantId)
  }

  const getReader = (engine) => {
    return getParticipant(engine, runtime.readerId)
  }

  const getWriter = (engine) => {
    return getParticipant(engine, runtime.writerId)
  }

  const setPhase = (phase) => {
    runtime.phase = phase
  }

  const showError = (message) => {
    if (typeof window.showToast === 'function') {
      window.showToast({
        type: 'error',
        title: 'امکان ادامه بازی نیست',
        message,
      })

      return
    }

    console.error(message)
  }

  const getAvailableFolders = async () => {
    if (!window.folderService || !window.wordService) {
      throw new Error('DICTATION_SERVICES_MISSING')
    }

    const folders = await window.folderService.getFolders()

    return folders.filter(
      (folder) =>
        folder.type === 'dictation' &&
        Number(folder.wordCount || 0) >= MIN_DICTATION_WORDS
    )
  }

  const clearSetupErrors = () => {
    const nameError = document.getElementById('dictation-name-error')

    const folderError = document.getElementById('dictation-folder-error')

    ;[nameError, folderError].forEach((element) => {
      if (!element) return

      element.textContent = ''
      element.classList.add('hidden')
    })
  }

  const setFieldError = (id, message) => {
    const element = document.getElementById(id)

    if (!element) return

    element.textContent = message
    element.classList.remove('hidden')
  }

  const initFolderDropdown = () => {
    const dropdown = document.getElementById('dictation-folder-dropdown')

    const trigger = document.getElementById('dictation-folder-trigger')

    const menu = document.getElementById('dictation-folder-menu')

    const valueElement = document.getElementById('dictation-folder-value')

    const input = document.getElementById('dictation-folder')

    const chevron = document.getElementById('dictation-folder-chevron')

    const options = Array.from(
      document.querySelectorAll('.dictation-folder-option')
    )

    if (
      !dropdown ||
      !trigger ||
      !menu ||
      !valueElement ||
      !input ||
      !chevron ||
      !options.length
    ) {
      return
    }

    let activeIndex = -1

    const openDropdown = () => {
      menu.classList.remove('hidden')

      trigger.setAttribute('aria-expanded', 'true')

      chevron.classList.add('rotate-180')

      const selectedIndex = options.findIndex(
        (option) => option.getAttribute('aria-selected') === 'true'
      )

      activeIndex = selectedIndex >= 0 ? selectedIndex : 0

      options[activeIndex]?.focus()
    }

    const closeDropdown = (returnFocus = false) => {
      menu.classList.add('hidden')

      trigger.setAttribute('aria-expanded', 'false')

      chevron.classList.remove('rotate-180')

      activeIndex = -1

      if (returnFocus) {
        trigger.focus()
      }
    }

    const selectFolder = (option) => {
      const value = option.dataset.value

      const label =
        option
          .querySelector('.dictation-folder-option-label')
          ?.textContent.trim() || ''

      input.value = value

      input.dispatchEvent(
        new Event('change', {
          bubbles: true,
        })
      )

      valueElement.textContent = label

      valueElement.classList.remove(
        'text-mutedColor/60',
        'dark:text-mutedColor-dark/50'
      )

      valueElement.classList.add('text-textColor', 'dark:text-textColor-dark')

      options.forEach((item) => {
        const selected = item === option

        item.setAttribute('aria-selected', String(selected))

        item.classList.toggle('bg-primary/10', selected)

        item.classList.toggle('text-primary', selected)

        item.classList.toggle('dark:bg-primary/15', selected)

        item.classList.toggle('dark:text-primary-light', selected)

        item
          .querySelector('.dictation-folder-check')
          ?.classList.toggle('hidden', !selected)
      })

      closeDropdown(true)
    }

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true'

      if (isOpen) {
        closeDropdown()
      } else {
        openDropdown()
      }
    })

    options.forEach((option, index) => {
      option.addEventListener('click', () => {
        selectFolder(option)
      })

      option.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()

          activeIndex = (index + 1) % options.length

          options[activeIndex].focus()
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()

          activeIndex = (index - 1 + options.length) % options.length

          options[activeIndex].focus()
        }

        if (event.key === 'Home') {
          event.preventDefault()

          activeIndex = 0

          options[activeIndex].focus()
        }

        if (event.key === 'End') {
          event.preventDefault()

          activeIndex = options.length - 1

          options[activeIndex].focus()
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()

          selectFolder(option)
        }

        if (event.key === 'Escape') {
          event.preventDefault()

          closeDropdown(true)
        }
      })
    })

    trigger.addEventListener('keydown', (event) => {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        openDropdown()
      }
    })

    document.addEventListener('click', (event) => {
      if (
        !dropdown.contains(event.target) &&
        trigger.getAttribute('aria-expanded') === 'true'
      ) {
        closeDropdown()
      }
    })
  }

  const renderSetup = async ({ engine, shell }) => {
    setPhase(PHASE.SETUP)

    const stage = getStage()
    if (!stage) return

    let folders = []

    try {
      folders = await getAvailableFolders()
    } catch (error) {
      console.error('Failed to load dictation folders:', error)

      showError('پوشه‌های کلمات در دسترس نیستند.')
    }

    if (!folders.length) {
      await shell.animateStage(() => {
        stage.innerHTML = `
          <div
            class="mx-auto max-w-xl text-center"
          >
            <div
              class="mx-auto mb-5 flex size-14 items-center justify-center rounded-md bg-accent/15 text-accent dark:bg-accent/10"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                class="size-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 5.5h8.5L18 9v9.5H6z"
                ></path>
                <path
                  stroke-linecap="round"
                  d="M9 12h6M9 15h4"
                ></path>
              </svg>
            </div>

            <h2
              class="mb-3"
            >
              هنوز کلمه‌ کافی برای بازی نداری
            </h2>

            <p
              class="mx-auto max-w-md text-mutedColor dark:text-mutedColor-dark"
            >
              برای شروع دیکته، یک پوشه با حداقل
              ${shell.toPersianNumber(MIN_DICTATION_WORDS)}
              کلمه لازم است. به یکی از پوشه‌ها کلمه بیشتری اضافه کن.
            </p>

            <a
              href="./dashboard.html?view=add-word"
              class="btn-primary mt-7"
            >
              افزودن کلمه
            </a>
          </div>
        `
      })

      return
    }

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto w-full max-w-xl"
        >
          <div
            class="mb-7 text-center"
          >
            <span
              class="ui-badge mb-3 bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark"
            >
              تنظیم مسابقه
            </span>

            <h2
              class="mb-2"
            >
              هم‌بازی‌ات کیه؟
            </h2>

            <p
              class="text-mutedColor dark:text-mutedColor-dark"
            >
              اسم بازیکن دوم و پوشه کلمات این مسابقه را انتخاب کن.
            </p>
          </div>

          <form
            id="dictation-setup-form"
            class="space-y-5"
            novalidate
          >
            <div class="form-group">
              <label
                for="dictation-guest-name"
                class="form-label"
              >
                نام بازیکن دوم
                <span
                  class="form-required"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <input
                id="dictation-guest-name"
                name="guestName"
                type="text"
                maxlength="40"
                autocomplete="off"
                class="form-control"
                placeholder="مثلاً مهدی"
                required
              />

              <p
                id="dictation-name-error"
                class="form-error hidden"
              ></p>
            </div>

            <div class="form-group">
              <label
                id="dictation-folder-label"
                class="form-label"
              >
                پوشه کلمات
                <span
                  class="form-required"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <div
                id="dictation-folder-dropdown"
                class="relative"
              >
                <input
                  type="hidden"
                  id="dictation-folder"
                  name="folderId"
                  value=""
                />

                <button
                  type="button"
                  id="dictation-folder-trigger"
                  aria-labelledby="dictation-folder-label dictation-folder-value"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="dictation-folder-menu"
                  class="form-control form-select-trigger"
                >
                  <span
                    id="dictation-folder-value"
                    class="text-mutedColor/60 dark:text-mutedColor-dark/50"
                  >
                    یک پوشه انتخاب کن
                  </span>

                  <svg
                    id="dictation-folder-chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    class="size-4 shrink-0 text-mutedColor transition-transform duration-300 dark:text-mutedColor-dark"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m6 9 6 6 6-6"
                    ></path>
                  </svg>
                </button>

                <div
                  id="dictation-folder-menu"
                  role="listbox"
                  aria-labelledby="dictation-folder-label"
                  tabindex="-1"
                  class="form-dropdown-menu hidden"
                >
                  ${folders
                    .map((folder) => {
                      const roundCount = getFairRoundCount(folder.wordCount)

                      return `
                        <button
                          type="button"
                          role="option"
                          aria-selected="false"
                          data-value="${shell.escapeGameHtml(folder.id)}"
                          class="dictation-folder-option form-option"
                        >
                          <span
                            class="min-w-0"
                          >
                            <span
                              class="dictation-folder-option-label block truncate"
                            >
                              ${shell.escapeGameHtml(folder.title)}
                            </span>

                            <span
                              class="ui-meta mt-1 block"
                            >
                              ${shell.toPersianNumber(folder.wordCount)}
                              کلمه
                              •
                              ${shell.toPersianNumber(roundCount)}
                              راند
                            </span>
                          </span>

                          <span
                            class="dictation-folder-check hidden shrink-0 text-primary dark:text-primary-light"
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        </button>
                      `
                    })
                    .join('')}
                </div>
              </div>

              <p
                id="dictation-folder-error"
                class="form-error hidden"
              ></p>
              <p
                class="form-help"
              >
                هر بازیکن باید تعداد مساوی کلمه بنویسد؛ اگر تعداد کلمات پوشه فرد باشد، یک کلمه در این مسابقه استفاده نمی‌شود.
              </p>

            </div>

            <div
              class="rounded-md border border-primary/10 bg-primary/5 px-4 py-3.5 dark:border-primary/15 dark:bg-primary/5"
            >
              <p
                class="text-mutedColor dark:text-mutedColor-dark"
              >
                بازیکن اول
                <strong
                  class="text-textColor dark:text-textColor-dark"
                >
                  ${shell.escapeGameHtml(runtime.user?.name || 'بازیکن')}
                </strong>
                است. بازیکن دوم فقط در همین مسابقه حضور دارد.
              </p>
            </div>

            <button
              type="submit"
              class="btn-primary w-full"
            >
              آماده شروع مسابقه
            </button>
          </form>
        </div>
      `
    })

    initFolderDropdown()

    initSetupForm({
      engine,
      shell,
      folders,
    })
  }

  const initSetupForm = ({ engine, shell, folders }) => {
    const form = document.getElementById('dictation-setup-form')

    if (!form) return

    const folderInput = document.getElementById('dictation-folder')

    folderInput?.addEventListener('change', () => {
      const folderError = document.getElementById('dictation-folder-error')

      if (!folderError) {
        return
      }

      folderError.textContent = ''
      folderError.classList.add('hidden')
    })

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      clearSetupErrors()

      const formData = new FormData(form)

      const guestName = normalizeName(formData.get('guestName'))

      const folderId = String(formData.get('folderId') || '').trim()

      let hasError = false

      if (guestName.length < 2) {
        setFieldError('dictation-name-error', 'نام بازیکن دوم را وارد کن.')
        hasError = true
      }

      if (guestName.length > 40) {
        setFieldError('dictation-name-error', 'نام بازیکن دوم خیلی طولانی است.')
        hasError = true
      }

      if (
        guestName &&
        guestName.localeCompare(runtime.user?.name || '', 'fa', {
          sensitivity: 'base',
        }) === 0
      ) {
        setFieldError(
          'dictation-name-error',
          'برای بازیکن دوم یک نام متفاوت وارد کن.'
        )
        hasError = true
      }

      const folder = folders.find((item) => item.id === folderId)

      if (!folder) {
        setFieldError(
          'dictation-folder-error',
          'یک پوشه برای مسابقه انتخاب کن.'
        )
        hasError = true
      }

      if (folder && Number(folder.wordCount || 0) < MIN_DICTATION_WORDS) {
        setFieldError(
          'dictation-folder-error',
          `پوشه باید حداقل ${MIN_DICTATION_WORDS} کلمه داشته باشد.`
        )
        hasError = true
      }

      if (hasError) return

      const submitButton = form.querySelector('button[type="submit"]')

      if (submitButton) {
        submitButton.disabled = true
      }

      try {
        const words = await window.wordService.getWordsByFolder(folder.id)

        if (words.length < MIN_DICTATION_WORDS) {
          throw new Error('DICTATION_FOLDER_TOO_SMALL')
        }

        const fairRoundCount = getFairRoundCount(words.length)

        if (fairRoundCount < MIN_DICTATION_WORDS) {
          throw new Error('DICTATION_ROUNDS_INVALID')
        }

        runtime.guest = {
          id: createGuestId(),
          name: guestName,
          isGuest: true,
          persistent: false,
        }

        runtime.folder = folder

        /*
         * An even number of rounds guarantees
         * that both players write exactly the
         * same number of words.
         */
        runtime.words = shuffleWords(words).slice(0, fairRoundCount)

        runtime.wordIndex = 0
        runtime.currentWord = null

        /*
         * First round:
         * logged-in player reads,
         * guest writes and receives score.
         */
        runtime.readerId = runtime.user.id
        runtime.writerId = runtime.guest.id

        engine.addParticipant(runtime.guest)

        engine.start({
          context: {
            folderId: folder.id,
            folderTitle: folder.title,

            roundCount: fairRoundCount,
          },
          currentPlayerId: runtime.writerId,
        })

        beginNextRound({
          engine,
          shell,
        })
      } catch (error) {
        console.error('Failed to start dictation:', error)

        if (submitButton) {
          submitButton.disabled = false
        }

        showError(
          error?.message === 'DICTATION_FOLDER_TOO_SMALL'
            ? `این پوشه باید حداقل ${MIN_DICTATION_WORDS} کلمه داشته باشد.`
            : 'شروع مسابقه انجام نشد. دوباره تلاش کن.'
        )
      }
    })
  }

  const beginNextRound = async ({ engine, shell }) => {
    if (runtime.wordIndex >= runtime.words.length) {
      finishGame({
        engine,
        shell,
        reason: 'words-completed',
      })
      return
    }

    runtime.currentWord = runtime.words[runtime.wordIndex]

    runtime.wordIndex += 1

    engine.beginRound({
      currentPlayerId: runtime.writerId,
      payload: {
        wordId: runtime.currentWord.id,
        folderId: runtime.folder.id,
      },
    })

    await renderReaderView({
      engine,
      shell,
    })
  }

  const getDictationFlashcard = () => {
    return document.getElementById('dictation-flashcard')
  }

  const setDictationActionState = (activeId) => {
    const actionIds = ['dictation-reader-actions', 'dictation-review-actions']

    actionIds.forEach((id) => {
      document.getElementById(id)?.classList.toggle('hidden', id !== activeId)
    })
  }

  const renderReaderView = async ({ engine, shell }) => {
    setPhase(PHASE.READER)
    runtime.cardBusy = false

    const stage = getStage()
    const reader = getReader(engine)
    const writer = getWriter(engine)

    if (!stage || !reader || !writer || !runtime.currentWord) {
      return
    }

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto w-full max-w-2xl text-center"
        >
          <span
            class="ui-badge mb-4 bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark"
          >
            دور ${shell.toPersianNumber(engine.getSnapshot().round)}
          </span>

          <p
            id="dictation-round-hint"
            class="mx-auto mb-5 max-w-xl text-mutedColor dark:text-mutedColor-dark"
          >
            ${shell.escapeGameHtml(reader.name)} کلمه را برای
            ${shell.escapeGameHtml(writer.name)}
            می‌خواند.
          </p>

          <div
            id="dictation-flashcard"
            class="game-flashcard game-flashcard--dictation"
            aria-label="فلش کارت کلمه دیکته"
          >
            <div
              data-flashcard-inner
              class="game-flashcard__inner"
            >
              <article
                data-flashcard-front
                class="game-flashcard__face game-flashcard__face--front"
                aria-hidden="false"
              >
                <div class="game-flashcard__content">
                  <span class="ui-eyebrow mb-4 block">
                    کلمه این دور
                  </span>

                  <strong class="game-word-value block">
                    ${shell.escapeGameHtml(runtime.currentWord.value)}
                  </strong>

                  <span class="game-flashcard__hint mt-6">
                    فقط ${shell.escapeGameHtml(reader.name)} به کارت نگاه کند.
                  </span>
                </div>
              </article>

              <article
                data-flashcard-back
                class="game-flashcard__face game-flashcard__face--back"
                aria-hidden="true"
              ></article>
            </div>
          </div>

          <div
            id="dictation-reader-actions"
            class="mt-7"
          >
            <button
              type="button"
              id="dictation-word-read"
              class="btn-primary"
            >
              کلمه را خواندم
            </button>
          </div>

          <div
            id="dictation-review-actions"
            class="mt-7 hidden"
          >
            <p class="mx-auto mb-4 max-w-lg text-mutedColor dark:text-mutedColor-dark">
              نوشته را با کلمه روی کارت مقایسه کنید.
            </p>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                data-dictation-outcome="correct"
                class="btn-primary gap-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="size-4"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m6 12 4 4 8-8"
                  ></path>
                </svg>
                درست
              </button>

              <button
                type="button"
                data-dictation-outcome="wrong"
                class="btn-secondary gap-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="size-4"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    d="m8 8 8 8M16 8l-8 8"
                  ></path>
                </svg>
                غلط
              </button>
            </div>
          </div>

          <button
            type="button"
            id="dictation-finish"
            class="btn-danger-soft btn-compact mt-4 cursor-pointer"
          >
            پایان مسابقه
          </button>

        </div>
      `
    })

    const card = getDictationFlashcard()
    shell.animateGameFlashcardIn?.(card)

    document.getElementById('dictation-word-read')?.addEventListener(
      'click',
      () => {
        renderReviewView({
          engine,
          shell,
        })
      },
      { once: true }
    )

    document.getElementById('dictation-finish')?.addEventListener(
      'click',
      async () => {
        if (runtime.cardBusy) return

        runtime.cardBusy = true

        const card = getDictationFlashcard()
        await shell.animateGameFlashcardAdvance?.(card)

        await finishGame({
          engine,
          shell,
          reason: 'user-finished',
        })

        runtime.cardBusy = false
      },
      { once: true }
    )

    stage.querySelectorAll('[data-dictation-outcome]').forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          if (runtime.cardBusy) return

          recordOutcome({
            engine,
            shell,
            outcome: button.dataset.dictationOutcome,
          })
        },
        { once: true }
      )
    })
  }

  const renderReviewView = async ({ engine, shell }) => {
    if (runtime.phase !== PHASE.READER || runtime.cardBusy) {
      return
    }

    const writer = getWriter(engine)
    const hint = document.getElementById('dictation-round-hint')

    if (!writer || !runtime.currentWord) {
      return
    }

    runtime.cardBusy = true
    setPhase(PHASE.REVIEW)

    if (hint) {
      hint.textContent = `نتیجه نوشته ${writer.name} را ثبت کنید.`
    }

    setDictationActionState('dictation-review-actions')

    await shell.revealGameActionGroup?.(
      document.getElementById('dictation-review-actions')
    )

    runtime.cardBusy = false
  }

  const swapRoles = () => {
    const previousReader = runtime.readerId

    runtime.readerId = runtime.writerId
    runtime.writerId = previousReader
  }

  const recordOutcome = async ({ engine, shell, outcome }) => {
    if (runtime.phase !== PHASE.REVIEW || runtime.cardBusy) {
      return
    }

    const isCorrect = outcome === 'correct'

    runtime.cardBusy = true

    engine.recordOutcome({
      outcome: isCorrect
        ? window.GameEngine.OUTCOME.CORRECT
        : window.GameEngine.OUTCOME.WRONG,
      participantId: runtime.writerId,
      metadata: {
        wordId: runtime.currentWord.id,
        word: runtime.currentWord.value,
      },
    })

    const isLastRound = runtime.wordIndex >= runtime.words.length

    if (!isLastRound) {
      swapRoles()
    }

    setDictationActionState(null)
    document.getElementById('dictation-finish')?.classList.add('hidden')

    /*
     * Intentional silent 500ms delay between registering the answer
     * and showing the next word/result.
     */
    await new Promise((resolve) => window.setTimeout(resolve, 500))

    if (isLastRound) {
      await finishGame({
        engine,
        shell,
        reason: 'words-completed',
      })
    } else {
      await beginNextRound({
        engine,
        shell,
      })
    }

    runtime.cardBusy = false
  }

  const finishGame = async ({ engine, shell, reason }) => {
    if (engine.getSnapshot().status === window.GameEngine.STATUS.PLAYING) {
      engine.finish({
        metadata: {
          reason,
          folderId: runtime.folder?.id || null,
          folderTitle: runtime.folder?.title || null,
        },
      })
    }

    setPhase(PHASE.FINISHED)

    const result = engine.getResult()

    let resultSaved = false

    try {
      await window.gameResultService.saveEngineResult({
        engineResult: result,
        userId: runtime.user?.id,
      })
      resultSaved = true
    } catch (error) {
      console.error('Failed to save dictation result:', error)
    }

    const stage = getStage()
    if (!stage) return

    const [playerOne, playerTwo] = result.participants

    const winner =
      playerOne?.score === playerTwo?.score
        ? null
        : [playerOne, playerTwo].sort((a, b) => b.score - a.score)[0]

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto max-w-2xl text-center"
        >
          <span
            class="ui-badge mb-4 bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
          >
            مسابقه تمام شد
          </span>

          <h2
            class="mb-2"
          >
            ${
              winner
                ? `${shell.escapeGameHtml(winner.name)} برنده شد!`
                : 'بازی مساوی شد!'
            }
          </h2>

          <p
            class="mx-auto mb-7 max-w-lg text-mutedColor dark:text-mutedColor-dark"
          >
            ${shell.toPersianNumber(result.rounds)}
            دور بازی کردید.
            ${
              resultSaved
                ? 'نتیجه این بازی با موفقیت ذخیره شد.'
                : 'نتیجه بازی نمایش داده شد، اما ذخیره آن انجام نشد.'
            }
          </p>

          <div
            class="grid gap-3 sm:grid-cols-2"
          >
            ${result.participants
              .map(
                (participant) => `
                  <div
                    class="rounded-md border border-white/70 bg-surface-soft px-5 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
                  >
                    <span
                      class="ui-meta mb-1 block"
                    >
                      ${participant.isGuest ? 'بازیکن مهمان' : 'بازیکن'}
                    </span>

                    <strong
                      class="game-result-name block truncate"
                    >
                      ${shell.escapeGameHtml(participant.name)}
                    </strong>

                    <strong
                      class="game-result-value mt-3 block text-primary dark:text-primary-light"
                    >
                      ${shell.toPersianNumber(participant.score)}
                    </strong>

                    <span
                      class="ui-meta mt-1 block"
                    >
                      امتیاز
                    </span>
                  </div>
                `
              )
              .join('')}
          </div>

          <div
            class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <button
              type="button"
              id="dictation-play-again"
              class="btn-primary"
            >
              بازی دوباره
            </button>

            <a
              href="./dashboard.html"
              class="btn-ghost"
            >
              بازگشت به داشبورد
            </a>
          </div>
        </div>
      `
    })

    document.getElementById('dictation-play-again')?.addEventListener(
      'click',
      () => {
        engine.reset()

        engine.setParticipants([
          {
            id: runtime.user.id,
            name: runtime.user.name || 'بازیکن',
            isGuest: false,
            persistent: true,
          },
        ])

        runtime.phase = PHASE.READY
        runtime.guest = null
        runtime.folder = null
        runtime.words = []
        runtime.wordIndex = 0
        runtime.currentWord = null
        runtime.readerId = null
        runtime.writerId = null
        runtime.cardBusy = false

        renderSetup({
          engine,
          shell,
        })
      },
      { once: true }
    )
  }

  const createEngine = ({ user }) => {
    runtime.user = user

    return window.GameEngine.create({
      gameType: 'dictation',
      participants: [
        {
          id: user.id,
          name: user.name || 'بازیکن',
          isGuest: false,
          persistent: true,
        },
      ],
    })
  }

  const onStart = async ({ engine, shell }) => {
    await renderSetup({
      engine,
      shell,
    })
  }

  window.DictationGame = Object.freeze({
    type: 'dictation',
    config,
    createEngine,
    onStart,
  })
})()
