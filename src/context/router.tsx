// src/router.tsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Auth from '../pages/Auth';
import SearchResults from '../pages/SearchResults';
import CoachDashboard from '../pages/coach/Dashboard';
import ChatListPage from '../pages/coach/ChatListPage';
import ChatWindowPage from '../pages/coach/ChatWindowPage';
import StudentDashboard from '../pages/student/Dashboard';
import StudentChatListPage from '../pages/student/ChatListPage';
import StudentChatWindowPage from '../pages/student/ChatWindowPage';
import EditorPage from '../pages/EditorPage';

const router = createBrowserRouter([
  // Public authentication route
  {
    path: '/auth',
    element: <Auth />,
  },
  // Protected application routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'search', element: <SearchResults /> },
      { path: 'coach', element: <CoachDashboard /> },
      {
        path: 'coach/chat',
        element: <ChatListPage />,
        children: [
          { path: ':studentId', element: <ChatWindowPage /> },
        ],
      },
      { path: 'student', element: <StudentDashboard /> },
      {
        path: 'student/chat',
        element: <StudentChatListPage />,
        children: [
          { path: ':coachId', element: <StudentChatWindowPage /> },
        ],
      },
      { path: 'editor', element: <EditorPage /> },
      { path: '*', element: <Navigate to='/' replace /> },
    ],
  },
]);

export default router;
