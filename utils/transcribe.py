import whisper

model = whisper.load_model("base")  # or "small" or "medium"

def transcribe_video(video_path):
    result = model.transcribe(video_path)
    return result["text"]
