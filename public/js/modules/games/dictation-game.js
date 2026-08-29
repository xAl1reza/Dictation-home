/*
 * Dictation game.
 *
 * Two-player flow:
 * SETUP → READER → WRITER → REVIEW → HANDOFF → next round
 *
 * The participant who writes the word receives the score.
 * Persistence is intentionally deferred to Stage 9.
 */

(() => {
  const PHASE = Object.freeze({
    READY: "ready",
    SETUP: "setup",
    READER: "reader",
    WRITER: "writer",
    REVIEW: "review",
    HANDOFF: "handoff",
    FINISHED: "finished",
  });

  const MIN_DICTATION_WORDS = 10;

  const getFairRoundCount = (wordCount) => {
    const count = Number(wordCount || 0);

    if (count < MIN_DICTATION_WORDS) {
      return 0;
    }

    return count % 2 === 0 ? count : count - 1;
  };

  const config = Object.freeze({
    title: "دیکته",
    eyebrow: "مسابقه دیکته",
    description: "کلمات را نوبتی تمرین کن و امتیاز هر پاسخ را ثبت کن.",
    icon: "#icon-game-dictation",
    iconClass: "bg-accent/15 text-accent dark:bg-accent/10",
    glowClass: "bg-accent/10",
    badgeClass:
      "bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark",
    tutorial: {
      title: "مسابقه دیکته چطور انجام می‌شود؟",
      description:
        "این بازی دونفره است. بازیکن دوم فقط برای همین مسابقه وارد می‌شود و نیازی به حساب کاربری ندارد.",
      steps: [
        "یک پوشه از کلماتت را برای مسابقه انتخاب می‌کنی.",
        "در هر دور، یک نفر کلمه را می‌بیند و برای نفر مقابل می‌خواند؛ بازیکن دوم باید کلمه را بنویسد و بعد نتیجه را با دکمه «درست» یا «غلط» ثبت کنید.",
        "بعد از ثبت نتیجه، نقش دو بازیکن عوض می‌شود و دور بعد شروع خواهد شد.",
        "فقط امتیاز کاربر واردشده در حساب ذخیره می‌شود.",
      ],
    },
  });

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
  };

  const createGuestId = () => {
    if (window.crypto?.randomUUID) {
      return `guest-${window.crypto.randomUUID()}`;
    }

    return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const normalizeName = (value = "") => {
    return String(value).replace(/\s+/g, " ").trim();
  };

  const shuffleWords = (words) => {
    const items = [...words];

    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }

    return items;
  };

  const getStage = () => {
    return document.getElementById("game-stage-content");
  };

  const getParticipant = (engine, participantId) => {
    return engine
      .getSnapshot()
      .participants.find((participant) => participant.id === participantId);
  };

  const getReader = (engine) => {
    return getParticipant(engine, runtime.readerId);
  };

  const getWriter = (engine) => {
    return getParticipant(engine, runtime.writerId);
  };

  const setPhase = (phase) => {
    runtime.phase = phase;
  };

  const showError = (message) => {
    if (typeof window.showToast === "function") {
      window.showToast({
        type: "error",
        title: "امکان ادامه بازی نیست",
        message,
      });

      return;
    }

    console.error(message);
  };

  const showSuccess = (message) => {
    if (typeof window.showToast === "function") {
      window.showToast({
        type: "success",
        title: "ثبت شد",
        message,
        duration: 2200,
      });
    }
  };

  const getAvailableFolders = async () => {
    if (!window.folderService || !window.wordService) {
      throw new Error("DICTATION_SERVICES_MISSING");
    }

    const folders = await window.folderService.getFolders();

    return folders.filter(
      (folder) => Number(folder.wordCount || 0) >= MIN_DICTATION_WORDS,
    );
  };

  const clearSetupErrors = () => {
    const nameError = document.getElementById("dictation-name-error");

    const folderError = document.getElementById("dictation-folder-error");

    [nameError, folderError].forEach((element) => {
      if (!element) return;

      element.textContent = "";
      element.classList.add("hidden");
    });
  };

  const setFieldError = (id, message) => {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = message;
    element.classList.remove("hidden");
  };

  const initFolderDropdown = () => {
    const dropdown = document.getElementById("dictation-folder-dropdown");

    const trigger = document.getElementById("dictation-folder-trigger");

    const menu = document.getElementById("dictation-folder-menu");

    const valueElement = document.getElementById("dictation-folder-value");

    const input = document.getElementById("dictation-folder");

    const chevron = document.getElementById("dictation-folder-chevron");

    const options = Array.from(
      document.querySelectorAll(".dictation-folder-option"),
    );

    if (
      !dropdown ||
      !trigger ||
      !menu ||
      !valueElement ||
      !input ||
      !chevron ||
      !options.length
    ) {
      return;
    }

    let activeIndex = -1;

    const openDropdown = () => {
      menu.classList.remove("hidden");

      trigger.setAttribute("aria-expanded", "true");

      chevron.classList.add("rotate-180");

      const selectedIndex = options.findIndex(
        (option) => option.getAttribute("aria-selected") === "true",
      );

      activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

      options[activeIndex]?.focus();
    };

    const closeDropdown = (returnFocus = false) => {
      menu.classList.add("hidden");

      trigger.setAttribute("aria-expanded", "false");

      chevron.classList.remove("rotate-180");

      activeIndex = -1;

      if (returnFocus) {
        trigger.focus();
      }
    };

    const selectFolder = (option) => {
      const value = option.dataset.value;

      const label =
        option
          .querySelector(".dictation-folder-option-label")
          ?.textContent.trim() || "";

      input.value = value;

      input.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );

      valueElement.textContent = label;

      valueElement.classList.remove(
        "text-mutedColor/60",
        "dark:text-mutedColor-dark/50",
      );

      valueElement.classList.add("text-textColor", "dark:text-textColor-dark");

      options.forEach((item) => {
        const selected = item === option;

        item.setAttribute("aria-selected", String(selected));

        item.classList.toggle("bg-primary/10", selected);

        item.classList.toggle("text-primary", selected);

        item.classList.toggle("dark:bg-primary/15", selected);

        item.classList.toggle("dark:text-primary-light", selected);

        item
          .querySelector(".dictation-folder-check")
          ?.classList.toggle("hidden", !selected);
      });

      closeDropdown(true);
    };

    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    options.forEach((option, index) => {
      option.addEventListener("click", () => {
        selectFolder(option);
      });

      option.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();

          activeIndex = (index + 1) % options.length;

          options[activeIndex].focus();
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();

          activeIndex = (index - 1 + options.length) % options.length;

          options[activeIndex].focus();
        }

        if (event.key === "Home") {
          event.preventDefault();

          activeIndex = 0;

          options[activeIndex].focus();
        }

        if (event.key === "End") {
          event.preventDefault();

          activeIndex = options.length - 1;

          options[activeIndex].focus();
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();

          selectFolder(option);
        }

        if (event.key === "Escape") {
          event.preventDefault();

          closeDropdown(true);
        }
      });
    });

    trigger.addEventListener("keydown", (event) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openDropdown();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        !dropdown.contains(event.target) &&
        trigger.getAttribute("aria-expanded") === "true"
      ) {
        closeDropdown();
      }
    });
  };

  const renderSetup = async ({ engine, shell }) => {
    setPhase(PHASE.SETUP);

    const stage = getStage();
    if (!stage) return;

    let folders = [];

    try {
      folders = await getAvailableFolders();
    } catch (error) {
      console.error("Failed to load dictation folders:", error);

      showError("پوشه‌های کلمات در دسترس نیستند.");
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
              class="mb-3 !text-[clamp(24px,4vw,32px)]"
            >
              هنوز کلمه‌ کافی برای بازی نداری
            </h2>

            <p
              class="mx-auto max-w-md !text-sm !leading-7 text-mutedColor dark:text-mutedColor-dark"
            >
              برای شروع دیکته، یک پوشه با حداقل
              ${shell.toPersianNumber(MIN_DICTATION_WORDS)}
              کلمه لازم است. به یکی از پوشه‌ها کلمه بیشتری اضافه کن.
            </p>

            <a
              href="./dashboard.html?view=add-word"
              class="mt-7 inline-flex cursor-pointer items-center justify-center rounded-full border border-primary bg-primary px-7 py-3 font-Peyda-medium text-sm text-white shadow-btn transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              افزودن کلمه
            </a>
          </div>
        `;
      });

      return;
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
              class="mb-3 inline-flex rounded-full bg-accent/15 px-4 py-2 font-Dana-medium text-xs text-textColor dark:bg-accent/10 dark:text-textColor-dark"
            >
              تنظیم مسابقه
            </span>

            <h2
              class="mb-2 !text-[clamp(25px,4vw,34px)]"
            >
              هم‌بازی‌ات کیه؟
            </h2>

            <p
              class="!text-sm !leading-7 text-mutedColor dark:text-mutedColor-dark"
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
                  class="form-control flex cursor-pointer items-center justify-between gap-4 text-right focus:outline-none focus:ring-4 focus:ring-primary/10"
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
                  class="absolute top-full right-0 left-0 z-40 mt-2 hidden max-h-64 overflow-y-auto rounded-md border border-white/80 bg-white/95 p-2 shadow-floating backdrop-blur-xl dark:border-border-dark dark:bg-bg-dark-secondary/95 dark:shadow-floating-dark"
                >
                  ${folders
                    .map((folder) => {
                      const roundCount = getFairRoundCount(folder.wordCount);

                      return `
                        <button
                          type="button"
                          role="option"
                          aria-selected="false"
                          data-value="${shell.escapeGameHtml(folder.id)}"
                          class="dictation-folder-option flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-4 py-3 text-right font-Dana-medium text-sm text-textColor transition-colors hover:bg-primary/10 hover:text-primary dark:text-textColor-dark dark:hover:bg-primary/15 dark:hover:text-primary-light"
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
                              class="mt-1 block font-Dana-regular text-[11px] text-mutedColor dark:text-mutedColor-dark"
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
                      `;
                    })
                    .join("")}
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
                class="!text-xs !leading-6 text-mutedColor dark:text-mutedColor-dark"
              >
                بازیکن اول
                <strong
                  class="font-Dana-bold text-textColor dark:text-textColor-dark"
                >
                  ${shell.escapeGameHtml(runtime.user?.name || "بازیکن")}
                </strong>
                است. بازیکن دوم فقط در همین مسابقه حضور دارد.
              </p>
            </div>

            <button
              type="submit"
              class="inline-flex w-full cursor-pointer items-center justify-center rounded-full border border-primary bg-primary px-7 py-3.5 font-Peyda-medium text-sm text-white shadow-btn transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              آماده شروع مسابقه
            </button>
          </form>
        </div>
      `;
    });

    initFolderDropdown();

    initSetupForm({
      engine,
      shell,
      folders,
    });
  };

  const initSetupForm = ({ engine, shell, folders }) => {
    const form = document.getElementById("dictation-setup-form");

    if (!form) return;

    const folderInput = document.getElementById("dictation-folder");

    folderInput?.addEventListener("change", () => {
      const folderError = document.getElementById("dictation-folder-error");

      if (!folderError) {
        return;
      }

      folderError.textContent = "";
      folderError.classList.add("hidden");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearSetupErrors();

      const formData = new FormData(form);

      const guestName = normalizeName(formData.get("guestName"));

      const folderId = String(formData.get("folderId") || "").trim();

      let hasError = false;

      if (guestName.length < 2) {
        setFieldError("dictation-name-error", "نام بازیکن دوم را وارد کن.");
        hasError = true;
      }

      if (guestName.length > 40) {
        setFieldError(
          "dictation-name-error",
          "نام بازیکن دوم خیلی طولانی است.",
        );
        hasError = true;
      }

      if (
        guestName &&
        guestName.localeCompare(runtime.user?.name || "", "fa", {
          sensitivity: "base",
        }) === 0
      ) {
        setFieldError(
          "dictation-name-error",
          "برای بازیکن دوم یک نام متفاوت وارد کن.",
        );
        hasError = true;
      }

      const folder = folders.find((item) => item.id === folderId);

      if (!folder) {
        setFieldError(
          "dictation-folder-error",
          "یک پوشه برای مسابقه انتخاب کن.",
        );
        hasError = true;
      }

      if (folder && Number(folder.wordCount || 0) < MIN_DICTATION_WORDS) {
        setFieldError(
          "dictation-folder-error",
          `پوشه باید حداقل ${MIN_DICTATION_WORDS} کلمه داشته باشد.`,
        );
        hasError = true;
      }

      if (hasError) return;

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const words = await window.wordService.getWordsByFolder(folder.id);

        if (words.length < MIN_DICTATION_WORDS) {
          throw new Error("DICTATION_FOLDER_TOO_SMALL");
        }

        const fairRoundCount = getFairRoundCount(words.length);

        if (fairRoundCount < MIN_DICTATION_WORDS) {
          throw new Error("DICTATION_ROUNDS_INVALID");
        }

        runtime.guest = {
          id: createGuestId(),
          name: guestName,
          isGuest: true,
          persistent: false,
        };

        runtime.folder = folder;

        /*
         * An even number of rounds guarantees
         * that both players write exactly the
         * same number of words.
         */
        runtime.words = shuffleWords(words).slice(0, fairRoundCount);

        runtime.wordIndex = 0;
        runtime.currentWord = null;

        /*
         * First round:
         * logged-in player reads,
         * guest writes and receives score.
         */
        runtime.readerId = runtime.user.id;
        runtime.writerId = runtime.guest.id;

        engine.addParticipant(runtime.guest);

        engine.start({
          context: {
            folderId: folder.id,
            folderTitle: folder.title,

            roundCount: fairRoundCount,
          },
          currentPlayerId: runtime.writerId,
        });

        beginNextRound({
          engine,
          shell,
        });
      } catch (error) {
        console.error("Failed to start dictation:", error);

        if (submitButton) {
          submitButton.disabled = false;
        }

        showError(
          error?.message === "DICTATION_FOLDER_TOO_SMALL"
            ? `این پوشه باید حداقل ${MIN_DICTATION_WORDS} کلمه داشته باشد.`
            : "شروع مسابقه انجام نشد. دوباره تلاش کن.",
        );
      }
    });
  };

  const beginNextRound = async ({ engine, shell }) => {
    if (runtime.wordIndex >= runtime.words.length) {
      finishGame({
        engine,
        shell,
        reason: "words-completed",
      });
      return;
    }

    runtime.currentWord = runtime.words[runtime.wordIndex];

    runtime.wordIndex += 1;

    engine.beginRound({
      currentPlayerId: runtime.writerId,
      payload: {
        wordId: runtime.currentWord.id,
        folderId: runtime.folder.id,
      },
    });

    renderReaderView({
      engine,
      shell,
    });
  };

  const renderReaderView = async ({ engine, shell }) => {
    setPhase(PHASE.READER);

    const stage = getStage();
    const reader = getReader(engine);
    const writer = getWriter(engine);

    if (!stage || !reader || !writer || !runtime.currentWord) {
      return;
    }

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto max-w-2xl text-center"
        >
          <span
            class="mb-4 inline-flex rounded-full bg-accent/15 px-4 py-2 font-Dana-medium text-xs text-textColor dark:bg-accent/10 dark:text-textColor-dark"
          >
            دور ${shell.toPersianNumber(engine.getSnapshot().round)}
          </span>

          <p
            class="mb-2 !text-sm text-mutedColor dark:text-mutedColor-dark"
          >
            ${shell.escapeGameHtml(reader.name)} کلمه را برای
            ${shell.escapeGameHtml(writer.name)}
            می‌خواند
          </p>

          <h2
            class="mb-7 !text-[clamp(25px,4vw,34px)]"
          >
            فقط ${shell.escapeGameHtml(reader.name)} به صفحه نگاه کند
          </h2>

          <div
            class="mx-auto max-w-xl rounded-lg border border-accent/20 bg-accent/5 px-5 py-8 shadow-card dark:border-accent/15 dark:bg-accent/5 dark:shadow-card-dark sm:px-8 sm:py-10"
          >
            <span
              class="mb-3 block font-Dana-medium text-xs text-mutedColor dark:text-mutedColor-dark"
            >
              کلمه این دور
            </span>

            <strong
              class="block font-Peyda-bold text-[clamp(32px,7vw,52px)] leading-tight text-textColor dark:text-textColor-dark"
            >
              ${shell.escapeGameHtml(runtime.currentWord.value)}
            </strong>
          </div>

          <p
            class="mx-auto mt-5 max-w-lg !text-sm !leading-7 text-mutedColor dark:text-mutedColor-dark"
          >
            کلمه را با صدای واضح برای
            ${shell.escapeGameHtml(writer.name)}
            بخوان و بعد آن را از صفحه مخفی کن.
          </p>

          <button
            type="button"
            id="dictation-word-read"
            class="mt-7 inline-flex cursor-pointer items-center justify-center rounded-full border border-primary bg-primary px-8 py-3.5 font-Peyda-medium text-sm text-white shadow-btn transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            کلمه را خواندم
          </button>
        </div>
      `;
    });

    document.getElementById("dictation-word-read")?.addEventListener(
      "click",
      () => {
        renderWriterView({
          engine,
          shell,
        });
      },
      { once: true },
    );
  };

  const renderWriterView = async ({ engine, shell }) => {
    setPhase(PHASE.WRITER);

    const stage = getStage();
    const writer = getWriter(engine);

    if (!stage || !writer) {
      return;
    }

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto max-w-xl text-center"
        >
          <div
            class="mx-auto mb-6 flex size-16 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              class="size-7"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 18h10M8 15l7.5-7.5 2 2L10 17H8z"
              ></path>
            </svg>
          </div>

          <span
            class="mb-3 inline-flex rounded-full bg-primary/10 px-4 py-2 font-Dana-medium text-xs text-primary dark:bg-primary/15 dark:text-primary-light"
          >
            حالا نوبت نوشتنه
          </span>

          <h2
            class="mb-3 !text-[clamp(26px,4vw,36px)]"
          >
            گوشی را به
            ${shell.escapeGameHtml(writer.name)}
            بده
          </h2>

          <p
            class="mx-auto max-w-md !text-sm !leading-8 text-mutedColor dark:text-mutedColor-dark"
          >
            ${shell.escapeGameHtml(
              writer.name,
            )} باید کلمه‌ای را که شنیده روی کاغذ بنویسد. کلمه تا زمان بررسی روی صفحه نمایش داده نمی‌شود.
          </p>

          <button
            type="button"
            id="dictation-written"
            class="mt-8 inline-flex cursor-pointer items-center justify-center rounded-full border border-primary bg-primary px-8 py-3.5 font-Peyda-medium text-sm text-white shadow-btn transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            نوشتم، بررسی کنیم
          </button>
        </div>
      `;
    });

    document.getElementById("dictation-written")?.addEventListener(
      "click",
      () => {
        renderReviewView({
          engine,
          shell,
        });
      },
      { once: true },
    );
  };

  const renderReviewView = async ({ engine, shell }) => {
    setPhase(PHASE.REVIEW);

    const stage = getStage();
    const writer = getWriter(engine);

    if (!stage || !writer || !runtime.currentWord) {
      return;
    }

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto max-w-2xl text-center"
        >
          <span
            class="mb-4 inline-flex rounded-full bg-secondary/10 px-4 py-2 font-Dana-medium text-xs text-secondary dark:bg-secondary/15"
          >
            بررسی پاسخ
          </span>

          <h2
            class="mb-2 !text-[clamp(25px,4vw,34px)]"
          >
            نوشته
            ${shell.escapeGameHtml(writer.name)}
            را بررسی کنید
          </h2>

          <p
            class="mb-6 !text-sm !leading-7 text-mutedColor dark:text-mutedColor-dark"
          >
            کلمه درست این دور:
          </p>

          <div
            class="mx-auto max-w-xl rounded-lg border border-primary/15 bg-primary/5 px-5 py-7 dark:border-primary/15 dark:bg-primary/5 sm:px-8"
          >
            <strong
              class="block font-Peyda-bold text-[clamp(30px,6vw,46px)] text-textColor dark:text-textColor-dark"
            >
              ${shell.escapeGameHtml(runtime.currentWord.value)}
            </strong>
          </div>

          <p
            class="mx-auto mt-5 max-w-lg !text-sm !leading-7 text-mutedColor dark:text-mutedColor-dark"
          >
            اگر کلمه دقیق و درست نوشته شده «درست» را بزن؛ در غیر این صورت «غلط» را انتخاب کن.
          </p>

          <div
            class="mt-7 grid gap-3 sm:grid-cols-2"
          >
            <button
              type="button"
              data-dictation-outcome="correct"
              class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-primary bg-primary px-7 py-3.5 font-Peyda-medium text-sm text-white shadow-btn transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-secondary bg-secondary px-7 py-3.5 font-Peyda-medium text-sm text-white transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-secondary active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary/30"
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
      `;
    });

    stage.querySelectorAll("[data-dictation-outcome]").forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          recordOutcome({
            engine,
            shell,
            outcome: button.dataset.dictationOutcome,
          });
        },
        { once: true },
      );
    });
  };

  const swapRoles = () => {
    const previousReader = runtime.readerId;

    runtime.readerId = runtime.writerId;

    runtime.writerId = previousReader;
  };

  const recordOutcome = ({ engine, shell, outcome }) => {
    const isCorrect = outcome === "correct";

    engine.recordOutcome({
      outcome: isCorrect
        ? window.GameEngine.OUTCOME.CORRECT
        : window.GameEngine.OUTCOME.WRONG,
      participantId: runtime.writerId,
      metadata: {
        wordId: runtime.currentWord.id,
        word: runtime.currentWord.value,
      },
    });

    showSuccess(isCorrect ? "یک امتیاز اضافه شد." : "یک امتیاز کم شد.");

    if (runtime.wordIndex >= runtime.words.length) {
      finishGame({
        engine,
        shell,
        reason: "words-completed",
      });
      return;
    }

    swapRoles();

    renderHandoffView({
      engine,
      shell,
      isCorrect,
    });
  };

  const renderHandoffView = async ({ engine, shell, isCorrect }) => {
    setPhase(PHASE.HANDOFF);

    const stage = getStage();
    const reader = getReader(engine);
    const writer = getWriter(engine);

    if (!stage || !reader || !writer) {
      return;
    }

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto max-w-xl text-center"
        >
          <div
            class="mx-auto mb-6 flex size-16 items-center justify-center rounded-lg ${
              isCorrect
                ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
                : "bg-secondary/10 text-secondary dark:bg-secondary/15"
            }"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              class="size-7"
            >
              ${
                isCorrect
                  ? `
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m6 12 4 4 8-8"
                    ></path>
                  `
                  : `
                    <path
                      stroke-linecap="round"
                      d="m8 8 8 8M16 8l-8 8"
                    ></path>
                  `
              }
            </svg>
          </div>

          <span
            class="mb-3 inline-flex rounded-full ${
              isCorrect
                ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
                : "bg-secondary/10 text-secondary dark:bg-secondary/15"
            } px-4 py-2 font-Dana-medium text-xs"
          >
            امتیاز ثبت شد
          </span>

          <h2
            class="mb-3 !text-[clamp(26px,4vw,36px)]"
          >
            حالا نقش‌ها عوض می‌شود
          </h2>

          <p
            class="mx-auto max-w-md !text-sm !leading-8 text-mutedColor dark:text-mutedColor-dark"
          >
            در دور بعد،
            <strong
              class="font-Dana-bold text-textColor dark:text-textColor-dark"
            >
              ${shell.escapeGameHtml(reader.name)}
            </strong>
            کلمه را می‌خواند و
            <strong
              class="font-Dana-bold text-textColor dark:text-textColor-dark"
            >
              ${shell.escapeGameHtml(writer.name)}
            </strong>
            آن را می‌نویسد.
          </p>

          <button
            type="button"
            id="dictation-next-round"
            class="mt-8 inline-flex cursor-pointer items-center justify-center rounded-full border border-primary bg-primary px-8 py-3.5 font-Peyda-medium text-sm text-white shadow-btn transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            آماده‌ایم، دور بعد
          </button>

          <button
            type="button"
            id="dictation-finish"
            class="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full border border-textColor/10 bg-transparent px-6 py-3 font-Peyda-medium text-xs text-mutedColor transition-all duration-300 hover:border-secondary/30 hover:text-secondary active:scale-95 dark:border-border-dark dark:text-mutedColor-dark"
          >
            پایان مسابقه
          </button>
        </div>
      `;
    });

    document.getElementById("dictation-next-round")?.addEventListener(
      "click",
      () => {
        beginNextRound({
          engine,
          shell,
        });
      },
      { once: true },
    );

    document.getElementById("dictation-finish")?.addEventListener(
      "click",
      () => {
        finishGame({
          engine,
          shell,
          reason: "user-finished",
        });
      },
      { once: true },
    );
  };

  const finishGame = async ({ engine, shell, reason }) => {
    if (engine.getSnapshot().status === window.GameEngine.STATUS.PLAYING) {
      engine.finish({
        metadata: {
          reason,
          folderId: runtime.folder?.id || null,
        },
      });
    }

    setPhase(PHASE.FINISHED);

    const result = engine.getResult();

    const stage = getStage();
    if (!stage) return;

    const [playerOne, playerTwo] = result.participants;

    const winner =
      playerOne?.score === playerTwo?.score
        ? null
        : [playerOne, playerTwo].sort((a, b) => b.score - a.score)[0];

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto max-w-2xl text-center"
        >
          <span
            class="mb-4 inline-flex rounded-full bg-primary/10 px-4 py-2 font-Dana-medium text-xs text-primary dark:bg-primary/15 dark:text-primary-light"
          >
            مسابقه تمام شد
          </span>

          <h2
            class="mb-2 !text-[clamp(28px,5vw,40px)]"
          >
            ${
              winner
                ? `${shell.escapeGameHtml(winner.name)} برنده شد!`
                : "بازی مساوی شد!"
            }
          </h2>

          <p
            class="mx-auto mb-7 max-w-lg !text-sm !leading-7 text-mutedColor dark:text-mutedColor-dark"
          >
            ${shell.toPersianNumber(result.rounds)}
            دور بازی کردید. ذخیره نتیجه دائمی در مرحله نتیجه‌ها اضافه می‌شود.
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
                      class="mb-1 block font-Dana-regular text-xs text-mutedColor dark:text-mutedColor-dark"
                    >
                      ${participant.isGuest ? "بازیکن مهمان" : "بازیکن"}
                    </span>

                    <strong
                      class="block truncate font-Peyda-medium text-base text-textColor dark:text-textColor-dark"
                    >
                      ${shell.escapeGameHtml(participant.name)}
                    </strong>

                    <strong
                      class="mt-3 block font-Dana-bold text-2xl text-primary dark:text-primary-light"
                    >
                      ${shell.toPersianNumber(participant.score)}
                    </strong>

                    <span
                      class="mt-1 block font-Dana-regular text-xs text-mutedColor dark:text-mutedColor-dark"
                    >
                      امتیاز
                    </span>
                  </div>
                `,
              )
              .join("")}
          </div>

          <div
            class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <button
              type="button"
              id="dictation-play-again"
              class="inline-flex cursor-pointer items-center justify-center rounded-full border border-primary bg-primary px-7 py-3 font-Peyda-medium text-sm text-white shadow-btn transition-all duration-300 hover:-translate-y-1 hover:bg-transparent hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              بازی دوباره
            </button>

            <a
              href="./dashboard.html"
              class="inline-flex cursor-pointer items-center justify-center rounded-full border border-textColor/10 bg-transparent px-7 py-3 font-Peyda-medium text-sm text-textColor transition-all duration-300 hover:border-primary/30 hover:text-primary active:scale-95 dark:border-border-dark dark:text-textColor-dark dark:hover:text-primary-light"
            >
              بازگشت به داشبورد
            </a>
          </div>
        </div>
      `;
    });

    document.getElementById("dictation-play-again")?.addEventListener(
      "click",
      () => {
        engine.reset();

        engine.setParticipants([
          {
            id: runtime.user.id,
            name: runtime.user.name || "بازیکن",
            isGuest: false,
            persistent: true,
          },
        ]);

        runtime.phase = PHASE.READY;
        runtime.guest = null;
        runtime.folder = null;
        runtime.words = [];
        runtime.wordIndex = 0;
        runtime.currentWord = null;
        runtime.readerId = null;
        runtime.writerId = null;

        renderSetup({
          engine,
          shell,
        });
      },
      { once: true },
    );
  };

  const createEngine = ({ user }) => {
    runtime.user = user;

    return window.GameEngine.create({
      gameType: "dictation",
      participants: [
        {
          id: user.id,
          name: user.name || "بازیکن",
          isGuest: false,
          persistent: true,
        },
      ],
    });
  };

  const onStart = async ({ engine, shell }) => {
    await renderSetup({
      engine,
      shell,
    });
  };

  window.DictationGame = Object.freeze({
    type: "dictation",
    config,
    createEngine,
    onStart,
  });
})();
