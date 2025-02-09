from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
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
from typing import List, Optional
from datetime import datetime
import sqlite3
import uuid

# Load environment variables
load_dotenv()

# SQLite setup
DATABASE_URL = "designs.db"

def init_db():
    conn = sqlite3.connect(DATABASE_URL)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS designs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL,
            tags TEXT NOT NULL,
            downloads INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database
init_db()

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
mqtt_connected = False
try:
    mqtt_client.connect("localhost")
    mqtt_client.loop_start()
    mqtt_connected = True
    print("Successfully connected to MQTT broker")
except Exception as e:
    print(f"Warning: Could not connect to MQTT broker: {e}")
    print("Robot movement commands will be logged but not sent to robot")

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

class Design(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    author: str
    content: dict
    created_at: Optional[datetime] = None
    tags: List[str] = []
    downloads: Optional[int] = 0

    class Config:
        json_schema_extra = {
            "example": {
                "title": "My Design",
                "description": "A simple robot design",
                "author": "John Doe",
                "content": {"shapes": [], "connections": []},
                "tags": ["robot", "movement"]
            }
        }

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
        print(f"Movement command received - Direction: {request.direction}, Value: {request.value}")
        
        # Map directions to MQTT commands
        valid_directions = ["forward", "back", "left", "right"]
        
        if request.direction in valid_directions:
            # Send command via MQTT only if connected
            if mqtt_connected:
                mqtt_client.publish(MQTT_TOPIC, request.direction)
                print(f"Published MQTT command: {request.direction}")
            else:
                print(f"MQTT not connected - would have sent command: {request.direction}")
            return {"status": "success", "message": f"Moving {request.direction}"}
        else:
            raise ValueError(f"Invalid direction: {request.direction}")

    except Exception as e:
        print(f"Error in handle_movement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stop")
async def handle_stop():
    try:
        # Send stop command via MQTT only if connected
        if mqtt_connected:
            mqtt_client.publish(MQTT_TOPIC, "stop")
            print("Published MQTT stop command")
        else:
            print("MQTT not connected - would have sent stop command")
        return {"status": "success", "message": "Robot stopped"}

    except Exception as e:
        print(f"Error in handle_stop: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    # Stop MQTT client only if it was connected
    if mqtt_connected:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()

@app.post("/api/designs")
async def create_design(design: Design):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        design_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        
        # Ensure content is properly serializable
        if not isinstance(design.content, dict):
            raise HTTPException(
                status_code=422,
                detail="Content must be a valid JSON object"
            )
        
        try:
            content_json = json.dumps(design.content)
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to serialize content: {str(e)}"
            )
        
        c.execute('''
            INSERT INTO designs (id, title, description, author, content, created_at, tags, downloads)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            design_id,
            design.title,
            design.description,
            design.author,
            content_json,
            created_at.isoformat(),
            json.dumps(design.tags),
            0
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "id": design_id,
            "title": design.title,
            "description": design.description,
            "author": design.author,
            "content": design.content,
            "created_at": created_at,
            "tags": design.tags,
            "downloads": 0
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_design: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create design: {str(e)}"
        )

@app.get("/api/designs")
async def list_designs(skip: int = 0, limit: int = 10, tag: Optional[str] = None):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        if tag:
            # Search for tag in JSON array
            c.execute('''
                SELECT * FROM designs 
                WHERE json_array_length(json_extract(tags, '$[*]')) > 0 
                AND tags LIKE ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (f'%"{tag}"%', limit, skip))
        else:
            c.execute('''
                SELECT * FROM designs 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (limit, skip))
            
        rows = c.fetchall()
        conn.close()
        
        designs = []
        for row in rows:
            designs.append({
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "author": row[3],
                "content": json.loads(row[4]),
                "created_at": row[5],
                "tags": json.loads(row[6]),
                "downloads": row[7]
            })
            
        return designs
    except Exception as e:
        print(f"Error in list_designs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/designs/{design_id}")
async def get_design(design_id: str):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        c.execute('SELECT * FROM designs WHERE id = ?', (design_id,))
        row = c.fetchone()
        conn.close()
        
        if row:
            return {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "author": row[3],
                "content": json.loads(row[4]),
                "created_at": row[5],
                "tags": json.loads(row[6]),
                "downloads": row[7]
            }
        raise HTTPException(status_code=404, detail="Design not found")
    except Exception as e:
        print(f"Error in get_design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/designs/{design_id}")
async def update_design(design_id: str, design: Design):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        c.execute('''
            UPDATE designs 
            SET title = ?, description = ?, author = ?, content = ?, tags = ?
            WHERE id = ?
        ''', (
            design.title,
            design.description,
            design.author,
            json.dumps(design.content),
            json.dumps(design.tags),
            design_id
        ))
        
        if c.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Design not found")
            
        conn.commit()
        conn.close()
        return {"message": "Design updated successfully"}
    except Exception as e:
        print(f"Error in update_design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/designs/{design_id}")
async def delete_design(design_id: str):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        c.execute('DELETE FROM designs WHERE id = ?', (design_id,))
        
        if c.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Design not found")
            
        conn.commit()
        conn.close()
        return {"message": "Design deleted successfully"}
    except Exception as e:
        print(f"Error in delete_design: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/designs/{design_id}/download")
async def increment_downloads(design_id: str):
    try:
        conn = sqlite3.connect(DATABASE_URL)
        c = conn.cursor()
        
        c.execute('''
            UPDATE designs 
            SET downloads = downloads + 1
            WHERE id = ?
        ''', (design_id,))
        
        if c.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Design not found")
            
        conn.commit()
        conn.close()
        return {"message": "Download count incremented"}
    except Exception as e:
        print(f"Error in increment_downloads: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return RedirectResponse(url="http://localhost:3000")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 