import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props { message?: string; onRetry?: () => void; }

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: Props) {
  return (
    <div className="py-12 flex flex-col items-center gap-4 text-center" role="alert">
      <AlertCircle className="w-10 h-10 text-red-400" aria-hidden="true" />
      <p className="text-gray-700 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
