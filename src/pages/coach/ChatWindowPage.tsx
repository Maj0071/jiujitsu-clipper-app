import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from '../../components/coach/ChatWindow';

export default function ChatWindowPage() {
  const { user } = useAuth();
  const coachId = user?.uid!;
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <ChatWindow
      coachId={coachId}
      threadId={studentId!}
    />
  );
}
