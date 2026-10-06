import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const PublicLayout = lazy(() => import('../pages/public/PublicLayout'));
const Home = lazy(() => import('../pages/public/Home'));
const About = lazy(() => import('../pages/public/About'));
const Features = lazy(() => import('../pages/public/Features'));
const ImageAnalysis = lazy(() => import('../pages/public/ImageAnalysis'));
const Privacy = lazy(() => import('../pages/public/Privacy'));
const Contact = lazy(() => import('../pages/public/Contact'));
const Terms = lazy(() => import('../pages/public/Terms'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const AppLayout = lazy(() => import('../pages/app/AppLayout'));
const Dashboard = lazy(() => import('../pages/app/Dashboard'));
const LiveMonitor = lazy(() => import('../pages/app/LiveMonitor'));
const PostureAnalysis = lazy(() => import('../pages/app/PostureAnalysis'));
const Yoga = lazy(() => import('../pages/app/Yoga'));
const BreakReminders = lazy(() => import('../pages/app/BreakReminders'));
const History = lazy(() => import('../pages/app/History'));
const Reports = lazy(() => import('../pages/app/Reports'));
const Achievements = lazy(() => import('../pages/app/Achievements'));
const Profile = lazy(() => import('../pages/app/Profile'));
const Settings = lazy(() => import('../pages/app/Settings'));
const NotFound = lazy(() => import('../pages/NotFound'));

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return null;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-shell"><div className="container section"><div className="skeleton" style={{height: 280}} /></div></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="page-shell"><div className="container section"><div className="skeleton" style={{ height: 420 }} /></div></div>}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="image-analysis" element={<ImageAnalysis />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<Terms />} />
        </Route>

        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="live-monitor" element={<LiveMonitor />} />
          <Route path="posture-analysis" element={<PostureAnalysis />} />
          <Route path="yoga" element={<Yoga />} />
          <Route path="breaks" element={<BreakReminders />} />
          <Route path="break-reminders" element={<BreakReminders />} />
          <Route path="history" element={<History />} />
          <Route path="reports" element={<Reports />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
