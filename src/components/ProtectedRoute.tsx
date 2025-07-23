// // src/components/ProtectedRoute.tsx
// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function ProtectedRoute({
//   children,
// }: {
//   children: JSX.Element;
// }) {
//   const { user, loading } = useAuth();
//   if (loading) return <div>Loading…</div>;
//   return user ? children : <Navigate to="/auth" replace />;
// }

// src/components/ProtectedRoute.tsx
import React from 'react';

// Temporary development stub: bypass authentication
export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  return children;
}

