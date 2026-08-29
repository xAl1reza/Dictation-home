/*
 * Dictation game module.
 *
 * Stage 5 defines only the game contract and configuration.
 * Full two-player setup and handoff flow starts in Stage 6.
 */

(() => {
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
        "بعد از ثبت نتیجه، نوبت دو بازیکن عوض می‌شود و دور بعد شروع خواهد شد.",
        "فقط امتیاز کاربر واردشده در حساب ذخیره می‌شود.",
      ],
    },
  });

  const createEngine = ({ user }) => {
    /*
     * Participant #2 is intentionally added
     * during Dictation setup in Stage 6.
     */
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

  window.DictationGame = Object.freeze({
    type: "dictation",
    config,
    createEngine,
  });
})();
