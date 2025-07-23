import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/coach/ChatList';
import ChatWindow from '../components/coach/ChatWindow';

export default function StudentChatPage() {
  const { user } = useAuth();
  const coachId = user?.uid!;
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <ChatList
        coachId={coachId}
        selectedThreadId={selectedThreadId}
        onSelect={setSelectedThreadId}
      />
      {selectedThreadId ? (
        <ChatWindow coachId={coachId} threadId={selectedThreadId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a chat
        </div>
      )}
    </div>
  );
}
