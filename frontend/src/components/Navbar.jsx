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
    <nav className="bg-navy-900 sticky top-0 z-50 shadow-lg shadow-navy-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center group-hover:bg-primary-400 transition">
              <FiBookOpen className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Hermex</span>
          </Link>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-stone-300 hover:text-primary-400 hover:bg-white/5 transition px-3 py-2 rounded-lg text-sm font-medium">
                  <FiGrid className="text-base" /> Dashboard
                </Link>
                <Link to="/profile" className="flex items-center gap-1.5 text-stone-300 hover:text-primary-400 hover:bg-white/5 transition px-3 py-2 rounded-lg text-sm font-medium">
                  <FiUser className="text-base" /> {user.name}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-stone-400 hover:text-red-400 hover:bg-white/5 transition px-3 py-2 rounded-lg text-sm font-medium ml-1">
                  <FiLogOut className="text-base" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-stone-300 hover:text-white transition text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5">Log In</Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-500 transition text-sm font-semibold ml-1">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
