/*
 * Science question service backed by the real API.
 *
 * All science question data comes from the backend.
 * All HTTP calls use async/await through apiClient.
 */

;(() => {
  const QUESTION_MAX_LENGTH = 220
  const ANSWER_MAX_LENGTH = 600

  const SERVER_ERROR_MAP = Object.freeze({
    'Folder not found': 'SCIENCE_FOLDER_NOT_FOUND',
    'Science questions are only allowed in science folders':
      'SCIENCE_FOLDER_TYPE_INVALID',
    'Questions are only allowed in science folders':
      'SCIENCE_FOLDER_TYPE_INVALID',
    'Question is required': 'SCIENCE_QUESTION_REQUIRED',
    'Question must not exceed 220 characters': 'SCIENCE_QUESTION_TOO_LONG',
    'Answer is required': 'SCIENCE_ANSWER_REQUIRED',
    'Answer must not exceed 600 characters': 'SCIENCE_ANSWER_TOO_LONG',
    'Question already exists in this folder': 'SCIENCE_QUESTION_DUPLICATE',
    'Science question already exists in this folder':
      'SCIENCE_QUESTION_DUPLICATE',
    'Science question not found': 'SCIENCE_QUESTION_NOT_FOUND',
    'Question not found': 'SCIENCE_QUESTION_NOT_FOUND',
  })

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

  const remapApiError = (error) => {
    return window.apiErrors?.remap(error, SERVER_ERROR_MAP) || error
  }

  const normalizeQuestionRecord = (item) => {
    if (!item || typeof item !== 'object') {
      return null
    }

    return {
      ...item,
      id: item.id,
      folderId: item.folderId ?? item.folder_id ?? null,
      question: item.question ?? '',
      answer: item.answer ?? '',
      createdAt: item.createdAt ?? item.created_at ?? null,
      updatedAt: item.updatedAt ?? item.updated_at ?? null,
    }
  }

  const getQuestionsByFolder = async (folderId) => {
    if (!folderId) return []

    try {
      const data = await window.apiClient.get(
        `/folders/${encodeURIComponent(folderId)}/science-questions`
      )

      const questions = Array.isArray(data)
        ? data.map(normalizeQuestionRecord).filter(Boolean)
        : []

      window.apiClient.log(
        `[API:SCIENCE] loaded from backend: count=${questions.length}`
      )

      return questions
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const getQuestions = async () => {
    const folders = await window.folderService.getFoldersByType(
      window.folderService.FOLDER_TYPE.SCIENCE
    )

    const lists = await Promise.all(
      folders.map(async (folder) => {
        return await getQuestionsByFolder(folder.id)
      })
    )

    return lists.flat()
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
        normalizeForCompare(normalized.question)
    )

    if (duplicate) {
      throw new Error('SCIENCE_QUESTION_DUPLICATE')
    }

    try {
      const data = await window.apiClient.post(
        `/folders/${encodeURIComponent(folderId)}/science-questions`,
        normalized
      )

      const scienceQuestion = normalizeQuestionRecord(data)

      window.apiClient.log('[API:SCIENCE] created on backend')

      return scienceQuestion
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const updateQuestion = async ({ questionId, question, answer }) => {
    if (!questionId) {
      throw new Error('SCIENCE_QUESTION_ID_REQUIRED')
    }

    const normalized = validateQuestionFields({ question, answer })

    try {
      const data = await window.apiClient.patch(
        `/science-questions/${encodeURIComponent(questionId)}`,
        normalized
      )

      const scienceQuestion = normalizeQuestionRecord(data)

      window.apiClient.log('[API:SCIENCE] updated on backend')

      return scienceQuestion
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const deleteQuestion = async (questionId) => {
    if (!questionId) {
      throw new Error('SCIENCE_QUESTION_ID_REQUIRED')
    }

    try {
      const data = await window.apiClient.delete(
        `/science-questions/${encodeURIComponent(questionId)}`
      )

      window.apiClient.log('[API:SCIENCE] deleted on backend')

      return data || { id: questionId }
    } catch (error) {
      throw remapApiError(error)
    }
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
