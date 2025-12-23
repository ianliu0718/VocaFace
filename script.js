const engine = new AudioEngine();
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');

const recordBtn = document.getElementById('recordBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
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

// --- Event Listeners ---

// Record Button
recordBtn.addEventListener('mousedown', startRecording);
recordBtn.addEventListener('mouseup', stopRecording);
recordBtn.addEventListener('mouseleave', () => {
    if (isRecording) stopRecording();
});
recordBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
recordBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });

// Reset Button
resetBtn.addEventListener('click', resetGame);

// Download Button
downloadBtn.addEventListener('click', downloadImage);

// --- Functions ---

async function startRecording() {
    if (isRecording) return;

    // Initialize Audio Engine on first click
    if (!engine.isInitialized) {
        await engine.init();
    }

    isRecording = true;
    engine.resetAnalysis();
    recordBtn.classList.add('active');
    recordBtn.querySelector('.text').textContent = "分析中...";

    // Hide previous results if any (though reset usually handles this)
    resultContainer.classList.remove('generating'); // clear any old flags

    // Start Visualizer Loop
    drawVisualizer();
}

async function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    recordBtn.classList.remove('active');
    recordBtn.querySelector('.text').textContent = "按住說話";
    cancelAnimationFrame(animationId);

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get Results
    const stats = engine.getAverageStats();
    console.log("Analysis Result:", stats);

    if (stats.volume < 2) {
        alert("聲音太小，請大聲一點！");
        return;
    }

    generateIdentity(stats);
}

function resetGame() {
    // UI Reset
    resultContainer.style.display = 'flex'; // Ensure container is visible
    loadingOverlay.style.display = 'none';
    generatedImage.style.display = 'none';
    generatedImage.src = "";
    identityData.style.display = 'none';
    downloadBtn.style.display = 'none';

    // Button Toggle
    recordBtn.style.display = 'block'; // Show record button
    resetBtn.style.display = 'none';   // Hide reset button

    // Clear Stats
    pitchDisplay.textContent = '--';
    volDisplay.textContent = '--';

    // Clear Engine Data (optional, mostly done in startRecording)
    engine.resetAnalysis();
}

async function downloadImage() {
    const src = generatedImage.src;
    if (!src) return;

    try {
        const response = await fetch(src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-identity-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Download failed:", err);
        alert("下載失敗，請長按圖片保存。");
    }
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
    loadingOverlay.style.display = 'flex';
    generatedImage.style.display = 'none';
    identityData.style.display = 'none';
    downloadBtn.style.display = 'none';

    // Hide Record Button, Show Reset later
    recordBtn.style.display = 'none';

    // --- ADVANCED PROMPT LOGIC ---

    // 1. Archetypes (Themes)
    const archetypes = [
        "Cyberpunk 2077 character", "High fantasy styling", "Modern streetwear fashion",
        "Sci-fi pilot suit", "Steampunk aesthetic", "Anime protagonist",
        "Tactical gear soldier", "Ethereal spirit", "Royal noble attire"
    ];
    const randomArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    // 2. Base Traits from Audio
    let gender = "androgynous";
    let age = "young adult";
    let body = "average build";
    let mood = "neutral";

    // Pitch Logic
    if (stats.pitch < 120) {
        gender = "masculine male";
        body = "muscular build, broad shoulders";
    } else if (stats.pitch < 180) {
        gender = "male";
        body = "athletic build";
    } else if (stats.pitch < 240) {
        gender = "teenager"; // Neutral zone
    } else if (stats.pitch < 320) {
        gender = "female";
        body = "slender build";
    } else {
        gender = "young girl"; // Very high pitch
        age = "child or very young";
    }

    // Volume Logic
    if (stats.volume > 40) {
        mood = "screaming, angry, intense energy, dynamic action pose";
    } else if (stats.volume > 20) {
        mood = "confident, smiling, energetic";
    } else if (stats.volume < 10) {
        mood = "shy, calm, sleeping or closed eyes, peaceful";
    } else {
        mood = "serious, focused";
    }

    // 3. Visual Modifiers (Randomness for diversity)
    const lighting = ["neon lighting", "cinematic soft lighting", "dramatic rim light", "golden hour sun"];
    const camera = ["upper body portrait", "close up face shot", "cinematic medium shot"];
    const styles = ["unreal engine 5 render", "octane render", "high quality anime art", "digital painting masterpiece"];
    const backgrounds = ["simple solid color background", "clean studio background", "abstract simple background"]; // Aiming for cleaner BG

    const rLight = lighting[Math.floor(Math.random() * lighting.length)];
    const rCamera = camera[Math.floor(Math.random() * camera.length)];
    const rStyle = styles[Math.floor(Math.random() * styles.length)];
    const rBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // Construct Prompt
    const prompt = `(best quality), ${rCamera}, ${gender}, ${age}, ${body}, ${randomArchetype}, ${mood}, ${rLight}, ${rBg}, ${rStyle}, detailed face, expressive`;
    console.log("Generated Prompt:", prompt);

    // Pollinations API
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=768&seed=${seed}&model=flux&nologo=true`;

    // Load Image
    const img = new Image();
    img.onload = () => {
        generatedImage.src = url;
        generatedImage.style.display = 'block';
        loadingOverlay.style.display = 'none';
        identityData.style.display = 'block';
        downloadBtn.style.display = 'flex'; // Show download button
        resetBtn.style.display = 'flex';   // Show reset button

        // Show Stats
        identityData.innerHTML = `
            <div><strong>頻率:</strong> ${stats.pitch} Hz / <strong>音量:</strong> ${stats.volume} dB</div>
            <div><strong>特徵:</strong> ${gender.toUpperCase()} / ${randomArchetype}</div>
            <div style="font-size: 0.7em; color: gray;">Prompt: ${prompt.substring(0, 50)}...</div>
        `;
    };
    img.onerror = () => {
        alert("圖片生成失敗，請稍後再試。");
        resetGame();
    };
    img.src = url;
}
