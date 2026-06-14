import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import NormalUserHome from './pages/NormalUserHome';
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';
import MyRatings from './pages/MyRatings';

// A wrapper to include the Navbar on main routes, but hide it on Login/Signup if desired.
// Here we display the Navbar dynamically if user is authenticated.
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #1e293b'
            }
          }} 
        />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes with Navbar Layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/store-owner"
            element={
              <ProtectedRoute allowedRoles={['STORE_OWNER']}>
                <MainLayout>
                  <StoreOwnerDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-ratings"
            element={
              <ProtectedRoute allowedRoles={['NORMAL_USER']}>
                <MainLayout>
                  <MyRatings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['NORMAL_USER']}>
                <MainLayout>
                  <NormalUserHome />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
