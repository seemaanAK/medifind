import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword, isConfigured } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-600">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your account email to receive a password recovery link.
          </p>
        </div>

        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Supabase is not yet configured. Password recovery requires live Supabase Auth setup.
          </div>
        )}

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-3">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
            <h3 className="text-base font-semibold text-green-800">Password reset email sent</h3>
            <p className="text-sm text-green-700">
              Check your inbox for instructions to reset your password.
            </p>
            <Link
              to="/auth/signin"
              className="inline-block py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Back to Sign In
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

            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending link…' : 'Send reset link'}
            </button>

            <div className="text-center">
              <Link to="/auth/signin" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
