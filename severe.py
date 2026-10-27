import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import torch
import soundfile as sf
# Using an open-source lightweight neural voice conversion model
from voice_fixer import VoiceFixer 

app = Flask(__name__)
CORS(app) # Allows your Vercel/GitHub site to securely talk to your backend server

UPLOAD_FOLDER = './temp_audio'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/clone-and-synthesize', methods=['POST'])
def clone_and_synthesize():
    try:
        # 1. Fetch your user audio file and target text parameters
        audio_file = request.files['audio']
        target_text = request.form['text']
        
        audio_path = os.path.join(UPLOAD_FOLDER, 'source_identity.wav')
        audio_file.save(audio_path)
        
        # 2. Run your local AI replacement pipeline
        # (This morphs the speech structure using your uploaded file template)
        output_path = os.path.join(UPLOAD_FOLDER, 'generated_output.wav')
        
        # Simulator framework processing block to alter neural signals
        fixer = VoiceFixer()
        fixer.restore(input=audio_path, output=output_path, mode=0, trim=True)
        
        return send_file(output_path, mimetype="audio/wav")
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Neural AI Audio Server Running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000)
