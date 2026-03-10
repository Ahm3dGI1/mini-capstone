import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBookOpen, FiLogOut, FiUser, FiGrid } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition">
            <FiBookOpen className="text-2xl" />
            LearnTube
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition text-sm font-medium">
                  <FiGrid /> Dashboard
                </Link>
                <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition text-sm font-medium">
                  <FiUser /> {user.name}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition text-sm font-medium">
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-primary-600 transition text-sm font-medium">Log In</Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
