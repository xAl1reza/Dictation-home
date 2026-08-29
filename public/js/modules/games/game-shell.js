/*
 * Shared game shell.
 *
 * Owns common UI, scorebar, tutorial and transitions.
 * Game-specific rules stay inside each game module.
 */

(() => {
  const TUTORIAL_STORAGE_PREFIX = "dikteh-khooneh-game-tutorial-v1";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const toPersianNumber = (value) => {
    return new Intl.NumberFormat("fa-IR").format(Number(value || 0));
  };

  const escapeGameHtml = (value = "") => {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const setText = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  };

  const getTutorialStorageKey = (type) => {
    return `${TUTORIAL_STORAGE_PREFIX}:${type}`;
  };

  const hasSeenTutorial = (type) => {
    try {
      return window.localStorage.getItem(getTutorialStorageKey(type)) === "1";
    } catch {
      return false;
    }
  };

  const markTutorialSeen = (type) => {
    try {
      window.localStorage.setItem(getTutorialStorageKey(type), "1");
    } catch {
      // Tutorial state is optional if storage is unavailable.
    }
  };

  const renderSinglePlayerScorebar = (participant, round) => {
    return `
      <div
        class="min-w-0 px-3 py-4 text-center sm:px-5"
      >
        <span
          class="game-score-label mb-1 block"
        >
          بازیکن
        </span>

        <strong
          class="game-player-name block truncate"
        >
          ${escapeGameHtml(participant?.name || "بازیکن")}
        </strong>
      </div>

      <div
        class="border-x border-textColor/5 px-3 py-4 text-center dark:border-border-dark-soft sm:px-5"
      >
        <span
          class="game-score-label mb-1 block"
        >
          دور
        </span>

        <strong
          class="game-score-value text-textColor dark:text-textColor-dark"
        >
          ${toPersianNumber(round)}
        </strong>
      </div>

      <div
        class="px-3 py-4 text-center sm:px-5"
      >
        <span
          class="game-score-label mb-1 block"
        >
          امتیاز بازی
        </span>

        <strong
          class="game-score-value text-primary dark:text-primary-light"
        >
          ${toPersianNumber(participant?.score || 0)}
        </strong>
      </div>
    `;
  };

  const renderTwoPlayerScorebar = (participants, round, currentPlayerId) => {
    const [playerOne, playerTwo] = participants;

    const createPlayerCell = (participant) => {
      const isCurrent = participant?.id === currentPlayerId;

      return `
        <div
          class="min-w-0 px-3 py-4 text-center sm:px-5"
        >
          <span
            class="game-score-label mb-1 flex items-center justify-center gap-1.5"
          >
            ${
              isCurrent
                ? `
                  <span
                    class="size-1.5 rounded-full bg-primary"
                    aria-hidden="true"
                  ></span>
                `
                : ""
            }

            ${participant?.isGuest ? "بازیکن مهمان" : "بازیکن"}
          </span>

          <strong
            class="game-player-name block truncate"
          >
            ${escapeGameHtml(participant?.name || "بازیکن")}
          </strong>

          <span
            class="game-score-value mt-1 block ${ isCurrent ?"text-primary dark:text-primary-light"
                : "text-textColor dark:text-textColor-dark"
            }"
          >
            ${toPersianNumber(participant?.score || 0)} امتیاز
          </span>
        </div>
      `;
    };

    return `
      ${createPlayerCell(playerOne)}

      <div
        class="border-x border-textColor/5 px-3 py-4 text-center dark:border-border-dark-soft sm:px-5"
      >
        <span
          class="game-score-label mb-1 block"
        >
          دور
        </span>

        <strong
          class="game-score-value text-textColor dark:text-textColor-dark"
        >
          ${toPersianNumber(round)}
        </strong>
      </div>

      ${createPlayerCell(playerTwo)}
    `;
  };

  const renderScorebar = (snapshot) => {
    const grid = document.getElementById("game-scorebar-grid");

    if (!grid) return;

    const participants = Array.isArray(snapshot.participants)
      ? snapshot.participants
      : [];

    if (participants.length >= 2) {
      grid.innerHTML = renderTwoPlayerScorebar(
        participants.slice(0, 2),
        snapshot.round,
        snapshot.currentPlayerId,
      );

      return;
    }

    grid.innerHTML = renderSinglePlayerScorebar(
      participants[0],
      snapshot.round,
    );
  };

  const updateEngineUI = (snapshot) => {
    renderScorebar(snapshot);

    const status = document.getElementById("game-status");

    if (!status) return;

    if (snapshot.status === window.GameEngine.STATUS.PLAYING) {
      status.textContent = "در حال اجرا";
      status.className =
        "ui-badge shrink-0 gap-2 bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light";
      return;
    }

    if (snapshot.status === window.GameEngine.STATUS.FINISHED) {
      status.textContent = "پایان یافته";
      status.className =
        "ui-badge shrink-0 gap-2 bg-secondary/10 text-secondary dark:bg-secondary/15";
      return;
    }

    status.textContent = "آماده";
    status.className =
      "ui-badge shrink-0 gap-2 bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark";
  };

  const setGameIcon = (config) => {
    const iconWrap = document.getElementById("game-icon-wrap");
    const iconUse = document.getElementById("game-icon-use");
    const glow = document.getElementById("game-stage-glow");

    if (iconWrap) {
      iconWrap.className = `flex size-12 shrink-0 items-center justify-center rounded-md ${config.iconClass}`;
    }

    iconUse?.setAttribute("href", config.icon);

    if (glow) {
      glow.className = `pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full blur-[100px] ${config.glowClass}`;
    }
  };

  const renderInvalidGame = () => {
    document.title = "مسابقه | دیکته خونه";

    const main = document.getElementById("game-main");

    if (!main) return;

    main.innerHTML = `
      <section
        class="mx-auto max-w-2xl rounded-lg border border-secondary/15 bg-secondary/5 px-6 py-12 text-center"
      >
        <div
          class="mx-auto mb-5 flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            class="size-5"
          >
            <path
              stroke-linecap="round"
              d="M12 8v5M12 17h.01"
            ></path>
            <circle cx="12" cy="12" r="9"></circle>
          </svg>
        </div>

        <h1 class="mb-3">
          بازی پیدا نشد
        </h1>

        <p
          class="mx-auto mb-7 max-w-md text-mutedColor dark:text-mutedColor-dark"
        >
          نوع مسابقه مشخص نیست. از داشبورد یکی از بازی‌ها را انتخاب کن.
        </p>

        <a
          href="./dashboard.html"
          class="btn-primary"
        >
          بازگشت به داشبورد
        </a>
      </section>
    `;
  };

  const animateStage = async (render) => {
    const stage = document.getElementById("game-stage-content");

    if (!stage) {
      render();
      return;
    }

    if (prefersReducedMotion || typeof stage.animate !== "function") {
      render();
      return;
    }

    const exit = stage.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(8px)" },
      ],
      {
        duration: 150,
        easing: "ease-out",
      },
    );

    try {
      await exit.finished;
    } catch {
      // Fast interactions can cancel animations.
    }

    render();

    const enter = stage.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 240,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );

    try {
      await enter.finished;
    } catch {
      // Fast interactions can cancel animations.
    }
  };

  const renderReadyStage = (config) => {
    const stage = document.getElementById("game-stage-content");

    if (!stage) return;

    stage.innerHTML = `
      <div class="mx-auto max-w-2xl text-center">
        <span
          class="ui-badge mb-5 items-center ${config.badgeClass}"
        >
          آماده شروع
        </span>

        <div
          class="mx-auto mb-6 flex size-20 items-center justify-center rounded-lg ${config.iconClass} shadow-card dark:shadow-card-dark"
          aria-hidden="true"
        >
          <svg viewBox="0 0 50 50" class="size-10">
            <use href="${config.icon}"></use>
          </svg>
        </div>

        <h2 class="mb-3">
          برای شروع آماده‌ای؟
        </h2>

        <p
          class="mx-auto max-w-xl text-mutedColor dark:text-mutedColor-dark"
        >
          ${escapeGameHtml(config.description)}
        </p>

        <button
          type="button"
          data-game-start
          class="btn-primary mt-8 gap-2"
        >
          شروع مسابقه

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            class="size-4 rotate-180"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m9 18 6-6-6-6"
            ></path>
          </svg>
        </button>
      </div>
    `;
  };

  const renderEngineReadyStage = (config) => {
    const stage = document.getElementById("game-stage-content");

    if (!stage) return;

    stage.innerHTML = `
      <div class="mx-auto max-w-2xl text-center">
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
              d="m7 12 3 3 7-7"
            ></path>
            <circle cx="12" cy="12" r="9"></circle>
          </svg>
        </div>

        <span
          class="ui-badge mb-4 bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
        >
          موتور بازی فعال است
        </span>

        <h2 class="mb-3">
          محیط ${escapeGameHtml(config.title)} آماده شد
        </h2>

        <p
          class="mx-auto max-w-xl text-mutedColor dark:text-mutedColor-dark"
        >
          پوسته و چرخه بازی فعال شده. محتوای اختصاصی هر مسابقه در مرحله بعد داخل همین بخش قرار می‌گیرد.
        </p>

        <button
          type="button"
          data-game-shell-reset
          class="btn-ghost mt-7"
        >
          بازگشت به حالت آماده
        </button>
      </div>
    `;
  };

  const animateTutorialOpen = async (panel, backdrop) => {
    if (prefersReducedMotion || typeof panel?.animate !== "function") {
      return;
    }

    panel.getAnimations().forEach((animation) => animation.cancel());
    backdrop?.getAnimations().forEach((animation) => animation.cancel());

    const panelAnimation = panel.animate(
      [
        { opacity: 0, transform: "translateY(-28px) scale(0.985)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );

    const backdropAnimation = backdrop?.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: 320,
        easing: "ease-out",
      },
    );

    try {
      await Promise.all(
        [panelAnimation.finished, backdropAnimation?.finished].filter(Boolean),
      );
    } catch {
      // Fast interactions can cancel animations.
    }
  };

  const animateTutorialClose = async (panel, backdrop) => {
    if (prefersReducedMotion || typeof panel?.animate !== "function") {
      return;
    }

    panel.getAnimations().forEach((animation) => animation.cancel());
    backdrop?.getAnimations().forEach((animation) => animation.cancel());

    const panelAnimation = panel.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-22px) scale(0.99)" },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
      },
    );

    const backdropAnimation = backdrop?.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: 240,
        easing: "ease-in",
      },
    );

    try {
      await Promise.all(
        [panelAnimation.finished, backdropAnimation?.finished].filter(Boolean),
      );
    } catch {
      // Fast interactions can cancel animations.
    }
  };

  const showTutorial = (type, config) => {
    if (!config?.tutorial || hasSeenTutorial(type)) return;

    const modal = document.getElementById("game-tutorial-modal");
    const panel = document.getElementById("game-tutorial-panel");
    const backdrop = document.getElementById("game-tutorial-backdrop");
    const title = document.getElementById("game-tutorial-title");
    const description = document.getElementById("game-tutorial-description");
    const steps = document.getElementById("game-tutorial-steps");
    const confirmButton = document.getElementById("game-tutorial-confirm");
    const iconWrap = document.getElementById("game-tutorial-icon-wrap");
    const iconUse = document.getElementById("game-tutorial-icon-use");
    const glow = document.getElementById("game-tutorial-glow");

    if (
      !modal ||
      !panel ||
      !title ||
      !description ||
      !steps ||
      !confirmButton
    ) {
      return;
    }

    title.textContent = config.tutorial.title;
    description.textContent = config.tutorial.description;

    steps.innerHTML = config.tutorial.steps
      .map(
        (step, index) => `
          <div
            class="flex items-start gap-3 rounded-md border border-white/70 bg-surface-soft px-4 py-3.5 dark:border-border-dark-soft dark:bg-surface-dark-soft"
          >
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ui-step-index text-primary dark:bg-primary/15 dark:text-primary-light"
            >
              ${toPersianNumber(index + 1)}
            </span>

            <p
              class="text-mutedColor dark:text-mutedColor-dark"
            >
              ${escapeGameHtml(step)}
            </p>
          </div>
        `,
      )
      .join("");

    if (iconWrap) {
      iconWrap.className = `mb-5 flex size-12 items-center justify-center rounded-md ${config.iconClass}`;
    }

    iconUse?.setAttribute("href", config.icon);

    if (glow) {
      glow.className = `pointer-events-none absolute -top-16 -left-16 size-40 rounded-full blur-[70px] ${config.glowClass}`;
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");

    requestAnimationFrame(() => {
      animateTutorialOpen(panel, backdrop);
      confirmButton.focus();
    });

    confirmButton.addEventListener(
      "click",
      async () => {
        confirmButton.disabled = true;
        markTutorialSeen(type);

        await animateTutorialClose(panel, backdrop);

        modal.classList.add("hidden");
        modal.classList.remove("flex");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("overflow-hidden");
        confirmButton.disabled = false;

        document.querySelector("[data-game-start]")?.focus();
      },
      { once: true },
    );
  };

  const animateGamePageIn = () => {
    const main = document.getElementById("game-main");

    if (!main || prefersReducedMotion || typeof main.animate !== "function") {
      return;
    }

    main.animate(
      [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  };

  const applyGameIdentity = ({ config, totalScore }) => {
    document.title = `${config.title} | دیکته خونه`;

    setText("game-eyebrow", config.eyebrow);
    setText("game-title", config.title);
    setText("game-description", config.description);
    setText("game-total-score", toPersianNumber(totalScore));
    setGameIcon(config);
  };

  const startDefaultGame = async ({ engine, config }) => {
    engine.start();
    engine.beginRound();

    await animateStage(() => {
      renderEngineReadyStage(config);
    });
  };

  const resetDefaultGame = async ({ engine, config }) => {
    engine.reset();

    await animateStage(() => {
      renderReadyStage(config);
    });
  };

  const initStageEvents = ({ engine, config, gameModule }) => {
    const stage = document.getElementById("game-stage-content");
    if (!stage) return;

    stage.addEventListener("click", async (event) => {
      const startButton = event.target.closest("[data-game-start]");
      const resetButton = event.target.closest("[data-game-shell-reset]");

      if (startButton) {
        if (typeof gameModule.onStart === "function") {
          await gameModule.onStart({
            engine,
            config,
            shell: window.GameShell,
          });
        } else {
          await startDefaultGame({ engine, config });
        }
        return;
      }

      if (resetButton) {
        if (typeof gameModule.onReset === "function") {
          await gameModule.onReset({
            engine,
            config,
            shell: window.GameShell,
          });
        } else {
          await resetDefaultGame({ engine, config });
        }
      }
    });
  };

  const init = ({ type, gameModule, user, totalScore }) => {
    if (!gameModule?.config || typeof gameModule.createEngine !== "function") {
      throw new Error("GAME_MODULE_INVALID");
    }

    const config = gameModule.config;

    animateGamePageIn();
    applyGameIdentity({ config, totalScore });

    const engine = gameModule.createEngine({ user });
    window.currentGameEngine = engine;

    engine.subscribe((snapshot) => {
      updateEngineUI(snapshot);

      if (typeof gameModule.onStateChange === "function") {
        gameModule.onStateChange({
          snapshot,
          engine,
          shell: window.GameShell,
        });
      }
    });

    renderReadyStage(config);
    initStageEvents({ engine, config, gameModule });
    showTutorial(type, config);

    return engine;
  };

  window.GameShell = Object.freeze({
    init,
    renderInvalidGame,
    renderReadyStage,
    renderEngineReadyStage,
    renderScorebar,
    updateEngineUI,
    animateStage,
    animateGamePageIn,
    toPersianNumber,
    escapeGameHtml,
  });
})();
