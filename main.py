from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import tempfile
import whisper
from moviepy.editor import VideoFileClip
from typing import List, Dict
import traceback
from highlight_detector import HighlightDetector

# Initialize FastAPI app
app = FastAPI()

# Configuration
UPLOAD_DIR = "uploads"
CLIP_DIR = "clips"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CLIP_DIR, exist_ok=True)

# --- Core Functions ---
def get_video_duration(video_path: str) -> float:
    """Get video duration safely"""
    with VideoFileClip(video_path) as clip:
        return clip.duration

def clip_video(video_path: str, start_time: float, end_time: float) -> str:
    """Create video clip with validation"""
    out_path = os.path.join(CLIP_DIR, f"clip_{start_time:.1f}_{end_time:.1f}.mp4")
    
    with VideoFileClip(video_path) as clip:
        # Validate timestamps
        start_time = max(0, min(start_time, clip.duration - 1))
        end_time = min(clip.duration, max(start_time + 1, end_time))
        
        clip.subclip(start_time, end_time).write_videofile(
            out_path,
            codec="libx264",
            audio_codec="aac"
        )
    return out_path

def transcribe_video(video_path: str):

    """Robust video transcription with error handling"""
    audio_path = None
    try:
        # Create temp audio file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as audio_file:
            audio_path = audio_file.name
            with VideoFileClip(video_path) as clip:
                if not clip.audio:
                    raise ValueError("Video has no audio track")
                clip.audio.write_audiofile(
                    audio_path,
                    codec="pcm_s16le",
                    fps=16000,
                    ffmpeg_params=["-ac", "1"]
                )

        # Load Whisper model with error handling
        try:
            model = whisper.load_model("base.en", device="cpu")
        except Exception as e:
            raise Exception(f"Failed to load Whisper model: {str(e)}")

        # Transcription with additional error handling
        try:
            result = model.transcribe(
                audio_path,
                language="en",
                fp16=False,
                initial_prompt="This is a Jiu-Jitsu instructional video",
                verbose=False  # Disable progress prints
            )
        except RuntimeError as e:
            if "tuple.index(x): x not in tuple" in str(e):
                # Clear model cache and retry once
                import shutil
                shutil.rmtree(os.path.expanduser("~/.cache/whisper"), ignore_errors=True)
                model = whisper.load_model("base.en", device="cpu")
                result = model.transcribe(audio_path, language="en", fp16=False)
            else:
                raise

        # Process segments
        segments = []
        for seg in result.get("segments", []):
            try:
                if seg.get("text", "").strip():
                    segments.append({
                        "text": seg["text"],
                        "start": seg["start"],
                        "end": seg["end"]
                    })
            except (KeyError, TypeError):
                continue

        if not segments:
            raise ValueError("No speech segments found")
            
        return segments, result.get("text", "")
        
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")
    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except:
                pass

def detect_highlights(segments: List[Dict]) -> List[Dict]:
    """Find key moments in Jiu-Jitsu videos"""
    highlights = []
    KEY_PHRASES = ["important", "key detail", "remember this", "critical"]
    
    for seg in segments:
        if not seg["text"]:
            continue
            
        text_lower = seg["text"].lower()
        score = 5  # Base score
        
        # Score based on content
        if any(phrase in text_lower for phrase in KEY_PHRASES):
            score += 3
        if any(tech in text_lower for tech in ["armbar", "guard", "sweep"]):
            score += 2
            
        if score >= 7:
            highlights.append({
                "start": max(0, seg["start"] - 1),  # 1s pre-roll
                "end": seg["end"] + 1,              # 1s post-roll
                "score": score,
                "text": seg["text"][:100]            # Truncate for display
            })
    
    return sorted(highlights, key=lambda x: x["score"], reverse=True)[:3]

# --- API Endpoints ---
@app.post("/upload/")
async def upload_video(file: UploadFile = File(...)):
    try:
        # Validate and save file
        if not file.filename.lower().endswith('.mp4'):
            raise ValueError("Only MP4 files are supported")
            
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)

        # Process with new components
        try:
            segments, transcript = transcribe_video(file_path)
            detector = HighlightDetector()
            highlights = detector.detect_highlights(file_path, segments)
            
            if not highlights:
                raise ValueError("No highlights detected - try a video with clearer instruction")
            
            # Create clips
            clip_paths = []
            for highlight in highlights:
                try:
                    clip_path = clip_video(
                        file_path,
                        highlight["start"],
                        highlight["end"]
                    )
                    clip_paths.append(os.path.basename(clip_path))
                except Exception as e:
                    print(f"Clip creation failed for highlight: {e}")
                    continue
            
            return {
                "status": "success",
                "clips": clip_paths,
                "highlights": [{
                    "text": h["text"],
                    "score": h["score"],
                    "duration": h["duration"]
                } for h in highlights]
            }
            
        except Exception as processing_error:
            traceback.print_exc()
            duration = get_video_duration(file_path)
            clip_path = clip_video(file_path, 0, min(60, duration))
            return {
                "status": "partial_success",
                "clips": [os.path.basename(clip_path)],
                "warning": str(processing_error)
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Upload failed",
                "details": str(e),
                "advice": "Try a shorter video (5-15 mins) with clear English instruction"
            }
        )
            
@app.get("/download/{filename}")
async def download_clip(filename: str):
    file_path = os.path.join(CLIP_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Clip not found")
    return FileResponse(file_path)

@app.get("/")
async def health_check():
    return {"status": "ready", "version": "1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)