/*
 * Game page controller.
 *
 * Resolves the requested game module and connects it
 * to the shared Game Shell and Game Engine.
 */

(() => {
  const getGameType = () => {
    const params = new URLSearchParams(window.location.search);

    return params.get("type");
  };

  const getGameModule = (type) => {
    const modules = {
      dictation: window.DictationGame,
      math: window.MathGame,
      science: window.ScienceGame,
    };

    return modules[type] || null;
  };

  const initGame = async () => {
    const type = getGameType();
    const gameModule = getGameModule(type);

    if (!gameModule) {
      window.GameShell?.renderInvalidGame();
      return;
    }

    if (
      !window.GameEngine ||
      !window.GameShell ||
      !window.userService ||
      !window.gameResultService
    ) {
      console.error("Game dependencies are not available.");

      window.GameShell?.renderInvalidGame();
      return;
    }

    try {
      const user = await window.userService.getCurrentUser();

      if (!user?.id) {
        window.location.replace("./auth.html#login");
        return;
      }

      const scoreSummary = await window.gameResultService.getUserScoreSummary(
        user.id,
      );

      const verifyAccess = async () => {
        try {
          const subscription = await window.subscriptionService.getStatus();
          if (subscription.permissions[type] === true) return true;
        } catch (error) {
          console.error('Could not verify game access:', error);
        }
        window.location.replace('./dashboard.html');
        return false;
      };
      if (!(await verifyAccess())) return;
      window.setInterval(() => { if (!document.hidden) void verifyAccess(); }, 60000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) void verifyAccess(); });
      window.addEventListener('pageshow', (event) => { if (event.persisted) void verifyAccess(); });

      window.GameShell.init({
        type,
        gameModule,
        user,
        totalScore: scoreSummary.totalScore,
      });
    } catch (error) {
      console.error("Failed to initialize game:", error);

      const resolved = window.apiErrors?.resolve(
        error,
        "اطلاعات لازم برای شروع بازی از سرور دریافت نشد.",
      );

      window.showToast?.({
        type: "error",
        title: "شروع بازی انجام نشد",
        message:
          resolved?.message ||
          "اطلاعات لازم برای شروع بازی از سرور دریافت نشد.",
      });

      window.GameShell.renderInvalidGame();
    }
  };

  initGame();
})();
