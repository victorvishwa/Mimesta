import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      className="fixed w-full z-50 backdrop-blur-md bg-white/30 border-b border-white/20 transition-all duration-300"
      style={{
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center md:justify-between items-center h-6 md:h-14">
          <div className="md:block">
            <Link 
              to="/" 
              className="text-base md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Mimesta 
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link 
                  to="/create" 
                  className="relative group"
                >
                  <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30">
                    Create Meme
                  </span>
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 font-medium"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-300 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-700 hover:text-indigo-600 transition-colors duration-300 absolute right-4"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden py-0.5 space-y-0.5 transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          {user ? (
            <>
              <Link 
                to="/create"
                className="block px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-600 to-pink-500 text-white text-[10px] font-medium text-center"
              >
                Create Meme
              </Link>
              <Link 
                to="/dashboard"
                className="block px-1.5 py-0.5 text-gray-700 hover:text-indigo-600 transition-colors duration-300 text-[10px] font-medium text-center"
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="block w-full px-1.5 py-0.5 text-gray-700 hover:text-indigo-600 transition-colors duration-300 text-[10px] font-medium text-center"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login"
                className="block px-1.5 py-0.5 text-gray-700 hover:text-indigo-600 transition-colors duration-300 text-[10px] font-medium text-center"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="block px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-600 to-pink-500 text-white text-[10px] font-medium text-center"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 