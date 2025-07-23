import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // New: search state
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-white border-b p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-lg font-bold text-bjj-red">
          Jiu‑Jitsu Academy
        </Link>
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search coaches or moves…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border rounded-full px-4 py-1 w-64 focus:outline-none focus:ring"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 text-gray-500 hover:text-gray-700"
          >
            🔍
          </button>
        </form>
      </div>

      <div className="space-x-4">
        {!user ? (
          <Link to="/auth" className="text-blue-600 hover:underline">
            Sign In / Register
          </Link>
        ) : (
          <>
            <Link to="/coach" className="text-gray-700 hover:underline">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
