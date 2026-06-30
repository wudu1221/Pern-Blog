// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// import { useState, useEffect } from 'react';
// import API from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import PublisherDashboard from './pages/PublisherDashboard';
import PublisherProfile from './pages/PublisherProfile';
import PostDetail from './pages/PostDetail';
import Home from './pages/Home';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';

// const AdminDash = () => <div className="p-8 text-xl text-purple-700 font-bold">👑 Secure Admin Operations Control Room.</div>;
// // const PublisherDash = () => <div className="p-8 text-xl text-green-700 font-bold">✍️ Welcome to your Creative Writing Studio.</div>;

export default function App() {
  return (
    <AuthProvider>
      <Router>
<Layout>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/publisher-dashboard" element={<PublisherDashboard />} />
          <Route path="/publisher/:id" element={<PublisherProfile />} />
          <Route path="/posts/:slug" element={<PostDetail />} />
        </Routes>
  

  </Layout>
      </Router>
    </AuthProvider>
  );
}