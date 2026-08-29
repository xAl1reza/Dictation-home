/*
 * Shared game engine.
 *
 * Owns generic lifecycle, rounds, participants and scoring.
 * Game-specific rules belong to strategy modules.
 */

(() => {
  const STATUS = Object.freeze({
    IDLE: "idle",
    PLAYING: "playing",
    FINISHED: "finished",
  });

  const OUTCOME = Object.freeze({
    CORRECT: "correct",
    WRONG: "wrong",
    SKIP: "skip",
  });

  const DEFAULT_SCORING = Object.freeze({
    correct: 1,
    wrong: -1,
    skip: 0,
  });

  class GameEngineError extends Error {
    constructor(code, message = code) {
      super(message);
      this.name = "GameEngineError";
      this.code = code;
    }
  }

  const cloneValue = (value) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  };

  const createSessionId = () => {
    if (window.crypto?.randomUUID) {
      return `game-${window.crypto.randomUUID()}`;
    }

    return `game-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const normalizeParticipants = (participants = []) => {
    const seenIds = new Set();

    return participants.map((participant, index) => {
      const id = String(participant?.id || `player-${index + 1}`).trim();

      if (!id) {
        throw new GameEngineError("PARTICIPANT_ID_REQUIRED");
      }

      if (seenIds.has(id)) {
        throw new GameEngineError("PARTICIPANT_ID_DUPLICATE");
      }

      seenIds.add(id);

      return {
        id,
        name: String(participant?.name || `بازیکن ${index + 1}`).trim(),
        isGuest: Boolean(participant?.isGuest),
        persistent: participant?.persistent !== false,
        score: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
      };
    });
  };

  const create = ({ gameType, participants = [], scoring = {} } = {}) => {
    if (!gameType) {
      throw new GameEngineError("GAME_TYPE_REQUIRED");
    }

    const baseParticipants = normalizeParticipants(participants);
    const scoreRules = {
      ...DEFAULT_SCORING,
      ...scoring,
    };

    const listeners = new Set();

    const createInitialState = () => ({
      id: createSessionId(),
      gameType: String(gameType).trim(),
      status: STATUS.IDLE,
      participants: cloneValue(baseParticipants),
      currentPlayerId: baseParticipants[0]?.id || null,
      round: 0,
      currentRound: null,
      history: [],
      context: {},
      startedAt: null,
      finishedAt: null,
      resultMetadata: {},
    });

    let state = createInitialState();

    const getSnapshot = () => cloneValue(state);

    const emit = () => {
      const snapshot = getSnapshot();
      listeners.forEach((listener) => listener(snapshot));
    };

    const assertPlaying = () => {
      if (state.status !== STATUS.PLAYING) {
        throw new GameEngineError("GAME_NOT_PLAYING");
      }
    };

    const getParticipant = (participantId) => {
      return state.participants.find(
        (participant) => participant.id === participantId,
      );
    };

    const requireParticipant = (participantId) => {
      const participant = getParticipant(participantId);

      if (!participant) {
        throw new GameEngineError("PARTICIPANT_NOT_FOUND");
      }

      return participant;
    };

    const subscribe = (listener) => {
      if (typeof listener !== "function") {
        throw new GameEngineError("LISTENER_REQUIRED");
      }

      listeners.add(listener);
      listener(getSnapshot());

      return () => listeners.delete(listener);
    };

    const start = ({ context = {}, currentPlayerId = null } = {}) => {
      if (state.status === STATUS.PLAYING) {
        throw new GameEngineError("GAME_ALREADY_STARTED");
      }

      if (state.status === STATUS.FINISHED) {
        throw new GameEngineError("GAME_ALREADY_FINISHED");
      }

      if (currentPlayerId) {
        requireParticipant(currentPlayerId);
        state.currentPlayerId = currentPlayerId;
      }

      state.status = STATUS.PLAYING;
      state.context = cloneValue(context);
      state.startedAt = new Date().toISOString();
      emit();

      return getSnapshot();
    };

    const setCurrentPlayer = (participantId) => {
      assertPlaying();
      requireParticipant(participantId);
      state.currentPlayerId = participantId;
      emit();

      return getSnapshot();
    };

    const beginRound = ({ payload = null, currentPlayerId = null } = {}) => {
      assertPlaying();

      if (state.currentRound && !state.currentRound.resolvedAt) {
        throw new GameEngineError("ROUND_ALREADY_ACTIVE");
      }

      if (currentPlayerId) {
        requireParticipant(currentPlayerId);
        state.currentPlayerId = currentPlayerId;
      }

      state.round += 1;
      state.currentRound = {
        number: state.round,
        playerId: state.currentPlayerId,
        payload: cloneValue(payload),
        outcome: null,
        points: 0,
        metadata: {},
        startedAt: new Date().toISOString(),
        resolvedAt: null,
      };

      emit();
      return cloneValue(state.currentRound);
    };

    const recordOutcome = ({
      outcome,
      participantId = null,
      metadata = {},
    } = {}) => {
      assertPlaying();

      if (!Object.values(OUTCOME).includes(outcome)) {
        throw new GameEngineError("OUTCOME_INVALID");
      }

      if (!state.currentRound) {
        throw new GameEngineError("ROUND_NOT_STARTED");
      }

      if (state.currentRound.resolvedAt) {
        throw new GameEngineError("ROUND_ALREADY_RESOLVED");
      }

      const targetParticipantId =
        participantId || state.currentRound.playerId || state.currentPlayerId;

      const participant = requireParticipant(targetParticipantId);
      const points = Number(scoreRules[outcome] ?? 0);

      participant.score += points;

      if (outcome === OUTCOME.CORRECT) participant.correct += 1;
      if (outcome === OUTCOME.WRONG) participant.wrong += 1;
      if (outcome === OUTCOME.SKIP) participant.skipped += 1;

      state.currentRound.playerId = participant.id;
      state.currentRound.outcome = outcome;
      state.currentRound.points = points;
      state.currentRound.metadata = cloneValue(metadata);
      state.currentRound.resolvedAt = new Date().toISOString();
      state.history.push(cloneValue(state.currentRound));

      emit();
      return cloneValue(state.currentRound);
    };

    const finish = ({ metadata = {} } = {}) => {
      assertPlaying();

      state.status = STATUS.FINISHED;
      state.finishedAt = new Date().toISOString();
      state.resultMetadata = cloneValue(metadata);
      emit();

      return getResult();
    };

    const reset = () => {
      state = createInitialState();
      emit();
      return getSnapshot();
    };

    const getParticipantScore = (participantId) => {
      return requireParticipant(participantId).score;
    };

    const getResult = () => {
      const participants = cloneValue(state.participants);
      const totals = participants.reduce(
        (result, participant) => {
          result.score += participant.score;
          result.correct += participant.correct;
          result.wrong += participant.wrong;
          result.skipped += participant.skipped;
          return result;
        },
        {
          score: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
        },
      );

      return {
        sessionId: state.id,
        gameType: state.gameType,
        status: state.status,
        rounds: state.round,
        startedAt: state.startedAt,
        finishedAt: state.finishedAt,
        participants,
        totals,
        history: cloneValue(state.history),
        metadata: cloneValue(state.resultMetadata),
      };
    };

    return Object.freeze({
      subscribe,
      start,
      beginRound,
      recordOutcome,
      setCurrentPlayer,
      finish,
      reset,
      getSnapshot,
      getParticipantScore,
      getResult,
    });
  };

  window.GameEngine = Object.freeze({
    STATUS,
    OUTCOME,
    DEFAULT_SCORING,
    GameEngineError,
    create,
  });
})();
