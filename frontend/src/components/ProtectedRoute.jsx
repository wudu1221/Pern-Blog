// frontend/src/components/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useContext(AuthContext);
  const token = localStorage.getItem('blog_token'); // 👈 Matches your context key

  // If the context is still checking localStorage on page refresh, wait.
  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">Verifying session...</div>;
  }

  // If no token or no user structure exists, redirect to login instantly
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If role checking is enabled and they don't match, send them home
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}