const engine = new AudioEngine();
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');

const recordBtn = document.getElementById('recordBtn');
const pitchDisplay = document.getElementById('pitchValue');
const volDisplay = document.getElementById('volValue');
const resultContainer = document.getElementById('resultContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const generatedImage = document.getElementById('generatedImage');
const identityData = document.getElementById('identityData');

let isRecording = false;
let animationId = null;

// Adjust Canvas Size
function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Button Events
recordBtn.addEventListener('mousedown', startRecording);
recordBtn.addEventListener('mouseup', stopRecording);
recordBtn.addEventListener('mouseleave', () => {
    if (isRecording) stopRecording();
});

// Touch support for mobile
recordBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
recordBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });


async function startRecording() {
    if (isRecording) return;

    // Initialize Audio Engine on first click
    if (!engine.isInitialized) {
        await engine.init();
    }

    isRecording = true;
    engine.resetAnalysis();
    recordBtn.classList.add('active');
    recordBtn.querySelector('.text').textContent = "ANALYZING...";

    // Start Visualizer Loop
    drawVisualizer();
}

async function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    recordBtn.classList.remove('active');
    recordBtn.querySelector('.text').textContent = "HOLD TO ANALYZE";
    cancelAnimationFrame(animationId);

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get Results
    const stats = engine.getAverageStats();
    console.log("Analysis Result:", stats);

    if (stats.volume < 2) {
        alert("Audio too quiet. Please speak louder.");
        return;
    }

    generateIdentity(stats);
}

function drawVisualizer() {
    if (!isRecording) return;

    animationId = requestAnimationFrame(drawVisualizer);

    const data = engine.getAudioData();
    if (!data) return;

    // Update UI Stats
    pitchDisplay.textContent = data.pitch;
    volDisplay.textContent = data.volume;

    // Draw Waveform
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fade effect

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f3ff';
    ctx.beginPath();

    const sliceWidth = canvas.width * 1.0 / data.waveform.length;
    let x = 0;

    for (let i = 0; i < data.waveform.length; i++) {
        const v = data.waveform[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

function generateIdentity(stats) {
    // Show Loading
    resultContainer.classList.add('generating');
    loadingOverlay.style.display = 'flex';
    generatedImage.style.display = 'none';
    identityData.style.display = 'none';

    // --- MAPPING LOGIC (The "AI" part) ---
    // Pitch: 
    // < 150 (Deep) -> Male, Rough
    // 150 - 250 (Mid) -> Teen, Androgynous
    // > 250 (High) -> Female, Cute

    let gender = "female"; // default
    let age = "young adults";
    let vibe = "cyberpunk";
    let color = "neon blue";
    let hair = "long hair";

    if (stats.pitch < 180) {
        gender = "male";
        vibe = "cyberpunk soldier, serious face";
        color = "dark red and gold";
        hair = "short messy hair";
    } else if (stats.pitch > 350) {
        gender = "chibi girl";
        vibe = "cute pop idol, happy";
        color = "pastel pink and white";
        hair = "twin tails";
    } else {
        gender = "female";
        vibe = "hacker, mysterious";
        color = "neon purple and black";
        hair = "bob cut"; // mid pitch
    }

    // Volume Modifier
    if (stats.volume > 30) {
        vibe += ", angry expression, dynamic pose, lightning effects";
    } else if (stats.volume < 10) {
        vibe += ", calm, closed eyes, serene atmosphere";
    }

    const prompt = `A 3D render of a ${gender}, ${vibe}, ${color} theme, ${hair}, high quality, unreal engine 5, octane render, 8k, detailed texture`;
    console.log("Generated Prompt:", prompt);

    // Pollinations API
    const encodedPrompt = encodeURIComponent(prompt);
    // Add random seed to avoid caching same image for same pitch
    const seed = Math.floor(Math.random() * 1000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&model=flux`;

    // Load Image
    const img = new Image();
    img.onload = () => {
        generatedImage.src = url;
        generatedImage.style.display = 'block';
        loadingOverlay.style.display = 'none';

        // Show Stats
        identityData.innerHTML = `
            <h3>IDENTITY ANALYSIS</h3>
            <p><strong>PITCH AVG:</strong> ${stats.pitch} Hz</p>
            <p><strong>VOL AVG:</strong> ${stats.volume} dB</p>
            <p><strong>ARCHETYPE:</strong> ${gender.toUpperCase()}</p>
            <p><strong>TRAITS:</strong> ${vibe}</p>
        `;
        identityData.style.display = 'block';
    };
    img.src = url;
}
