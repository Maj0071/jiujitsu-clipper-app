import React, { useState, useEffect } from 'react';

interface StudentChatProps {
  coachId: string;
}

interface Message {
  id: string;
  from: 'coach' | 'student';
  text: string;
  timestamp: string;
}

export default function StudentChat({ coachId }: StudentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch chat history
  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/coaches/${coachId}/chats`)
      .then(res => res.json())
      .then((data: Message[]) => setMessages(data))
      .catch(console.error);
  }, [coachId]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/coaches/${coachId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage }),
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
    <div className="flex flex-col h-64 border rounded">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`p-2 rounded ${
              msg.from === 'coach' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
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
