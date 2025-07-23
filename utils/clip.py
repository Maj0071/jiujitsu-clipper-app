from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, concatenate_videoclips
import os

CLIP_DIR = "clips"
os.makedirs(CLIP_DIR, exist_ok=True)

def clip_video(video_path, start_time, end_time):
    """Safe video clipping with validation"""
    out_path = os.path.join(CLIP_DIR, f"clip_{start_time:.1f}_{end_time:.1f}.mp4")
    
    try:
        with VideoFileClip(video_path) as clip:
            # Validate timestamps
            start_time = max(0, min(start_time, clip.duration - 1))
            end_time = min(clip.duration, max(start_time + 1, end_time))
            
            clip.subclip(start_time, end_time).write_videofile(
                out_path,
                codec="libx264",
                audio_codec="aac",
                threads=4
            )
        return out_path
    except Exception as e:
        if os.path.exists(out_path):
            os.remove(out_path)
        raise Exception(f"Clip creation failed: {str(e)}")

def add_captions(clip_path, text):
    """Add captions safely"""
    try:
        with VideoFileClip(clip_path) as clip:
            txt_clip = TextClip(
                text,
                fontsize=24,
                color='yellow',
                stroke_color='black',
                font='Arial-Bold',
                size=(clip.w * 0.9, None)
            ).set_position(('center', 'bottom'))
            
            final = CompositeVideoClip([clip, txt_clip])
            output_path = clip_path.replace(".mp4", "_captioned.mp4")
            final.write_videofile(output_path)
            return output_path
    except Exception as e:
        raise Exception(f"Captioning failed: {str(e)}")

def combine_clips(clip_paths, output_path):
    """Merge clips with error handling"""
    try:
        clips = [VideoFileClip(p) for p in clip_paths]
        final = concatenate_videoclips(clips, method="compose", transition=1)
        final.write_videofile(output_path)
        return output_path
    except Exception as e:
        raise Exception(f"Clip combining failed: {str(e)}")
    finally:
        for clip in clips:
            clip.close()