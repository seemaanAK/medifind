import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, AlertCircle, Info } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    localStorage.setItem('medifind_demo_token', '00000000-0000-0000-0000-000000000001');
    localStorage.setItem('medifind_demo_user', JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo.user@medifind.in',
    }));
    window.location.href = '/profile';
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-600">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-900">
            Sign in to MediFind
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Supabase Not Yet Configured</span>
            </div>
            <p className="text-xs text-amber-700">
              To use live Supabase authentication, configure <code className="bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code>.
            </p>
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="mt-2 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Continue in Demonstration Mode
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800" role="alert">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link to="/auth/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
