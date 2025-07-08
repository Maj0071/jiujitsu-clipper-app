import { useState } from 'react';

export default function VideoProcessor() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE_MB = 500; // 500MB limit

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Reset states
    setError(null);
    setVideoFile(null);

    if (!file) return;

    // Validate file type
    if (!file.type.match('video.*')) {
      setError('Please select a valid video file (MP4, MOV, etc.)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }

    setVideoFile(file);
  };

  const getFileSizeMB = (file: File | null): string => {
    if (!file) return '0';
    return (file.size / (1024 * 1024)).toFixed(2);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Upload Instructional Video</h3>
      
      {/* File Input */}
      <input
        type="file"
        accept="video/mp4,video/quicktime"
        onChange={handleFileChange}
        className="mb-4 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-bjj-blue file:text-white
                  hover:file:bg-blue-700"
      />

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* File Preview */}
      {videoFile && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bjj-blue" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4h-1V6H8v1H7V5zm5 6H8v1h4v-1zm-4 2h6v4H8v-4z" clipRule="evenodd" />
            </svg>
            {videoFile.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Size: {getFileSizeMB(videoFile)} MB • Type: {videoFile.type.split('/')[1].toUpperCase()}
          </p>
        </div>
      )}

      {/* Process Button (will hook this up later) */}
      <button
        disabled={!videoFile}
        className={`mt-6 w-full py-3 rounded-lg font-medium text-white transition-colors
          ${videoFile ? 'bg-bjj-red hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        Process Video
      </button>
    </div>
  );
}