import cv2
import numpy as np
from typing import List, Dict

def analyze_motion(video_path: str, start: float, end: float) -> float:
    """Quantify motion in a video segment"""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    start_frame = int(fps * start)
    end_frame = int(fps * end)
    
    motion_intensity = []
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    
    ret, prev_frame = cap.read()
    if not ret:
        return 0.0
    
    for _ in range(start_frame, end_frame):
        ret, curr_frame = cap.read()
        if not ret:
            break
        
        diff = cv2.absdiff(prev_frame, curr_frame)
        motion_intensity.append(np.mean(diff))
        prev_frame = curr_frame
    
    cap.release()
    return min(10, np.mean(motion_intensity) * 0.2) if motion_intensity else 0.0

def detect_highlights(video_path: str, segments: List[Dict]) -> List[Dict]:
    """Find the most valuable moments for coaches"""
    TECHNIQUE_KEYWORDS = [
        "armbar", "guard", "sweep", "escape", "pass",
        "submission", "back take", "triangle", "kimura"
    ]
    
    INSTRUCTIONAL_PHRASES = [
        "important", "key detail", "remember this",
        "most effective", "critical", "focus here"
    ]
    
    highlights = []
    for seg in segments:
        if not seg["text"]:
            continue
        
        text = seg["text"].lower()
        score = 0
        
        # Technique scoring
        tech_score = sum(3 for tech in TECHNIQUE_KEYWORDS if tech in text)
        score += min(tech_score, 9)  # Cap at 9 points
        
        # Instructional scoring
        instr_score = sum(2 for phrase in INSTRUCTIONAL_PHRASES if phrase in text)
        score += min(instr_score, 6)  # Cap at 6 points
        
        # Motion analysis
        motion_score = analyze_motion(video_path, seg["start"], seg["end"])
        score += motion_score
        
        if score >= 8:  # Only keep high-quality highlights
            highlights.append({
                "start": max(0, seg["start"] - 1),  # 1s pre-roll
                "end": seg["end"] + 1,              # 1s post-roll
                "score": score,
                "text": seg["text"][:100]            # Preview text
            })
    
    return sorted(highlights, key=lambda x: x["score"], reverse=True)