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

let voices = [];
let clonedVoices = [];
let mediaRecorder;
let audioChunks = [];
let temporaryAudioUrl = null;

const forbiddenWords = ['badword1', 'badword2', 'swearword', 'hatephrase'];

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
    
    // Inject user clones using their custom assigned names
    clonedVoices.forEach((cloned, index) => {
        const option = document.createElement('option');
        option.textContent = `👤 ${cloned.name}`;
        option.setAttribute('data-type', 'cloned');
        option.setAttribute('data-index', index);
        voiceSelect.appendChild(option);
    });

    voices = synth.getVoices();
    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-type', 'system');
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => { voices = synth.getVoices(); updateMasterVoiceDropdown(); };
}

// Function to activate form inputs when an audio asset is ready
function enableAddingState(statusText) {
    recordStatus.textContent = statusText;
    addVoiceBtn.disabled = false;
    addVoiceBtn.style.opacity = "1";
    voiceNameInput.disabled = false;
    voiceNameInput.value = `Cloned Voice ${clonedVoices.length + 1}`; // Default fallback name
}

// Handle File Selection
uploadBtn.addEventListener('click', () => audioFileInput.click());
audioFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        temporaryAudioUrl = URL.createObjectURL(file);
        enableAddingState(`Status: File "${file.name}" loaded! Name your voice and save.`);
    }
});

// Microphone Recording Logic
recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        audioChunks = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                temporaryAudioUrl = URL.createObjectURL(audioBlob);
                
                recordBtn.textContent = "🎤 Re-Record Sample";
                recordBtn.style.backgroundColor = "#007bff";
                enableAddingState("Status: Sample captured! Name your voice and save.");
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

// Add Voice Action Button Configuration
addVoiceBtn.addEventListener('click', () => {
    if (temporaryAudioUrl) {
        // Collect custom text name or use generic fallback
        const finalName = voiceNameInput.value.trim() || `Cloned Voice Profile ${clonedVoices.length + 1}`;
        
        clonedVoices.push({ 
            audioUrl: temporaryAudioUrl,
            name: finalName
        });
        
        recordStatus.textContent = `Status: ✅ "${finalName}" added to system dropdown!`;
        
        // Reset state interface items
        temporaryAudioUrl = null;
        addVoiceBtn.disabled = true;
        addVoiceBtn.style.opacity = "0.5";
        voiceNameInput.value = "";
        voiceNameInput.disabled = true;
        audioFileInput.value = "";
        
        updateMasterVoiceDropdown();
    }
});

function speak() {
    if (synth.speaking) return;
    
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
        
        const audio = new Audio(activeClone.audioUrl);
        audio.playbackRate = rateInput.value;
        audio.play();
        
        const backupUtterance = new SpeechSynthesisUtterance(safeText);
        backupUtterance.rate = rateInput.value;
        backupUtterance.pitch = pitchInput.value;
        synth.speak(backupUtterance);
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
stopBtn.addEventListener('click', () => synth.cancel());
updateMasterVoiceDropdown();
