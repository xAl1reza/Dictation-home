/*
 * Folder service backed by the real API.
 *
 * No folder/domain data is read from browser mock storage.
 * All server calls use async/await through apiClient.
 */

;(() => {
  const FOLDER_TITLE_MAX_LENGTH = 60

  const FOLDER_TYPE = Object.freeze({
    DICTATION: 'dictation',
    SCIENCE: 'science',
  })

  const SERVER_ERROR_MAP = Object.freeze({
    'Title and type are required': 'FOLDER_TITLE_REQUIRED',
    'Title is required': 'FOLDER_TITLE_REQUIRED',
    'Title must not exceed 100 characters': 'FOLDER_TITLE_TOO_LONG',
    'Invalid folder type': 'FOLDER_TYPE_INVALID',
    'Folder not found': 'FOLDER_NOT_FOUND',
  })

  const normalizeFolderTitle = (title = '') => {
    return String(title).trim().replace(/\s+/g, ' ')
  }

  const normalizeFolderTitleForCompare = (title = '') => {
    return normalizeFolderTitle(title).toLocaleLowerCase('fa-IR')
  }

  const normalizeFolderType = (type) => {
    if (type === FOLDER_TYPE.SCIENCE) {
      return FOLDER_TYPE.SCIENCE
    }

    return FOLDER_TYPE.DICTATION
  }

  const assertFolderType = (type) => {
    if (!Object.values(FOLDER_TYPE).includes(type)) {
      throw new Error('FOLDER_TYPE_INVALID')
    }
  }

  const remapApiError = (error) => {
    return window.apiErrors?.remap(error, SERVER_ERROR_MAP) || error
  }

  const normalizeFolder = (folder) => {
    if (!folder || typeof folder !== 'object') {
      return null
    }

    const type = normalizeFolderType(folder.type)
    const wordCount = Math.max(0, Number(folder.wordCount || 0))
    const questionCount = Math.max(0, Number(folder.questionCount || 0))

    return {
      ...folder,
      type,
      ownerType: folder.ownerType || 'user',
      locked: Boolean(folder.locked),
      wordCount,
      questionCount,
      itemCount: type === FOLDER_TYPE.SCIENCE ? questionCount : wordCount,
    }
  }

  const getFolders = async (type = null) => {
    if (type) {
      assertFolderType(type)
    }

    try {
      const data = await window.apiClient.get('/folders', {
        query: type ? { type } : null,
      })

      const folders = Array.isArray(data)
        ? data.map(normalizeFolder).filter(Boolean)
        : []

      window.apiClient.log(
        `[API:FOLDERS] loaded from backend: ${folders.length}`
      )

      return folders
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const getFolderById = async (folderId) => {
    if (!folderId) return null

    const folders = await getFolders()

    return folders.find((folder) => folder.id === folderId) || null
  }

  const getFoldersByType = async (type) => {
    assertFolderType(type)

    return await getFolders(type)
  }

  const getUserFolders = async (type = null) => {
    if (type) {
      assertFolderType(type)
    }

    const folders = await getFolders(type)

    return folders.filter(
      (folder) => folder.ownerType === 'user' && !folder.locked
    )
  }

  const getWritableFolders = async (type = null) => {
    if (type) {
      assertFolderType(type)
    }

    const folders = await getFolders(type)

    return folders.filter((folder) => !folder.locked)
  }

  const createFolder = async ({ title, type = FOLDER_TYPE.DICTATION }) => {
    const normalizedTitle = normalizeFolderTitle(title)

    assertFolderType(type)

    const normalizedType = normalizeFolderType(type)

    if (!normalizedTitle) {
      throw new Error('FOLDER_TITLE_REQUIRED')
    }

    if (normalizedTitle.length > FOLDER_TITLE_MAX_LENGTH) {
      throw new Error('FOLDER_TITLE_TOO_LONG')
    }

    const folders = await getFolders(normalizedType)

    const duplicateFolder = folders.some(
      (folder) =>
        normalizeFolderTitleForCompare(folder.title) ===
        normalizeFolderTitleForCompare(normalizedTitle)
    )

    if (duplicateFolder) {
      throw new Error('FOLDER_TITLE_DUPLICATE')
    }

    try {
      const data = await window.apiClient.post('/folders', {
        title: normalizedTitle,
        type: normalizedType,
      })

      const folder = normalizeFolder(data)

      window.apiClient.log('[API:FOLDERS] created on backend')

      return folder
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const updateFolder = async ({ folderId, title }) => {
    if (!folderId) {
      throw new Error('FOLDER_ID_REQUIRED')
    }

    const normalizedTitle = normalizeFolderTitle(title)

    if (!normalizedTitle) {
      throw new Error('FOLDER_TITLE_REQUIRED')
    }

    if (normalizedTitle.length > FOLDER_TITLE_MAX_LENGTH) {
      throw new Error('FOLDER_TITLE_TOO_LONG')
    }

    const folders = await getFolders()
    const currentFolder = folders.find((folder) => folder.id === folderId)

    if (!currentFolder) {
      throw new Error('FOLDER_NOT_FOUND')
    }

    if (currentFolder.locked) {
      throw new Error('FOLDER_LOCKED')
    }

    const duplicateFolder = folders.some(
      (folder) =>
        folder.id !== folderId &&
        folder.type === currentFolder.type &&
        normalizeFolderTitleForCompare(folder.title) ===
          normalizeFolderTitleForCompare(normalizedTitle)
    )

    if (duplicateFolder) {
      throw new Error('FOLDER_TITLE_DUPLICATE')
    }

    try {
      const data = await window.apiClient.patch(
        `/folders/${encodeURIComponent(folderId)}`,
        { title: normalizedTitle }
      )

      const folder = normalizeFolder({
        ...currentFolder,
        ...data,
        title: data?.title || normalizedTitle,
      })

      window.apiClient.log('[API:FOLDERS] updated on backend')

      return folder
    } catch (error) {
      throw remapApiError(error)
    }
  }

  const deleteFolder = async (folderId) => {
    if (!folderId) {
      throw new Error('FOLDER_ID_REQUIRED')
    }

    const folder = await getFolderById(folderId)

    if (!folder) {
      throw new Error('FOLDER_NOT_FOUND')
    }

    if (folder.locked) {
      throw new Error('FOLDER_LOCKED')
    }

    try {
      await window.apiClient.delete(
        `/folders/${encodeURIComponent(folderId)}`
      )

      window.apiClient.log('[API:FOLDERS] deleted on backend')

      return {
        folder,
        deletedWordCount: folder.wordCount,
        deletedQuestionCount: folder.questionCount,
      }
    } catch (error) {
      throw remapApiError(error)
    }
  }

  window.folderService = Object.freeze({
    FOLDER_TYPE,
    normalizeFolderType,
    getFolders,
    getFolderById,
    getFoldersByType,
    getUserFolders,
    getWritableFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  })
})()
