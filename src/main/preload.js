const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
    analyzeUrl: (url) => ipcRenderer.invoke('download-analyze', url),
    startDownload: (options) => ipcRenderer.invoke('download-start', options),
    checkDeps: () => ipcRenderer.invoke('check-deps'),
    onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (e, data) => cb(data)),
    onDownloadDone: (cb) => ipcRenderer.on('download-done', (e, data) => cb(data)),
    onDownloadError: (cb) => ipcRenderer.on('download-error', (e, data) => cb(data))
});