/*
 * Folder service.
 *
 * Handles folder-related domain logic.
 * Legacy folders without `type` are treated as dictation folders.
 */

;(() => {
  const FOLDER_TITLE_MAX_LENGTH = 60

  const FOLDER_TYPE = Object.freeze({
    DICTATION: 'dictation',
    SCIENCE: 'science',
  })

  const normalizeFolderTitle = (title = '') => {
    return String(title)
      .trim()
      .replace(/\s+/g, ' ')
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

  const createFolderId = () => {
    if (window.crypto?.randomUUID) {
      return `folder-${window.crypto.randomUUID()}`
    }

    return `folder-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const getFolders = async () => {
    const data = await window.appDataProvider.getState()

    const folders = Array.isArray(data.folders) ? data.folders : []
    const words = Array.isArray(data.words) ? data.words : []
    const scienceQuestions = Array.isArray(data.scienceQuestions)
      ? data.scienceQuestions
      : []

    return folders.map((folder) => {
      const type = normalizeFolderType(folder.type)

      const wordCount = words.filter(
        (word) => word.folderId === folder.id,
      ).length

      const questionCount = scienceQuestions.filter(
        (question) => question.folderId === folder.id,
      ).length

      return {
        ...folder,
        type,
        wordCount,
        questionCount,
        itemCount:
          type === FOLDER_TYPE.SCIENCE ? questionCount : wordCount,
      }
    })
  }

  const getFolderById = async (folderId) => {
    if (!folderId) return null

    const folders = await getFolders()

    return folders.find((folder) => folder.id === folderId) || null
  }

  const getFoldersByType = async (type) => {
    assertFolderType(type)

    const folders = await getFolders()

    return folders.filter((folder) => folder.type === type)
  }

  const getUserFolders = async (type = null) => {
    if (type) {
      assertFolderType(type)
    }

    const folders = await getFolders()

    return folders.filter(
      (folder) =>
        folder.ownerType === 'user' &&
        !folder.locked &&
        (!type || folder.type === type),
    )
  }

  const getWritableFolders = async (type = null) => {
    if (type) {
      assertFolderType(type)
    }

    const folders = await getFolders()

    return folders.filter(
      (folder) => !folder.locked && (!type || folder.type === type),
    )
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

    const folders = await getFolders()

    const duplicateFolder = folders.some(
      (folder) =>
        folder.type === normalizedType &&
        normalizeFolderTitleForCompare(folder.title) ===
          normalizeFolderTitleForCompare(normalizedTitle),
    )

    if (duplicateFolder) {
      throw new Error('FOLDER_TITLE_DUPLICATE')
    }

    const folder = {
      id: createFolderId(),
      title: normalizedTitle,
      type: normalizedType,
      ownerType: 'user',
      locked: false,
      createdAt: new Date().toISOString(),
    }

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.folders)) {
        state.folders = []
      }

      state.folders.push(folder)
      return state
    })

    return {
      ...folder,
      wordCount: 0,
      questionCount: 0,
      itemCount: 0,
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

    let updatedFolder = null

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.folders)) {
        state.folders = []
      }

      const folder = state.folders.find((item) => item.id === folderId)

      if (!folder) {
        throw new Error('FOLDER_NOT_FOUND')
      }

      if (folder.locked) {
        throw new Error('FOLDER_LOCKED')
      }

      const folderType = normalizeFolderType(folder.type)

      const duplicateFolder = state.folders.some(
        (item) =>
          item.id !== folderId &&
          normalizeFolderType(item.type) === folderType &&
          normalizeFolderTitleForCompare(item.title) ===
            normalizeFolderTitleForCompare(normalizedTitle),
      )

      if (duplicateFolder) {
        throw new Error('FOLDER_TITLE_DUPLICATE')
      }

      folder.title = normalizedTitle
      folder.type = folderType
      folder.updatedAt = new Date().toISOString()

      updatedFolder = { ...folder }
      return state
    })

    const refreshedFolder = await getFolderById(folderId)

    return refreshedFolder || updatedFolder
  }

  const deleteFolder = async (folderId) => {
    if (!folderId) {
      throw new Error('FOLDER_ID_REQUIRED')
    }

    let deletedFolder = null
    let deletedWordCount = 0
    let deletedQuestionCount = 0

    await window.appDataProvider.updateState((state) => {
      if (!Array.isArray(state.folders)) {
        state.folders = []
      }

      if (!Array.isArray(state.words)) {
        state.words = []
      }

      if (!Array.isArray(state.scienceQuestions)) {
        state.scienceQuestions = []
      }

      const folderIndex = state.folders.findIndex(
        (folder) => folder.id === folderId,
      )

      if (folderIndex < 0) {
        throw new Error('FOLDER_NOT_FOUND')
      }

      const folder = state.folders[folderIndex]

      if (folder.locked) {
        throw new Error('FOLDER_LOCKED')
      }

      deletedFolder = {
        ...folder,
        type: normalizeFolderType(folder.type),
      }

      deletedWordCount = state.words.filter(
        (word) => word.folderId === folderId,
      ).length

      deletedQuestionCount = state.scienceQuestions.filter(
        (question) => question.folderId === folderId,
      ).length

      state.folders.splice(folderIndex, 1)

      state.words = state.words.filter((word) => word.folderId !== folderId)

      state.scienceQuestions = state.scienceQuestions.filter(
        (question) => question.folderId !== folderId,
      )

      return state
    })

    return {
      folder: deletedFolder,
      deletedWordCount,
      deletedQuestionCount,
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
