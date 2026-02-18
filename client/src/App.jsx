import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import ProtectedRoute from './components/ProtectedRoute';
import { useNotificationSocket } from './hooks/useNotificationSocket';

const AppContent = () => {
    const { user } = useSelector((state) => state.auth);

    // Initialize global notification listener
    useNotificationSocket();

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/board/:boardId"
                element={
                    <ProtectedRoute>
                        <Board />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
    );
};

function App() {
    return (
        <Router>
            <AppContent />
            <ToastContainer limit={3} position="top-right" autoClose={3000} />
        </Router>
    );
}

export default App;
