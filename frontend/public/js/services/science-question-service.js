/*
 * Science question service.
 *
 * Stores free-response science questions inside science folders.
 */

;(() => {
  const QUESTION_MAX_LENGTH = 220
  const ANSWER_MAX_LENGTH = 600

  const normalizeText = (value = '') => {
    return String(value)
      .trim()
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
  }

  const normalizeForCompare = (value = '') => {
    return normalizeText(value)
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('fa-IR')
  }

  const createQuestionId = () => {
    if (window.crypto?.randomUUID) {
      return `science-question-${window.crypto.randomUUID()}`
    }

    return `science-question-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`
  }

  const getQuestions = async () => {
    const state = await window.appDataProvider.getState()

    return Array.isArray(state.scienceQuestions)
      ? state.scienceQuestions
      : []
  }

  const getQuestionsByFolder = async (folderId) => {
    if (!folderId) return []

    const questions = await getQuestions()

    return questions.filter((question) => question.folderId === folderId)
  }

  const getQuestionById = async (questionId) => {
    if (!questionId) return null

    const questions = await getQuestions()

    return questions.find((question) => question.id === questionId) || null
  }

  const requireScienceFolder = async (folderId) => {
    if (!folderId) {
      throw new Error('SCIENCE_FOLDER_REQUIRED')
    }

    const folder = await window.folderService.getFolderById(folderId)

    if (!folder) {
      throw new Error('SCIENCE_FOLDER_NOT_FOUND')
    }

    if (folder.locked) {
      throw new Error('SCIENCE_FOLDER_LOCKED')
    }

    if (folder.type !== window.folderService.FOLDER_TYPE.SCIENCE) {
      throw new Error('SCIENCE_FOLDER_TYPE_INVALID')
    }

    return folder
  }

  const validateQuestionFields = ({ question, answer }) => {
    const normalizedQuestion = normalizeText(question)
    const normalizedAnswer = normalizeText(answer)

    if (!normalizedQuestion) {
      throw new Error('SCIENCE_QUESTION_REQUIRED')
    }

    if (normalizedQuestion.length > QUESTION_MAX_LENGTH) {
      throw new Error('SCIENCE_QUESTION_TOO_LONG')
    }

    if (!normalizedAnswer) {
      throw new Error('SCIENCE_ANSWER_REQUIRED')
    }

    if (normalizedAnswer.length > ANSWER_MAX_LENGTH) {
      throw new Error('SCIENCE_ANSWER_TOO_LONG')
    }

    return {
      question: normalizedQuestion,
      answer: normalizedAnswer,
    }
  }

  const createQuestion = async ({ folderId, question, answer }) => {
    await requireScienceFolder(folderId)

    const normalized = validateQuestionFields({ question, answer })
    const folderQuestions = await getQuestionsByFolder(folderId)

    const duplicate = folderQuestions.some(
      (item) =>
        normalizeForCompare(item.question) ===
        normalizeForCompare(normalized.question),
    )

    if (duplicate) {
      throw new Error('SCIENCE_QUESTION_DUPLICATE')
    }

    const scienceQuestion = {
      id: createQuestionId(),
      folderId,
      question: normalized.question,
      answer: normalized.answer,
      createdAt: new Date().toISOString(),
    }

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.scienceQuestions)) {
        state.scienceQuestions = []
      }

      state.scienceQuestions.push(scienceQuestion)
      return state
    })

    return scienceQuestion
  }

  const updateQuestion = async ({ questionId, question, answer }) => {
    if (!questionId) {
      throw new Error('SCIENCE_QUESTION_ID_REQUIRED')
    }

    const normalized = validateQuestionFields({ question, answer })
    let updatedQuestion = null

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.scienceQuestions)) {
        state.scienceQuestions = []
      }

      if (!Array.isArray(state.folders)) {
        state.folders = []
      }

      const scienceQuestion = state.scienceQuestions.find(
        (item) => item.id === questionId,
      )

      if (!scienceQuestion) {
        throw new Error('SCIENCE_QUESTION_NOT_FOUND')
      }

      const folder = state.folders.find(
        (item) => item.id === scienceQuestion.folderId,
      )

      if (!folder) {
        throw new Error('SCIENCE_FOLDER_NOT_FOUND')
      }

      if (folder.locked) {
        throw new Error('SCIENCE_FOLDER_LOCKED')
      }

      const folderType = window.folderService.normalizeFolderType(folder.type)

      if (folderType !== window.folderService.FOLDER_TYPE.SCIENCE) {
        throw new Error('SCIENCE_FOLDER_TYPE_INVALID')
      }

      const duplicate = state.scienceQuestions.some(
        (item) =>
          item.id !== questionId &&
          item.folderId === scienceQuestion.folderId &&
          normalizeForCompare(item.question) ===
            normalizeForCompare(normalized.question),
      )

      if (duplicate) {
        throw new Error('SCIENCE_QUESTION_DUPLICATE')
      }

      scienceQuestion.question = normalized.question
      scienceQuestion.answer = normalized.answer
      scienceQuestion.updatedAt = new Date().toISOString()

      updatedQuestion = { ...scienceQuestion }
      return state
    })

    return updatedQuestion
  }

  const deleteQuestion = async (questionId) => {
    if (!questionId) {
      throw new Error('SCIENCE_QUESTION_ID_REQUIRED')
    }

    let deletedQuestion = null

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.scienceQuestions)) {
        state.scienceQuestions = []
      }

      if (!Array.isArray(state.folders)) {
        state.folders = []
      }

      const questionIndex = state.scienceQuestions.findIndex(
        (item) => item.id === questionId,
      )

      if (questionIndex < 0) {
        throw new Error('SCIENCE_QUESTION_NOT_FOUND')
      }

      const scienceQuestion = state.scienceQuestions[questionIndex]
      const folder = state.folders.find(
        (item) => item.id === scienceQuestion.folderId,
      )

      if (!folder) {
        throw new Error('SCIENCE_FOLDER_NOT_FOUND')
      }

      if (folder.locked) {
        throw new Error('SCIENCE_FOLDER_LOCKED')
      }

      deletedQuestion = { ...scienceQuestion }
      state.scienceQuestions.splice(questionIndex, 1)

      return state
    })

    return deletedQuestion
  }

  window.scienceQuestionService = Object.freeze({
    QUESTION_MAX_LENGTH,
    ANSWER_MAX_LENGTH,
    getQuestions,
    getQuestionsByFolder,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  })
})()
