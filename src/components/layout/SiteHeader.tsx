import { Link } from 'react-router-dom';
import { Cross, User, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700" aria-label="MediFind Home">
          <Cross className="w-6 h-6 text-primary-600" aria-hidden="true" />
          <span>MediFind</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/emergency"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-emergency-600 border border-emergency-500 rounded-full px-3 py-1 hover:bg-emergency-50 transition-colors"
            aria-label="Emergency assistance 24/7"
          >
            Emergency 24/7
          </Link>
          {user ? (
            <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors">
              <User className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          ) : (
            <Link to="/auth/signin" className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              <LogIn className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
