# SyncDL

Descarga música de Apple Music, Spotify y YouTube en máxima calidad real, con archivos `.lrc`, y sincroniza automáticamente con tu reproductora MP3 portátil (tarjeta SD).

---

## Requisitos previos

- **Windows 10/11** (64-bit)
- **Node.js** v18 o superior → https://nodejs.org
- **Python 3.10+** → https://python.org (marca "Add to PATH" al instalar)
- **FFmpeg** → https://www.gyan.dev/ffmpeg/builds/ (descarga `ffmpeg-release-essentials.zip`, extrae y agrega la carpeta `bin` al PATH de Windows)

---

## Instalación

```bash
# 1. Clonar o descomprimir el proyecto
cd syncdl

# 2. Instalar dependencias Node
npm install

# 3. Instalar herramientas Python
pip install gamdl spotdl pywidevine

# 4. Instalar yt-dlp
# Opción A: automático desde la app (Ajustes > Dependencias > Instalar)
# Opción B: manual
pip install yt-dlp

# 5. Arrancar la app
npm start
```

---

## Configurar Apple Music (ALAC 24-bit)

### Paso 1 — Convertir tus claves Widevine a .wvd

Tienes `client_id.bin` y `private_key.pem`. Ejecuta:

```bash
python scripts/setup_wvd.py --client-id client_id.bin --private-key private_key.pem --output device.wvd
```

Esto crea `device.wvd`. Guárdalo en un lugar seguro.

### Paso 2 — Exportar cookies de Apple Music

1. Abre **Chrome** o **Firefox**
2. Ve a https://music.apple.com y inicia sesión con tu cuenta
3. Instala la extensión **"Get cookies.txt LOCALLY"** (Chrome) o **"cookies.txt"** (Firefox)
4. Exporta las cookies del sitio → guarda como `cookies.txt`

### Paso 3 — Configurar en SyncDL

1. Ve a **Ajustes** en la app
2. En "Apple Music":
   - Selecciona tu `cookies.txt`
   - Selecciona tu `device.wvd`
3. Listo — ahora puedes descargar ALAC 24-bit

---

## Calidades disponibles por plataforma

| Plataforma     | Máxima calidad real      | Formato  | LRC |
|----------------|--------------------------|----------|-----|
| Apple Music    | ALAC 24-bit / 192kHz ★  | .m4a     | ✓   |
| Apple Music    | ALAC 16-bit / 44.1kHz   | .m4a     | ✓   |
| Apple Music    | AAC 256kbps             | .m4a     | ✓   |
| Apple Music    | Dolby Atmos             | .ec3     | ✓   |
| Spotify        | Opus 251kbps (vía YTM)  | .opus    | ✓   |
| Spotify        | M4A 256kbps (vía YTM)   | .m4a     | ✓   |
| YouTube Music  | Opus 251kbps ★          | .opus    | ✗   |
| YouTube Music  | M4A 256kbps             | .m4a     | ✗   |
| YouTube        | Opus 251kbps ★          | .opus    | ✗   |

> **Nota:** YouTube y Spotify no tienen FLAC real. Lo que se anuncia como "FLAC" en estas plataformas es siempre un re-encode. ALAC de Apple Music SÍ es lossless original.

---

## Sincronizar con SD Card / MP3 portátil

1. Conecta la SD via adaptador USB → aparece en la barra lateral como unidad (ej. `E:\`)
2. Ve a **Sincronizar**
3. Selecciona tu biblioteca local (donde descargaste las canciones)
4. Selecciona el dispositivo (la unidad SD)
5. Opcionalmente escribe una subcarpeta (ej. `Music` o `MUSIC`)
6. Pulsa **Analizar diferencias**
7. La app mostrará qué canciones son nuevas y cuáles ya existen
8. Pulsa **Actualizar dispositivo** → solo copia las nuevas, no toca las que ya están

---

## Build para distribución

```bash
npm run build
# Genera instalador .exe en /dist
```

---

## Soporte Android

La versión Android (APK) está en desarrollo usando Capacitor.
Por ahora, en Android usa la app **Seal** (basada en yt-dlp) para YouTube/YTMusic,
y gamdl funciona en Termux para Apple Music.
