import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { 
  AuthProvider, 
  SocketProvider, 
  ChatProvider, 
  NotificationProvider 
} from './context';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';

// Components
import ChatWindow from './components/ChatWindow';
import RoomBrowser from './components/RoomBrowser';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Styles
import './styles/global.css';

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ChatProvider>
              <NotificationProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected Dashboard Routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Default Dashboard view */}
                    <Route index element={<Dashboard />} />
                    
                    {/* Public Rooms */}
                    <Route path="rooms/:roomId" element={<ChatWindow />} />
                    
                    {/* Direct Messages */}
                    <Route path="dm/:userId" element={<ChatWindow />} />

                    {/* Exploration */}
                    <Route path="browse" element={<RoomBrowser />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </NotificationProvider>
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
