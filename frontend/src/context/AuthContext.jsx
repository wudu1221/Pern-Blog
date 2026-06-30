// frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On initialization, verify if a token exists to persist login session
  useEffect(() => {
    const token = localStorage.getItem('blog_token');
    const storedUser = localStorage.getItem('blog_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 💡 ADDED: Register handler (Sends full_name to match your database schema)
// Inside frontend/src/context/AuthContext.jsx

const register = async (fullName, email, password) => {
  // 💡 FIXED: Sending 'fullName' to match exactly what your backend destructures
  const response = await API.post('/auth/register', { 
    fullName, 
    email, 
    password 
  });
  const { token, data } = response.data;

  localStorage.setItem('blog_token', token);
  localStorage.setItem('blog_user', JSON.stringify(data.user));
  setUser(data.user);
  return data.user;
};

  // Login handler
  const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    const { token, data } = response.data;

    localStorage.setItem('blog_token', token);
    localStorage.setItem('blog_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('blog_token');
    localStorage.removeItem('blog_user');
    setUser(null);
  };

  // 💡 UPDATED: Added 'register' to the shared value object below
  return (
    <AuthContext.Provider value={{ user, register, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};