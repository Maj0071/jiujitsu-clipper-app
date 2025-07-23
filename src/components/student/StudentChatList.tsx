import React, { useState, useEffect } from 'react';

interface Thread {
  id: string;
  coachName: string;
  lastMessage: string;
  lastTimestamp: string;
}

interface StudentChatListProps {
  studentId: string;
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
}

export default function StudentChatList({
  studentId,
  selectedThreadId,
  onSelect,
}: StudentChatListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/students/${studentId}/chats/threads`)
      .then(res => res.json())
      .then((data: Thread[]) => setThreads(data))
      .catch(console.error);
  }, [studentId]);

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
          <div className="font-semibold">{thread.coachName}</div>
          <div className="text-sm text-gray-600 truncate">{thread.lastMessage}</div>
          <div className="text-xs text-gray-400">
            {new Date(thread.lastTimestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
