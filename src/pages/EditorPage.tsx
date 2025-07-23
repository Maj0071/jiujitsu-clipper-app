import React, { useState, useRef, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Auth context (assumed provided elsewhere)
const AuthContext = React.createContext<{ coachId: string } | null>(null);

interface Segment { id: string; start: number; end: number; }
interface TextOverlay { id: string; segmentId: string; text: string; x: number; y: number; fontSize: string; fontFamily: string; color: string; }

export default function VideoProcessor() {
  const auth = useContext(AuthContext);
  const coachId = auth?.coachId;

  // Video & segments state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Text overlays
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Voiceover & upload state
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setVideoFile(file);
    setVideoURL(URL.createObjectURL(file));
    setSegments([]);
    setOverlays([]);
    setSelectedSegmentId(null);
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

  // Advanced Add Text
  const handleAddText = (segmentIdParam?: string) => {
    const segId = segmentIdParam || selectedSegmentId;
    if (!segId) return;
    const text = prompt('Enter text:'); if (!text) return;
    const fontSize = (prompt('Font size px:', '24') || '24') + 'px';
    const fontFamily = prompt('Font family:', 'Arial') || 'Arial';
    const color = prompt('Text color:', '#FFFFFF') || '#FFFFFF';
    setOverlays(prev => [...prev, { id: uuidv4(), segmentId: segId, text, x: 50, y: 10, fontSize, fontFamily, color }]);
  };

  // Drag overlays
  const startDragOverlay = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const wr = wrapperRef.current!.getBoundingClientRect();
    setDragging({ id, offsetX: e.clientX - r.left, offsetY: e.clientY - r.top });
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const wr = wrapperRef.current!.getBoundingClientRect();
      const x = ((e.clientX - wr.left - dragging.offsetX) / wr.width) * 100;
      const y = ((e.clientY - wr.top - dragging.offsetY) / wr.height) * 100;
      setOverlays(prev => prev.map(o => o.id !== dragging.id ? o : ({ ...o, x: Math.max(0,Math.min(100,x)), y: Math.max(0,Math.min(100,y)) })));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  // Voiceover recording
  const handleAddVoiceOver = async () => {
    if (recording) { recorder?.stop(); setRecording(false); }
    else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = () => setVoiceBlob(new Blob(chunks, { type: 'audio/webm' }));
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecording(true);
    }
  };

  // Upload all data
  const handleUpload = async () => {
    if (!coachId || !videoFile) { alert('Missing coach info or video file'); return; }
    const form = new FormData();
    form.append('video', videoFile);
    form.append('overlays', JSON.stringify(overlays));
    if (voiceBlob) form.append('voiceover', voiceBlob, 'voice.webm');
    try {
      const res = await fetch(`/api/coaches/${coachId}/uploads`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      alert('Upload successful');
    } catch (err) { console.error(err); alert('Upload failed'); }
  };

  return (
    <div className="relative p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">TikTok-Style Video Editor</h2>
      <input type="file" accept="video/*" onChange={handleFileChange} />

      {videoURL && (
        <div ref={wrapperRef} className="relative inline-block">
          <video ref={videoRef} src={videoURL} controls onLoadedMetadata={handleLoadedMetadata} className="w-full my-4 rounded" />

          {/* Text Overlays */}
          {overlays.map(o => (
            <div key={o.id} onMouseDown={e => startDragOverlay(e, o.id)} style={{ position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, fontSize: o.fontSize, fontFamily: o.fontFamily, color: o.color }} className="cursor-move">{o.text}</div>
          ))}

          {/* Timeline Bar */}
          <div ref={timelineRef} className="relative w-full h-10 bg-gray-200 rounded overflow-hidden my-4">
            {segments.map(seg => {
              const left = `${(seg.start/duration)*100}%`;
              const width = `${((seg.end-seg.start)/duration)*100}%`;
              const sel = seg.id === selectedSegmentId;
              return (
                <div key={seg.id} onClick={() => setSelectedSegmentId(seg.id)} className={`absolute top-0 bottom-0 bg-bjj-blue/60 border ${sel?'border-yellow-300':'border-bjj-blue'} rounded`} style={{ left, width }}>
                  <button onClick={() => handleAddText(seg.id)} className="absolute top-1 left-1 text-xs bg-blue-400 text-white px-1 rounded">T</button>
                  <div className="absolute left-0 top-0 h-full w-8 bg-transparent cursor-ew-resize z-10" onMouseDown={e=>handleSegmentDrag(e,seg.id,'start')} />
                  <div className="absolute right-0 top-0 h-full w-8 bg-transparent cursor-ew-resize z-10" onMouseDown={e=>handleSegmentDrag(e,seg.id,'end')} />
                  <div className="absolute left-0 top-0 h-full w-2 bg-blue-800 cursor-ew-resize" onMouseDown={e=>handleSegmentDrag(e,seg.id,'start')} />
                  <div className="absolute right-0 top-0 h-full w-2 bg-blue-800 cursor-ew-resize" onMouseDown={e=>handleSegmentDrag(e,seg.id,'end')} />
                  <button onClick={()=>previewSegment(seg)} className="absolute bottom-0 right-0 text-xs bg-gray-800 text-white px-1 rounded">▶</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Control Buttons moved below */}
      {videoURL && (
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={handleSplitActive} disabled={!selectedSegmentId} className="text-xs bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50">✂ Split</button>
          <button onClick={handleDeleteActive} disabled={!selectedSegmentId} className="text-xs bg-red-500 text-white px-2 py-1 rounded disabled:opacity-50">✕ Delete</button>
          <button onClick={() => handleAddText()} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Add Text</button>
          <button onClick={handleAddVoiceOver} className={`${recording ? 'bg-yellow-500' : 'bg-indigo-500'} text-xs text-white px-2 py-1 rounded`}>{recording ? 'Stop Rec' : 'Add Voice'}</button>
          <button onClick={handleUpload} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Upload</button>
        </div>
      )}
    </div>
  );
}
