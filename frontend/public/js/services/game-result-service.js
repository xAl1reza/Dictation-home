/*
 * Game result service backed by the real API.
 *
 * The backend is authoritative for persisted score, answered count,
 * accuracy, duration and authenticated user ownership.
 * Frontend sends only raw outcome counts and session metadata.
 */

;(() => {
  const RESULT_SCHEMA_VERSION = 1

  const GAME_TYPE = Object.freeze({
    DICTATION: 'dictation',
    MATH: 'math',
    SCIENCE: 'science',
  })

  const VALID_GAME_TYPES = new Set(Object.values(GAME_TYPE))

  const SERVER_ERROR_MAP = Object.freeze({
    'Invalid game type': 'GAME_RESULT_GAME_TYPE_INVALID',
    'Folder not found': 'GAME_RESULT_FOLDER_NOT_FOUND',
    'Game result already exists': 'GAME_RESULT_DUPLICATE',
    'Game result already exists for this session': 'GAME_RESULT_DUPLICATE',
    'Session already exists': 'GAME_RESULT_DUPLICATE',
  })

  const normalizeNumber = (value, fallback = 0) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const normalizeInteger = (value, fallback = 0) => {
    return Math.trunc(normalizeNumber(value, fallback))
  }

  const remapApiError = (error) => {
    const mapped = window.apiErrors?.remap(error, SERVER_ERROR_MAP) || error

    if (
      Number(mapped?.status || 0) === 409 &&
      !SERVER_ERROR_MAP[String(error?.code || error?.message || '').trim()]
    ) {
      const conflict = new Error('GAME_RESULT_DUPLICATE')
      conflict.code = 'GAME_RESULT_DUPLICATE'
      conflict.status = 409
      conflict.cause = error
      return conflict
    }

    return mapped
  }

  const assertFinishedEngineResult = (engineResult) => {
    if (!engineResult || typeof engineResult !== 'object') {
      throw new Error('GAME_RESULT_REQUIRED')
    }

    if (engineResult.status !== 'finished') {
      throw new Error('GAME_RESULT_NOT_FINISHED')
    }

    if (!engineResult.sessionId) {
      throw new Error('GAME_RESULT_SESSION_ID_REQUIRED')
    }

    if (!VALID_GAME_TYPES.has(engineResult.gameType)) {
      throw new Error('GAME_RESULT_GAME_TYPE_INVALID')
    }
  }

  const getPersistentParticipant = ({ engineResult, userId }) => {
    if (!userId) {
      throw new Error('GAME_RESULT_USER_ID_REQUIRED')
    }

    const normalizedUserId = String(userId)

    const participant = Array.isArray(engineResult.participants)
      ? engineResult.participants.find(
          (item) =>
            String(item?.id || '') === normalizedUserId &&
            item?.persistent !== false
        )
      : null

    if (!participant) {
      throw new Error('GAME_RESULT_PARTICIPANT_NOT_FOUND')
    }

    return participant
  }

  const normalizeResult = (item) => {
    if (!item || typeof item !== 'object') {
      return null
    }

    const correct = Math.max(0, normalizeInteger(item.correct))
    const wrong = Math.max(0, normalizeInteger(item.wrong))
    const skipped = Math.max(0, normalizeInteger(item.skipped))
    const answered = Math.max(
      0,
      normalizeInteger(item.answered, correct + wrong)
    )

    return {
      ...item,
      id: item.id ?? null,
      schemaVersion: normalizeInteger(
        item.schemaVersion ?? item.schema_version,
        RESULT_SCHEMA_VERSION
      ),
      sessionId: item.sessionId ?? item.session_id ?? null,
      gameType: item.gameType ?? item.game_type ?? null,
      userId: item.userId ?? item.user_id ?? null,
      folderId: item.folderId ?? item.folder_id ?? null,
      score: normalizeInteger(item.score),
      correct,
      wrong,
      skipped,
      answered,
      rounds: Math.max(0, normalizeInteger(item.rounds)),
      accuracy: normalizeNumber(item.accuracy),
      durationSeconds: Math.max(
        0,
        normalizeInteger(item.durationSeconds ?? item.duration_seconds)
      ),
      startedAt: item.startedAt ?? item.started_at ?? null,
      finishedAt: item.finishedAt ?? item.finished_at ?? null,
      createdAt: item.createdAt ?? item.created_at ?? null,
      metadata:
        item.metadata && typeof item.metadata === 'object'
          ? item.metadata
          : {},
    }
  }

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
  })

  const normalizeScoreBucket = (bucket = {}) => {
    const correct = Math.max(0, normalizeInteger(bucket.correct))
    const wrong = Math.max(0, normalizeInteger(bucket.wrong))
    const answered = Math.max(
      0,
      normalizeInteger(bucket.answered, correct + wrong)
    )

    return {
      score: normalizeInteger(bucket.score),
      gamesPlayed: Math.max(0, normalizeInteger(bucket.gamesPlayed)),
      correct,
      wrong,
      skipped: Math.max(0, normalizeInteger(bucket.skipped)),
      answered,
      rounds: Math.max(0, normalizeInteger(bucket.rounds)),
      durationSeconds: Math.max(0, normalizeInteger(bucket.durationSeconds)),
      accuracy: normalizeNumber(bucket.accuracy),
      latestFinishedAt: bucket.latestFinishedAt || null,
    }
  }

  const getScoreBucketSource = (data, gameType) => {
    if (!data || typeof data !== 'object') return null

    return (
      data.byGame?.[gameType] ||
      data.games?.[gameType] ||
      data[gameType] ||
      null
    )
  }

  const normalizeScoreSummary = (data = {}) => {
    const total = normalizeScoreBucket(data.total || {})

    return {
      totalScore: normalizeInteger(data.totalScore, total.score),
      totalGames: Math.max(
        0,
        normalizeInteger(data.totalGames, total.gamesPlayed)
      ),
      total,
      byGame: {
        [GAME_TYPE.DICTATION]: normalizeScoreBucket(
          getScoreBucketSource(data, GAME_TYPE.DICTATION) ||
            createEmptyScoreBucket()
        ),
        [GAME_TYPE.MATH]: normalizeScoreBucket(
          getScoreBucketSource(data, GAME_TYPE.MATH) || createEmptyScoreBucket()
        ),
        [GAME_TYPE.SCIENCE]: normalizeScoreBucket(
          getScoreBucketSource(data, GAME_TYPE.SCIENCE) ||
            createEmptyScoreBucket()
        ),
      },
    }
  }

  const hasDashboardGameBreakdown = (data = {}) => {
    return Object.values(GAME_TYPE).some(
      (gameType) => getScoreBucketSource(data, gameType) !== null
    )
  }

  const getLatestFinishedAt = (currentValue, nextValue) => {
    if (!nextValue) return currentValue || null
    if (!currentValue) return nextValue

    const currentTime = Date.parse(currentValue)
    const nextTime = Date.parse(nextValue)

    if (!Number.isFinite(nextTime)) return currentValue
    if (!Number.isFinite(currentTime)) return nextValue

    return nextTime > currentTime ? nextValue : currentValue
  }

  const finalizeScoreBucket = (bucket) => {
    const answered = Math.max(
      0,
      normalizeInteger(bucket.answered, bucket.correct + bucket.wrong)
    )

    return {
      ...bucket,
      answered,
      accuracy:
        answered > 0
          ? Math.round((normalizeInteger(bucket.correct) / answered) * 100)
          : 0,
    }
  }

  const aggregateScoreSummaryFromResults = (results = []) => {
    const byGame = {
      [GAME_TYPE.DICTATION]: createEmptyScoreBucket(),
      [GAME_TYPE.MATH]: createEmptyScoreBucket(),
      [GAME_TYPE.SCIENCE]: createEmptyScoreBucket(),
    }

    const total = createEmptyScoreBucket()

    results.forEach((result) => {
      if (!result || !VALID_GAME_TYPES.has(result.gameType)) return

      const bucket = byGame[result.gameType]
      const values = {
        score: normalizeInteger(result.score),
        correct: Math.max(0, normalizeInteger(result.correct)),
        wrong: Math.max(0, normalizeInteger(result.wrong)),
        skipped: Math.max(0, normalizeInteger(result.skipped)),
        answered: Math.max(
          0,
          normalizeInteger(
            result.answered,
            normalizeInteger(result.correct) + normalizeInteger(result.wrong)
          )
        ),
        rounds: Math.max(0, normalizeInteger(result.rounds)),
        durationSeconds: Math.max(
          0,
          normalizeInteger(result.durationSeconds)
        ),
      }

      bucket.score += values.score
      bucket.gamesPlayed += 1
      bucket.correct += values.correct
      bucket.wrong += values.wrong
      bucket.skipped += values.skipped
      bucket.answered += values.answered
      bucket.rounds += values.rounds
      bucket.durationSeconds += values.durationSeconds
      bucket.latestFinishedAt = getLatestFinishedAt(
        bucket.latestFinishedAt,
        result.finishedAt || result.createdAt || null
      )

      total.score += values.score
      total.gamesPlayed += 1
      total.correct += values.correct
      total.wrong += values.wrong
      total.skipped += values.skipped
      total.answered += values.answered
      total.rounds += values.rounds
      total.durationSeconds += values.durationSeconds
      total.latestFinishedAt = getLatestFinishedAt(
        total.latestFinishedAt,
        result.finishedAt || result.createdAt || null
      )
    })

    Object.values(GAME_TYPE).forEach((gameType) => {
      byGame[gameType] = finalizeScoreBucket(byGame[gameType])
    })

    const finalizedTotal = finalizeScoreBucket(total)

    return {
      totalScore: finalizedTotal.score,
      totalGames: finalizedTotal.gamesPlayed,
      total: finalizedTotal,
      byGame,
    }
  }

  const isDashboardSummaryConsistent = (summary) => {
    const buckets = Object.values(summary.byGame || {})
    const gameScore = buckets.reduce(
      (sum, bucket) => sum + normalizeInteger(bucket?.score),
      0
    )
    const gameCount = buckets.reduce(
      (sum, bucket) => sum + Math.max(0, normalizeInteger(bucket?.gamesPlayed)),
      0
    )

    return (
      gameScore === normalizeInteger(summary.totalScore) &&
      gameCount === Math.max(0, normalizeInteger(summary.totalGames))
    )
  }

  const getResults = async ({ userId = null, gameType = null, limit = null } = {}) => {
    if (gameType && !VALID_GAME_TYPES.has(gameType)) {
      throw new Error('GAME_RESULT_GAME_TYPE_INVALID')
    }

    try {
      const data = await window.apiClient.get('/game-results', {
        query: gameType ? { gameType } : null,
      })

      let results = Array.isArray(data)
        ? data.map(normalizeResult).filter(Boolean)
        : []

      const normalizedUserId = userId == null ? null : String(userId)

      if (normalizedUserId) {
        results = results.filter((item) => {
          return !item.userId || String(item.userId) === normalizedUserId
        })
      }

      results.sort((a, b) => {
        const aTime = Date.parse(a.finishedAt || a.createdAt || '') || 0
        const bTime = Date.parse(b.finishedAt || b.createdAt || '') || 0
        return bTime - aTime
      })

      if (Number.isInteger(limit) && limit >= 0) {
        results = results.slice(0, limit)
      }

      window.apiClient.log(
        `[API:GAME_RESULT] history loaded from backend: ${results.length}`
      )

      return results
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const getUserScoreSummary = async (userId) => {
    if (!userId) {
      throw new Error('GAME_RESULT_USER_ID_REQUIRED')
    }

    try {
      const data = await window.apiClient.get('/dashboard/stats')
      const summary = normalizeScoreSummary(data)

      if (
        hasDashboardGameBreakdown(data) &&
        isDashboardSummaryConsistent(summary)
      ) {
        window.apiClient.log('[API:DASHBOARD] stats loaded from backend')
        return summary
      }

      const results = await getResults({ userId })
      const rebuiltSummary = aggregateScoreSummaryFromResults(results)

      window.apiClient.log(
        '[API:DASHBOARD] game breakdown rebuilt from game-results API'
      )

      return rebuiltSummary
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const getResultById = async (resultId) => {
    if (!resultId) return null

    const results = await getResults()
    return results.find((item) => item.id === resultId) || null
  }

  const getResultBySession = async ({ sessionId, userId }) => {
    if (!sessionId || !userId) return null

    const results = await getResults({ userId })

    return (
      results.find(
        (item) =>
          item.sessionId === sessionId &&
          (!item.userId || String(item.userId) === String(userId))
      ) || null
    )
  }

  const saveEngineResult = async ({ engineResult, userId, metadata = {} }) => {
    assertFinishedEngineResult(engineResult)

    const participant = getPersistentParticipant({ engineResult, userId })
    const combinedMetadata = {
      ...(engineResult.metadata && typeof engineResult.metadata === 'object'
        ? engineResult.metadata
        : {}),
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
    }

    const payload = {
      sessionId: String(engineResult.sessionId),
      gameType: engineResult.gameType,
      correct: Math.max(0, normalizeInteger(participant.correct)),
      wrong: Math.max(0, normalizeInteger(participant.wrong)),
      skipped: Math.max(0, normalizeInteger(participant.skipped)),
      rounds: Math.max(0, normalizeInteger(engineResult.rounds)),
      startedAt: engineResult.startedAt || null,
      finishedAt: engineResult.finishedAt || new Date().toISOString(),
    }

    if (combinedMetadata.folderId) {
      payload.folderId = String(combinedMetadata.folderId)
    }

    try {
      const data = await window.apiClient.post('/game-results', payload)
      const savedResult = normalizeResult(data)

      window.apiClient.log('[API:GAME_RESULT] saved to backend')

      return savedResult || data
    } catch (error) {
      const mappedError = remapApiError(error)

      if (
        String(mappedError?.code || mappedError?.message || '') ===
        'GAME_RESULT_DUPLICATE'
      ) {
        const existing = await getResultBySession({
          sessionId: String(engineResult.sessionId),
          userId: String(userId),
        })

        if (existing) {
          window.apiClient.log(
            '[API:GAME_RESULT] duplicate save resolved with existing backend result'
          )

          return existing
        }
      }

      throw mappedError
    }
  }

  window.gameResultService = Object.freeze({
    RESULT_SCHEMA_VERSION,
    GAME_TYPE,
    getResults,
    getUserScoreSummary,
    getResultById,
    getResultBySession,
    saveEngineResult,
  })
})()
