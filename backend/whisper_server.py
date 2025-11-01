import asyncio
import websockets
import numpy as np
import json
import subprocess
from faster_whisper import WhisperModel

print("✅ Whisper server starting...")
model = WhisperModel("large-v3", device="cuda", compute_type="float16")
print("✅ Model 'large-v3' loaded on GPU")


def media_to_float32(data):
    """Convert ANY audio/video format to float32 PCM using FFmpeg."""
    process = subprocess.Popen(
        [
            "ffmpeg",
            "-loglevel", "error",
            "-i", "pipe:0",      # <-- FFmpeg auto-detects format
            "-ac", "1",          # mono
            "-ar", "16000",      # 16 kHz sample rate
            "-f", "f32le",       # raw PCM float32
            "pipe:1",
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    raw_audio, stderr = process.communicate(data)

    if process.returncode != 0:
        raise Exception(f"FFmpeg error:\n{stderr.decode()}")

    if len(raw_audio) == 0:
        raise Exception("FFmpeg produced empty audio output")

    return np.frombuffer(raw_audio, dtype=np.float32)



async def transcribe(websocket):
    print("🎤 Client connected — waiting for full recording...")
    audio_buffer = bytearray()

    try:
        async for message in websocket:
            # ✅ Detect end of audio upload
            if isinstance(message, str) and message == "DONE":
                print("✅ Received DONE signal. Starting transcription...")
                break

            # ✅ Append binary data
            if isinstance(message, (bytes, bytearray)):
                audio_buffer.extend(message)

    except websockets.ConnectionClosed:
        print("🔌 Client disconnected unexpectedly")

    print(f"📦 Received {len(audio_buffer)} bytes — converting to PCM...")

    try:
        audio = media_to_float32(bytes(audio_buffer))
        print(f"🎧 Audio length: {len(audio) / 16000:.2f} seconds")

        segments, _ = model.transcribe(
            audio,
            language="en",
            beam_size=1,
            best_of=1,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=200)
        )

        text = " ".join(seg.text for seg in segments).strip()
        print(f"📝 Final Transcript: {text}")

        # ✅ Send final transcript to client
        await websocket.send(json.dumps({"text": text}))

        # ✅ Close connection nicely
        await websocket.close()
        print("✅ Transcription sent and connection closed.")

    except Exception as e:
        print("❌ Error:", e)
        try:
            await websocket.send(json.dumps({"error": str(e)}))
        except:
            pass
        await websocket.close()


async def main():
    print("✅ WebSocket server ready at ws://localhost:8000/transcribe")
    async with websockets.serve(
        transcribe,
        "0.0.0.0",
        8000,
        max_size=50 * 1024 * 1024,  # Allow up to 50MB uploads
        ping_interval=20,
        ping_timeout=20,
    ):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
