/*
 * Word service.
 *
 * Handles word-related domain logic.
 * The UI never reads or writes application state directly.
 */

const WORD_MAX_LENGTH = 80

const normalizeWord = (value = '') => {
  return String(value).trim().replace(/\s+/g, ' ')
}

const normalizeWordForCompare = (value = '') => {
  return normalizeWord(value).toLocaleLowerCase('fa-IR')
}

const createWordId = () => {
  if (window.crypto?.randomUUID) {
    return `word-${window.crypto.randomUUID()}`
  }

  return `word-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getWords = async () => {
  const data = await window.appDataProvider.getState()

  return Array.isArray(data.words) ? data.words : []
}

const getWordsByFolder = async (folderId) => {
  if (!folderId) return []

  const words = await getWords()

  return words.filter((word) => word.folderId === folderId)
}

const getWordById = async (wordId) => {
  if (!wordId) return null

  const words = await getWords()

  return words.find((word) => word.id === wordId) || null
}

const createWord = async ({ folderId, value }) => {
  const normalizedWord = normalizeWord(value)

  if (!folderId) {
    throw new Error('WORD_FOLDER_REQUIRED')
  }

  if (!normalizedWord) {
    throw new Error('WORD_VALUE_REQUIRED')
  }

  if (normalizedWord.length > WORD_MAX_LENGTH) {
    throw new Error('WORD_VALUE_TOO_LONG')
  }

  const folders = await window.folderService.getFolders()

  const targetFolder = folders.find((folder) => folder.id === folderId)

  if (!targetFolder) {
    throw new Error('WORD_FOLDER_NOT_FOUND')
  }

  if (targetFolder.locked) {
    throw new Error('WORD_FOLDER_LOCKED')
  }

  const folderWords = await getWordsByFolder(folderId)

  const duplicateWord = folderWords.some(
    (word) =>
      normalizeWordForCompare(word.value) ===
      normalizeWordForCompare(normalizedWord)
  )

  if (duplicateWord) {
    throw new Error('WORD_DUPLICATE')
  }

  const word = {
    id: createWordId(),

    folderId,

    value: normalizedWord,

    createdAt: new Date().toISOString(),
  }

  await window.appDataProvider.updateState((state) => {
    if (!Array.isArray(state.words)) {
      state.words = []
    }

    state.words.push(word)

    return state
  })

  return word
}

const updateWord = async ({ wordId, value }) => {
  if (!wordId) {
    throw new Error('WORD_ID_REQUIRED')
  }

  const normalizedWord = normalizeWord(value)

  if (!normalizedWord) {
    throw new Error('WORD_VALUE_REQUIRED')
  }

  if (normalizedWord.length > WORD_MAX_LENGTH) {
    throw new Error('WORD_VALUE_TOO_LONG')
  }

  let updatedWord = null

  await window.appDataProvider.updateState((state) => {
    if (!Array.isArray(state.words)) {
      state.words = []
    }

    if (!Array.isArray(state.folders)) {
      state.folders = []
    }

    const word = state.words.find((item) => item.id === wordId)

    if (!word) {
      throw new Error('WORD_NOT_FOUND')
    }

    const folder = state.folders.find((item) => item.id === word.folderId)

    if (!folder) {
      throw new Error('WORD_FOLDER_NOT_FOUND')
    }

    if (folder.locked) {
      throw new Error('WORD_FOLDER_LOCKED')
    }

    const duplicateWord = state.words.some(
      (item) =>
        item.id !== wordId &&
        item.folderId === word.folderId &&
        normalizeWordForCompare(item.value) ===
          normalizeWordForCompare(normalizedWord)
    )

    if (duplicateWord) {
      throw new Error('WORD_DUPLICATE')
    }

    word.value = normalizedWord
    word.updatedAt = new Date().toISOString()

    updatedWord = {
      ...word,
    }

    return state
  })

  return updatedWord
}

const deleteWord = async (wordId) => {
  if (!wordId) {
    throw new Error('WORD_ID_REQUIRED')
  }

  let deletedWord = null

  await window.appDataProvider.updateState((state) => {
    if (!Array.isArray(state.words)) {
      state.words = []
    }

    if (!Array.isArray(state.folders)) {
      state.folders = []
    }

    const wordIndex = state.words.findIndex((word) => word.id === wordId)

    if (wordIndex < 0) {
      throw new Error('WORD_NOT_FOUND')
    }

    const word = state.words[wordIndex]

    const folder = state.folders.find((item) => item.id === word.folderId)

    if (!folder) {
      throw new Error('WORD_FOLDER_NOT_FOUND')
    }

    if (folder.locked) {
      throw new Error('WORD_FOLDER_LOCKED')
    }

    deletedWord = {
      ...word,
    }

    state.words.splice(wordIndex, 1)

    return state
  })

  return deletedWord
}

window.wordService = {
  getWords,
  getWordsByFolder,
  getWordById,
  createWord,
  updateWord,
  deleteWord,
}
