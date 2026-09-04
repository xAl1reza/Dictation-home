/*
 * Word service backed by the real API.
 *
 * All word data comes from the backend.
 * All HTTP calls use async/await through apiClient.
 */

;(() => {
  const WORD_MAX_LENGTH = 80

  const SERVER_ERROR_MAP = Object.freeze({
    'Folder not found': 'WORD_FOLDER_NOT_FOUND',
    'Words are only allowed in dictation folders': 'WORD_FOLDER_TYPE_INVALID',
    'Value is required': 'WORD_VALUE_REQUIRED',
    'Value must not exceed 80 characters': 'WORD_VALUE_TOO_LONG',
    'Word already exists in this folder': 'WORD_DUPLICATE',
    'Word not found': 'WORD_NOT_FOUND',
  })

  const normalizeWord = (value = '') => {
    return String(value).trim().replace(/\s+/g, ' ')
  }

  const normalizeWordForCompare = (value = '') => {
    return normalizeWord(value).toLocaleLowerCase('fa-IR')
  }

  const remapApiError = (error) => {
    return window.apiErrors?.remap(error, SERVER_ERROR_MAP) || error
  }

  const normalizeWordRecord = (word) => {
    if (!word || typeof word !== 'object') {
      return null
    }

    return {
      ...word,
      id: word.id,
      folderId: word.folderId ?? word.folder_id ?? null,
      value: word.value ?? word.word ?? '',
      createdAt: word.createdAt ?? word.created_at ?? null,
      updatedAt: word.updatedAt ?? word.updated_at ?? null,
    }
  }

  const getWordsByFolder = async (folderId) => {
    if (!folderId) return []

    try {
      const data = await window.apiClient.get(
        `/folders/${encodeURIComponent(folderId)}/words`
      )

      const words = Array.isArray(data)
        ? data.map(normalizeWordRecord).filter(Boolean)
        : []

      window.apiClient.log(
        `[API:WORDS] loaded from backend: count=${words.length}`
      )

      return words
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const getWords = async () => {
    const folders = await window.folderService.getFoldersByType(
      window.folderService.FOLDER_TYPE.DICTATION
    )

    const lists = await Promise.all(
      folders.map(async (folder) => {
        return await getWordsByFolder(folder.id)
      })
    )

    return lists.flat()
  }

  const getWordById = async (wordId) => {
    if (!wordId) return null

    const words = await getWords()

    return words.find((word) => word.id === wordId) || null
  }

  const requireDictationFolder = async (folderId) => {
    if (!folderId) {
      throw new Error('WORD_FOLDER_REQUIRED')
    }

    const folder = await window.folderService.getFolderById(folderId)

    if (!folder) {
      throw new Error('WORD_FOLDER_NOT_FOUND')
    }

    if (folder.locked) {
      throw new Error('WORD_FOLDER_LOCKED')
    }

    if (
      window.folderService.normalizeFolderType(folder.type) !==
      window.folderService.FOLDER_TYPE.DICTATION
    ) {
      throw new Error('WORD_FOLDER_TYPE_INVALID')
    }

    return folder
  }

  const validateWordValue = (value) => {
    const normalizedValue = normalizeWord(value)

    if (!normalizedValue) {
      throw new Error('WORD_VALUE_REQUIRED')
    }

    if (normalizedValue.length > WORD_MAX_LENGTH) {
      throw new Error('WORD_VALUE_TOO_LONG')
    }

    return normalizedValue
  }

  const createWord = async ({ folderId, value }) => {
    await requireDictationFolder(folderId)

    const normalizedValue = validateWordValue(value)
    const folderWords = await getWordsByFolder(folderId)

    const duplicateWord = folderWords.some(
      (word) =>
        normalizeWordForCompare(word.value) ===
        normalizeWordForCompare(normalizedValue)
    )

    if (duplicateWord) {
      throw new Error('WORD_DUPLICATE')
    }

    try {
      const data = await window.apiClient.post(
        `/folders/${encodeURIComponent(folderId)}/words`,
        { value: normalizedValue }
      )

      const word = normalizeWordRecord(data)

      window.apiClient.log('[API:WORDS] created on backend')

      return word
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const updateWord = async ({ wordId, value }) => {
    if (!wordId) {
      throw new Error('WORD_ID_REQUIRED')
    }

    const normalizedValue = validateWordValue(value)

    try {
      const data = await window.apiClient.patch(
        `/words/${encodeURIComponent(wordId)}`,
        { value: normalizedValue }
      )

      const word = normalizeWordRecord(data)

      window.apiClient.log('[API:WORDS] updated on backend')

      return word
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const deleteWord = async (wordId) => {
    if (!wordId) {
      throw new Error('WORD_ID_REQUIRED')
    }

    try {
      const data = await window.apiClient.delete(
        `/words/${encodeURIComponent(wordId)}`
      )

      window.apiClient.log('[API:WORDS] deleted on backend')

      return data || { id: wordId }
    } catch (error) {
      throw remapApiError(error)
    }
  }

  window.wordService = Object.freeze({
    WORD_MAX_LENGTH,
    getWords,
    getWordsByFolder,
    getWordById,
    createWord,
    updateWord,
    deleteWord,
  })
})()
