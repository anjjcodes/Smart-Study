import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Timer from './pages/Timer';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6c63ff', fontSize: 18 }}>
        🧠 Loading SmartStudy...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Navbar />
    {children}
  </div>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/" element={
      <ProtectedRoute>
        <AppLayout><Dashboard /></AppLayout>
      </ProtectedRoute>
    } />
    <Route path="/tasks" element={
      <ProtectedRoute>
        <AppLayout><Tasks /></AppLayout>
      </ProtectedRoute>
    } />
    <Route path="/timer" element={
      <ProtectedRoute>
        <AppLayout><Timer /></AppLayout>
      </ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute>
        <AppLayout><Profile /></AppLayout>
      </ProtectedRoute>
    } />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#2d2622',
              border: '1px solid #ebe5de',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00d4aa', secondary: '#1a1d35' } },
            error: { iconTheme: { primary: '#ff4757', secondary: '#1a1d35' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
