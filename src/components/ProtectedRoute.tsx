// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  requireRole?: 'coach' | 'student'; // Optional role-based access
}

export default function ProtectedRoute({ 
  children, 
  requireRole 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-bjj-blue"></div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Optional: Check user role if specified
  if (requireRole) {
    // You can implement role checking here later
    // For now, we'll assume all authenticated users can access everything
    // Future enhancement: check user.customClaims or user profile data
  }

  // User is authenticated, render the protected component
  return children;
}