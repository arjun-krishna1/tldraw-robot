import sys
import os
from transformers import pipeline
from transformers.pipelines.audio_utils import ffmpeg_microphone_live
import paho.mqtt.client as mqtt
import logging

# Suppress unnecessary logging
logging.getLogger("transformers").setLevel(logging.ERROR)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# ------------------------------------------------------------------------------------
# Constants & Setup
# ------------------------------------------------------------------------------------
MQTT_BROKER_ADDRESS = "localhost"
MQTT_TOPIC = "robot/drive"

# Create MQTT client
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect(MQTT_BROKER_ADDRESS)
client.loop_start()

# Whisper setup
device = 'cpu'
model = "openai/whisper-tiny.en"
transcriber = pipeline(
    "automatic-speech-recognition", 
    model=model, 
    device=device
)

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
            import time
            time.sleep(1.0)  # Move for 1 second
            client.publish(MQTT_TOPIC, "stop")
            print("Stopping")

def transcribe(chunk_length_s=3.0, stream_chunk_s=1.0):
    """Continuously transcribe audio and process commands"""
    sampling_rate = transcriber.feature_extractor.sampling_rate

    # Redirect stdout/stderr temporarily
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = open(os.devnull, 'w')
    sys.stderr = open(os.devnull, 'w')
    
    try:
        mic = ffmpeg_microphone_live(
            sampling_rate=sampling_rate,
            chunk_length_s=chunk_length_s,
            stream_chunk_s=stream_chunk_s,
        )
    finally:
        # Restore stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    print("\nVoice Control Active!")
    print("Commands: forward, back, left, right, stop")
    print("Press Ctrl+C to exit\n")
    
    try:
        while True:
            # Redirect stdout/stderr for transcription
            sys.stdout = open(os.devnull, 'w')
            sys.stderr = open(os.devnull, 'w')
            
            for item in transcriber(mic, generate_kwargs={"max_new_tokens": 128}):
                # Restore stdout/stderr for our output
                sys.stdout = old_stdout
                sys.stderr = old_stderr
                
                sys.stdout.write("\033[K")
                text = item["text"]
                print(text, end="\r")
                
                # Process command when chunk is complete
                if not item["partial"][0]:
                    print()  # Move to next line
                    process_command(text)
                    break
                    
    except KeyboardInterrupt:
        print("\nStopping voice control...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Restore stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr
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