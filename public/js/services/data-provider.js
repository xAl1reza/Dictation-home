/*
 * Application data provider.
 *
 * Current implementation:
 * JSON seed + localStorage persistence.
 *
 * Future implementation:
 * Replace this provider with API requests while keeping
 * page controllers and UI components unchanged.
 */

const APP_DATA_URL = './data/app-data.json'
const APP_STORAGE_KEY = 'dikteh-khooneh-app-data'

let memoryState = null

const cloneData = (data) => {
  return structuredClone(data)
}

const readLocalState = () => {
  try {
    const storedData = localStorage.getItem(APP_STORAGE_KEY)

    if (!storedData) return null

    const parsedData = JSON.parse(storedData)

    if (!parsedData || typeof parsedData !== 'object') {
      return null
    }

    return parsedData
  } catch (error) {
    console.warn('Could not read local app data:', error)

    return null
  }
}

const writeLocalState = (data) => {
  memoryState = cloneData(data)

  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Could not persist local app data:', error)
  }
}

const loadSeedData = async () => {
  const response = await fetch(APP_DATA_URL)

  if (!response.ok) {
    throw new Error(`Failed to load application data: ${response.status}`)
  }

  const data = await response.json()

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid application data format.')
  }

  return data
}

const initializeData = async () => {
  if (memoryState) {
    return cloneData(memoryState)
  }

  const localState = readLocalState()

  if (localState) {
    memoryState = localState

    return cloneData(memoryState)
  }

  const seedData = await loadSeedData()

  writeLocalState(seedData)

  return cloneData(seedData)
}

const getState = async () => {
  return initializeData()
}

const updateState = async (updater) => {
  if (typeof updater !== 'function') {
    throw new TypeError('Data provider updater must be a function.')
  }

  const currentState = await initializeData()
  const draftState = cloneData(currentState)

  const nextState = updater(draftState) || draftState

  if (!nextState || typeof nextState !== 'object') {
    throw new Error('Data provider received an invalid state.')
  }

  writeLocalState(nextState)

  return cloneData(nextState)
}

/*
 * Development helper.
 * Restores localStorage from app-data.json.
 */
const resetData = async () => {
  const seedData = await loadSeedData()

  writeLocalState(seedData)

  return cloneData(seedData)
}

window.appDataProvider = {
  getState,
  updateState,
  resetData,
}
