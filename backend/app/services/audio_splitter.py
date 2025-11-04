import os
import subprocess
import math
from pathlib import Path
import uuid


def get_audio_duration(path: str) -> float:
    """Get audio duration in seconds using ffprobe."""
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            path,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return float(result.stdout.strip())


def split_audio_ffmpeg(input_path: str, chunk_duration=30, overlap=5) -> list[str]:
    """
    Split an audio file into overlapping chunks using FFmpeg.

    Args:
        input_path (str): Path to original audio file
        chunk_duration (int): Chunk duration in seconds (default = 30s)
        overlap (int): Overlap between chunks in seconds (default = 5s)

    Returns:
        List of file paths to chunked audio segments
    """
    duration = get_audio_duration(input_path)
    shift = chunk_duration - overlap

    base = Path(input_path)
    folder = base.with_suffix("")  # e.g. myfile.wav -> myfile/
    os.makedirs(folder, exist_ok=True)

    chunk_paths = []
    i = 0
    start = 0

    while start < duration:
        end = min(start + chunk_duration, duration)
        out_path = folder / f"chunk_{i}_{int(start)}_{int(end)}.wav"

        subprocess.run([
            "ffmpeg", "-y",
            "-ss", str(start),
            "-t", str(chunk_duration),
            "-i", input_path,
            "-acodec", "pcm_s16le",  # WAV format
            "-ar", "16000",          # Optional: standard Whisper rate
            "-ac", "1",              # mono channel
            str(out_path)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        chunk_paths.append(str(out_path))
        start += shift
        i += 1

    return chunk_paths


if __name__ == "__main__":
    chunks = split_audio_ffmpeg("example.mp3")
    print("Generated chunks:", chunks)


