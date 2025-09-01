# utils/social_features.py
from deepseek_api import DeepSeekAPI, generate_post
import os
from dotenv import load_dotenv

load_dotenv()

class CoachSocialTools:
    @staticmethod
    def generate_hashtags(technique_name):
        prompt = f"Generate 3 viral hashtags for a Jiu-Jitsu clip about {technique_name}"
        return generate_post(prompt)
    
    @staticmethod
    def create_coach_callout(coach_name):
        return f"Learn from @{coach_name} 🔥 Comment 'Tutorial' to request this move!"