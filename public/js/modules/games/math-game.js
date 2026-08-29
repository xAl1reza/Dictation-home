/*
 * Math game module.
 *
 * Stage 5 defines configuration and the shared-engine contract.
 * Math question generation is implemented in Stage 7.
 */

(() => {
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
        "عبارت ریاضی را با دقت بخوان.",
        "جوابت را وارد کن و برای بررسی ثبت کن.",
        "پاسخ درست یک امتیاز اضافه و پاسخ غلط یک امتیاز کم می‌کند.",
        "هر زمان خواستی می‌توانی مسابقه را تمام کنی.",
      ],
    },
  });

  const createEngine = ({ user }) => {
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

  window.MathGame = Object.freeze({
    type: "math",
    config,
    createEngine,
  });
})();
