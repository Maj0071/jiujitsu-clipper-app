import React, { useState, useEffect } from 'react';

interface Thread {
  id: string;
  studentName: string;
  lastMessage: string;
  lastTimestamp: string;
}

interface ChatListProps {
  coachId: string;
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
}

export default function ChatList({ coachId, selectedThreadId, onSelect }: ChatListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/coaches/${coachId}/chats/threads`)
      .then(res => res.json())
      .then((data: Thread[]) => setThreads(data))
      .catch(console.error);
  }, [coachId]);

  return (
    <div className="w-1/3 border-r overflow-y-auto">
      {threads.map(thread => (
        <div
          key={thread.id}
          onClick={() => onSelect(thread.id)}
          className={`p-4 cursor-pointer ${
            thread.id === selectedThreadId ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
        >
          <div className="font-semibold">{thread.studentName}</div>
          <div className="text-sm text-gray-600 truncate">{thread.lastMessage}</div>
          <div className="text-xs text-gray-400">
            {new Date(thread.lastTimestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
