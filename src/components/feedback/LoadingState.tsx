import { Loader2 } from 'lucide-react';

interface Props { message?: string; fullPage?: boolean; }

export function LoadingState({ message = 'Loading…', fullPage = false }: Props) {
  const inner = (
    <div className="flex flex-col items-center gap-3 text-primary-600" role="status" aria-live="polite">
      <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
  if (fullPage) {
    return <div className="min-h-[60vh] flex items-center justify-center">{inner}</div>;
  }
  return <div className="py-12 flex justify-center">{inner}</div>;
}
