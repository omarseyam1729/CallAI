

import os
import json
import whisperx
from whisperx.diarize import DiarizationPipeline

def transcribe_with_whisperx(
    file_path: str,
    model_size: str = "base",
    device: str = "cpu",            
    compute_type: str = "float32"   
) -> tuple[list[dict], list[dict]]:
    """Return aligned transcription and diarization segments separately."""
    
    print("1. Loading WhisperX ASR model …")
    asr_model = whisperx.load_model(
        model_size, device=device, compute_type=compute_type
    )

    print("2. Transcribing …")
    asr_result = asr_model.transcribe(file_path)

    print("3. Aligning words …")
    align_model, meta = whisperx.load_align_model("en", device=device)
    aligned_result = whisperx.align(
        asr_result["segments"], align_model, meta, file_path, device=device
    )

    transcription_segments = aligned_result["segments"] 

    print("4. Performing speaker diarization …")
    diarize_pipeline = DiarizationPipeline(
        use_auth_token="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", 
        device=device
    )
    diarize_segments_df = diarize_pipeline(file_path)
    diarize_segments = diarize_segments_df[["start", "end", "speaker"]].to_dict(orient="records")

    print(f"Transcription segments: {len(transcription_segments)}")
    print(f"Diarization segments: {len(diarize_segments)}")

    return transcription_segments, diarize_segments


def main() -> None:
    AUDIO_FILE        = "example1.wav"
    TRANSCRIPT_JSON   = "transcription.json"
    DIARIZATION_JSON  = "diarization.json"

    transcription_segments, diarize_segments = transcribe_with_whisperx(
        AUDIO_FILE, model_size="base",
        device="cpu", compute_type="float32"
    )

    with open(TRANSCRIPT_JSON, "w") as f1:
        json.dump(transcription_segments, f1, indent=2)
    print(f"Transcription written to {TRANSCRIPT_JSON}")

    with open(DIARIZATION_JSON, "w") as f2:
        json.dump(diarize_segments, f2, indent=2)
    print(f"Diarization written to {DIARIZATION_JSON}")


if __name__ == "__main__":
    main()
