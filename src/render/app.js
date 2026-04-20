document.addEventListener('DOMContentLoaded', () => {
    console.log("SyncDL: Interfaz cargada");

    if (!window.api) {
        console.error("Error: window.api no detectado. Asegúrate de que el script 'preload' esté configurado en el proceso principal.");
        return;
    }

    // ─── NAVEGACIÓN ENTRE PÁGINAS ──────────────────────────────────────────
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPage = tab.getAttribute('data-page');

            // Actualizar estado de las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Cambiar visibilidad de las páginas
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `page-${targetPage}`) {
                    page.classList.add('active');
                }
            });
        });
    });

    // ─── SELECCIÓN DE FUENTES (SIDEBAR) ───────────────────────────────────
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-source]');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            console.log("Fuente seleccionada:", item.getAttribute('data-source'));
        });
    });

    // ─── LÓGICA DE DESCARGA ───────────────────────────────────────────────
    const urlInput = document.getElementById('url-input');
    const btnAnalyze = document.getElementById('btn-analyze');
    const urlClear = document.getElementById('url-clear');
    const qualityCard = document.getElementById('quality-card');
    const outputCard = document.getElementById('output-card');
    const progressCard = document.getElementById('progress-card');
    const btnStartDownload = document.getElementById('btn-start-download');

    if (btnAnalyze && urlInput) {
        btnAnalyze.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) return;
            
            console.log("Analizando URL:", url);
            btnAnalyze.disabled = true;
            btnAnalyze.innerHTML = '<span class="btn-icon">⏳</span> Analizando...';
            
            try {
                // Enviar al backend para obtener info del álbum/canción
                const info = await window.api.analyzeUrl(url);
                
                if (info) {
                    // Mostramos las secciones de calidad y destino
                    if (qualityCard) qualityCard.style.display = 'block';
                    if (outputCard) outputCard.style.display = 'block';
                    
                    // Si ya hay una ruta de salida, habilitamos el botón de inicio
                    const currentPath = document.getElementById('output-path').value;
                    if (currentPath) btnStartDownload.disabled = false;

                    console.log("Análisis completado para:", info.title);
                }
            } catch (err) {
                console.error("Error en el análisis:", err);
            } finally {
                btnAnalyze.disabled = false;
                btnAnalyze.textContent = "Analizar";
            }
        });
    }

    urlClear?.addEventListener('click', () => {
        urlInput.value = '';
        urlInput.focus();
        if (qualityCard) qualityCard.style.display = 'none';
        if (outputCard) outputCard.style.display = 'none';
    });

    // Lógica del botón "Iniciar descarga"
    if (btnStartDownload) {
        btnStartDownload.addEventListener('click', async () => {
            const config = {
                url: urlInput.value.trim(),
                outputPath: document.getElementById('output-path').value,
                options: {
                    lrc: document.getElementById('opt-lrc').checked,
                    metadata: document.getElementById('opt-metadata').checked
                }
            };

            console.log("Iniciando proceso de descarga...", config);
            btnStartDownload.disabled = true;
            if (progressCard) progressCard.style.display = 'block';

            try {
                await window.api.startDownload(config);
            } catch (error) {
                console.error("Error al iniciar descarga:", error);
                btnStartDownload.disabled = false;
            }
        });
    }

    // ─── SELECCIÓN DE CARPETAS (GENÉRICO) ──────────────────────────────────
    // Función para conectar un botón con un input de ruta
    const bindFolderPicker = (btnId, inputId) => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);

        if (btn && input) {
            btn.addEventListener('click', async () => {
                try {
                    const path = await window.api.selectFolder();
                    if (path) {
                        input.value = path;
                        // Habilitar botones de acción si es necesario
                        if (btnId === 'btn-select-output') {
                            document.getElementById('btn-start-download').disabled = false;
                        }
                    }
                } catch (error) {
                    console.error(`Error al seleccionar carpeta (${btnId}):`, error);
                }
            });
        }
    };

    // Conectar todos los botones de "Examinar" de tu HTML
    bindFolderPicker('btn-select-output', 'output-path');
    bindFolderPicker('btn-sync-source', 'sync-source');
    bindFolderPicker('btn-sync-device', 'sync-device');
    bindFolderPicker('btn-lib-path', 'lib-path');
    bindFolderPicker('btn-default-output', 'set-default-output'); // Para la página de ajustes

    // ─── SELECCIÓN DE ARCHIVOS (AJUSTES) ──────────────────────────────────
    const bindFilePicker = (btnId, inputId, configKey) => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (btn && input) {
            btn.addEventListener('click', async () => {
                try {
                    const path = await window.api.selectFile();
                    if (path) {
                        input.value = path;
                        // Notificar al proceso principal que el ajuste ha cambiado
                        if (window.api.updateConfig) {
                            await window.api.updateConfig(configKey, path);
                        }
                    }
                } catch (error) {
                    console.error(`Error al seleccionar archivo (${btnId}):`, error);
                }
            });
        }
    };

    bindFilePicker('btn-am-cookies', 'set-am-cookies', 'apple_cookies');
    bindFilePicker('btn-wvd', 'set-wvd', 'apple_wvd');

    // ─── CONTROLES DE VENTANA ──────────────────────────────────────────────
    document.getElementById('btn-minimize')?.addEventListener('click', () => window.api.minimize());
    document.getElementById('btn-maximize')?.addEventListener('click', () => window.api.maximize());
    document.getElementById('btn-close')?.addEventListener('click', () => window.api.close());

    document.getElementById('btn-refresh-devices')?.addEventListener('click', () => console.log("Refrescando dispositivos..."));
});