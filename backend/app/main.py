from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import base64
import io
import paho.mqtt.client as mqtt
import json
import sounddevice as sd
import soundfile as sf
from io import BytesIO
from scipy import signal

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

# Initialize MQTT client
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
try:
    mqtt_client.connect("localhost")
    mqtt_client.loop_start()
except Exception as e:
    print(f"Error connecting to MQTT broker: {e}")

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

class MovementRequest(BaseModel):
    direction: str
    value: float

# Constants for movement
LINEAR_SPEED = 0.2  # m/s
ANGULAR_SPEED = 1.2  # rad/s

MQTT_TOPIC = "robot/drive"

@app.post("/api/generate")
async def generate_response(request: PromptRequest):
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Generate content
        response = model.generate_content(request.prompt + "\n Be Concise, keep all responses to 1 or two sentences")
        print("ARJUN LOG RESPONSE")
        print(response.candidates[0].content.parts[0].text)

        return {"response": response.candidates[0].content.parts[0].text}
    except Exception as e:
        print(f"Error in generate_response:")
        print(f"  Type: {type(e).__name__}")
        print(f"  Message: {str(e)}")
        print(f"  Prompt: {request.prompt}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/speak")
async def text_to_speech(request: SpeechRequest):
    try:
        # Check for special phrases that use pre-recorded audio
        text_normalized = request.text.lower().strip('-.,!?')
        if text_normalized in ["wow", "uhhhhhhhhh lemme think about that"]:
            filename = "wow.wav" if text_normalized == "wow" else "uhh.wav"
            try:
                data, sample_rate = sf.read(filename, dtype='float32')
                device_name = "UACDemoV1.0"
                device_info = sd.query_devices(device_name, 'output')
                device_id = device_info['index']
                device_sample_rate = device_info['default_samplerate']

                # Resample if needed
                if sample_rate != device_sample_rate:
                    number_of_samples = int(round(len(data) * float(device_sample_rate) / sample_rate))
                    data = signal.resample(data, number_of_samples)
                    sample_rate = device_sample_rate

                sd.play(data, samplerate=sample_rate, device=device_id)
                sd.wait()
                return {"status": "success"}
            except Exception as e:
                print(f"Error playing pre-recorded audio: {e}")
                # Continue to generate new audio if pre-recorded playback fails
        
        # Generate audio using ElevenLabs
        audio = eleven.generate(
            text=request.text,
            voice="Josh",  # Using Josh voice
            model="eleven_multilingual_v2"
        )

        # Set audio device
        device_name = "UACDemoV1.0"
        device_info = sd.query_devices(device_name, 'output')
        device_id = device_info['index']
        device_sample_rate = device_info['default_samplerate']

        # Prepare audio data
        audio_data = b''.join(audio)
        data, sample_rate = sf.read(BytesIO(audio_data), dtype='float32')

        # Resample if needed
        if sample_rate != device_sample_rate:
            number_of_samples = int(round(len(data) * float(device_sample_rate) / sample_rate))
            data = signal.resample(data, number_of_samples)
            sample_rate = device_sample_rate

        # Play the audio
        sd.play(data, samplerate=sample_rate, device=device_id)
        sd.wait()

        # Save to wav if text was "wow" or "uhh"
        if text_normalized in ["wow", "uhhhhhhhhh lemme think about that"]:
            filename = "wow.wav" if text_normalized == "wow" else "uhh.wav"
            sf.write(filename, data, int(sample_rate))

        return {"status": "success"}
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/move")
async def handle_movement(request: MovementRequest):
    try:
        print(f"Movement command received - Direction: {request.direction}, Value: {request.value}")
        
        # Map directions to MQTT commands
        valid_directions = ["forward", "back", "left", "right"]
        
        if request.direction in valid_directions:
            # Send command via MQTT
            mqtt_client.publish(MQTT_TOPIC, request.direction)
            print(f"Published MQTT command: {request.direction}")
            return {"status": "success", "message": f"Moving {request.direction}"}
        else:
            raise ValueError(f"Invalid direction: {request.direction}")

    except Exception as e:
        print(f"Error in handle_movement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stop")
async def handle_stop():
    try:
        # Send stop command via MQTT
        mqtt_client.publish(MQTT_TOPIC, "stop")
        print("Published MQTT stop command")
        return {"status": "success", "message": "Robot stopped"}

    except Exception as e:
        print(f"Error in handle_stop: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    # Stop MQTT client
    mqtt_client.loop_stop()
    mqtt_client.disconnect()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 