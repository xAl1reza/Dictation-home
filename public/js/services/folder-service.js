/*
 * Folder service.
 *
 * Handles folder-related domain logic.
 * The UI never reads app-data.json or localStorage directly.
 */

const FOLDER_TITLE_MAX_LENGTH = 60

const normalizeFolderTitle = (title = '') => {
  return String(title).trim().replace(/\s+/g, ' ')
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

  const currentFolders = await getFolders()

  const duplicateFolder = currentFolders.some(
    (folder) => normalizeFolderTitle(folder.title) === normalizedTitle
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

window.folderService = {
  getFolders,
  getUserFolders,
  getWritableFolders,
  createFolder,
}
