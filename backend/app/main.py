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
mqtt_client = mqtt.Client()
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

@app.post("/api/move")
async def handle_movement(request: MovementRequest):
    try:
        print(f"Movement command received - Direction: {request.direction}, Value: {request.value}")
        
        # Map directions to linear and angular velocities
        command_map = {
            "forward": {"linear_velocity": LINEAR_SPEED, "angular_velocity": 0},
            "back": {"linear_velocity": -LINEAR_SPEED, "angular_velocity": 0},
            "left": {"linear_velocity": 0, "angular_velocity": ANGULAR_SPEED},
            "right": {"linear_velocity": 0, "angular_velocity": -ANGULAR_SPEED},
        }

        if request.direction in command_map:
            # Send command via MQTT
            command = command_map[request.direction]
            mqtt_client.publish("robot/drive", json.dumps(command))
            print(f"Published MQTT command: {command}")
            return {"status": "success", "message": f"Moving {request.direction}"}
        else:
            raise ValueError(f"Invalid direction: {request.direction}")

    except Exception as e:
        print(f"Error in handle_movement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stop")
async def handle_stop():
    try:
        # Create stop command (zero velocities)
        stop_command = {
            "linear_velocity": 0,
            "angular_velocity": 0
        }
        
        # Send stop command via MQTT
        mqtt_client.publish("robot/drive", json.dumps(stop_command))
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