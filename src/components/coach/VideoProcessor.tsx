import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';
import { bjjApi } from '../../utils/apiClients';

interface Segment { 
  id: string; 
  start: number; 
  end: number; 
}

interface TextOverlay { 
  id: string; 
  segmentId: string; 
  text: string; 
  x: number; 
  y: number; 
  fontSize: string; 
  fontFamily: string; 
  color: string; 
}

interface ProcessingResult {
  status: 'success' | 'partial_success' | 'error';
  file_id?: string;
  clips?: Array<{
    filename: string;
    start: number;
    end: number;
    duration: number;
    score: number;
    text: string;
  }>;
  highlights_count?: number;
  total_duration?: number;
  transcript_preview?: string;
  warning?: string;
  error?: string;
}

export default function VideoProcessor() {
  const { user } = useAuth();

  // Video & segments state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Text overlays
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Processing state
  const [uploading, setUploading] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large. Please select a video under 100MB');
      return;
    }

    setVideoFile(file);
    setVideoURL(URL.createObjectURL(file));
    setSegments([]);
    setOverlays([]);
    setSelectedSegmentId(null);
    setProcessingResult(null);
  };

  // Initialize segments
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const full = videoRef.current.duration;
    setDuration(full);
    const init = { id: uuidv4(), start: 0, end: full };
    setSegments([init]);
    setSelectedSegmentId(init.id);
  };

  // Split segment
  const splitSegment = (id: string, time: number) => {
    setSegments(prev => {
      const seg = prev.find(s => s.id === id);
      if (!seg || time <= seg.start || time >= seg.end) return prev;
      const a = { id: uuidv4(), start: seg.start, end: time };
      const b = { id: uuidv4(), start: time, end: seg.end };
      return [...prev.filter(s => s.id !== id), a, b].sort((x, y) => x.start - y.start);
    });
    setSelectedSegmentId(null);
  };

  const handleSplitActive = () => {
    if (!selectedSegmentId) return;
    const seg = segments.find(s => s.id === selectedSegmentId);
    if (seg) splitSegment(seg.id, (seg.start + seg.end) / 2);
  };

  // Delete segment
  const deleteSegment = (id: string) => setSegments(prev => prev.filter(s => s.id !== id));
  const handleDeleteActive = () => selectedSegmentId && deleteSegment(selectedSegmentId);

  // Resize segments
  const handleSegmentDrag = (e: React.MouseEvent, id: string, side: 'start' | 'end') => {
    e.preventDefault();
    const rect = timelineRef.current!.getBoundingClientRect();
    const move = (ev: MouseEvent) => {
      const pct = (ev.clientX - rect.left) / rect.width;
      const t = Math.max(0, Math.min(duration, pct * duration));
      setSegments(prev => prev.map(s => s.id !== id ? s : side === 'start'
        ? { ...s, start: Math.min(t, s.end - 0.1) }
        : { ...s, end: Math.max(t, s.start + 0.1) }
      ));
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // Preview segment
  const previewSegment = (seg: Segment) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seg.start;
    videoRef.current.play();
    const stop = seg.end;
    const onTime = () => {
      if (videoRef.current!.currentTime >= stop) {
        videoRef.current!.pause();
        videoRef.current!.removeEventListener('timeupdate', onTime);
      }
    };
    videoRef.current.addEventListener('timeupdate', onTime);
  };

  // Add text overlay
  const handleAddText = (segmentIdParam?: string) => {
    const segId = segmentIdParam || selectedSegmentId;
    if (!segId) return;
    const text = prompt('Enter text:'); 
    if (!text) return;
    const fontSize = (prompt('Font size px:', '24') || '24') + 'px';
    const fontFamily = prompt('Font family:', 'Arial') || 'Arial';
    const color = prompt('Text color:', '#FFFFFF') || '#FFFFFF';
    setOverlays(prev => [...prev, { 
      id: uuidv4(), 
      segmentId: segId, 
      text, 
      x: 50, 
      y: 10, 
      fontSize, 
      fontFamily, 
      color 
    }]);
  };

  // Drag overlays
  const startDragOverlay = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    setDragging({ id, offsetX: e.clientX - r.left, offsetY: e.clientY - r.top });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const wr = wrapperRef.current!.getBoundingClientRect();
      const x = ((e.clientX - wr.left - dragging.offsetX) / wr.width) * 100;
      const y = ((e.clientY - wr.top - dragging.offsetY) / wr.height) * 100;
      setOverlays(prev => prev.map(o => o.id !== dragging.id ? o : ({
        ...o, 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
      })));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { 
      window.removeEventListener('mousemove', onMove); 
      window.removeEventListener('mouseup', onUp); 
    };
  }, [dragging]);

  // Upload and process video
  const handleUpload = async () => {
    if (!videoFile || !user) {
      alert('Please select a video file and ensure you are logged in');
      return;
    }

    setUploading(true);
    setProcessingResult(null);

    try {
      // Upload to coach-specific endpoint if user is a coach
      const result = await bjjApi.uploadCoachVideo(user.uid, videoFile);

      if (result.error) {
        setProcessingResult({
          status: 'error',
          error: result.error
        });
        return;
      }

      setProcessingResult(result.data as ProcessingResult);

      // Show success message
      if (result.data?.status === 'success') {
        alert(`Video processed successfully! Created ${result.data.clips?.length || 0} highlight clips.`);
      } else if (result.data?.status === 'partial_success') {
        alert(`Video uploaded but processing had issues: ${result.data.warning}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setProcessingResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  // Download clip
  const handleDownloadClip = async (filename: string) => {
    try {
      const result = await bjjApi.downloadClip(filename);
      
      if (result.error) {
        alert(`Download failed: ${result.error}`);
        return;
      }

      // Create download link
      const blob = result.data!;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  return (
    <div className="relative p-6 bg-white rounded shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">BJJ Video Processor</h2>
      
      {/* File Upload */}
      <div className="mb-4">
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bjj-blue file:text-white hover:file:bg-bjj-blue-dark"
        />
        <p className="text-sm text-gray-600 mt-1">
          Upload MP4, MOV, or AVI files (max 100MB)
        </p>
      </div>

      {videoURL && (
        <div ref={wrapperRef} className="relative inline-block w-full">
          <video 
            ref={videoRef} 
            src={videoURL} 
            controls 
            onLoadedMetadata={handleLoadedMetadata} 
            className="w-full max-w-2xl mx-auto my-4 rounded shadow"
          />

          {/* Text Overlays */}
          {overlays.map(o => (
            <div 
              key={o.id} 
              onMouseDown={e => startDragOverlay(e, o.id)} 
              style={{ 
                position: 'absolute', 
                left: `${o.x}%`, 
                top: `${o.y}%`, 
                fontSize: o.fontSize, 
                fontFamily: o.fontFamily, 
                color: o.color,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                cursor: 'move',
                userSelect: 'none',
                zIndex: 10
              }}
            >
              {o.text}
            </div>
          ))}

          {/* Timeline */}
          <div ref={timelineRef} className="relative w-full h-12 bg-gray-200 rounded overflow-hidden my-4">
            {segments.map(seg => {
              const left = `${(seg.start/duration)*100}%`;
              const width = `${((seg.end-seg.start)/duration)*100}%`;
              const sel = seg.id === selectedSegmentId;
              return (
                <div 
                  key={seg.id} 
                  onClick={() => setSelectedSegmentId(seg.id)} 
                  className={`absolute top-0 bottom-0 bg-bjj-blue/60 border ${sel?'border-yellow-400 border-2':'border-bjj-blue'} rounded cursor-pointer hover:bg-bjj-blue/80 transition-colors`} 
                  style={{ left, width }}
                >
                  <button 
                    onClick={(e) => {e.stopPropagation(); handleAddText(seg.id);}} 
                    className="absolute top-1 left-1 text-xs bg-blue-500 text-white px-1 rounded hover:bg-blue-600"
                    title="Add text overlay"
                  >
                    T
                  </button>
                  
                  {/* Resize handles */}
                  <div 
                    className="absolute left-0 top-0 h-full w-3 bg-blue-800 cursor-ew-resize opacity-0 hover:opacity-100" 
                    onMouseDown={e=>handleSegmentDrag(e,seg.id,'start')} 
                  />
                  <div 
                    className="absolute right-0 top-0 h-full w-3 bg-blue-800 cursor-ew-resize opacity-0 hover:opacity-100" 
                    onMouseDown={e=>handleSegmentDrag(e,seg.id,'end')} 
                  />
                  
                  <button 
                    onClick={(e) => {e.stopPropagation(); previewSegment(seg);}} 
                    className="absolute bottom-0 right-0 text-xs bg-gray-800 text-white px-1 rounded hover:bg-gray-700"
                    title="Preview segment"
                  >
                    ▶
                  </button>
                </div>
              );
            })}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-2 mt-4">
            <button 
              onClick={handleSplitActive} 
              disabled={!selectedSegmentId} 
              className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-green-700"
            >
              ✂ Split Segment
            </button>
            <button 
              onClick={handleDeleteActive} 
              disabled={!selectedSegmentId || segments.length <= 1} 
              className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-red-600"
            >
              ✕ Delete Segment
            </button>
            <button 
              onClick={() => handleAddText()} 
              disabled={!selectedSegmentId}
              className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50 hover:bg-blue-600"
            >
              Add Text
            </button>
          </div>

          {/* Upload Button */}
          <div className="text-center mt-6">
            <button 
              onClick={handleUpload} 
              disabled={uploading || !videoFile}
              className="bg-bjj-red text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-bjj-red-dark font-semibold"
            >
              {uploading ? 'Processing Video...' : '🚀 Process Video'}
            </button>
          </div>
        </div>
      )}

      {/* Processing Results */}
      {processingResult && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Processing Results</h3>
          
          {processingResult.status === 'success' && (
            <div className="text-green-600 mb-4">
              ✅ Video processed successfully! Created {processingResult.clips?.length} highlight clips.
            </div>
          )}
          
          {processingResult.status === 'partial_success' && (
            <div className="text-yellow-600 mb-4">
              ⚠️ Partial success: {processingResult.warning}
            </div>
          )}
          
          {processingResult.status === 'error' && (
            <div className="text-red-600 mb-4">
              ❌ Error: {processingResult.error}
            </div>
          )}

          {/* Clips List */}
          {processingResult.clips && processingResult.clips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Generated Clips:</h4>
              <div className="space-y-2">
                {processingResult.clips.map((clip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{clip.filename}</div>
                      <div className="text-sm text-gray-600">
                        {clip.duration.toFixed(1)}s • Score: {clip.score} • {clip.text}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadClip(clip.filename)}
                      className="bg-bjj-blue text-white px-3 py-1 rounded hover:bg-bjj-blue-dark text-sm"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Preview */}
          {processingResult.transcript_preview && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Transcript Preview:</h4>
              <div className="p-2 bg-gray-50 rounded text-sm">
                {processingResult.transcript_preview}
              </div>
            </div>
          )}
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bjj-blue mx-auto mb-4"></div>
            <p>Processing your BJJ video...</p>
            <p className="text-sm text-gray-600 mt-2">This may take a few minutes</p>
          </div>
        </div>
      )}
    </div>
  );
}