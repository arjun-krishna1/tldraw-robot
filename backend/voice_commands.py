import sys
import os
import sounddevice as sd
import numpy as np
import paho.mqtt.client as mqtt
import logging
import time
from io import BytesIO
import wave
import modal

# Suppress unnecessary logging
logging.basicConfig(level=logging.INFO)

# ------------------------------------------------------------------------------------
# Constants & Setup
# ------------------------------------------------------------------------------------
MQTT_BROKER_ADDRESS = "localhost"
MQTT_TOPIC = "robot/drive"
SAMPLE_RATE = 16000
CHANNELS = 1  # Mono audio
STREAM_CHUNK_DURATION = 3.0  # Duration for stream updates

# Modal setup
image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install("openai-whisper", "ffmpeg-python")
)
stub = modal.Stub("voice-command-whisper")
cache_vol = modal.Volume.from_name("whisper-cache", create_if_missing=True)
CACHE_DIR = "/cache"

@stub.cls(
    gpu=modal.gpu.T4(count=1),
    volumes={CACHE_DIR: cache_vol},
    allow_concurrent_inputs=15,
    container_idle_timeout=60 * 10,
    timeout=60 * 60,
)
class WhisperModel:
    @modal.enter()
    def setup(self):
        import whisper
        self.model = whisper.load_model("tiny.en", device="cuda", download_root=CACHE_DIR)

    @modal.method()
    def transcribe(self, audio_data: bytes):
        with open("temp_audio.wav", "wb") as f:
            f.write(audio_data)
        result = self.model.transcribe("temp_audio.wav")
        return result["text"]

# Create MQTT client
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect(MQTT_BROKER_ADDRESS)
client.loop_start()

def process_command(text):
    """Process transcribed text and send appropriate MQTT commands"""
    if not text:
        return
        
    text = text.lower().strip()
    command = None
    
    # Movement commands
    if "forward" in text or "go forward" in text or "move forward" in text:
        command = "forward"
    elif "back" in text or "backward" in text or "go back" in text:
        command = "back"
    elif "left" in text or "turn left" in text:
        command = "left"
    elif "right" in text or "turn right" in text:
        command = "right"
    elif "stop" in text or "halt" in text:
        command = "stop"
    
    if command:
        print(f"\nExecuting: {command}")
        client.publish(MQTT_TOPIC, command)
        
        # Automatically stop after movement commands (except 'stop' command)
        if command != "stop":
            time.sleep(1.0)  # Move for 1 second
            client.publish(MQTT_TOPIC, "stop")
            print("Stopping")

def save_audio_chunk(audio_data, sample_rate):
    """Save audio data to a WAV format bytes object"""
    with BytesIO() as wav_buffer:
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(CHANNELS)
            wav_file.setsampwidth(2)  # 16-bit audio
            wav_file.setframerate(sample_rate)
            wav_file.writeframes((audio_data * 32767).astype(np.int16).tobytes())
        return wav_buffer.getvalue()

def transcribe_audio(audio_data):
    """Send audio data to Modal for transcription"""
    try:
        whisper_model = WhisperModel()
        result = whisper_model.transcribe.remote(audio_data)
        return result
    except Exception as e:
        print(f"Transcription error: {e}")
        return None

def transcribe():
    """Continuously transcribe audio and process commands"""
    try:
        print("\nVoice Control Active!")
        print("Commands: forward, back, left, right, stop")
        print("Press Ctrl+C to exit\n")
        
        def audio_callback(indata, frames, time, status):
            if status:
                print(f"Status: {status}")
                return
            
            # Save audio chunk to WAV format
            audio_data = indata.flatten()
            wav_data = save_audio_chunk(audio_data, SAMPLE_RATE)
            
            # Send to Modal for transcription
            result = transcribe_audio(wav_data)
            if result:
                print(result, end="\r")
                sys.stdout.flush()
                process_command(result)

        # Start audio stream
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            blocksize=int(SAMPLE_RATE * STREAM_CHUNK_DURATION),
            callback=audio_callback
        ):
            print("Listening... Press Ctrl+C to stop")
            while True:
                time.sleep(0.1)
                
    except KeyboardInterrupt:
        print("\nStopping voice control...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        client.publish(MQTT_TOPIC, "stop")
        client.loop_stop()
        client.disconnect()
        print("Shutdown complete.")

if __name__ == "__main__":
    try:
        with stub.run():
            transcribe()
    except Exception as e:
        print(f"Error: {e}")
        # Ensure cleanup happens
        client.publish(MQTT_TOPIC, "stop")
        client.loop_stop()
        client.disconnect()