/*
 * Math game.
 *
 * Single-player flow:
 * QUESTION → FEEDBACK → QUESTION ... → FINISHED
 *
 * Questions are generated from the built-in product math configuration.
 * Results are persisted through gameResultService.
 */

(() => {
  const PHASE = Object.freeze({
    READY: "ready",
    QUESTION: "question",
    FEEDBACK: "feedback",
    FINISHED: "finished",
  });

  const MAX_MATH_NUMBER = 9;

  const DEFAULT_MATH_CONFIG = Object.freeze({
    minNumber: 1,
    maxNumber: MAX_MATH_NUMBER,
    operators: ["+", "-", "*", "/"],
  });

  const OPERATOR_LABELS = Object.freeze({
    "+": "+",
    "-": "−",
    "*": "×",
    "×": "×",
    x: "×",
    "/": "÷",
    "÷": "÷",
  });

  const config = Object.freeze({
    title: "ریاضی",
    eyebrow: "مسابقه ریاضی",
    description: "مسئله‌ها را یکی‌یکی حل کن و امتیازت را بالاتر ببر.",
    icon: "#icon-game-math",
    iconClass:
      "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light",
    glowClass: "bg-primary/10",
    badgeClass:
      "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light",
    tutorial: {
      title: "مسابقه ریاضی چطور انجام می‌شود؟",
      description:
        "در هر دور یک عبارت ریاضی نمایش داده می‌شود و باید جواب درست را وارد کنی.",
      steps: [
        "عبارت ریاضی را با دقت بخوان؛ سؤال‌ها شامل جمع، تفریق، ضرب و تقسیم هستند.",
        "جوابت را وارد کن و برای بررسی ثبت کن.",
        "پاسخ درست یک امتیاز اضافه و پاسخ غلط یک امتیاز کم می‌کند.",
        "بعد از هر پاسخ می‌توانی سؤال بعدی را شروع کنی یا مسابقه را تمام کنی.",
      ],
    },
  });

  const runtime = {
    phase: PHASE.READY,
    user: null,
    mathConfig: null,
    questionPool: [],
    questionIndex: 0,
    currentQuestion: null,
  };

  const getStage = () => {
    return document.getElementById("game-stage-content");
  };

  const setPhase = (phase) => {
    runtime.phase = phase;
  };

  const clampInteger = (value, fallback) => {
    const parsed = Number(value);

    return Number.isInteger(parsed) ? parsed : fallback;
  };

  const normalizeOperators = (operators) => {
    const requiredOperators = ["+", "-", "*", "/"];

    const source = Array.isArray(operators) ? operators : [];

    const canonical = source
      .map((operator) => {
        const value = String(operator).trim();

        if (value === "×" || value === "x") {
          return "*";
        }

        if (value === "÷") {
          return "/";
        }

        return value;
      })
      .filter((operator) => requiredOperators.includes(operator));

    /*
     * All four basic operators are active from Stage 7 onward,
     * even if an older configuration only contained + and -.
     */
    return [...new Set([...requiredOperators, ...canonical])];
  };

  const normalizeMathConfig = (value = {}) => {
    let minNumber = clampInteger(
      value.minNumber,
      DEFAULT_MATH_CONFIG.minNumber,
    );

    let maxNumber = clampInteger(
      value.maxNumber,
      DEFAULT_MATH_CONFIG.maxNumber,
    );

    if (minNumber > maxNumber) {
      [minNumber, maxNumber] = [maxNumber, minNumber];
    }

    /*
     * Current product rule:
     * operands must never be greater than 9,
     * even if an older configuration used a larger number.
     */
    minNumber = Math.min(minNumber, MAX_MATH_NUMBER);

    maxNumber = Math.min(maxNumber, MAX_MATH_NUMBER);

    if (minNumber > maxNumber) {
      minNumber = DEFAULT_MATH_CONFIG.minNumber;
    }

    return {
      minNumber,
      maxNumber,
      operators: normalizeOperators(value.operators),
    };
  };

  const loadMathConfig = async () => {
    /*
     * Math configuration is product/static configuration, not user data.
     * Keep the async contract without browser mock-data dependencies.
     */
    return normalizeMathConfig(DEFAULT_MATH_CONFIG);
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

  const calculateAnswer = ({ numberOne, numberTwo, operator }) => {
    if (operator === "+") {
      return numberOne + numberTwo;
    }

    if (operator === "-") {
      return numberOne - numberTwo;
    }

    if (operator === "*" || operator === "×" || operator === "x") {
      return numberOne * numberTwo;
    }

    if (operator === "/" || operator === "÷") {
      return numberOne / numberTwo;
    }

    throw new Error("MATH_OPERATOR_UNSUPPORTED");
  };

  const createQuestion = ({ numberOne, numberTwo, operator }) => {
    let left = numberOne;
    let right = numberTwo;

    /*
     * Keep subtraction child-friendly:
     * no negative answers with the current config.
     */
    if (operator === "-" && right > left) {
      [left, right] = [right, left];
    }

    return {
      id: `${operator}:${left}:${right}`,
      numberOne: left,
      numberTwo: right,
      operator,
      operatorLabel: OPERATOR_LABELS[operator],
      answer: calculateAnswer({
        numberOne: left,
        numberTwo: right,
        operator,
      }),
    };
  };

  const buildQuestionPool = (mathConfig) => {
    const seen = new Set();

    const questionsByOperator = new Map(
      mathConfig.operators.map((operator) => [operator, []]),
    );

    for (
      let numberOne = mathConfig.minNumber;
      numberOne <= mathConfig.maxNumber;
      numberOne += 1
    ) {
      for (
        let numberTwo = mathConfig.minNumber;
        numberTwo <= mathConfig.maxNumber;
        numberTwo += 1
      ) {
        for (const operator of mathConfig.operators) {
          if (operator === "/" && numberTwo === 0) {
            continue;
          }

          const question = createQuestion({
            numberOne,
            numberTwo,
            operator,
          });

          /*
           * Division stays child-friendly:
           * only exact integer answers are used.
           */
          if (operator === "/" && !Number.isInteger(question.answer)) {
            continue;
          }

          if (seen.has(question.id)) {
            continue;
          }

          seen.add(question.id);

          questionsByOperator.get(operator)?.push(question);
        }
      }
    }

    const queues = new Map(
      [...questionsByOperator].map(([operator, questions]) => [
        operator,
        shuffleItems(questions),
      ]),
    );

    const pool = [];

    /*
     * Interleave operators instead of shuffling one huge pool.
     * This keeps +, −, × and ÷ balanced in normal short sessions.
     */
    while ([...queues.values()].some((questions) => questions.length)) {
      const operatorOrder = shuffleItems(mathConfig.operators);

      for (const operator of operatorOrder) {
        const queue = queues.get(operator);

        if (!queue?.length) {
          continue;
        }

        const question = queue.pop();

        if (question) {
          pool.push(question);
        }
      }
    }

    return pool;
  };

  const refillQuestionPool = () => {
    runtime.questionPool = buildQuestionPool(runtime.mathConfig);

    runtime.questionIndex = 0;
  };

  const getNextQuestion = () => {
    if (runtime.questionIndex >= runtime.questionPool.length) {
      refillQuestionPool();
    }

    const question = runtime.questionPool[runtime.questionIndex];

    runtime.questionIndex += 1;

    return question || null;
  };

  const normalizeDigits = (value = "") => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

    return String(value)
      .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
      .replace(/−/g, "-")
      .trim();
  };

  const parseAnswer = (value) => {
    const normalized = normalizeDigits(value);

    if (!/^-?\d+$/.test(normalized)) {
      return null;
    }

    const parsed = Number(normalized);

    return Number.isSafeInteger(parsed) ? parsed : null;
  };

  const animateQuestionTiles = async () => {
    const tiles = Array.from(document.querySelectorAll("[data-math-tile]"));

    if (!tiles.length) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || typeof tiles[0].animate !== "function") {
      tiles.forEach((tile) => {
        tile.classList.remove("invisible");
      });

      return;
    }

    const animations = tiles.map((tile, index) => {
      /*
       * The tile has no CSS transform state.
       * `backwards` only applies the first keyframe
       * during stagger delay and releases naturally
       * at the end, so there is no final snap.
       */
      const animation = tile.animate(
        [
          {
            opacity: 0,
            transform: "translateY(-30px)",
          },
          {
            opacity: 1,
            transform: "translateY(0)",
          },
        ],
        {
          duration: 440,
          delay: index * 90,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        },
      );

      tile.classList.remove("invisible");

      return animation;
    });

    try {
      await Promise.all(animations.map((animation) => animation.finished));
    } catch {
      // A fast view change can cancel the tile animations.
    }
  };

  const renderQuestion = async ({ engine, shell }) => {
    setPhase(PHASE.QUESTION);

    const stage = getStage();
    if (!stage) return;

    const question = getNextQuestion();

    if (!question) {
      finishGame({
        engine,
        shell,
        reason: "questions-unavailable",
      });
      return;
    }

    runtime.currentQuestion = question;

    engine.beginRound({
      payload: {
        questionId: question.id,
        numberOne: question.numberOne,
        numberTwo: question.numberTwo,
        operator: question.operator,
      },
    });

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto w-full max-w-2xl text-center"
        >
          <span
            class="ui-badge mb-4 bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
          >
            سؤال ${shell.toPersianNumber(engine.getSnapshot().round)}
          </span>

          <h2
            class="mb-2"
          >
            جواب این عبارت چنده؟
          </h2>

          <p
            class="mx-auto mb-7 max-w-md text-mutedColor dark:text-mutedColor-dark"
          >
            جواب را وارد کن و برای بررسی بفرست.
          </p>

          <div
            class="mx-auto grid max-w-lg grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4"
            dir="ltr"
            aria-label="عبارت ریاضی"
          >
            <div
              data-math-tile
              class="invisible flex min-h-24 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 px-4 shadow-card dark:border-primary/15 dark:bg-primary/5 dark:shadow-card-dark sm:min-h-28"
            >
              <strong
                class="game-number-value"
              >
                ${shell.toPersianNumber(question.numberOne)}
              </strong>
            </div>

            <div
              data-math-tile
              class="invisible grid size-14 shrink-0 place-items-center rounded-full bg-accent/15 text-textColor dark:bg-accent/10 dark:text-textColor-dark sm:size-16"
              aria-hidden="true"
            >
              <span
                class="game-operator-value grid size-full translate-y-px place-items-center"
              >
                ${shell.escapeGameHtml(question.operatorLabel)}
              </span>
            </div>

            <div
              data-math-tile
              class="invisible flex min-h-24 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 px-4 shadow-card dark:border-primary/15 dark:bg-primary/5 dark:shadow-card-dark sm:min-h-28"
            >
              <strong
                class="game-number-value"
              >
                ${shell.toPersianNumber(question.numberTwo)}
              </strong>
            </div>
          </div>

          <form
            id="math-answer-form"
            class="mx-auto mt-8 max-w-xs"
            novalidate
          >
            <label
              for="math-answer"
              class="form-label mb-2.5 block text-center"
            >
              جواب تو
            </label>

            <div
              class="relative"
            >
              <input
                id="math-answer"
                name="answer"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                enterkeyhint="done"
                class="form-control text-center"
                placeholder="مثلاً ۸"
                dir="ltr"
                aria-describedby="math-answer-error"
              />
            </div>

            <span
              id="math-answer-error"
              class="form-error mt-2 block min-h-5 text-center opacity-0 transition-opacity duration-200"
              aria-live="polite"
            ></span>

            <button
              type="submit"
              class="btn-primary mt-5 w-full"
            >
              بررسی جواب
            </button>
          </form>
        </div>
      `;
    });

    await animateQuestionTiles();

    initAnswerForm({
      engine,
      shell,
    });
  };

  const showAnswerError = (message) => {
    const errorElement = document.getElementById("math-answer-error");

    if (!errorElement) return;

    errorElement.textContent = message;

    errorElement.classList.remove("opacity-0");

    errorElement.classList.add("opacity-100");
  };

  const clearAnswerError = () => {
    const errorElement = document.getElementById("math-answer-error");

    if (!errorElement) return;

    errorElement.textContent = "";
    errorElement.classList.remove("opacity-100");
    errorElement.classList.add("opacity-0");
  };

  const initAnswerForm = ({ engine, shell }) => {
    const form = document.getElementById("math-answer-form");

    const input = document.getElementById("math-answer");

    if (!form || !input) {
      return;
    }

    requestAnimationFrame(() => {
      input.focus();
    });

    input.addEventListener("input", clearAnswerError);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearAnswerError();

      const answer = parseAnswer(input.value);

      if (answer === null) {
        showAnswerError("جوابت را به صورت عدد وارد کن.");
        input.focus();
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
      }

      await submitAnswer({
        engine,
        shell,
        answer,
      });
    });
  };

  const submitAnswer = async ({ engine, shell, answer }) => {
    if (!runtime.currentQuestion) {
      return;
    }

    const isCorrect = answer === runtime.currentQuestion.answer;

    engine.recordOutcome({
      outcome: isCorrect
        ? window.GameEngine.OUTCOME.CORRECT
        : window.GameEngine.OUTCOME.WRONG,
      participantId: runtime.user.id,
      metadata: {
        questionId: runtime.currentQuestion.id,
        numberOne: runtime.currentQuestion.numberOne,
        numberTwo: runtime.currentQuestion.numberTwo,
        operator: runtime.currentQuestion.operator,
        submittedAnswer: answer,
        correctAnswer: runtime.currentQuestion.answer,
      },
    });

    await renderFeedback({
      engine,
      shell,
      isCorrect,
      submittedAnswer: answer,
    });
  };

  const renderFeedback = async ({
    engine,
    shell,
    isCorrect,
    submittedAnswer,
  }) => {
    setPhase(PHASE.FEEDBACK);

    const stage = getStage();

    if (!stage || !runtime.currentQuestion) {
      return;
    }

    const question = runtime.currentQuestion;

    await shell.animateStage(() => {
      stage.innerHTML = `
        <div
          class="mx-auto w-full max-w-xl text-center"
        >
          <div
            class="mx-auto mb-5 flex size-16 items-center justify-center rounded-lg ${ isCorrect ?"bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
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
            class="mb-3 inline-flex rounded-full ${ isCorrect ?"bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
                : "bg-secondary/10 text-secondary dark:bg-secondary/15"
            } ui-badge"
          >
            ${isCorrect ? "آفرین، درست بود!" : "این یکی درست نبود"}
          </span>

          <h2
            class="mb-3"
          >
            ${isCorrect ? "یک امتیاز گرفتی" : "یک امتیاز کم شد"}
          </h2>

          <div
            class="mx-auto mt-6 grid max-w-md grid-cols-2 overflow-hidden rounded-md border border-white/70 bg-surface-soft dark:border-border-dark-soft dark:bg-surface-dark-soft"
          >
            <div
              class="px-4 py-4 text-center"
            >
              <span
                class="ui-meta mb-1 block"
              >
                جواب تو
              </span>

              <strong
                class="game-feedback-value ${ isCorrect ?"text-primary dark:text-primary-light"
                    : "text-secondary"
                }"
              >
                ${shell.toPersianNumber(submittedAnswer)}
              </strong>
            </div>

            <div
              class="border-r border-textColor/5 px-4 py-4 text-center dark:border-border-dark-soft"
            >
              <span
                class="ui-meta mb-1 block"
              >
                جواب درست
              </span>

              <strong
                class="game-feedback-value text-textColor dark:text-textColor-dark"
              >
                ${shell.toPersianNumber(question.answer)}
              </strong>
            </div>
          </div>

          <p
            class="mx-auto mt-5 max-w-md text-mutedColor dark:text-mutedColor-dark"
            dir="ltr"
          >
            ${shell.toPersianNumber(question.numberOne)}
            ${shell.escapeGameHtml(question.operatorLabel)}
            ${shell.toPersianNumber(question.numberTwo)}
            =
            ${shell.toPersianNumber(question.answer)}
          </p>

          <div
            class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <button
              type="button"
              id="math-next-question"
              class="btn-primary"
            >
              سؤال بعدی
            </button>

            <button
              type="button"
              id="math-finish-game"
              class="btn-ghost-secondary"
            >
              پایان مسابقه
            </button>
          </div>
        </div>
      `;
    });

    document.getElementById("math-next-question")?.addEventListener(
      "click",
      () => {
        renderQuestion({
          engine,
          shell,
        });
      },
      { once: true },
    );

    document.getElementById("math-finish-game")?.addEventListener(
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
      console.error("Failed to save math result:", error);

      window.apiErrors?.showToast(error, {
        title: "نتیجه ریاضی ذخیره نشد",
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
        <div
          class="mx-auto w-full max-w-2xl text-center"
        >
          <span
            class="ui-badge mb-4 bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
          >
            مسابقه تمام شد
          </span>

          <h2
            class="mb-2"
          >
            نتیجه ریاضی تو
          </h2>

          <p
            class="mx-auto mb-7 max-w-lg text-mutedColor dark:text-mutedColor-dark"
          >
            ${
              resultSaved
                ? "نتیجه این بازی با موفقیت ذخیره شد."
                : "نتیجه بازی نمایش داده شد، اما ذخیره آن انجام نشد."
            }
          </p>

          <div
            class="grid gap-3 sm:grid-cols-4"
          >
            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span
                class="ui-meta mb-2 block"
              >
                امتیاز
              </span>

              <strong
                class="game-result-value text-primary dark:text-primary-light"
              >
                ${shell.toPersianNumber(player?.score || 0)}
              </strong>
            </div>

            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span
                class="ui-meta mb-2 block"
              >
                درست
              </span>

              <strong
                class="game-result-value text-primary dark:text-primary-light"
              >
                ${shell.toPersianNumber(player?.correct || 0)}
              </strong>
            </div>

            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span
                class="ui-meta mb-2 block"
              >
                غلط
              </span>

              <strong
                class="game-result-value text-secondary"
              >
                ${shell.toPersianNumber(player?.wrong || 0)}
              </strong>
            </div>

            <div
              class="rounded-md border border-white/70 bg-surface-soft px-4 py-5 text-center dark:border-border-dark-soft dark:bg-surface-dark-soft"
            >
              <span
                class="ui-meta mb-2 block"
              >
                دقت
              </span>

              <strong
                class="game-result-value text-textColor dark:text-textColor-dark"
              >
                ${shell.toPersianNumber(accuracy)}٪
              </strong>
            </div>
          </div>

          <div
            class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <button
              type="button"
              id="math-play-again"
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
      `;
    });

    document.getElementById("math-play-again")?.addEventListener(
      "click",
      async () => {
        engine.reset();

        runtime.phase = PHASE.READY;
        runtime.currentQuestion = null;

        runtime.mathConfig = await loadMathConfig();

        refillQuestionPool();

        engine.start({
          context: {
            mathConfig: runtime.mathConfig,
          },
        });

        renderQuestion({
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
      gameType: "math",
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
    runtime.mathConfig = await loadMathConfig();

    refillQuestionPool();

    if (!runtime.questionPool.length) {
      console.error("No math questions could be generated.");

      return;
    }

    engine.start({
      context: {
        mathConfig: runtime.mathConfig,
      },
    });

    await renderQuestion({
      engine,
      shell,
    });
  };

  window.MathGame = Object.freeze({
    type: "math",
    config,
    createEngine,
    onStart,
  });
})();
