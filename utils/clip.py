import ffmpeg
import os

CLIP_DIR = "clips"
os.makedirs(CLIP_DIR, exist_ok=True)

def clip_video(video_path, start_time, end_time):
    out_path = os.path.join(CLIP_DIR, f"clip_{start_time}_{end_time}.mp4")

    (
        ffmpeg
        .input(video_path, ss=start_time, t=(end_time - start_time))
        .output(out_path)
        .run(overwrite_output=True)
    )

    return out_path
