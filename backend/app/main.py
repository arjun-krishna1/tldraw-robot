from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import base64
import io

# Load environment variables
load_dotenv()

# Configure API keys
gemini_api_key = os.getenv("GEMINI_API_KEY")
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")

if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")
if not elevenlabs_api_key:
    raise ValueError("ELEVENLABS_API_KEY environment variable is not set")

genai.configure(api_key=gemini_api_key)
eleven = ElevenLabs(api_key=elevenlabs_api_key)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str

class SpeechRequest(BaseModel):
    text: str

@app.post("/api/generate")
async def generate_response(request: PromptRequest):
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-pro')
        
        # Generate content
        response = model.generate_content(request.prompt)
        
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/speak")
async def text_to_speech(request: SpeechRequest):
    try:
        # Generate audio using ElevenLabs
        audio_stream = eleven.text_to_speech.convert_as_stream(
            text=request.text,
            voice_id="JBFqnCBsd6RMkjVDRZzb",  # Josh voice
            model_id="eleven_multilingual_v2",
        )
        
        # Collect all audio bytes from the stream
        audio_bytes = io.BytesIO()
        for chunk in audio_stream:
            if isinstance(chunk, bytes):
                audio_bytes.write(chunk)
        
        # Convert audio bytes to base64 for sending over JSON
        audio_base64 = base64.b64encode(audio_bytes.getvalue()).decode('utf-8')
        
        return {"audio": audio_base64}
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 