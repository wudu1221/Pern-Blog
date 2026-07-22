// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PublisherDashboard from './pages/PublisherDashboard';
import PublisherProfile from './pages/PublisherProfile';
import PostDetail from './pages/PostDetail';
import Home from './pages/Home';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import Categories from './pages/Categories';
import About from './pages/About';
import ProtectedRoute from './components/ProtectedRoute'; // 👈 1. Import your guard

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/publisher/:id" element={<PublisherProfile />} />
            <Route path="/posts/:slug" element={<PostDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/about" element={<About />} />

            {/* 🔒 Protected Admin Route */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 🔒 Protected Publisher Route */}
            <Route 
              path="/publisher-dashboard" 
              element={
                <ProtectedRoute allowedRole="publisher">
                  <PublisherDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}