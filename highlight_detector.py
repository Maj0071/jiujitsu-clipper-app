# highlight_detector.py
import cv2
import numpy as np
from typing import List, Dict

class HighlightDetector:
    def __init__(self):
        self.TECHNIQUE_KEYWORDS = [
            "armbar", "guard", "sweep", "escape", "pass",
            "submission", "back take", "triangle", "kimura"
        ]
        
        self.INSTRUCTIONAL_PHRASES = [
            "important", "key detail", "remember this",
            "most effective", "critical", "focus here"
        ]
    
    def analyze_motion(self, video_path: str, start: float, end: float) -> float:
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

    def detect_highlights(self, video_path: str, segments: List[Dict]) -> List[Dict]:
        """Find the most valuable moments for coaches"""
        highlights = []
        
        for seg in segments:
            if not seg["text"]:
                continue
            
            text = seg["text"].lower()
            score = 0
            
            # Content scoring
            tech_score = sum(3 for tech in self.TECHNIQUE_KEYWORDS if tech in text)
            instr_score = sum(2 for phrase in self.INSTRUCTIONAL_PHRASES if phrase in text)
            score += min(tech_score, 9) + min(instr_score, 6)
            
            # Motion analysis
            motion_score = self.analyze_motion(video_path, seg["start"], seg["end"])
            score += motion_score
            
            if score >= 8:
                highlights.append({
                    "start": max(0, seg["start"] - 1),
                    "end": seg["end"] + 1,
                    "score": score,
                    "text": seg["text"][:100],
                    "duration": seg["end"] - seg["start"]
                })
        
        return sorted(highlights, key=lambda x: x["score"], reverse=True)[:3]