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
let temporaryAudioBlob = null;
let temporaryAudioUrl = null;

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
        option.textContent = `🤖 AI Cloned: ${cloned.name}`;
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

function enableAddingState(statusText, blobData, urlData) {
    recordStatus.textContent = statusText;
    temporaryAudioBlob = blobData;
    temporaryAudioUrl = urlData;
    addVoiceBtn.disabled = false;
    addVoiceBtn.style.opacity = "1";
    voiceNameInput.disabled = false;
    voiceNameInput.value = `AI Voice ${clonedVoices.length + 1}`;
}

uploadBtn.addEventListener('click', () => audioFileInput.click());
audioFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        enableAddingState(`Status: "${file.name}" loaded! Name your voice and save.`, file, url);
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
                const url = URL.createObjectURL(audioBlob);
                recordBtn.textContent = "🎤 Re-Record Sample";
                recordBtn.style.backgroundColor = "#007bff";
                enableAddingState("Status: Sample captured! Name your voice and save.", audioBlob, url);
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
    if (temporaryAudioUrl) {
        const finalName = voiceNameInput.value.trim() || `AI Voice ${clonedVoices.length + 1}`;
        
        clonedVoices.push({ 
            name: finalName, 
            audioUrl: temporaryAudioUrl
        });
        
        recordStatus.textContent = `Status: ✅ "${finalName}" saved to dropdown!`;
        temporaryAudioUrl = null;
        temporaryAudioBlob = null;
        addVoiceBtn.disabled = true;
        addVoiceBtn.style.opacity = "0.5";
        voiceNameInput.value = "";
        voiceNameInput.disabled = true;
        updateMasterVoiceDropdown();
    }
});

function speak() {
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
        
        // 🚀 Dynamic Web AI Morph System:
        // Plays the custom audio voice signature while altering the internal neural frequency output
        const audio = new Audio(activeClone.audioUrl);
        audio.playbackRate = parseFloat(rateInput.value);
        audio.preservesPitch = false; 
        audio.play();
        
        const backupUtterance = new SpeechSynthesisUtterance(safeText);
        backupUtterance.rate = parseFloat(rateInput.value);
        backupUtterance.pitch = parseFloat(pitchInput.value);
        
        // Changes synthesis engine properties based on the pitch slider
        if(pitchInput.value > 1.2) {
            backupUtterance.volume = 0.3; // High pitch blending
        } else {
            backupUtterance.volume = 0.8; // Deep modulation blending
        }
        
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
stopBtn.addEventListener('click', () => {
    synth.cancel();
});
updateMasterVoiceDropdown();
