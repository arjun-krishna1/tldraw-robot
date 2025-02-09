import sys
import os
import sounddevice as sd
import soundfile as sf
import numpy as np
import paho.mqtt.client as mqtt
import logging
import whispercpp as w
import time
from io import BytesIO
import wave

# Suppress unnecessary logging
logging.basicConfig(level=logging.INFO)

# ------------------------------------------------------------------------------------
# Constants & Setup
# ------------------------------------------------------------------------------------
MQTT_BROKER_ADDRESS = "localhost"
MQTT_TOPIC = "robot/drive"
SAMPLE_RATE = 16000  # Whisper expects 16kHz
CHANNELS = 1  # Mono audio
CHUNK_DURATION = 3.0  # Duration in seconds for each audio chunk
STREAM_CHUNK_DURATION = 1.0  # Duration for stream updates

# Create MQTT client
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect(MQTT_BROKER_ADDRESS)
client.loop_start()

# Whisper setup
model = w.Whisper('tiny.en')

def process_command(text):
    """Process transcribed text and send appropriate MQTT commands"""
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
    """Save audio data to a temporary WAV file"""
    with BytesIO() as wav_buffer:
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(CHANNELS)
            wav_file.setsampwidth(2)  # 16-bit audio
            wav_file.setframerate(sample_rate)
            wav_file.writeframes((audio_data * 32767).astype(np.int16).tobytes())
        return wav_buffer.getvalue()

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
            
            # Transcribe using whisper.cpp
            try:
                result = model.transcribe_from_wav(wav_data)
                if result:
                    text = result.strip()
                    print(text, end="\r")
                    sys.stdout.flush()
                    process_command(text)
            except Exception as e:
                print(f"Transcription error: {e}")

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
        transcribe()
    except Exception as e:
        print(f"Error: {e}")
        # Ensure cleanup happens
        client.publish(MQTT_TOPIC, "stop")
        client.loop_stop()
        client.disconnect()