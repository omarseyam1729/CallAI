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


def extract_audio_snippet(chunk_path: str, start: float, end: float, output_path: str = None) -> str:
    """
    Extract an audio snippet from a chunk file using FFmpeg.
    
    Args:
        chunk_path: Path to the audio chunk file
        start: Start time in seconds (relative to chunk)
        end: End time in seconds (relative to chunk)
        output_path: Optional output path. If None, generates a temp file.
    
    Returns:
        Path to the extracted audio snippet
    """
    from pathlib import Path
    import tempfile
    
    if output_path is None:
        # Create temp file
        temp_dir = Path(tempfile.gettempdir())
        output_path = str(temp_dir / f"segment_{uuid.uuid4().hex}.wav")
    else:
        os.makedirs(Path(output_path).parent, exist_ok=True)
    
    duration = end - start
    
    subprocess.run([
        "ffmpeg", "-y",
        "-ss", str(start),
        "-t", str(duration),
        "-i", chunk_path,
        "-acodec", "pcm_s16le",  # WAV format
        "-ar", "16000",          # Standard rate
        "-ac", "1",              # mono channel
        str(output_path)
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    return output_path


if __name__ == "__main__":
    chunks = split_audio_ffmpeg("example.mp3")
    print("Generated chunks:", chunks)


