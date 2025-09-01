from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import tempfile
import whisper
from moviepy.editor import VideoFileClip
from typing import List, Dict, Optional
import traceback
import json
import uuid
from highlight_detector import HighlightDetector
from firebase_auth import (
    verify_firebase_token, 
    require_coach, 
    require_student, 
    require_coach_or_student,
    verify_coach_access,
    verify_student_access,
    FirebaseUser
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="BJJ Video Processing API", 
    version="1.0.0",
    description="Brazilian Jiu-Jitsu video processing and highlight detection API"
)

# CORS configuration from environment
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
CLIP_DIR = os.getenv("CLIP_DIR", "clips")
PROCESSED_DIR = os.getenv("PROCESSED_DIR", "processed")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_VIDEO_DURATION_MINUTES = int(os.getenv("MAX_VIDEO_DURATION_MINUTES", "30"))
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base.en")
MAX_HIGHLIGHTS = int(os.getenv("MAX_HIGHLIGHTS", "3"))
CLIP_BUFFER_SECONDS = float(os.getenv("CLIP_BUFFER_SECONDS", "1"))

# Create directories
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CLIP_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# --- Core Functions ---
def get_video_duration(video_path: str) -> float:
    """Get video duration safely"""
    try:
        with VideoFileClip(video_path) as clip:
            return clip.duration
    except Exception as e:
        print(f"Error getting video duration: {e}")
        return 0.0

def validate_video_file(file: UploadFile) -> None:
    """Validate uploaded video file"""
    # Check file type
    if not file.filename or not file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
        raise HTTPException(
            status_code=400, 
            detail="Only video files are supported (mp4, mov, avi, mkv)"
        )
    
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB"
        )

def clip_video(video_path: str, start_time: float, end_time: float, output_name: str = None) -> str:
    """Create video clip with validation"""
    if not output_name:
        output_name = f"clip_{uuid.uuid4().hex[:8]}_{start_time:.1f}_{end_time:.1f}.mp4"
    
    out_path = os.path.join(CLIP_DIR, output_name)
    
    try:
        with VideoFileClip(video_path) as clip:
            # Check video duration limit
            if clip.duration > MAX_VIDEO_DURATION_MINUTES * 60:
                raise Exception(f"Video too long. Maximum duration is {MAX_VIDEO_DURATION_MINUTES} minutes")
                
            # Validate timestamps
            start_time = max(0, min(start_time, clip.duration - 1))
            end_time = min(clip.duration, max(start_time + 1, end_time))
            
            clip_segment = clip.subclip(start_time, end_time)
            clip_segment.write_videofile(
                out_path,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile_path=tempfile.gettempdir(),
                remove_temp=True,
                verbose=False,
                logger=None
            )
            clip_segment.close()
        return out_path
    except Exception as e:
        print(f"Error creating clip: {e}")
        if os.path.exists(out_path):
            os.remove(out_path)
        raise Exception(f"Clip creation failed: {str(e)}")

def transcribe_video(video_path: str):
    """Robust video transcription with error handling"""
    audio_path = None
    try:
        # Create temp audio file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as audio_file:
            audio_path = audio_file.name
            
        try:
            with VideoFileClip(video_path) as clip:
                if not clip.audio:
                    raise ValueError("Video has no audio track")
                clip.audio.write_audiofile(
                    audio_path,
                    codec="pcm_s16le",
                    fps=16000,
                    ffmpeg_params=["-ac", "1"],
                    verbose=False,
                    logger=None
                )
        except Exception as e:
            raise Exception(f"Audio extraction failed: {str(e)}")

        # Load Whisper model with error handling
        try:
            model = whisper.load_model(WHISPER_MODEL, device="cpu")
        except Exception as e:
            raise Exception(f"Failed to load Whisper model: {str(e)}")

        # Transcription with additional error handling
        try:
            result = model.transcribe(
                audio_path,
                language="en",
                fp16=False,
                initial_prompt="This is a Brazilian Jiu-Jitsu instructional video about techniques and training methods.",
                verbose=False
            )
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")

        # Process segments
        segments = []
        for seg in result.get("segments", []):
            try:
                if seg.get("text", "").strip():
                    segments.append({
                        "text": seg["text"].strip(),
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

# --- Public API Endpoints ---
@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ready", 
        "version": "1.0", 
        "service": "BJJ Video Processing API",
        "config": {
            "max_file_size_mb": MAX_FILE_SIZE_MB,
            "max_duration_minutes": MAX_VIDEO_DURATION_MINUTES,
            "whisper_model": WHISPER_MODEL
        }
    }

@app.get("/api/status")
async def api_status():
    """API status check for frontend"""
    return {
        "status": "online", 
        "endpoints": ["upload", "clips", "transcribe"],
        "cors_origins": cors_origins
    }

# --- Authenticated API Endpoints ---
@app.post("/api/video/upload")
async def upload_video(
    file: UploadFile = File(...), 
    user: FirebaseUser = Depends(verify_firebase_token)
):
    """Upload and process video file (authenticated)"""
    try:
        # Validate file
        validate_video_file(file)
        
        # Save uploaded file with user context
        file_id = f"{user.uid}_{uuid.uuid4().hex[:8]}"
        filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        with open(file_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # Read in 1MB chunks
                f.write(chunk)

        print(f"Processing video for user {user.email}: {file.filename}")

        # Process video
        try:
            segments, transcript = transcribe_video(file_path)
            detector = HighlightDetector()
            highlights = detector.detect_highlights(file_path, segments)
            
            # Create clips for highlights
            clip_info = []
            for i, highlight in enumerate(highlights[:MAX_HIGHLIGHTS]):
                try:
                    clip_name = f"{file_id}_highlight_{i+1}.mp4"
                    clip_path = clip_video(
                        file_path,
                        max(0, highlight["start"] - CLIP_BUFFER_SECONDS),
                        highlight["end"] + CLIP_BUFFER_SECONDS,
                        clip_name
                    )
                    clip_info.append({
                        "filename": clip_name,
                        "start": highlight["start"],
                        "end": highlight["end"],
                        "duration": highlight["duration"],
                        "score": highlight["score"],
                        "text": highlight["text"]
                    })
                    print(f"Created highlight clip {i+1}: {clip_name}")
                except Exception as e:
                    print(f"Clip creation failed for highlight {i+1}: {e}")
                    continue
            
            # Save processing results with user info
            result_data = {
                "file_id": file_id,
                "user_id": user.uid,
                "user_email": user.email,
                "original_filename": file.filename,
                "transcript": transcript,
                "segments": segments,
                "highlights": highlights,
                "clips": clip_info,
                "duration": get_video_duration(file_path),
                "processed_at": json.dumps({"timestamp": "now"})
            }
            
            result_path = os.path.join(PROCESSED_DIR, f"{file_id}_result.json")
            with open(result_path, 'w') as f:
                json.dump(result_data, f, indent=2)
            
            print(f"Processing completed successfully: {len(clip_info)} clips created")
            
            return {
                "status": "success",
                "file_id": file_id,
                "clips": clip_info,
                "highlights_count": len(highlights),
                "total_duration": result_data["duration"],
                "transcript_preview": transcript[:200] + "..." if len(transcript) > 200 else transcript
            }
            
        except Exception as processing_error:
            print(f"Processing error: {processing_error}")
            traceback.print_exc()
            
            # Fallback: create a simple clip from the beginning
            duration = get_video_duration(file_path)
            fallback_clip = clip_video(file_path, 0, min(30, duration), f"{file_id}_fallback.mp4")
            
            return {
                "status": "partial_success",
                "file_id": file_id,
                "clips": [{
                    "filename": os.path.basename(fallback_clip),
                    "start": 0,
                    "end": min(30, duration),
                    "duration": min(30, duration),
                    "score": 5,
                    "text": "Fallback clip - processing had issues"
                }],
                "warning": str(processing_error)
            }
            
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Upload failed",
                "details": str(e),
                "advice": f"Try a shorter video (under {MAX_VIDEO_DURATION_MINUTES} mins) with clear English instruction"
            }
        )

@app.get("/api/video/clip/{filename}")
async def download_clip(
    filename: str,
    user: FirebaseUser = Depends(verify_firebase_token)
):
    """Download processed video clip (authenticated)"""
    file_path = os.path.join(CLIP_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Clip not found")
    
    # Verify user owns this clip (filename should start with their user ID)
    if not filename.startswith(user.uid) and user.uid != "dev-user-123":
        raise HTTPException(status_code=403, detail="Access denied to this clip")
    
    return FileResponse(
        file_path, 
        media_type="video/mp4",
        filename=filename
    )

@app.get("/api/video/results/{file_id}")
async def get_results(
    file_id: str,
    user: FirebaseUser = Depends(verify_firebase_token)
):
    """Get processing results for a file (authenticated)"""
    result_path = os.path.join(PROCESSED_DIR, f"{file_id}_result.json")
    
    if not os.path.exists(result_path):
        raise HTTPException(status_code=404, detail="Results not found")
    
    # Verify user owns this result
    if not file_id.startswith(user.uid) and user.uid != "dev-user-123":
        raise HTTPException(status_code=403, detail="Access denied to these results")
    
    with open(result_path, 'r') as f:
        return json.load(f)

# --- Coach-specific endpoints ---
@app.post("/api/coaches/{coach_id}/uploads")
async def upload_coach_video(
    coach_id: str, 
    file: UploadFile = File(...), 
    user: FirebaseUser = Depends(require_coach)
):
    """Upload video for a specific coach (coach authentication required)"""
    
    # Verify coach can access this resource
    if not verify_coach_access(user, coach_id):
        raise HTTPException(status_code=403, detail="Cannot upload to this coach account")
    
    # Use the main upload function
    result = await upload_video(file, user)
    result["coach_id"] = coach_id
    return result

@app.get("/api/coaches/{coach_id}/videos")
async def get_coach_videos(
    coach_id: str,
    user: FirebaseUser = Depends(require_coach)
):
    """Get all videos for a coach"""
    
    if not verify_coach_access(user, coach_id):
        raise HTTPException(status_code=403, detail="Cannot access this coach's videos")
    
    # Find all result files for this coach
    videos = []
    try:
        for filename in os.listdir(PROCESSED_DIR):
            if filename.startswith(f"{coach_id}_") and filename.endswith("_result.json"):
                result_path = os.path.join(PROCESSED_DIR, filename)
                with open(result_path, 'r') as f:
                    video_data = json.load(f)
                    videos.append({
                        "file_id": video_data["file_id"],
                        "filename": video_data["original_filename"],
                        "duration": video_data["duration"],
                        "clips_count": len(video_data["clips"]),
                        "highlights_count": len(video_data["highlights"]),
                        "processed_at": video_data.get("processed_at")
                    })
    except Exception as e:
        print(f"Error loading coach videos: {e}")
    
    return {"videos": videos, "total": len(videos)}

# --- Student-specific endpoints ---
@app.get("/api/students/{student_id}/purchased-content")
async def get_student_content(
    student_id: str,
    user: FirebaseUser = Depends(require_student)
):
    """Get purchased content for a student"""
    
    if not verify_student_access(user, student_id):
        raise HTTPException(status_code=403, detail="Cannot access this student's content")
    
    # TODO: Implement actual purchase tracking with database
    # For now, return mock data based on processed videos
    return {
        "courses": [],
        "message": "Purchase tracking will be implemented with database integration",
        "user_id": user.uid
    }

# --- Utility endpoints ---
@app.get("/api/health")
async def detailed_health():
    """Detailed health check with system info"""
    return {
        "status": "healthy",
        "service": "BJJ Video Processing API",
        "version": "1.0.0",
        "system": {
            "upload_dir": UPLOAD_DIR,
            "clips_dir": CLIP_DIR,
            "max_file_size_mb": MAX_FILE_SIZE_MB,
            "max_duration_minutes": MAX_VIDEO_DURATION_MINUTES,
            "whisper_model": WHISPER_MODEL
        },
        "directories": {
            "uploads_exist": os.path.exists(UPLOAD_DIR),
            "clips_exist": os.path.exists(CLIP_DIR),
            "processed_exist": os.path.exists(PROCESSED_DIR)
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    
    print(f"Starting BJJ Video Processing API on {host}:{port}")
    print(f"Debug mode: {debug}")
    print(f"Max file size: {MAX_FILE_SIZE_MB}MB")
    print(f"CORS origins: {cors_origins}")
    
    uvicorn.run(
        app, 
        host=host, 
        port=port, 
        log_level="info" if debug else "warning",
        reload=debug
    )