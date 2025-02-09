import modal

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install("openai-whisper", "ffmpeg-python")
)
app = modal.App("example-base-whisper-large-v3-turbo", image=image)

GPU_CONFIG = modal.gpu.H100(count=1)

CACHE_DIR = "/cache"
cache_vol = modal.Volume.from_name("whisper-cache", create_if_missing=True)

@app.cls(
    gpu=GPU_CONFIG,
    volumes={CACHE_DIR: cache_vol},
    allow_concurrent_inputs=15,
    container_idle_timeout=60 * 10,
    timeout=60 * 60,
)
class Model:
    @modal.enter()
    def setup(self):
        import whisper

        self.model = whisper.load_model("tiny.en", device="cuda", download_root=CACHE_DIR)

    @modal.method()
    def transcribe(self, audio_url: str):
        import requests

        response = requests.get(audio_url)

        # Save the audio file locally
        with open("downloaded_audio.wav", "wb") as audio_file:
            audio_file.write(response.content)

        result = self.model.transcribe("downloaded_audio.wav")
        return result["text"]


# ## Run the model
@app.local_entrypoint()
def main():
    url = "https://pub-ebe9e51393584bf5b5bea84a67b343c2.r2.dev/examples_english_english.wav"
    print(Model().transcribe.remote(url))