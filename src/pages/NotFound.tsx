import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center p-6">
      <h1 className="text-6xl font-bold text-primary-200">404</h1>
      <p className="text-xl font-semibold text-gray-700">Page not found</p>
      <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
        <Home className="w-4 h-4" />
        Go to Home
      </Link>
    </div>
  );
}
