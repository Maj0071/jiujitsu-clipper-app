import cv2
import numpy as np

def analyze_video_motion(video_path, start_time, end_time):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(fps * (end_time - start_time))
    motion_scores = []
    
    # Seek to start time
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(fps * start_time))
    
    ret, prev_frame = cap.read()
    if not ret:
        cap.release()
        return 0.0
        
    for _ in range(frame_count):
        ret, curr_frame = cap.read()
        if not ret: break
        
        diff = cv2.absdiff(prev_frame, curr_frame)
        motion_scores.append(np.mean(diff))
        prev_frame = curr_frame
    
    cap.release()
    return min(10, np.mean(motion_scores) / 5) if motion_scores else 0.0