# Plan del Proyecto: Aplicación Web de Práctica Musical

Este documento detalla el plan para desarrollar una aplicación web completamente frontend y estática, diseñada para ser alojada en GitHub Pages. La aplicación permitirá la práctica de un instrumento musical mediante el análisis de audio en tiempo real para detectar y visualizar las notas tocadas en un pentagrama interactivo. Incluirá funcionalidades para exportar el pentagrama a formatos PDF y MIDI, y permitirá cargar y reproducir archivos MIDI.

**Tecnologías Propuestas:**

*   **Análisis de Audio en Tiempo Real:** [`Web Audio API`](https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API) y [`Meyda`](https://meyda.js.org/).
*   **Visualización de Pentagrama Interactivo:** [`VexFlow`](https://www.vexflow.com/).
*   **Carga y Reproducción de Archivos MIDI:** [`Tone.js`](https://tonejs.github.io/).
*   **Exportación a MIDI:** [`MidiWriterJS`](https://grimmdude.com/MidiWriterJS/).
*   **Exportación a PDF:** [`jsPDF`](https://parall.ax/products/jspdf).

Todas las tecnologías seleccionadas son gratuitas y de código abierto.

**Plan Detallado del Proyecto:**

1.  **Configuración Inicial:**
    *   Crear la estructura básica de archivos: `index.html`, `style.css`, `script.js`.
    *   Incluir las bibliotecas necesarias (Meyda, VexFlow, Tone.js, MidiWriterJS, jsPDF) a través de CDN o descargándolas y sirviéndolas localmente.

2.  **Interfaz de Usuario (UI):**
    *   Diseñar una interfaz sencilla en `index.html` con:
        *   Un área para mostrar el pentagrama.
        *   Botones para iniciar/detener el análisis de audio.
        *   Un control de entrada de archivo (`<input type="file">`) para cargar archivos MIDI.
        *   Botones para reproducir/pausar el MIDI cargado.
        *   Botones para exportar el pentagrama actual a PDF y MIDI.
        *   Posiblemente, un indicador visual del audio de entrada o la nota detectada.

3.  **Análisis de Audio y Detección de Notas:**
    *   Utilizar la [`Web Audio API`](https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API) para acceder al micrófono del usuario (`navigator.mediaDevices.getUserMedia`).
    *   Crear un nodo [`AnalyserNode`](https://developer.mozilla.org/es/docs/Web/API/AnalyserNode) para obtener datos de frecuencia o tiempo del audio.
    *   Integrar [`Meyda`](https://meyda.js.org/) para extraer características del audio, como el tono (pitch).
    *   Implementar o utilizar un algoritmo de detección de tono (si Meyda no proporciona uno directamente o si se necesita mayor precisión) para identificar la nota musical correspondiente.

4.  **Visualización del Pentagrama:**
    *   Configurar [`VexFlow`](https://www.vexflow.com/) para dibujar un pentagrama en un elemento [`<canvas>`](https://developer.mozilla.org/es/docs/Web/API/Canvas_API) o [`<svg>`](https://developer.mozilla.org/es/docs/Web/SVG).
    *   Desarrollar la lógica para añadir notas al pentagrama a medida que son detectadas por el análisis de audio.
    *   Asegurar que el pentagrama sea interactivo, permitiendo quizás seleccionar o editar notas (aunque la edición no se especificó, la interactividad básica para visualización es clave).

5.  **Carga y Reproducción de Archivos MIDI:**
    *   Utilizar [`Tone.js`](https://tonejs.github.io/) para cargar archivos MIDI seleccionados por el usuario. Tone.js tiene funcionalidades para parsear datos MIDI.
    *   Configurar un sintetizador o sampler en [`Tone.js`](https://tonejs.github.io/) (por ejemplo, un [`Sampler`](https://tonejs.github.io/docs/14.7.77/Sampler) con un sonido de piano) para reproducir las notas del archivo MIDI cargado.
    *   Implementar controles de reproducción (play, pause, stop).

6.  **Sincronización Audio-Pentagrama y MIDI-Pentagrama:**
    *   Conectar la detección de notas del análisis de audio con la adición de notas al pentagrama de [`VexFlow`](https://www.vexflow.com/).
    *   Al cargar un archivo MIDI, parsear su contenido y renderizar las notas en el pentagrama usando [`VexFlow`](https://www.vexflow.com/).
    *   Durante la reproducción de un archivo MIDI, resaltar o indicar visualmente en el pentagrama la nota que se está reproduciendo actualmente.

7.  **Exportación a PDF:**
    *   Utilizar [`VexFlow`](https://www.vexflow.com/) para renderizar el pentagrama actual en un formato que [`jsPDF`](https://parall.ax/products/jspdf) pueda procesar (por ejemplo, a un [`<canvas>`](https://developer.mozilla.org/es/docs/Web/API/Canvas_API)).
    *   Usar [`jsPDF`](https://parall.ax/products/jspdf) para crear un documento PDF y añadir la imagen del pentagrama renderizado.
    *   Permitir al usuario descargar el archivo PDF generado.

8.  **Exportación a MIDI:**
    *   Recopilar las notas actualmente mostradas en el pentagrama de [`VexFlow`](https://www.vexflow.com/) (ya sean detectadas por audio o cargadas desde un MIDI).
    *   Utilizar [`MidiWriterJS`](https://grimmdude.com/MidiWriterJS/) para crear un nuevo archivo MIDI a partir de esta colección de notas.
    *   Permitir al usuario descargar el archivo MIDI generado.

9.  **Alojamiento en GitHub Pages:**
    *   Estructurar el proyecto para que sea completamente estático (HTML, CSS, JS, archivos de sonido/SoundFonts si son necesarios para Tone.js).
    *   Subir el código a un repositorio de GitHub.
    *   Configurar GitHub Pages para servir los archivos desde la rama principal (o `gh-pages`).

**Diagrama del Flujo de la Aplicación:**

```mermaid
graph TD
    A[Usuario] --> B(Interfaz de Usuario);
    B --> C{Análisis de Audio};
    C --> D[Detección de Notas];
    D --> E[Visualización en Pentagrama (VexFlow)];
    B --> F{Carga de Archivo MIDI};
    F --> G[Parseo MIDI (Tone.js)];
    G --> E;
    B --> H{Reproducción MIDI};
    H --> I[Reproductor MIDI (Tone.js)];
    I --> E;
    E --> J{Exportar a PDF};
    J --> K[Generar PDF (jsPDF)];
    K --> L[Descargar PDF];
    E --> M{Exportar a MIDI};
    M --> N[Generar Archivo MIDI (MidiWriterJS)];
    N --> O[Descargar MIDI];
    D --> P[Almacenamiento Temporal de Notas];
    G --> P;
    P --> M;
    P --> J;