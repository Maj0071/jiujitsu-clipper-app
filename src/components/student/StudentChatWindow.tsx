// frontend/src/components/student/StudentChatWindow.tsx
import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  from: 'coach' | 'student';
  text: string;
  timestamp: string;
}

interface StudentChatWindowProps {
  studentId: string;
  threadId: string;
}

export default function StudentChatWindow({
  studentId,
  threadId,
}: StudentChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Load messages for the selected thread
  useEffect(() => {
    if (!threadId) return;
    fetch(`/api/students/${studentId}/chats/threads/${threadId}`)
      .then(res => res.json())
      .then((data: Message[]) => setMessages(data))
      .catch(console.error);
  }, [studentId, threadId]);

  // Send a new message
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/chats/threads/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Send failed');
      const sent: Message = await res.json();
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 border-l">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-xs ${
              msg.from === 'student' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
            <span className="text-xs text-gray-500">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 border rounded px-2 mr-2"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-bjj-blue text-white px-4 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
