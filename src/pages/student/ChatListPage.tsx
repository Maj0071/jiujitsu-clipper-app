import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentChatList from '../../components/student/StudentChatList';

export default function StudentChatListPage() {
  const { user } = useAuth();
  const studentId = user?.uid!;

  // Track which thread is selected
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      <aside className="w-1/3 border-r">
        <StudentChatList
          studentId={studentId}
          selectedThreadId={selectedThreadId}
          onSelect={setSelectedThreadId}
        />
      </aside>
      <main className="flex-1 p-4">
        {/* Show placeholder if no thread selected */}
        {!selectedThreadId ? (
          <p className="text-center text-gray-500">You have no chats yet.</p>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
