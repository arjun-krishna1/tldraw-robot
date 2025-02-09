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
import numpy as np

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
    allow_origins=["*"],  # Frontend URL
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

def list_audio_devices():
    """List all available audio devices"""
    print("\nAvailable Audio Devices:")
    print("-" * 50)
    devices = sd.query_devices()
    for i, device in enumerate(devices):
        print(f"Device {i}: {device['name']}")
        print(f"  Inputs: {device['max_input_channels']}")
        print(f"  Outputs: {device['max_output_channels']}")
        print(f"  Default Sample Rate: {device['default_samplerate']}")
        print("-" * 50)

def get_audio_device():
    """Find the USB audio device"""
    devices = sd.query_devices()
    device_id = None
    for i, device in enumerate(devices):
        if "Jieli" in device['name'] or "UACDemoV1.0" in device['name']:
            device_id = i
            break
    
    if device_id is None:
        raise ValueError("Could not find USB audio device")
    
    return device_id

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
                device_id = get_audio_device()
                device_info = sd.query_devices(device_id)
                device_sample_rate = int(device_info['default_samplerate'])

                # Resample if needed
                if sample_rate != device_sample_rate:
                    number_of_samples = int(round(len(data) * float(device_sample_rate) / sample_rate))
                    data = signal.resample(data, number_of_samples)
                
                # Ensure audio is in the correct range (-1 to 1)
                data = np.clip(data, -1.0, 1.0)
                
                sd.play(data, samplerate=device_sample_rate, device=device_id)
                sd.wait()
                return {"status": "success"}
            except Exception as e:
                print(f"Error playing pre-recorded audio: {e}")
                # Continue to generate new audio if pre-recorded playback fails
        
        # Generate audio using ElevenLabs
        audio = eleven.generate(
            text=request.text,
            voice="Josh",
            model="eleven_multilingual_v2"
        )

        # Get audio device
        device_id = get_audio_device()
        device_info = sd.query_devices(device_id)
        device_sample_rate = int(device_info['default_samplerate'])

        # Prepare audio data
        audio_data = b''.join(audio)
        data, sample_rate = sf.read(BytesIO(audio_data), dtype='float32')

        # Resample if needed
        if sample_rate != device_sample_rate:
            number_of_samples = int(round(len(data) * float(device_sample_rate) / sample_rate))
            data = signal.resample(data, number_of_samples)
        
        # Ensure audio is in the correct range (-1 to 1)
        data = np.clip(data, -1.0, 1.0)

        # Play the audio
        sd.play(data, samplerate=device_sample_rate, device=device_id)
        sd.wait()

        # Save to wav if text was "wow" or "uhh"
        if text_normalized in ["wow", "uhhhhhhhhh lemme think about that"]:
            filename = "wow.wav" if text_normalized == "wow" else "uhh.wav"
            sf.write(filename, data, int(device_sample_rate))

        return {"status": "success"}
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/move")
async def handle_movement(request: MovementRequest):
    try:
        print(f"[MOVE] Received request - Direction: {request.direction}, Value: {request.value}")
        
        # Map directions to MQTT commands
        valid_directions = ["forward", "back", "left", "right"]

        # Send command via MQTT
        mqtt_command = request.direction.lower()
        mqtt_client.publish(MQTT_TOPIC, mqtt_command)
        print(f"[MOVE] Successfully published MQTT command: {mqtt_command}")
        
        return {
            "status": "success",
            "message": f"Moving {request.direction}",
            "direction": request.direction,
            "value": request.value
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"[MOVE] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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