/*
 * Science game module.
 *
 * Stage 5 defines configuration and the shared-engine contract.
 * Science question flow is implemented in Stage 8.
 */

(() => {
  const config = Object.freeze({
    title: "علوم",
    eyebrow: "مسابقه علوم",
    description: "سؤال را بخوان، پاسخ را بررسی کن و نتیجه را ثبت کن.",
    icon: "#icon-game-science",
    iconClass: "bg-secondary/10 text-secondary dark:bg-secondary/15",
    glowClass: "bg-secondary/10",
    badgeClass: "bg-secondary/10 text-secondary dark:bg-secondary/15",
    tutorial: {
      title: "مسابقه علوم چطور انجام می‌شود؟",
      description:
        "اول سؤال را پاسخ می‌دهی، بعد جواب اصلی را می‌بینی و خودت نتیجه را ثبت می‌کنی.",
      steps: [
        "سؤال را بخوان و جوابش را در ذهن یا با صدای بلند بگو.",
        "پاسخ اصلی را نمایش بده و با جواب خودت مقایسه کن.",
        "اگر درست بود «درست» و اگر اشتباه بود «غلط» را انتخاب کن.",
        "اگر نمی‌خواهی جواب بدهی، می‌توانی سؤال را رد کنی.",
      ],
    },
  });

  const createEngine = ({ user }) => {
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

  window.ScienceGame = Object.freeze({
    type: "science",
    config,
    createEngine,
  });
})();
