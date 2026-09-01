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

      window.GameShell.init({
        type,
        gameModule,
        user,
        totalScore: scoreSummary.totalScore,
      });
    } catch (error) {
      console.error("Failed to initialize game:", error);

      window.GameShell.renderInvalidGame();
    }
  };

  initGame();
})();
