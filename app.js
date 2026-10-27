// Connects your frontend interface to your local computing script
const AI_SERVER_URL = "http://localhost:5000/api/clone-and-synthesize";

async function speak() {
    let origText = textInput.value.trim();
    if (origText === '') return;

    let safeText = filterProfanity(origText);
    textInput.value = safeText;

    const selectedOption = voiceSelect.selectedOptions[0];
    const dataType = selectedOption.getAttribute('data-type');

    if (dataType === 'cloned') {
        const clonedIndex = selectedOption.getAttribute('data-index');
        const activeClone = clonedVoices[clonedIndex];
        
        recordStatus.textContent = "Status: 🧠 Processing true AI voice morphing...";

        // Pack the audio sample alongside your custom text box string
        const formData = new FormData();
        formData.append('audio', activeClone.audioBlob);
        formData.append('text', safeText);

        try {
            const response = await fetch(AI_SERVER_URL, {
                method: 'POST',
                body: formData
            });

            // Convert and play back the synthesized server result block directly
            const outputBlob = await response.blob();
            const outputAudioUrl = URL.createObjectURL(outputBlob);
            const audio = new Audio(outputAudioUrl);
            audio.playbackRate = parseFloat(rateInput.value);
            audio.play();
            
            recordStatus.textContent = "Status: ✅ AI Speech Generated!";
        } catch (error) {
            console.error("Local Server Error:", error);
            recordStatus.textContent = "Status: ❌ Server Offline. Run server.py locally.";
        }
    } else {
        // Fallback to standard system background sound modules
        const speakText = new SpeechSynthesisUtterance(safeText);
        const selectedVoiceName = selectedOption.getAttribute('data-name');
        speakText.voice = voices.find(voice => voice.name === selectedVoiceName);
        speakText.rate = rateInput.value;
        speakText.pitch = pitchInput.value;
        synth.speak(speakText);
    }
}

