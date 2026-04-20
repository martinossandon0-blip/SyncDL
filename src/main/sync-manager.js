const { EventEmitter } = require('events')
const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')
const os = require('os')

// Supported audio extensions
const AUDIO_EXTS = ['.mp3', '.m4a', '.flac', '.opus', '.ogg', '.wav', '.aac', '.alac', '.wma']
const LRC_EXT = '.lrc'

class SyncManager extends EventEmitter {
  constructor(store) {
    super()
    this.store = store
  }

  // ─── Device Detection ─────────────────────────────────────────────
  async detectDevices() {
    const devices = []

    if (process.platform === 'win32') {
      // Scan drive letters D: through Z:
      const { exec } = require('child_process')
      return new Promise((resolve) => {
        exec('wmic logicaldisk get Caption,DriveType,Size,FreeSpace,VolumeName /format:csv', (err, out) => {
          if (err) { resolve([]); return }
          const lines = out.split('\n').filter(l => l.trim() && !l.startsWith('Node'))
          lines.forEach(line => {
            const parts = line.split(',')
            if (parts.length >= 5) {
              const [, caption, driveType, freeSpace, size, volumeName] = parts
              // DriveType 2 = removable, 3 = local fixed
              if (caption && (driveType === '2' || driveType === '3') && caption.trim() !== 'C:') {
                const free = parseInt(freeSpace) || 0
                const total = parseInt(size) || 0
                devices.push({
                  path: caption.trim() + '\\',
                  label: volumeName?.trim() || caption.trim(),
                  letter: caption.trim(),
                  freeGB: (free / 1e9).toFixed(1),
                  totalGB: (total / 1e9).toFixed(1),
                  type: driveType === '2' ? 'removable' : 'fixed',
                  isRemovable: driveType === '2'
                })
              }
            }
          })
          resolve(devices)
        })
      })
    } else {
      // Linux/Mac: scan /media and /mnt
      const mountPoints = ['/media', '/mnt', '/Volumes']
      for (const mp of mountPoints) {
        if (!fs.existsSync(mp)) continue
        const entries = fs.readdirSync(mp)
        for (const entry of entries) {
          const fullPath = path.join(mp, entry)
          try {
            const stat = fs.statSync(fullPath)
            if (stat.isDirectory()) {
              devices.push({
                path: fullPath,
                label: entry,
                type: 'removable',
                isRemovable: true
              })
            }
          } catch {}
        }
      }
      return devices
    }
  }

  // ─── Analyze Diff ─────────────────────────────────────────────────
  async analyze({ sourcePath, devicePath, deviceSubfolder }) {
    const targetDir = deviceSubfolder
      ? path.join(devicePath, deviceSubfolder)
      : devicePath

    // Scan source (local library)
    const sourceFiles = await this.scanFolder(sourcePath)
    // Scan target (SD card)
    const targetFiles = await this.scanFolder(targetDir)

    // Build lookup by normalized name
    const targetMap = new Map()
    targetFiles.forEach(f => {
      const key = this.normalizeTrackName(f.name)
      targetMap.set(key, f)
    })

    const sourceMap = new Map()
    sourceFiles.forEach(f => {
      const key = this.normalizeTrackName(f.name)
      sourceMap.set(key, f)
    })

    // Calculate diff
    const toAdd = []
    const toKeep = []
    const onlyOnDevice = []

    for (const [key, file] of sourceMap) {
      if (targetMap.has(key)) {
        toKeep.push({ ...file, devicePath: targetMap.get(key).fullPath })
      } else {
        toAdd.push(file)
      }
    }

    for (const [key, file] of targetMap) {
      if (!sourceMap.has(key)) {
        onlyOnDevice.push(file)
      }
    }

    return {
      success: true,
      sourcePath,
      targetPath: targetDir,
      sourceCount: sourceFiles.length,
      targetCount: targetFiles.length,
      toAdd,
      toKeep,
      onlyOnDevice,
      addCount: toAdd.length,
      keepCount: toKeep.length,
      onlyOnDeviceCount: onlyOnDevice.length
    }
  }

  // ─── Execute Sync ─────────────────────────────────────────────────
  async execute({ sourcePath, devicePath, deviceSubfolder, filesToAdd }) {
    const targetDir = deviceSubfolder
      ? path.join(devicePath, deviceSubfolder)
      : devicePath

    await fse.ensureDir(targetDir)

    const results = { copied: [], errors: [], skipped: [] }
    const files = filesToAdd || []
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      this.emit('progress', {
        current: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 100),
        file: file.name
      })

      try {
        const dest = path.join(targetDir, path.basename(file.fullPath))

        // Skip if already exists (double check)
        if (fs.existsSync(dest)) {
          results.skipped.push(file.name)
          continue
        }

        await fse.copy(file.fullPath, dest)
        results.copied.push(file.name)

        // Also copy .lrc if exists
        const lrcSrc = file.fullPath.replace(/\.[^.]+$/, LRC_EXT)
        if (fs.existsSync(lrcSrc)) {
          const lrcDest = dest.replace(/\.[^.]+$/, LRC_EXT)
          await fse.copy(lrcSrc, lrcDest)
        }

        this.emit('file-copied', { name: file.name, dest })
      } catch (err) {
        results.errors.push({ name: file.name, error: err.message })
        this.emit('progress', { error: true, file: file.name, message: err.message })
      }
    }

    this.emit('done', results)
    return { success: true, ...results }
  }

  // ─── Folder Scanner ───────────────────────────────────────────────
  async scanFolder(folderPath) {
    const files = []
    if (!folderPath || !fs.existsSync(folderPath)) return files

    const scan = (dir) => {
      let entries
      try { entries = fs.readdirSync(dir) } catch { return }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry)
        let stat
        try { stat = fs.statSync(fullPath) } catch { continue }

        if (stat.isDirectory()) {
          scan(fullPath) // recursive
        } else {
          const ext = path.extname(entry).toLowerCase()
          if (AUDIO_EXTS.includes(ext)) {
            files.push({
              name: entry,
              fullPath,
              ext,
              size: stat.size,
              sizeKB: Math.round(stat.size / 1024),
              modified: stat.mtime,
              hasLrc: fs.existsSync(fullPath.replace(/\.[^.]+$/, LRC_EXT))
            })
          }
        }
      }
    }

    scan(folderPath)
    return files
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  normalizeTrackName(filename) {
    // Remove extension, lowercase, remove special chars for fuzzy matching
    return filename
      .replace(/\.[^.]+$/, '')  // remove ext
      .toLowerCase()
      .replace(/[^\w\s]/g, '')   // remove special chars
      .replace(/\s+/g, ' ')
      .trim()
  }
}

module.exports = SyncManager
