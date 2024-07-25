import '@testing-library/jest-dom';
import { ipcRenderer } from 'electron';
import { enableFetchMocks } from 'jest-fetch-mock';

// mock fetch request (for router)
enableFetchMocks();

// Mock the IPC Renderer
jest.mock('electron', () => ({
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

// Mock the contextBridge and expose methods to the window object
window.api = {
  getPasswordStoreEntries: () => ipcRenderer.invoke('get-password-store-entries'),
  getPasswordStoreEntry: async (entryPath) => {
    return await ipcRenderer.invoke('get-password-store-entry', entryPath);
  },
  savePasswordStoreEntry: async (entryPath, content) => {
    return await ipcRenderer.invoke('save-password-store-entry', entryPath, content)
  },
};
