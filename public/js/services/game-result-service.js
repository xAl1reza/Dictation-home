/*
 * Game result service.
 *
 * Persists normalized game summaries through appDataProvider.
 * Game modules never read from or write to localStorage directly.
 *
 * API migration path:
 * keep this async public contract and replace the provider-backed
 * implementation with HTTP calls when the backend is available.
 */

(() => {
  const RESULT_SCHEMA_VERSION = 1;

  const GAME_TYPE = Object.freeze({
    DICTATION: "dictation",
    MATH: "math",
    SCIENCE: "science",
  });

  const VALID_GAME_TYPES = new Set(Object.values(GAME_TYPE));

  const createResultId = () => {
    if (window.crypto?.randomUUID) {
      return `result-${window.crypto.randomUUID()}`;
    }

    return `result-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const cloneValue = (value) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  };

  const normalizeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizeInteger = (value, fallback = 0) => {
    return Math.trunc(normalizeNumber(value, fallback));
  };

  const normalizeMetadata = (metadata) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return {};
    }

    return cloneValue(metadata);
  };

  const calculateDurationSeconds = (startedAt, finishedAt) => {
    const start = Date.parse(startedAt || "");
    const finish = Date.parse(finishedAt || "");

    if (!Number.isFinite(start) || !Number.isFinite(finish) || finish < start) {
      return 0;
    }

    return Math.max(0, Math.round((finish - start) / 1000));
  };

  const calculateAccuracy = ({ correct, wrong }) => {
    const answered = correct + wrong;

    if (answered <= 0) {
      return 0;
    }

    return Math.round((correct / answered) * 100);
  };

  const assertProvider = () => {
    if (
      !window.appDataProvider ||
      typeof window.appDataProvider.getState !== "function" ||
      typeof window.appDataProvider.updateState !== "function"
    ) {
      throw new Error("GAME_RESULT_PROVIDER_UNAVAILABLE");
    }
  };

  const assertFinishedEngineResult = (engineResult) => {
    if (!engineResult || typeof engineResult !== "object") {
      throw new Error("GAME_RESULT_REQUIRED");
    }

    if (engineResult.status !== "finished") {
      throw new Error("GAME_RESULT_NOT_FINISHED");
    }

    if (!engineResult.sessionId) {
      throw new Error("GAME_RESULT_SESSION_ID_REQUIRED");
    }

    if (!VALID_GAME_TYPES.has(engineResult.gameType)) {
      throw new Error("GAME_RESULT_GAME_TYPE_INVALID");
    }
  };

  const buildResultRecord = ({ engineResult, userId, metadata = {} }) => {
    assertFinishedEngineResult(engineResult);

    if (!userId) {
      throw new Error("GAME_RESULT_USER_ID_REQUIRED");
    }

    const normalizedUserId = String(userId);

    const participant = Array.isArray(engineResult.participants)
      ? engineResult.participants.find(
          (item) =>
            String(item?.id || "") === normalizedUserId &&
            item?.persistent !== false,
        )
      : null;

    if (!participant) {
      throw new Error("GAME_RESULT_PARTICIPANT_NOT_FOUND");
    }

    const correct = Math.max(0, normalizeInteger(participant.correct));
    const wrong = Math.max(0, normalizeInteger(participant.wrong));
    const skipped = Math.max(0, normalizeInteger(participant.skipped));
    const answered = correct + wrong;

    const startedAt = engineResult.startedAt || null;
    const finishedAt = engineResult.finishedAt || new Date().toISOString();

    return {
      id: createResultId(),
      schemaVersion: RESULT_SCHEMA_VERSION,
      sessionId: String(engineResult.sessionId),
      gameType: engineResult.gameType,
      userId: normalizedUserId,
      score: normalizeInteger(participant.score),
      correct,
      wrong,
      skipped,
      answered,
      rounds: Math.max(0, normalizeInteger(engineResult.rounds)),
      accuracy: calculateAccuracy({ correct, wrong }),
      startedAt,
      finishedAt,
      durationSeconds: calculateDurationSeconds(startedAt, finishedAt),
      metadata: {
        ...normalizeMetadata(engineResult.metadata),
        ...normalizeMetadata(metadata),
      },
      createdAt: new Date().toISOString(),
    };
  };

  const getResults = async ({
    userId = null,
    gameType = null,
    limit = null,
  } = {}) => {
    assertProvider();

    if (gameType && !VALID_GAME_TYPES.has(gameType)) {
      throw new Error("GAME_RESULT_GAME_TYPE_INVALID");
    }

    const state = await window.appDataProvider.getState();
    const source = Array.isArray(state.gameResults) ? state.gameResults : [];

    const normalizedUserId = userId == null ? null : String(userId);

    let results = source.filter((item) => {
      if (!item || typeof item !== "object") return false;
      if (normalizedUserId && String(item.userId) !== normalizedUserId) {
        return false;
      }
      if (gameType && item.gameType !== gameType) return false;
      return true;
    });

    results = [...results].sort((a, b) => {
      const aTime = Date.parse(a.finishedAt || a.createdAt || "") || 0;
      const bTime = Date.parse(b.finishedAt || b.createdAt || "") || 0;
      return bTime - aTime;
    });

    if (Number.isInteger(limit) && limit >= 0) {
      results = results.slice(0, limit);
    }

    return cloneValue(results);
  };

  const createEmptyScoreBucket = () => ({
    score: 0,
    gamesPlayed: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    answered: 0,
    rounds: 0,
    durationSeconds: 0,
    accuracy: 0,
    latestFinishedAt: null,
  });

  const finalizeScoreBucket = (bucket) => {
    const answered = Math.max(0, normalizeInteger(bucket.answered));
    const correct = Math.max(0, normalizeInteger(bucket.correct));

    return {
      ...bucket,
      accuracy:
        answered > 0 ? Math.round((correct / answered) * 100) : 0,
    };
  };

  const summarizeResults = (results = []) => {
    const byGame = {
      [GAME_TYPE.DICTATION]: createEmptyScoreBucket(),
      [GAME_TYPE.MATH]: createEmptyScoreBucket(),
      [GAME_TYPE.SCIENCE]: createEmptyScoreBucket(),
    };

    const total = createEmptyScoreBucket();

    results.forEach((result) => {
      if (!result || !VALID_GAME_TYPES.has(result.gameType)) {
        return;
      }

      const bucket = byGame[result.gameType];
      const score = normalizeInteger(result.score);
      const correct = Math.max(0, normalizeInteger(result.correct));
      const wrong = Math.max(0, normalizeInteger(result.wrong));
      const skipped = Math.max(0, normalizeInteger(result.skipped));
      const answered = Math.max(
        0,
        normalizeInteger(result.answered, correct + wrong),
      );
      const rounds = Math.max(0, normalizeInteger(result.rounds));
      const durationSeconds = Math.max(
        0,
        normalizeInteger(result.durationSeconds),
      );

      bucket.score += score;
      bucket.gamesPlayed += 1;
      bucket.correct += correct;
      bucket.wrong += wrong;
      bucket.skipped += skipped;
      bucket.answered += answered;
      bucket.rounds += rounds;
      bucket.durationSeconds += durationSeconds;

      if (!bucket.latestFinishedAt) {
        bucket.latestFinishedAt =
          result.finishedAt || result.createdAt || null;
      }

      total.score += score;
      total.gamesPlayed += 1;
      total.correct += correct;
      total.wrong += wrong;
      total.skipped += skipped;
      total.answered += answered;
      total.rounds += rounds;
      total.durationSeconds += durationSeconds;

      if (!total.latestFinishedAt) {
        total.latestFinishedAt =
          result.finishedAt || result.createdAt || null;
      }
    });

    return {
      totalScore: total.score,
      totalGames: total.gamesPlayed,
      total: finalizeScoreBucket(total),
      byGame: {
        [GAME_TYPE.DICTATION]: finalizeScoreBucket(
          byGame[GAME_TYPE.DICTATION],
        ),
        [GAME_TYPE.MATH]: finalizeScoreBucket(byGame[GAME_TYPE.MATH]),
        [GAME_TYPE.SCIENCE]: finalizeScoreBucket(
          byGame[GAME_TYPE.SCIENCE],
        ),
      },
    };
  };

  const getUserScoreSummary = async (userId) => {
    if (!userId) {
      throw new Error("GAME_RESULT_USER_ID_REQUIRED");
    }

    const results = await getResults({
      userId: String(userId),
    });

    return summarizeResults(results);
  };

  const getResultById = async (resultId) => {
    if (!resultId) return null;

    const results = await getResults();
    return results.find((item) => item.id === resultId) || null;
  };

  const getResultBySession = async ({ sessionId, userId }) => {
    if (!sessionId || !userId) return null;

    const results = await getResults({ userId });

    return (
      results.find(
        (item) => item.sessionId === sessionId && item.userId === userId,
      ) || null
    );
  };

  const saveEngineResult = async ({ engineResult, userId, metadata = {} }) => {
    assertProvider();

    const record = buildResultRecord({
      engineResult,
      userId,
      metadata,
    });

    let savedResult = null;

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.gameResults)) {
        state.gameResults = [];
      }

      const existing = state.gameResults.find(
        (item) =>
          item?.sessionId === record.sessionId && item?.userId === record.userId,
      );

      if (existing) {
        savedResult = cloneValue(existing);
        return state;
      }

      state.gameResults.push(record);
      savedResult = cloneValue(record);

      return state;
    });

    return savedResult;
  };

  window.gameResultService = Object.freeze({
    RESULT_SCHEMA_VERSION,
    GAME_TYPE,
    getResults,
    getUserScoreSummary,
    getResultById,
    getResultBySession,
    saveEngineResult,
  });
})();
