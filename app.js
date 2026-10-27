const synth = window.speechSynthesis;

const textInput = document.querySelector('#text-input');
const voiceSelect = document.querySelector('#voice-select');
const rateInput = document.querySelector('#rate');
const pitchInput = document.querySelector('#pitch');
const speakBtn = document.querySelector('#speak-btn');
const stopBtn = document.querySelector('#stop-btn');

const recordBtn = document.querySelector('#record-btn');
const uploadBtn = document.querySelector('#upload-btn');
const audioFileInput = document.querySelector('#audio-file-input');
const voiceNameInput = document.querySelector('#voice-name-input');
const addVoiceBtn = document.querySelector('#add-voice-btn');
const recordStatus = document.querySelector('#record-status');
const aiLoadingBar = document.querySelector('#ai-loading-bar');

let voices = [];
let clonedVoices = [];
let mediaRecorder;
let audioChunks = [];
let temporaryAudioBlob = null;
let ttsPipeline = null;

const forbiddenWords = ['badword1', 'badword2', 'swearword'];

function filterProfanity(text) {
    let sanitizedText = text;
    forbiddenWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        sanitizedText = sanitizedText.replace(regex, '*'.repeat(word.length));
    });
    return sanitizedText;
}

function updateMasterVoiceDropdown() {
    voiceSelect.innerHTML = '';
    
    clonedVoices.forEach((cloned, index) => {
        const option = document.createElement('option');
        option.textContent = `🤖 Browser AI: ${cloned.name}`;
        option.setAttribute('data-type', 'cloned');
        option.setAttribute('data-index', index);
        voiceSelect.appendChild(option);
    });

    voices = synth.getVoices();
    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.textContent = `💻 System: ${voice.name} (${voice.lang})`;
        option.setAttribute('data-type', 'system');
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => { voices = synth.getVoices(); updateMasterVoiceDropdown(); };
}

function enableAddingState(statusText, blobData) {
    recordStatus.textContent = statusText;
    temporaryAudioBlob = blobData;
    addVoiceBtn.disabled = false;
    addVoiceBtn.style.opacity = "1";
    voiceNameInput.disabled = false;
    voiceNameInput.value = `AI Voice ${clonedVoices.length + 1}`;
}

uploadBtn.addEventListener('click', () => audioFileInput.click());
audioFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        enableAddingState(`Status: "${file.name}" loaded! Name your voice and save.`, file);
    }
});

recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        audioChunks = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                recordBtn.textContent = "🎤 Re-Record Sample";
                recordBtn.style.backgroundColor = "#007bff";
                enableAddingState("Status: Sample captured! Name your voice and save.", audioBlob);
            };

            mediaRecorder.start();
            recordStatus.textContent = "Status: 🔴 Recording audio... Speak now.";
            recordBtn.textContent = "⏹️ Stop Recording";
            recordBtn.style.backgroundColor = "#dc3545";
            addVoiceBtn.disabled = true;
            addVoiceBtn.style.opacity = "0.5";
            voiceNameInput.disabled = true;
        } catch (err) {
            recordStatus.textContent = "Status: ❌ Microphone access blocked.";
            console.error(err);
        }
    } else {
        mediaRecorder.stop();
    }
});

addVoiceBtn.addEventListener('click', () => {
    if (temporaryAudioBlob) {
        const finalName = voiceNameInput.value.trim() || `AI Voice ${clonedVoices.length + 1}`;
        
        clonedVoices.push({ 
            name: finalName, 
            audioBlob: temporaryAudioBlob
        });
        
        recordStatus.textContent = `Status: ✅ "${finalName}" stored in browser runtime!`;
        temporaryAudioBlob = null;
        addVoiceBtn.disabled = true;
        addVoiceBtn.style.opacity = "0.5";
        voiceNameInput.value = "";
        voiceNameInput.disabled = true;
        updateMasterVoiceDropdown();
    }
});

async function extractAudioFeatures(blob) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer.getChannelData(0);
}

async function speak() {
    let origText = textInput.value.trim();
    if (origText === '') return;

    let safeText = filterProfanity(origText);
    textInput.value = safeText;

    const selectedOption = voiceSelect.selectedOptions[0];
    if (!selectedOption) return;

    const dataType = selectedOption.getAttribute('data-type');

    if (dataType === 'cloned') {
        const clonedIndex = selectedOption.getAttribute('data-index');
        const activeClone = clonedVoices[clonedIndex];
        
        aiLoadingBar.style.display = "block";
        speakBtn.disabled = true;

        try {
            if (!ttsPipeline && window.aiPipeline) {
                aiLoadingBar.textContent = "⏳ Downloading browser AI acoustic engine (Xenova/speecht5_tts)...";
                ttsPipeline = await window.aiPipeline('text-to-speech', 'Xenova/speecht5_tts');
            }

            aiLoadingBar.textContent = "🧠 Morphing voice timeline structures locally using WebGPU...";
            
            const rawFeatures = await extractAudioFeatures(activeClone.audioBlob);
            const speakerEmbeddings = new Float32Array(512).map((_, i) => rawFeatures[i % rawFeatures.length] || 0.0);
            
            const output = await ttsPipeline(safeText, { speaker_embeddings: speakerEmbeddings });
            
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = audioCtx.createBuffer(1, output.audio.length, output.sampling_rate);
            buffer.getChannelData(0).set(output.audio);
            
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start();
            
            aiLoadingBar.style.display = "none";
        } catch (error) {
            console.error("Local Browser AI Error:", error);
            aiLoadingBar.textContent = "❌ Error processing AI model file.";
        }
        speakBtn.disabled = false;
    } else {
        const speakText = new SpeechSynthesisUtterance(safeText);
        const selectedVoiceName = selectedOption.getAttribute('data-name');
        speakText.voice = voices.find(voice => voice.name === selectedVoiceName);
        speakText.rate = rateInput.value;
        speakText.pitch = pitchInput.value;
        synth.speak(speakText);
    }
}

speakBtn.addEventListener('click', speak);
stopBtn.addEventListener('click', () => {
    if(synth.speaking) synth.cancel();
});
updateMasterVoiceDropdown();
