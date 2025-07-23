import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentChatWindow from '../../components/student/StudentChatWindow';

export default function StudentChatWindowPage() {
  const { user } = useAuth();
  const studentId = user?.uid!;
  const { coachId } = useParams<{ coachId: string }>();

  return (
    <StudentChatWindow
      studentId={studentId}
      threadId={coachId!}
    />
  );
}
