import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'buyer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If we need a specific role but profile hasn't loaded yet, show loading
  if (requiredRole && !userProfile && !loading) {
    // Profile loaded but is null - user not in database
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile && userProfile.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (userProfile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userProfile.role === 'buyer') {
      return <Navigate to="/buyer" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
