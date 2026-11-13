import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, isConfigured } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignUp = () => {
    localStorage.setItem('medifind_demo_token', '00000000-0000-0000-0000-000000000001');
    localStorage.setItem('medifind_demo_user', JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001',
      email: email || 'demo.user@medifind.in',
    }));
    window.location.href = '/profile';
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-600">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-900">
            Create your MediFind account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Supabase Authentication</span>
            </div>
            <p className="text-xs text-amber-700">
              Supabase credentials are not currently configured in the environment. You can enter demonstration mode to preview private features.
            </p>
            <button
              type="button"
              onClick={handleDemoSignUp}
              className="mt-2 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Continue in Demonstration Mode
            </button>
          </div>
        )}

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-3">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
            <h3 className="text-base font-semibold text-green-800">Verification email sent</h3>
            <p className="text-sm text-green-700">
              Please check your email to confirm your account, then sign in.
            </p>
            <Link
              to="/auth/signin"
              className="inline-block py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800" role="alert">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
