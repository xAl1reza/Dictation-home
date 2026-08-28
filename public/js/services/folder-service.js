/*
 * Folder service.
 *
 * Handles folder-related domain logic.
 * The UI never reads or writes application state directly.
 */

const FOLDER_TITLE_MAX_LENGTH = 60

const normalizeFolderTitle = (title = '') => {
  return String(title).trim().replace(/\s+/g, ' ')
}

const normalizeFolderTitleForCompare = (title = '') => {
  return normalizeFolderTitle(title).toLocaleLowerCase('fa-IR')
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

  return folders.map((folder) => ({
    ...folder,

    wordCount: words.filter((word) => word.folderId === folder.id).length,
  }))
}

const getFolderById = async (folderId) => {
  if (!folderId) return null

  const folders = await getFolders()

  return folders.find((folder) => folder.id === folderId) || null
}

const getUserFolders = async () => {
  const folders = await getFolders()

  return folders.filter(
    (folder) => folder.ownerType === 'user' && !folder.locked
  )
}

const getWritableFolders = async () => {
  const folders = await getFolders()

  return folders.filter((folder) => !folder.locked)
}

const createFolder = async ({ title }) => {
  const normalizedTitle = normalizeFolderTitle(title)

  if (!normalizedTitle) {
    throw new Error('FOLDER_TITLE_REQUIRED')
  }

  if (normalizedTitle.length > FOLDER_TITLE_MAX_LENGTH) {
    throw new Error('FOLDER_TITLE_TOO_LONG')
  }

  const folders = await getFolders()

  const duplicateFolder = folders.some(
    (folder) =>
      normalizeFolderTitleForCompare(folder.title) ===
      normalizeFolderTitleForCompare(normalizedTitle)
  )

  if (duplicateFolder) {
    throw new Error('FOLDER_TITLE_DUPLICATE')
  }

  const folder = {
    id: createFolderId(),

    title: normalizedTitle,

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

    const duplicateFolder = state.folders.some(
      (item) =>
        item.id !== folderId &&
        normalizeFolderTitleForCompare(item.title) ===
          normalizeFolderTitleForCompare(normalizedTitle)
    )

    if (duplicateFolder) {
      throw new Error('FOLDER_TITLE_DUPLICATE')
    }

    folder.title = normalizedTitle
    folder.updatedAt = new Date().toISOString()

    updatedFolder = {
      ...folder,
    }

    return state
  })

  const words = await window.wordService?.getWordsByFolder?.(folderId)

  return {
    ...updatedFolder,
    wordCount: Array.isArray(words) ? words.length : 0,
  }
}

const deleteFolder = async (folderId) => {
  if (!folderId) {
    throw new Error('FOLDER_ID_REQUIRED')
  }

  let deletedFolder = null
  let deletedWordCount = 0

  await window.appDataProvider.updateState((state) => {
    if (!Array.isArray(state.folders)) {
      state.folders = []
    }

    if (!Array.isArray(state.words)) {
      state.words = []
    }

    const folderIndex = state.folders.findIndex(
      (folder) => folder.id === folderId
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
    }

    deletedWordCount = state.words.filter(
      (word) => word.folderId === folderId
    ).length

    state.folders.splice(folderIndex, 1)

    state.words = state.words.filter((word) => word.folderId !== folderId)

    return state
  })

  return {
    folder: deletedFolder,
    deletedWordCount,
  }
}

window.folderService = {
  getFolders,
  getFolderById,
  getUserFolders,
  getWritableFolders,
  createFolder,
  updateFolder,
  deleteFolder,
}
