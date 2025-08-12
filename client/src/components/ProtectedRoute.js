import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && Array.isArray(requiredRole)) {
    if (!user || !requiredRole.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
            <p className="text-gray-600 mb-8">Access Denied</p>
            <p className="text-sm text-gray-500 mb-8">
              You don't have permission to access this page.
            </p>
            <a href="/dashboard" className="btn-primary">
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;