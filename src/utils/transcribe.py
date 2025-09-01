import whisper
import os
import tempfile
from moviepy.editor import VideoFileClip
import numpy as np

def load_whisper_model():
    """Load with fresh model each time to avoid state issues"""
    return whisper.load_model("base.en")

def extract_audio(video_path: str) -> str:
    """Convert video to optimized audio format"""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as audio_file:
        audio_path = audio_file.name
        with VideoFileClip(video_path) as clip:
            if not clip.audio:
                raise ValueError("No audio track detected")
            clip.audio.write_audiofile(
                audio_path,
                codec="pcm_s16le",
                fps=16000,
                ffmpeg_params=["-ac", "1", "-af", "loudnorm"]
            )
        return audio_path

def safe_transcribe(audio_path: str):
    """Robust transcription with validation"""
    model = load_whisper_model()
    try:
        result = model.transcribe(
            audio_path,
            language="en",
            fp16=False,
            initial_prompt="This is a Jiu-Jitsu instructional video about techniques",
            word_timestamps=True
        )
        
        # More comprehensive validation
        if not isinstance(result, dict):
            raise ValueError("Whisper returned non-dict result")
            
        if "segments" not in result or not isinstance(result["segments"], list):
            raise ValueError("Invalid segments format")
            
        # Validate each segment
        validated_segments = []
        for seg in result["segments"]:
            if not isinstance(seg, dict):
                continue
            try:
                validated_segments.append({
                    "text": str(seg.get("text", "")).strip(),
                    "start": float(seg.get("start", 0)),
                    "end": float(seg.get("end", 0)),
                    "words": seg.get("words", [])
                })
            except (TypeError, ValueError) as e:
                print(f"Segment validation error: {e}")
                continue
                
        if not validated_segments:
            raise ValueError("No valid segments found")
            
        return {"segments": validated_segments, "text": result.get("text", "")}
        
    except Exception as e:
        raise Exception(f"Transcription processing failed: {str(e)}")

def transcribe_video(video_path: str):
    """Main transcription handler"""
    audio_path = None
    try:
        audio_path = extract_audio(video_path)
        result = safe_transcribe(audio_path)
        
        # Process segments
        segments = []
        for seg in result["segments"]:
            if not isinstance(seg, dict):
                continue
            try:
                segments.append({
                    "text": str(seg.get("text", "")).strip(),
                    "start": float(seg.get("start", 0)),
                    "end": float(seg.get("end", 0)),
                    "words": seg.get("words", [])
                })
            except (TypeError, ValueError):
                continue
        
        if not segments:
            raise ValueError("No valid segments found")
        
        return segments, result.get("text", "")
    
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")
    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except:
                pass