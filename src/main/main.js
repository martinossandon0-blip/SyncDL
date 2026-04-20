const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const Store = require('electron-store')
const DownloadManager = require('./download-manager')
const SyncManager = require('./sync-manager')
const DepsManager = require('./deps-manager')

const store = new Store()
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  })

  // Ruta corregida para tu estructura: src/main/main.js -> src/render/index.html
  mainWindow.loadFile(path.join(__dirname, '..', 'render', 'index.html'))

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Window Controls ───────────────────────────────────────────────
ipcMain.on('win-minimize', () => mainWindow.minimize())
ipcMain.on('win-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.on('win-close', () => mainWindow.close())

// ─── Settings ──────────────────────────────────────────────────────
ipcMain.handle('get-settings', () => store.store || {})
ipcMain.handle('save-settings', (_, settings) => { 
  store.set(settings)
  return true 
})

// ─── File Dialogs (Conectados a tu Preload) ────────────────────────
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('select-file', async (_, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || []
  })
  return result.canceled ? null : result.filePaths[0]
})

// ─── Dependency Management ─────────────────────────────────────────
const depsManager = new DepsManager()
ipcMain.handle('check-deps', async () => {
  return await depsManager.checkAll()
})

// ─── Downloads ────────────────────────────────────────────────────
const downloadManager = new DownloadManager(store)

ipcMain.handle('download-analyze', async (_, url) => {
  return await downloadManager.analyzeUrl(url)
})

ipcMain.handle('download-start', async (_, options) => {
  // Escuchadores de progreso enviados al renderer
  downloadManager.on('progress', (data) => {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send('download-progress', data)
  })
  return await downloadManager.start(options)
})

// ─── Sync ─────────────────────────────────────────────────────────
const syncManager = new SyncManager(store)
ipcMain.handle('sync-detect-devices', async () => {
  return await syncManager.detectDevices()
})