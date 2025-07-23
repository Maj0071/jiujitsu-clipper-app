import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MyCourses from '../../components/student/MyCourses';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>

      {/* My Courses Component */}
      <MyCourses />

      {/* Chats Button */}
      <button
        onClick={() => navigate('/student/chat')}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        💬 Chats
      </button>
    </div>
  );
}
