# test_transcribe.py
import sys
from transcribe import transcribe_video

def test_transcription(file_path):
    try:
        print(f"\nTesting file: {file_path}")
        segments, text = transcribe_video(file_path)
        
        print("\nFull Transcript:")
        print(text)
        
        print("\nSegments:")
        for i, segment in enumerate(segments, 1):
            print(f"{i}. {segment['text']} (Start: {segment['start']}, End: {segment['end']})")
            
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
    else:
        test_file = "test_files/sample.mp4"  # Default test file
    
    success = test_transcription(test_file)
    sys.exit(0 if success else 1)