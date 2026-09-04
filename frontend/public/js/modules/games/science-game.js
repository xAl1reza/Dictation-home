/*
 * Science game.
 *
 * Single-player flow:
 * SETUP → QUESTION → REVIEW → FEEDBACK → QUESTION ... → FINISHED
 *
 * Questions come from science folders created in the dashboard.
 * Completed results are persisted through gameResultService.
 */

(() => {
  const PHASE = Object.freeze({
    READY: "ready",
    SETUP: "setup",
    QUESTION: "question",
    REVIEW: "review",
    FEEDBACK: "feedback",
    FINISHED: "finished",
  });

  const MIN_SCIENCE_QUESTIONS = 5;

  const config = Object.freeze({
    title: "علوم",
    eyebrow: "مسابقه علوم",
    description: "سؤال‌های علوم را مرور کن، پاسخ بده و دانسته‌هایت را محک بزن.",
    icon: "#icon-game-science",
    iconClass: "bg-secondary/10 text-secondary dark:bg-secondary/15",
    glowClass: "bg-secondary/10",
    badgeClass: "bg-secondary/10 text-secondary dark:bg-secondary/15",
    tutorial: {
      title: "مسابقه علوم چطور انجام می‌شود؟",
      description:
        "یک پوشه علوم انتخاب می‌کنی و سؤال‌های همان پوشه را یکی‌یکی پاسخ می‌دهی.",
      steps: [
        "سؤال را بخوان و جوابش را در ذهن یا با صدای بلند بگو.",
        "وقتی آماده بودی، پاسخ درست را نمایش بده و با جواب خودت مقایسه کن.",
        "اگر درست جواب دادی «درست» و اگر اشتباه بود «غلط» را انتخاب کن.",
        "اگر نمی‌خواهی به یک سؤال جواب بدهی، می‌توانی آن را رد کنی.",
      ],
    },
  });

  const runtime = {
    phase: PHASE.READY,
    user: null,
    folder: null,
    questions: [],
    questionIndex: 0,
    currentQuestion: null,
    dropdownAbortController: null,
    cardBusy: false,
  };

  const getStage = () => {
    return document.getElementById("game-stage-content");
  };

  const setPhase = (phase) => {
    runtime.phase = phase;
  };

  const shuffleItems = (items) => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }

    return shuffled;
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

  const getAvailableFolders = async () => {
    if (!window.folderService || !window.scienceQuestionService) {
      throw new Error("SCIENCE_SERVICES_MISSING");
    }

    const folders = await window.folderService.getFoldersByType("science");

    return folders.filter(
      (folder) =>
        Number(folder.questionCount || 0) >= MIN_SCIENCE_QUESTIONS,
    );
  };

  const clearDropdownEvents = () => {
    runtime.dropdownAbortController?.abort();
    runtime.dropdownAbortController = null;
  };

  const initFolderDropdown = () => {
    clearDropdownEvents();

    const dropdown = document.getElementById("science-game-folder-dropdown");
    const trigger = document.getElementById("science-game-folder-trigger");
    const menu = document.getElementById("science-game-folder-menu");
    const valueElement = document.getElementById("science-game-folder-value");
    const input = document.getElementById("science-game-folder");
    const chevron = document.getElementById("science-game-folder-chevron");
    const options = Array.from(
      document.querySelectorAll(".science-game-folder-option"),
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

    const controller = new AbortController();
    const { signal } = controller;
    runtime.dropdownAbortController = controller;

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
          .querySelector(".science-game-folder-option-label")
          ?.textContent.trim() || "";

      input.value = value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
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
          .querySelector(".science-game-folder-check")
          ?.classList.toggle("hidden", !selected);
      });

      closeDropdown(true);
    };

    trigger.addEventListener(
      "click",
      () => {
        if (trigger.getAttribute("aria-expanded") === "true") {
          closeDropdown();
        } else {
          openDropdown();
        }
      },
      { signal },
    );

    trigger.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openDropdown();
        }
      },
      { signal },
    );

    options.forEach((option, index) => {
      option.addEventListener("click", () => selectFolder(option), { signal });

      option.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            activeIndex = (index + 1) % options.length;
            options[activeIndex]?.focus();
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            activeIndex = (index - 1 + options.length) % options.length;
            options[activeIndex]?.focus();
            return;
          }

          if (event.key === "Home") {
            event.preventDefault();
            activeIndex = 0;
            options[activeIndex]?.focus();
            return;
          }

          if (event.key === "End") {
            event.preventDefault();
            activeIndex = options.length - 1;
            options[activeIndex]?.focus();
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectFolder(option);
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            closeDropdown(true);
          }
        },
        { signal },
      );
    });

    document.addEventListener(
      "click",
      (event) => {
        if (
          !dropdown.contains(event.target) &&
          trigger.getAttribute("aria-expanded") === "true"
        ) {
          closeDropdown();
        }
      },
      { signal },
    );
  };

  const renderSetup = async ({ engine, shell }) => {
    setPhase(PHASE.SETUP);

    const stage = getStage();
    if (!stage) return;

    let folders = [];

    try {
      folders = await getAvailableFolders();
    } catch (error) {
      console.error("Failed to load science folders:", error);
      showError("پوشه‌های علوم در دسترس نیستند.");
    }

    if (!folders.length) {
      await shell.animateStage(() => {
        stage.innerHTML = `
          <div class="mx-auto max-w-xl text-center">
            <div
              class="mx-auto mb-5 flex size-14 items-center justify-center rounded-md bg-secondary/10 text-secondary dark:bg-secondary/15"
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
                  d="M9 3h6v4l4 7a4 4 0 0 1-3.5 6h-7A4 4 0 0 1 5 14l4-7V3Z"
                ></path>
                <path stroke-linecap="round" d="M8 14h8"></path>
              </svg>
            </div>

            <h2 class="mb-3">
              هنوز سؤال علوم آماده بازی نداری
            </h2>

            <p class="mx-auto max-w-md text-mutedColor dark:text-mutedColor-dark">
              برای شروع مسابقه، یک پوشه علوم با حداقل
              ${shell.toPersianNumber(MIN_SCIENCE_QUESTIONS)}
              سؤال لازم داری.
            </p>

            <a
              href="./dashboard.html?view=add-science-question"
              class="btn-primary mt-7"
            >
              افزودن سؤال علوم
            </a>
          </div>
        `;
      });

      return;
    }

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div class="mx-auto w-full max-w-xl">
          <div class="mb-7 text-center">
            <span
              class="ui-badge mb-3 bg-secondary/10 text-secondary dark:bg-secondary/15"
            >
              انتخاب سؤال‌ها
            </span>

            <h2 class="mb-2">
              از کدوم پوشه بازی کنیم؟
            </h2>

            <p class="text-mutedColor dark:text-mutedColor-dark">
              سؤال‌های پوشه‌ای که انتخاب می‌کنی به ترتیب تصادفی در مسابقه نمایش داده می‌شن.
            </p>
          </div>

          <form id="science-game-setup-form" class="space-y-5" novalidate>
            <div class="form-group">
              <label id="science-game-folder-label" class="form-label">
                پوشه علوم
                <span class="form-required" aria-hidden="true">*</span>
              </label>

              <div id="science-game-folder-dropdown" class="relative">
                <input
                  type="hidden"
                  id="science-game-folder"
                  name="folderId"
                  value=""
                />

                <button
                  type="button"
                  id="science-game-folder-trigger"
                  aria-labelledby="science-game-folder-label science-game-folder-value"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="science-game-folder-menu"
                  class="form-control form-select-trigger"
                >
                  <span
                    id="science-game-folder-value"
                    class="text-mutedColor/60 dark:text-mutedColor-dark/50"
                  >
                    یک پوشه علوم انتخاب کن
                  </span>

                  <svg
                    id="science-game-folder-chevron"
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
                  id="science-game-folder-menu"
                  role="listbox"
                  aria-labelledby="science-game-folder-label"
                  tabindex="-1"
                  class="form-dropdown-menu hidden"
                >
                  ${folders
                    .map(
                      (folder) => `
                        <button
                          type="button"
                          role="option"
                          aria-selected="false"
                          data-value="${shell.escapeGameHtml(folder.id)}"
                          class="science-game-folder-option form-option"
                        >
                          <span class="min-w-0">
                            <span
                              class="science-game-folder-option-label block truncate"
                            >
                              ${shell.escapeGameHtml(folder.title)}
                            </span>

                            <span class="ui-meta mt-1 block">
                              ${shell.toPersianNumber(folder.questionCount)} سؤال
                            </span>
                          </span>

                          <span
                            class="science-game-folder-check hidden shrink-0 text-primary dark:text-primary-light"
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        </button>
                      `,
                    )
                    .join("")}
                </div>
              </div>

              <span
                id="science-game-folder-error"
                class="form-error hidden"
                role="alert"
              ></span>

              <span class="form-help">
                فقط پوشه‌هایی که حداقل
                ${shell.toPersianNumber(MIN_SCIENCE_QUESTIONS)}
                سؤال دارند قابل انتخاب هستند.
              </span>
            </div>

            <button type="submit" class="btn-primary w-full">
              شروع سؤال‌ها
            </button>
          </form>
        </div>
      `;
    });

    initFolderDropdown();
    initSetupForm({ engine, shell, folders });
  };

  const initSetupForm = ({ engine, shell, folders }) => {
    const form = document.getElementById("science-game-setup-form");
    const folderInput = document.getElementById("science-game-folder");
    const folderError = document.getElementById("science-game-folder-error");

    if (!form || !folderInput || !folderError) return;

    const clearError = () => {
      folderError.textContent = "";
      folderError.classList.add("hidden");
    };

    const showFieldError = (message) => {
      folderError.textContent = message;
      folderError.classList.remove("hidden");
    };

    folderInput.addEventListener("change", clearError);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearError();

      const folderId = folderInput.value.trim();
      const folder = folders.find((item) => item.id === folderId);

      if (!folder) {
        showFieldError("یک پوشه علوم برای مسابقه انتخاب کن.");
        return;
      }

      if (Number(folder.questionCount || 0) < MIN_SCIENCE_QUESTIONS) {
        showFieldError(
          `پوشه باید حداقل ${shell.toPersianNumber(
            MIN_SCIENCE_QUESTIONS,
          )} سؤال داشته باشد.`,
        );
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add("opacity-60", "cursor-not-allowed");
        submitButton.classList.remove("cursor-pointer");
      }

      try {
        const questions =
          await window.scienceQuestionService.getQuestionsByFolder(folder.id);

        if (questions.length < MIN_SCIENCE_QUESTIONS) {
          throw new Error("SCIENCE_GAME_FOLDER_TOO_SMALL");
        }

        runtime.folder = folder;
        runtime.questions = shuffleItems(questions);
        runtime.questionIndex = 0;
        runtime.currentQuestion = null;

        clearDropdownEvents();

        engine.start({
          context: {
            folderId: folder.id,
            folderTitle: folder.title,
            questionCount: questions.length,
          },
          currentPlayerId: runtime.user.id,
        });

        await beginNextQuestion({ engine, shell });
      } catch (error) {
        console.error("Failed to start science game:", error);

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove("opacity-60", "cursor-not-allowed");
          submitButton.classList.add("cursor-pointer");
        }

        showFieldError(
          error?.message === "SCIENCE_GAME_FOLDER_TOO_SMALL"
            ? `این پوشه باید حداقل ${shell.toPersianNumber(
                MIN_SCIENCE_QUESTIONS,
              )} سؤال قابل استفاده داشته باشد.`
            : "شروع مسابقه انجام نشد. دوباره تلاش کن.",
        );
      }
    });
  };

  const beginNextQuestion = async ({ engine, shell }) => {
    if (runtime.questionIndex >= runtime.questions.length) {
      await finishGame({ engine, shell, reason: "questions-completed" });
      return;
    }

    runtime.currentQuestion = runtime.questions[runtime.questionIndex];
    runtime.questionIndex += 1;

    engine.beginRound({
      currentPlayerId: runtime.user.id,
      payload: {
        questionId: runtime.currentQuestion.id,
        folderId: runtime.folder.id,
      },
    });

    await renderQuestion({ engine, shell });
  };

  const renderQuestion = async ({ engine, shell }) => {
    setPhase(PHASE.QUESTION);
    runtime.cardBusy = false;

    const stage = getStage();
    const question = runtime.currentQuestion;

    if (!stage || !question) return;

    const currentNumber = engine.getSnapshot().round;
    const totalQuestions = runtime.questions.length;

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div class="mx-auto w-full max-w-2xl text-center">
          <span
            class="ui-badge mb-5 bg-secondary/10 text-secondary dark:bg-secondary/15"
          >
            سؤال ${shell.toPersianNumber(currentNumber)} از ${shell.toPersianNumber(totalQuestions)}
          </span>

          <div
            id="science-flashcard"
            class="game-flashcard game-flashcard--science"
            aria-label="فلش کارت سؤال علوم"
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
                    سؤال
                  </span>

                  <h2 class="mb-5 max-w-lg">
                    ${shell.escapeGameHtml(question.question)}
                  </h2>

                  <span class="game-flashcard__hint">
                    اول جواب خودت را بگو، بعد کارت را برگردان.
                  </span>
                </div>
              </article>

              <article
                data-flashcard-back
                class="game-flashcard__face game-flashcard__face--back"
                aria-hidden="true"
              >
                <div class="game-flashcard__content">
                  <span class="ui-eyebrow mb-4 block">
                    پاسخ درست
                  </span>

                  <p class="game-flashcard__answer max-w-lg">
                    ${shell.escapeGameHtml(question.answer)}
                  </p>

                  <span class="game-flashcard__hint mt-5">
                    جوابت را با پاسخ پشت کارت مقایسه کن.
                  </span>
                </div>
              </article>
            </div>
          </div>

          <div
            id="science-question-actions"
            class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <button
              type="button"
              id="science-reveal-answer"
              class="btn-primary"
            >
              دیدن پاسخ
            </button>

            <button
              type="button"
              id="science-skip-question"
              class="btn-ghost-secondary"
            >
              رد کردن سؤال
            </button>
          </div>

          <div
            id="science-review-actions"
            class="mt-12 hidden"
          >
            <p class="mx-auto mb-4 max-w-lg text-mutedColor dark:text-mutedColor-dark">
              پاسخت چطور بود؟
            </p>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                data-science-outcome="correct"
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
                درست جواب دادم
              </button>

              <button
                type="button"
                data-science-outcome="wrong"
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
                اشتباه جواب دادم
              </button>
            </div>
          </div>
        </div>
      `;
    });

    const card = document.getElementById("science-flashcard");
    shell.animateGameFlashcardIn?.(card);

    document.getElementById("science-reveal-answer")?.addEventListener(
      "click",
      () => {
        renderReview({ engine, shell });
      },
      { once: true },
    );

    document.getElementById("science-skip-question")?.addEventListener(
      "click",
      () => {
        if (runtime.cardBusy) return;

        recordOutcome({
          engine,
          shell,
          outcome: window.GameEngine.OUTCOME.SKIP,
        });
      },
      { once: true },
    );

    stage.querySelectorAll("[data-science-outcome]").forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          if (runtime.cardBusy) return;

          const outcome =
            button.dataset.scienceOutcome === "correct"
              ? window.GameEngine.OUTCOME.CORRECT
              : window.GameEngine.OUTCOME.WRONG;

          recordOutcome({ engine, shell, outcome });
        },
        { once: true },
      );
    });
  };

  const renderReview = async ({ engine, shell }) => {
    if (runtime.phase !== PHASE.QUESTION || runtime.cardBusy) {
      return;
    }

    const card = document.getElementById("science-flashcard");
    const questionActions = document.getElementById("science-question-actions");
    const reviewActions = document.getElementById("science-review-actions");
    const revealButton = document.getElementById("science-reveal-answer");
    const skipButton = document.getElementById("science-skip-question");

    if (!card || !questionActions || !reviewActions) {
      return;
    }

    runtime.cardBusy = true;
    revealButton?.setAttribute("disabled", "");
    skipButton?.setAttribute("disabled", "");

    await shell.flipGameFlashcard(card, {
      toBack: true,
    });

    setPhase(PHASE.REVIEW);

    questionActions.classList.add("hidden");
    reviewActions.classList.remove("hidden");

    await shell.revealGameActionGroup?.(reviewActions);

    runtime.cardBusy = false;
  };

  const recordOutcome = async ({ engine, shell, outcome }) => {
    const question = runtime.currentQuestion;

    if (!question) return;

    const isSkip = outcome === window.GameEngine.OUTCOME.SKIP;
    const isAssessment =
      outcome === window.GameEngine.OUTCOME.CORRECT ||
      outcome === window.GameEngine.OUTCOME.WRONG;

    if (isSkip && runtime.phase !== PHASE.QUESTION) return;
    if (isAssessment && runtime.phase !== PHASE.REVIEW) return;

    // Lock this round before mutating the engine so fast double-clicks
    // cannot submit two outcomes for the same question.
    setPhase(PHASE.FEEDBACK);

    engine.recordOutcome({
      outcome,
      participantId: runtime.user.id,
      metadata: {
        questionId: question.id,
        question: question.question,
        answer: question.answer,
        folderId: runtime.folder.id,
      },
    });

    await renderFeedback({ engine, shell, outcome });
  };

  const renderFeedback = async ({ engine, shell, outcome }) => {
    setPhase(PHASE.FEEDBACK);

    const stage = getStage();
    const question = runtime.currentQuestion;

    if (!stage || !question) return;

    const isCorrect = outcome === window.GameEngine.OUTCOME.CORRECT;
    const isWrong = outcome === window.GameEngine.OUTCOME.WRONG;
    const isLastQuestion = runtime.questionIndex >= runtime.questions.length;

    const feedback = isCorrect
      ? {
          title: "آفرین، درست جواب دادی",
          label: "+۱ امتیاز",
          iconClass:
            "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light",
          badgeClass:
            "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light",
        }
      : isWrong
        ? {
            title: "این یکی نیاز به مرور داشت",
            label: "−۱ امتیاز",
            iconClass: "bg-secondary/10 text-secondary dark:bg-secondary/15",
            badgeClass: "bg-secondary/10 text-secondary dark:bg-secondary/15",
          }
        : {
            title: "سؤال رد شد",
            label: "بدون تغییر امتیاز",
            iconClass:
              "bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark",
            badgeClass:
              "bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark",
          };

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div class="mx-auto w-full max-w-2xl text-center">
          <div
            class="mx-auto mb-5 flex size-16 items-center justify-center rounded-lg ${feedback.iconClass}"
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
                  : isWrong
                    ? `
                      <path
                        stroke-linecap="round"
                        d="m8 8 8 8M16 8l-8 8"
                      ></path>
                    `
                    : `
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m9 18 6-6-6-6"
                      ></path>
                    `
              }
            </svg>
          </div>

          <span class="ui-badge mb-3 ${feedback.badgeClass}">
            ${feedback.label}
          </span>

          <h2 class="mb-5">
            ${feedback.title}
          </h2>

          <div
            class="mx-auto max-w-xl rounded-lg border border-white/70 bg-surface-soft px-5 py-6 text-right dark:border-border-dark-soft dark:bg-surface-dark-soft sm:px-7"
          >
            <span class="ui-label mb-2 block">
              پاسخ درست
            </span>

            <p class="text-textColor dark:text-textColor-dark">
              ${shell.escapeGameHtml(question.answer)}
            </p>
          </div>

          <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              id="science-next-question"
              class="btn-primary"
            >
              ${isLastQuestion ? "دیدن نتیجه" : "سؤال بعدی"}
            </button>

            ${
              isLastQuestion
                ? ""
                : `
                  <button
                    type="button"
                    id="science-finish-game"
                    class="btn-ghost-secondary"
                  >
                    پایان مسابقه
                  </button>
                `
            }
          </div>
        </div>
      `;
    });

    document.getElementById("science-next-question")?.addEventListener(
      "click",
      () => {
        if (isLastQuestion) {
          finishGame({ engine, shell, reason: "questions-completed" });
          return;
        }

        beginNextQuestion({ engine, shell });
      },
      { once: true },
    );

    document.getElementById("science-finish-game")?.addEventListener(
      "click",
      () => {
        finishGame({ engine, shell, reason: "user-finished" });
      },
      { once: true },
    );
  };

  const resetRuntime = () => {
    clearDropdownEvents();
    runtime.phase = PHASE.READY;
    runtime.folder = null;
    runtime.questions = [];
    runtime.questionIndex = 0;
    runtime.currentQuestion = null;
    runtime.cardBusy = false;
  };

  const finishGame = async ({ engine, shell, reason }) => {
    if (engine.getSnapshot().status === window.GameEngine.STATUS.PLAYING) {
      engine.finish({
        metadata: {
          reason,
          folderId: runtime.folder?.id || null,
          folderTitle: runtime.folder?.title || null,
        },
      });
    }

    setPhase(PHASE.FINISHED);

    const result = engine.getResult();

    let resultSaved = false;

    try {
      await window.gameResultService.saveEngineResult({
        engineResult: result,
        userId: runtime.user?.id,
      });
      resultSaved = true;
    } catch (error) {
      console.error("Failed to save science result:", error);

      window.apiErrors?.showToast(error, {
        title: "نتیجه علوم ذخیره نشد",
        fallbackMessage: "نتیجه مسابقه روی سرور ذخیره نشد. دوباره تلاش کن.",
      });
    }

    const player = result.participants[0];
    const answered = Number(player?.correct || 0) + Number(player?.wrong || 0);
    const accuracy =
      answered > 0
        ? Math.round((Number(player?.correct || 0) / answered) * 100)
        : 0;

    const stage = getStage();
    if (!stage) return;

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div class="mx-auto w-full max-w-2xl text-center">
          <span
            class="ui-badge mb-4 bg-secondary/10 text-secondary dark:bg-secondary/15"
          >
            مسابقه تمام شد
          </span>

          <h2 class="mb-2">
            نتیجه علوم تو
          </h2>

          <p class="mx-auto mb-7 max-w-lg text-mutedColor dark:text-mutedColor-dark">
            ${shell.toPersianNumber(result.rounds)} سؤال از پوشه «${shell.escapeGameHtml(runtime.folder?.title || "علوم")}» مرور کردی.
            ${
              resultSaved
                ? " نتیجه این بازی ذخیره شد."
                : " نتیجه بازی نمایش داده شد، اما ذخیره آن انجام نشد."
            }
          </p>

          <div class="grid gap-3 sm:grid-cols-4">
            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span class="ui-meta mb-2 block">امتیاز</span>
              <strong class="game-result-value text-primary dark:text-primary-light">
                ${shell.toPersianNumber(player?.score || 0)}
              </strong>
            </div>

            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span class="ui-meta mb-2 block">درست</span>
              <strong class="game-result-value text-primary dark:text-primary-light">
                ${shell.toPersianNumber(player?.correct || 0)}
              </strong>
            </div>

            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span class="ui-meta mb-2 block">غلط</span>
              <strong class="game-result-value text-secondary">
                ${shell.toPersianNumber(player?.wrong || 0)}
              </strong>
            </div>

            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span class="ui-meta mb-2 block">دقت پاسخ‌ها</span>
              <strong class="game-result-value text-textColor dark:text-textColor-dark">
                ${shell.toPersianNumber(accuracy)}٪
              </strong>
            </div>
          </div>

          ${
            Number(player?.skipped || 0) > 0
              ? `
                <p class="mx-auto mt-4 max-w-lg text-mutedColor dark:text-mutedColor-dark">
                  ${shell.toPersianNumber(player.skipped)} سؤال را بدون تغییر امتیاز رد کردی.
                </p>
              `
              : ""
          }

          <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              id="science-play-again"
              class="btn-primary"
            >
              بازی دوباره
            </button>

            <a href="./dashboard.html" class="btn-ghost">
              بازگشت به داشبورد
            </a>
          </div>
        </div>
      `;
    });

    document.getElementById("science-play-again")?.addEventListener(
      "click",
      () => {
        engine.reset();
        resetRuntime();
        renderSetup({ engine, shell });
      },
      { once: true },
    );
  };

  const createEngine = ({ user }) => {
    runtime.user = user;

    return window.GameEngine.create({
      gameType: "science",
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
    await renderSetup({ engine, shell });
  };

  window.ScienceGame = Object.freeze({
    type: "science",
    config,
    createEngine,
    onStart,
  });
})();
