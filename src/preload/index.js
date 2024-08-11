import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getPasswordStoreEntries: (query) => {
    return ipcRenderer.invoke('get-password-store-entries', query);
  },
  getPasswordStoreEntry: async (entryPath) => {
    return await ipcRenderer.invoke('get-password-store-entry', entryPath);
  },
  savePasswordStoreEntry: async (entryPath, content) => {
    return await ipcRenderer.invoke('save-password-store-entry', entryPath, content);
  },
  deletePasswordStoreEntry: async (entryPath) => {
    return await ipcRenderer.invoke('delete-password-store-entry', entryPath);
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
