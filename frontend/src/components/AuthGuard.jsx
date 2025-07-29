import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function AuthGuard({ children }) {
  const token = useSelector(s => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}