import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import Quiz from './Quiz';
import History from './History';
import AuthGuard from '../components/AuthGuard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
      <Route
        path="/quiz/:sessionId"
        element={
          <AuthGuard>
            <Quiz />
          </AuthGuard>
        }
      />
      <Route
        path="/history"
        element={
          <AuthGuard>
            <History />
          </AuthGuard>
        }
      />
      <Route path="*" element={<p>404</p>} />
    </Routes>
  );
}