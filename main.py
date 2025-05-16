from fastapi import FastAPI, UploadFile, File, Form
import os
from utils.transcribe import transcribe_video
from utils.clip import clip_video

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Jiu-Jitsu Clipper API!"}


@app.post("/upload/")
async def upload_video(
    file: UploadFile = File(...),
    start_time: float = Form(0),
    end_time: float = Form(-1)
):
    #save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Step 1: Transcribe video
    transcript = transcribe_video(file_path)

    # Step 2: (Placeholder) Clip top moment
    clip_path = clip_video(file_path, 10, 20)  # clip from 10s to 20s as test

    return {
        "message": "Video processed",
        "transcript_preview": transcript[:500],
        "clip_path": clip_path
    }
