const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

class DepsManager {
  async checkAll() {
    const deps = [
      { id: 'gamdl', name: 'Apple Music (gamdl)', cmd: 'gamdl --version' },
      { id: 'spotdl', name: 'Spotify (spotdl)', cmd: 'spotdl --version' },
      { id: 'yt-dlp', name: 'YouTube (yt-dlp)', cmd: 'yt-dlp --version' },
      { id: 'ffmpeg', name: 'FFmpeg', cmd: 'ffmpeg -version' }
    ]

    return deps.map(d => {
      try {
        execSync(d.cmd, { stdio: 'ignore' })
        return { ...d, status: 'ok' }
      } catch (e) {
        return { ...d, status: 'missing' }
      }
    })
  }
}

module.exports = DepsManager