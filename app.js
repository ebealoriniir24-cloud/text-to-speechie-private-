const synth = window.speechSynthesis;

const textInput = document.querySelector('#text-input');
const voiceSelect = document.querySelector('#voice-select');
const rateInput = document.querySelector('#rate');
const pitchInput = document.querySelector('#pitch');
const speakBtn = document.querySelector('#speak-btn');
const stopBtn = document.querySelector('#stop-btn');

let voices = [];

function populateVoiceList() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '';
    
    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

populateVoiceList();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoiceList;
}

function speak() {
    if (synth.speaking) {
        console.error('Already speaking...');
        return;
    }
    if (textInput.value !== '') {
        const speakText = new SpeechSynthesisUtterance(textInput.value);
        
        const selectedVoiceName = voiceSelect.selectedOptions[0].getAttribute('data-name');
        speakText.voice = voices.find(voice => voice.name === selectedVoiceName);
        
        speakText.rate = rateInput.value;
        speakText.pitch = pitchInput.value;
        
        synth.speak(speakText);
    }
}

speakBtn.addEventListener('click', speak);
stopBtn.addEventListener('click', () => synth.cancel());
