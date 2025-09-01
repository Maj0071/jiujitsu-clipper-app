import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Thread {
  id: string;
  coachName: string;
  lastMessage?: string;
}

interface StudentChatListProps {
  studentId: string;
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
}

export default function StudentChatList({ studentId, selectedThreadId, onSelect }: StudentChatListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    if (!studentId) return;
    const q = query(
      collection(db, 'chats'),
      where('studentId', '==', studentId)
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setThreads(data);
    });
    return unsubscribe;
  }, [studentId]);

  if (threads.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        You have no conversations yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {threads.map(thread => (
        <li
          key={thread.id}
          className={`p-3 cursor-pointer ${thread.id === selectedThreadId ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          onClick={() => onSelect(thread.id)}
        >
          <p className="font-medium text-bjj-blue">{thread.coachName}</p>
          <p className="text-sm text-gray-600 mt-1">
            {thread.lastMessage || 'No messages yet.'}
          </p>
        </li>
      ))}
    </ul>
  );
}
