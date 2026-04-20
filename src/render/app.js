// Prueba de conexión
console.log("App.js cargado correctamente");

// Buscar el botón de seleccionar carpeta (asegúrate de que el ID en el HTML sea este)
const btnFolder = document.getElementById('btn-select-folder');
const inputPath = document.getElementById('input-path');

if (btnFolder) {
    btnFolder.addEventListener('click', async () => {
        console.log("Hiciste clic en el botón");
        try {
            // Llamamos a la API que definimos en el preload
            const path = await window.api.selectFolder();
            if (path) {
                console.log("Carpeta seleccionada:", path);
                if (inputPath) inputPath.value = path;
            }
        } catch (error) {
            console.error("Error al llamar a la API:", error);
        }
    });
} else {
    console.error("No se encontró el botón con ID 'btn-select-folder'");
}