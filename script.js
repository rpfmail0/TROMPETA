// Referencias a elementos del DOM
const startAudioButton = document.getElementById('start-audio');
const stopAudioButton = document.getElementById('stop-audio');
const midiFileInput = document.getElementById('midi-file');
const playMidiButton = document.getElementById('play-midi');
const pauseMidiButton = document.getElementById('pause-midi');
const exportPdfButton = document.getElementById('export-pdf');
const exportMidiButton = document.getElementById('export-midi');
const scoreCanvas = document.getElementById('score-canvas');

// Variables para el análisis de audio
let audioContext = null;
let analyser = null;
let microphone = null;
let meydaAnalyzer = null;

// Variables para VexFlow
const { Renderer, Stave, Formatter, System } = VexFlow;
const renderer = new Renderer(scoreCanvas, Renderer.Backends.CANVAS);
const context = renderer.getContext();
let stave = null;
let notes = []; // Array para almacenar las notas detectadas o cargadas

// Variables para MIDI
let currentMidi = null;
let pianoSampler = null;

// Configuración inicial de VexFlow
function setupScore() {
    renderer.resize(800, 300); // Tamaño inicial del canvas
    context.clearRect(0, 0, 800, 300); // Limpiar canvas
    stave = new Stave(10, 40, 780); // Posición y ancho del pentagrama
    stave.addClef("treble").addTimeSignature("4/4"); // Clave de sol y compás 4/4
    stave.setContext(context).draw();
    notes = []; // Reiniciar notas
    drawNotes(); // Dibujar notas iniciales (ninguna)
}

// Función para dibujar las notas en el pentagrama
function drawNotes() {
    context.clearRect(0, 0, 800, 300); // Limpiar canvas antes de redibujar
    stave.setContext(context).draw(); // Redibujar pentagrama

    if (notes.length === 0) {
        // Si no hay notas, dibujar un silencio o simplemente el pentagrama vacío
        return;
    }

    // Agrupar notas en voces y formatear
    const voice = new VexFlow.Voice({ num_beats: 4, beat_value: 4 }); // Compás 4/4
    voice.addTickables(notes);

    const formatter = new Formatter().joinVoices([voice]);
    formatter.format([voice], 700); // Ancho disponible para las notas

    voice.draw(context, stave);
}

// --- Event Listeners ---

startAudioButton.addEventListener('click', async () => {
    console.log('Iniciar Análisis de Audio');
    startAudioButton.disabled = true;
    stopAudioButton.disabled = false;

    try {
        // Asegurarse de que el contexto de audio está iniciado/reanudado
        if (!audioContext) {
             audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('AudioContext reanudado');
        }


        // Solicitar acceso al micrófono
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();

        microphone.connect(analyser);
        // analyser.connect(audioContext.destination); // Opcional: para escuchar el micrófono

        // Inicializar Meyda
        meydaAnalyzer = Meyda.createAnalyzer({
            audioContext: audioContext,
            source: microphone,
            buffersize: 512, // Tamaño del buffer para el análisis
            featureExtractors: ['pitch'], // Extraer solo el tono
            callback: features => {
                // Llamar a la función para manejar el tono detectado
                handleDetectedPitch(features.pitch);
            }
        });

        meydaAnalyzer.start(); // Iniciar el análisis de Meyda

        console.log('Análisis de Audio Iniciado');

    } catch (err) {
        console.error('Error al acceder al micrófono:', err);
        alert('No se pudo acceder al micrófono. Asegúrate de haber dado permiso.');
        startAudioButton.disabled = false;
        stopAudioButton.disabled = true;
    }
});

stopAudioButton.addEventListener('click', () => {
    console.log('Detener Análisis de Audio');
    startAudioButton.disabled = false;
    stopAudioButton.disabled = true;

    if (meydaAnalyzer) {
        meydaAnalyzer.stop(); // Detener el análisis de Meyda
        meydaAnalyzer = null;
    }

    if (microphone) {
        const tracks = microphone.mediaStream.getTracks();
        tracks.forEach(track => track.stop()); // Detener el stream del micrófono
        microphone = null;
    }

    if (audioContext) {
        audioContext.close(); // Cerrar el contexto de audio
        audioContext = null;
    }

    console.log('Análisis de Audio Detenido');
});

midiFileInput.addEventListener('change', async (event) => {
    console.log('Archivo MIDI seleccionado');
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const midiData = e.target.result;
            currentMidi = new Midi(midiData); // Parsear el archivo MIDI

            console.log('Archivo MIDI cargado y parseado:', currentMidi);

            // Limpiar pentagrama actual y notas
            setupScore(); // Esto también limpia el array 'notes'

            // Procesar las notas del MIDI y añadirlas al pentagrama
            const vexflowNotes = [];
            currentMidi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    // Convertir nota MIDI a formato VexFlow (e.g., "C/4")
                    // Tone.js Midi Note tiene propiedades 'name', 'octave', 'time', 'duration', 'midi'
                    const vexflowKey = `${note.name}/${note.octave}`;
                    // Simplificación: usar duración de negra por ahora, se puede mejorar para usar duraciones reales
                    const vexflowNote = new VexFlow.StaveNote({
                        keys: [vexflowKey],
                        duration: "q" // Duración de ejemplo
                    });
                    vexflowNotes.push(vexflowNote);
                });
            });

            // Añadir las notas procesadas al array global y redibujar
            notes = vexflowNotes;
            drawNotes();

            // Habilitar botones relevantes
            playMidiButton.disabled = false;
            exportMidiButton.disabled = false;
            exportPdfButton.disabled = false; // Permitir exportar el pentagrama cargado desde MIDI

        } catch (error) {
            console.error('Error al cargar o parsear el archivo MIDI:', error);
            alert('No se pudo cargar o procesar el archivo MIDI.');
            // Deshabilitar botones si falla la carga
            playMidiButton.disabled = true;
            pauseMidiButton.disabled = true;
            exportMidiButton.disabled = true;
            exportPdfButton.disabled = true;
        }
    };

    reader.readAsArrayBuffer(file); // Leer el archivo como ArrayBuffer
});

playMidiButton.addEventListener('click', async () => {
    console.log('Reproducir MIDI');

    if (!currentMidi) {
        console.warn('No hay archivo MIDI cargado para reproducir.');
        return;
    }

    // Asegurarse de que Tone.js está iniciado
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Tone.js context started');
    }

    // Crear un sintetizador simple si no existe
    if (!pianoSampler) {
        pianoSampler = new Tone.Synth().toDestination();
        console.log('Tone.js Synth creado');
    }

    // Detener cualquier reproducción anterior y limpiar el transporte
    Tone.Transport.stop();
    Tone.Transport.removeAll();

    // Schedule MIDI notes for playback
    currentMidi.tracks.forEach(track => {
        track.notes.forEach(note => {
            Tone.Transport.schedule(time => {
                pianoSampler.triggerAttackRelease(note.name + note.octave, note.duration, time, note.velocity);
            }, note.time);
        });
    });

    // Iniciar el transporte de Tone.js
    Tone.Transport.start();

    playMidiButton.disabled = true;
    pauseMidiButton.disabled = false;
});

pauseMidiButton.addEventListener('click', () => {
    console.log('Pausar MIDI');
    if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
        console.log('Reproducción MIDI pausada');
        playMidiButton.disabled = false;
        pauseMidiButton.disabled = true;
    }
});

exportPdfButton.addEventListener('click', () => {
    console.log('Exportar a PDF');

    // Crear una nueva instancia de jsPDF
    const pdf = new jspdf.jsPDF({
        orientation: 'landscape', // o 'portrait'
        unit: 'pt',
        format: [scoreCanvas.width, scoreCanvas.height] // Usar el tamaño del canvas
    });

    // Obtener la imagen del canvas
    const imgData = scoreCanvas.toDataURL('image/png');

    // Añadir la imagen al PDF
    pdf.addImage(imgData, 'PNG', 0, 0, scoreCanvas.width, scoreCanvas.height);

    // Descargar el PDF
    pdf.save('pentagrama.pdf');

    console.log('Pentagrama exportado a PDF');
});

exportMidiButton.addEventListener('click', () => {
    console.log('Exportar a MIDI');

    // Crear una nueva pista MIDI
    const track = new MidiWriterJS.Track();

    // Añadir las notas del pentagrama a la pista MIDI
    // Simplificación: asume que cada VexFlow note tiene una sola key y duración "q"
    notes.forEach(note => {
        // Convertir formato VexFlow (e.g., "C/4") a notación de MidiWriterJS (e.g., ["C4"])
        const midiNote = new MidiWriterJS.Note(note.keys[0].replace('/', ''), note.duration);
        track.addEvent(midiNote);
    });

    // Crear el escritor MIDI
    const writer = new MidiWriterJS.Writer([track]);

    // Descargar el archivo MIDI
    writer.saveMIDI('pentagrama');

    console.log('Pentagrama exportado a MIDI');
});

// Inicializar el pentagrama al cargar la página
window.onload = setupScore;

// Función placeholder para la detección de tono (será llamada por Meyda)
function handleDetectedPitch(pitch) {
    if (pitch > 0) { // Asegurarse de que el tono detectado es válido
        // Convertir frecuencia (pitch) a nota musical y octava
        const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const halfSteps = Math.round(12 * Math.log2(pitch / C0));
        const octave = Math.floor(halfSteps / 12);
        const noteIndex = halfSteps % 12;
        const noteName = noteStrings[noteIndex];

        // Formato para VexFlow (e.g., "C/4", "D#/5")
        const vexflowNote = `${noteName}/${octave}`;

        console.log(`Tono detectado: ${pitch.toFixed(2)} Hz -> Nota: ${vexflowNote}`);

        // Crear una nota de VexFlow
        // Simplificación: añadir solo la cabeza de la nota por ahora
        const newNote = new VexFlow.StaveNote({
            keys: [vexflowNote],
            duration: "q" // Duración de ejemplo (negra)
        });

        // Añadir la nueva nota al array y redibujar
        notes.push(newNote);

        // Limitar el número de notas mostradas para evitar que se salga del pentagrama
        const maxNotes = 16; // Ejemplo: 16 notas por pentagrama
        if (notes.length > maxNotes) {
            notes.shift(); // Eliminar la nota más antigua
        }

        drawNotes(); // Redibujar el pentagrama con la nueva nota
    }
}

// Función placeholder para procesar notas de archivo MIDI
function processMidiNotes(midiNotes) {
    // Convertir notas MIDI a formato VexFlow y añadir a 'notes'
    // Redibujar pentagrama
    console.log('Notas MIDI procesadas:', midiNotes);
    exportPdfButton.disabled = false; // Permitir exportar el pentagrama cargado
}